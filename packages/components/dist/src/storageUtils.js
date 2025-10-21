"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getS3Config = exports.getS3StorageSize = exports.getGcsClient = exports.getGCSStorageSize = exports.streamStorageFile = exports.removeFolderFromStorage = exports.removeSpecificFileFromStorage = exports.removeSpecificFileFromUpload = exports.removeFilesFromStorage = exports.getStorageType = exports.getStoragePath = exports.getFilesListFromStorage = exports.getFileFromStorage = exports.getFileFromUpload = exports.addSingleFileToStorage = exports.addArrayFilesToStorage = exports.addBase64FilesToStorage = void 0;
const client_s3_1 = require("@aws-sdk/client-s3");
const storage_1 = require("@google-cloud/storage");
const fs_1 = __importDefault(require("fs"));
const node_stream_1 = require("node:stream");
const path_1 = __importDefault(require("path"));
const sanitize_filename_1 = __importDefault(require("sanitize-filename"));
const utils_1 = require("./utils");
const validator_1 = require("./validator");
const dirSize = async (directoryPath) => {
    let totalSize = 0;
    async function calculateSize(itemPath) {
        const stats = await fs_1.default.promises.stat(itemPath);
        if (stats.isFile()) {
            totalSize += stats.size;
        }
        else if (stats.isDirectory()) {
            const files = await fs_1.default.promises.readdir(itemPath);
            for (const file of files) {
                await calculateSize(path_1.default.join(itemPath, file));
            }
        }
    }
    await calculateSize(directoryPath);
    return totalSize;
};
const addBase64FilesToStorage = async (fileBase64, chatflowid, fileNames, orgId) => {
    // Validate chatflowid
    if (!chatflowid || !(0, validator_1.isValidUUID)(chatflowid)) {
        throw new Error('Invalid chatflowId format - must be a valid UUID');
    }
    // Check for path traversal attempts
    if ((0, validator_1.isPathTraversal)(chatflowid)) {
        throw new Error('Invalid path characters detected in chatflowId');
    }
    const storageType = (0, exports.getStorageType)();
    if (storageType === 's3') {
        const { s3Client, Bucket } = (0, exports.getS3Config)();
        const splitDataURI = fileBase64.split(',');
        const filename = splitDataURI.pop()?.split(':')[1] ?? '';
        const bf = Buffer.from(splitDataURI.pop() || '', 'base64');
        const mime = splitDataURI[0].split(':')[1].split(';')[0];
        const sanitizedFilename = _sanitizeFilename(filename);
        const Key = orgId + '/' + chatflowid + '/' + sanitizedFilename;
        const putObjCmd = new client_s3_1.PutObjectCommand({
            Bucket,
            Key,
            ContentEncoding: 'base64', // required for binary data
            ContentType: mime,
            Body: bf
        });
        await s3Client.send(putObjCmd);
        fileNames.push(sanitizedFilename);
        const totalSize = await (0, exports.getS3StorageSize)(orgId);
        return { path: 'FILE-STORAGE::' + JSON.stringify(fileNames), totalSize: totalSize / 1024 / 1024 };
    }
    else if (storageType === 'gcs') {
        const { bucket } = (0, exports.getGcsClient)();
        const splitDataURI = fileBase64.split(',');
        const filename = splitDataURI.pop()?.split(':')[1] ?? '';
        const bf = Buffer.from(splitDataURI.pop() || '', 'base64');
        const mime = splitDataURI[0].split(':')[1].split(';')[0];
        const sanitizedFilename = _sanitizeFilename(filename);
        const normalizedChatflowid = chatflowid.replace(/\\/g, '/');
        const normalizedFilename = sanitizedFilename.replace(/\\/g, '/');
        const filePath = `${normalizedChatflowid}/${normalizedFilename}`;
        const file = bucket.file(filePath);
        await new Promise((resolve, reject) => {
            file.createWriteStream({ contentType: mime, metadata: { contentEncoding: 'base64' } })
                .on('error', (err) => reject(err))
                .on('finish', () => resolve())
                .end(bf);
        });
        fileNames.push(sanitizedFilename);
        const totalSize = await (0, exports.getGCSStorageSize)(orgId);
        return { path: 'FILE-STORAGE::' + JSON.stringify(fileNames), totalSize: totalSize / 1024 / 1024 };
    }
    else {
        const dir = path_1.default.join((0, exports.getStoragePath)(), orgId, chatflowid);
        if (!fs_1.default.existsSync(dir)) {
            fs_1.default.mkdirSync(dir, { recursive: true });
        }
        const splitDataURI = fileBase64.split(',');
        const filename = splitDataURI.pop()?.split(':')[1] ?? '';
        const bf = Buffer.from(splitDataURI.pop() || '', 'base64');
        const sanitizedFilename = _sanitizeFilename(filename);
        const filePath = path_1.default.join(dir, sanitizedFilename);
        fs_1.default.writeFileSync(filePath, bf);
        fileNames.push(sanitizedFilename);
        const totalSize = await dirSize(path_1.default.join((0, exports.getStoragePath)(), orgId));
        return { path: 'FILE-STORAGE::' + JSON.stringify(fileNames), totalSize: totalSize / 1024 / 1024 };
    }
};
exports.addBase64FilesToStorage = addBase64FilesToStorage;
const addArrayFilesToStorage = async (mime, bf, fileName, fileNames, ...paths) => {
    const storageType = (0, exports.getStorageType)();
    const sanitizedFilename = _sanitizeFilename(fileName);
    if (storageType === 's3') {
        const { s3Client, Bucket } = (0, exports.getS3Config)();
        let Key = paths.reduce((acc, cur) => acc + '/' + cur, '') + '/' + sanitizedFilename;
        if (Key.startsWith('/')) {
            Key = Key.substring(1);
        }
        const putObjCmd = new client_s3_1.PutObjectCommand({
            Bucket,
            Key,
            ContentEncoding: 'base64', // required for binary data
            ContentType: mime,
            Body: bf
        });
        await s3Client.send(putObjCmd);
        fileNames.push(sanitizedFilename);
        const totalSize = await (0, exports.getS3StorageSize)(paths[0]);
        return { path: 'FILE-STORAGE::' + JSON.stringify(fileNames), totalSize: totalSize / 1024 / 1024 };
    }
    else if (storageType === 'gcs') {
        const { bucket } = (0, exports.getGcsClient)();
        const normalizedPaths = paths.map((p) => p.replace(/\\/g, '/'));
        const normalizedFilename = sanitizedFilename.replace(/\\/g, '/');
        const filePath = [...normalizedPaths, normalizedFilename].join('/');
        const file = bucket.file(filePath);
        await new Promise((resolve, reject) => {
            file.createWriteStream()
                .on('error', (err) => reject(err))
                .on('finish', () => resolve())
                .end(bf);
        });
        fileNames.push(sanitizedFilename);
        const totalSize = await (0, exports.getGCSStorageSize)(paths[0]);
        return { path: 'FILE-STORAGE::' + JSON.stringify(fileNames), totalSize: totalSize / 1024 / 1024 };
    }
    else {
        const dir = path_1.default.join((0, exports.getStoragePath)(), ...paths.map(_sanitizeFilename));
        if (!fs_1.default.existsSync(dir)) {
            fs_1.default.mkdirSync(dir, { recursive: true });
        }
        const filePath = path_1.default.join(dir, sanitizedFilename);
        fs_1.default.writeFileSync(filePath, bf);
        fileNames.push(sanitizedFilename);
        const totalSize = await dirSize(path_1.default.join((0, exports.getStoragePath)(), paths[0]));
        return { path: 'FILE-STORAGE::' + JSON.stringify(fileNames), totalSize: totalSize / 1024 / 1024 };
    }
};
exports.addArrayFilesToStorage = addArrayFilesToStorage;
const addSingleFileToStorage = async (mime, bf, fileName, ...paths) => {
    const storageType = (0, exports.getStorageType)();
    const sanitizedFilename = _sanitizeFilename(fileName);
    if (storageType === 's3') {
        const { s3Client, Bucket } = (0, exports.getS3Config)();
        let Key = paths.reduce((acc, cur) => acc + '/' + cur, '') + '/' + sanitizedFilename;
        if (Key.startsWith('/')) {
            Key = Key.substring(1);
        }
        const putObjCmd = new client_s3_1.PutObjectCommand({
            Bucket,
            Key,
            ContentEncoding: 'base64', // required for binary data
            ContentType: mime,
            Body: bf
        });
        await s3Client.send(putObjCmd);
        const totalSize = await (0, exports.getS3StorageSize)(paths[0]);
        return { path: 'FILE-STORAGE::' + sanitizedFilename, totalSize: totalSize / 1024 / 1024 };
    }
    else if (storageType === 'gcs') {
        const { bucket } = (0, exports.getGcsClient)();
        const normalizedPaths = paths.map((p) => p.replace(/\\/g, '/'));
        const normalizedFilename = sanitizedFilename.replace(/\\/g, '/');
        const filePath = [...normalizedPaths, normalizedFilename].join('/');
        const file = bucket.file(filePath);
        await new Promise((resolve, reject) => {
            file.createWriteStream({ contentType: mime, metadata: { contentEncoding: 'base64' } })
                .on('error', (err) => reject(err))
                .on('finish', () => resolve())
                .end(bf);
        });
        const totalSize = await (0, exports.getGCSStorageSize)(paths[0]);
        return { path: 'FILE-STORAGE::' + sanitizedFilename, totalSize: totalSize / 1024 / 1024 };
    }
    else {
        const dir = path_1.default.join((0, exports.getStoragePath)(), ...paths.map(_sanitizeFilename));
        if (!fs_1.default.existsSync(dir)) {
            fs_1.default.mkdirSync(dir, { recursive: true });
        }
        const filePath = path_1.default.join(dir, sanitizedFilename);
        fs_1.default.writeFileSync(filePath, bf);
        const totalSize = await dirSize(path_1.default.join((0, exports.getStoragePath)(), paths[0]));
        return { path: 'FILE-STORAGE::' + sanitizedFilename, totalSize: totalSize / 1024 / 1024 };
    }
};
exports.addSingleFileToStorage = addSingleFileToStorage;
const getFileFromUpload = async (filePath) => {
    const storageType = (0, exports.getStorageType)();
    if (storageType === 's3') {
        const { s3Client, Bucket } = (0, exports.getS3Config)();
        let Key = filePath;
        // remove the first '/' if it exists
        if (Key.startsWith('/')) {
            Key = Key.substring(1);
        }
        const getParams = {
            Bucket,
            Key
        };
        const response = await s3Client.send(new client_s3_1.GetObjectCommand(getParams));
        const body = response.Body;
        if (body instanceof node_stream_1.Readable) {
            const streamToString = await body.transformToString('base64');
            if (streamToString) {
                return Buffer.from(streamToString, 'base64');
            }
        }
        // @ts-ignore
        const buffer = Buffer.concat(response.Body.toArray());
        return buffer;
    }
    else if (storageType === 'gcs') {
        const { bucket } = (0, exports.getGcsClient)();
        const file = bucket.file(filePath);
        const [buffer] = await file.download();
        return buffer;
    }
    else {
        return fs_1.default.readFileSync(filePath);
    }
};
exports.getFileFromUpload = getFileFromUpload;
const getFileFromStorage = async (file, ...paths) => {
    const storageType = (0, exports.getStorageType)();
    const sanitizedFilename = _sanitizeFilename(file);
    if (storageType === 's3') {
        const { s3Client, Bucket } = (0, exports.getS3Config)();
        let Key = paths.reduce((acc, cur) => acc + '/' + cur, '') + '/' + sanitizedFilename;
        if (Key.startsWith('/')) {
            Key = Key.substring(1);
        }
        try {
            const getParams = {
                Bucket,
                Key
            };
            const response = await s3Client.send(new client_s3_1.GetObjectCommand(getParams));
            const body = response.Body;
            if (body instanceof node_stream_1.Readable) {
                const streamToString = await body.transformToString('base64');
                if (streamToString) {
                    return Buffer.from(streamToString, 'base64');
                }
            }
            // @ts-ignore
            const buffer = Buffer.concat(response.Body.toArray());
            return buffer;
        }
        catch (error) {
            // Fallback: Check if file exists without the first path element (likely orgId)
            if (paths.length > 1) {
                const fallbackPaths = paths.slice(1);
                let fallbackKey = fallbackPaths.reduce((acc, cur) => acc + '/' + cur, '') + '/' + sanitizedFilename;
                if (fallbackKey.startsWith('/')) {
                    fallbackKey = fallbackKey.substring(1);
                }
                try {
                    const fallbackParams = {
                        Bucket,
                        Key: fallbackKey
                    };
                    const fallbackResponse = await s3Client.send(new client_s3_1.GetObjectCommand(fallbackParams));
                    const fallbackBody = fallbackResponse.Body;
                    // Get the file content
                    let fileContent;
                    if (fallbackBody instanceof node_stream_1.Readable) {
                        const streamToString = await fallbackBody.transformToString('base64');
                        if (streamToString) {
                            fileContent = Buffer.from(streamToString, 'base64');
                        }
                        else {
                            // @ts-ignore
                            fileContent = Buffer.concat(fallbackBody.toArray());
                        }
                    }
                    else {
                        // @ts-ignore
                        fileContent = Buffer.concat(fallbackBody.toArray());
                    }
                    // Move to correct location with orgId
                    const putObjCmd = new client_s3_1.PutObjectCommand({
                        Bucket,
                        Key,
                        Body: fileContent
                    });
                    await s3Client.send(putObjCmd);
                    // Delete the old file
                    await s3Client.send(new client_s3_1.DeleteObjectsCommand({
                        Bucket,
                        Delete: {
                            Objects: [{ Key: fallbackKey }],
                            Quiet: false
                        }
                    }));
                    // Check if the directory is empty and delete recursively if needed
                    if (fallbackPaths.length > 0) {
                        await _cleanEmptyS3Folders(s3Client, Bucket, fallbackPaths[0]);
                    }
                    return fileContent;
                }
                catch (fallbackError) {
                    // Throw the original error since the fallback also failed
                    throw error;
                }
            }
            else {
                throw error;
            }
        }
    }
    else if (storageType === 'gcs') {
        const { bucket } = (0, exports.getGcsClient)();
        const normalizedPaths = paths.map((p) => p.replace(/\\/g, '/'));
        const normalizedFilename = sanitizedFilename.replace(/\\/g, '/');
        const filePath = [...normalizedPaths, normalizedFilename].join('/');
        try {
            const file = bucket.file(filePath);
            const [buffer] = await file.download();
            return buffer;
        }
        catch (error) {
            // Fallback: Check if file exists without the first path element (likely orgId)
            if (normalizedPaths.length > 1) {
                const fallbackPaths = normalizedPaths.slice(1);
                const fallbackPath = [...fallbackPaths, normalizedFilename].join('/');
                try {
                    const fallbackFile = bucket.file(fallbackPath);
                    const [buffer] = await fallbackFile.download();
                    // Move to correct location with orgId
                    const file = bucket.file(filePath);
                    await new Promise((resolve, reject) => {
                        file.createWriteStream()
                            .on('error', (err) => reject(err))
                            .on('finish', () => resolve())
                            .end(buffer);
                    });
                    // Delete the old file
                    await fallbackFile.delete();
                    // Check if the directory is empty and delete recursively if needed
                    if (fallbackPaths.length > 0) {
                        await _cleanEmptyGCSFolders(bucket, fallbackPaths[0]);
                    }
                    return buffer;
                }
                catch (fallbackError) {
                    // Throw the original error since the fallback also failed
                    throw error;
                }
            }
            else {
                throw error;
            }
        }
    }
    else {
        try {
            const fileInStorage = path_1.default.join((0, exports.getStoragePath)(), ...paths.map(_sanitizeFilename), sanitizedFilename);
            return fs_1.default.readFileSync(fileInStorage);
        }
        catch (error) {
            // Fallback: Check if file exists without the first path element (likely orgId)
            if (paths.length > 1) {
                const fallbackPaths = paths.slice(1);
                const fallbackPath = path_1.default.join((0, exports.getStoragePath)(), ...fallbackPaths.map(_sanitizeFilename), sanitizedFilename);
                if (fs_1.default.existsSync(fallbackPath)) {
                    // Create directory if it doesn't exist
                    const targetPath = path_1.default.join((0, exports.getStoragePath)(), ...paths.map(_sanitizeFilename), sanitizedFilename);
                    const dir = path_1.default.dirname(targetPath);
                    if (!fs_1.default.existsSync(dir)) {
                        fs_1.default.mkdirSync(dir, { recursive: true });
                    }
                    // Copy file to correct location with orgId
                    fs_1.default.copyFileSync(fallbackPath, targetPath);
                    // Delete the old file
                    fs_1.default.unlinkSync(fallbackPath);
                    // Clean up empty directories recursively
                    if (fallbackPaths.length > 0) {
                        _cleanEmptyLocalFolders(path_1.default.join((0, exports.getStoragePath)(), ...fallbackPaths.map(_sanitizeFilename).slice(0, -1)));
                    }
                    return fs_1.default.readFileSync(targetPath);
                }
                else {
                    throw error;
                }
            }
            else {
                throw error;
            }
        }
    }
};
exports.getFileFromStorage = getFileFromStorage;
const getFilesListFromStorage = async (...paths) => {
    const storageType = (0, exports.getStorageType)();
    if (storageType === 's3') {
        const { s3Client, Bucket } = (0, exports.getS3Config)();
        let Key = paths.reduce((acc, cur) => acc + '/' + cur, '');
        if (Key.startsWith('/')) {
            Key = Key.substring(1);
        }
        const listCommand = new client_s3_1.ListObjectsV2Command({
            Bucket,
            Prefix: Key
        });
        const list = await s3Client.send(listCommand);
        if (list.Contents && list.Contents.length > 0) {
            return list.Contents.map((item) => ({
                name: item.Key?.split('/').pop() || '',
                path: item.Key ?? '',
                size: item.Size || 0
            }));
        }
        else {
            return [];
        }
    }
    else {
        const directory = path_1.default.join((0, exports.getStoragePath)(), ...paths);
        const filesList = getFilePaths(directory);
        return filesList;
    }
};
exports.getFilesListFromStorage = getFilesListFromStorage;
function getFilePaths(dir) {
    let results = [];
    function readDirectory(directory) {
        try {
            if (!fs_1.default.existsSync(directory)) {
                console.warn(`Directory does not exist: ${directory}`);
                return;
            }
            const list = fs_1.default.readdirSync(directory);
            list.forEach((file) => {
                const filePath = path_1.default.join(directory, file);
                try {
                    const stat = fs_1.default.statSync(filePath);
                    if (stat && stat.isDirectory()) {
                        readDirectory(filePath);
                    }
                    else {
                        const sizeInMB = stat.size / (1024 * 1024);
                        results.push({ name: file, path: filePath, size: sizeInMB });
                    }
                }
                catch (error) {
                    console.error(`Error processing file ${filePath}:`, error);
                }
            });
        }
        catch (error) {
            console.error(`Error reading directory ${directory}:`, error);
        }
    }
    readDirectory(dir);
    return results;
}
/**
 * Prepare storage path
 */
const getStoragePath = () => {
    const storagePath = process.env.BLOB_STORAGE_PATH
        ? path_1.default.join(process.env.BLOB_STORAGE_PATH)
        : path_1.default.join((0, utils_1.getUserHome)(), '.flowise', 'storage');
    if (!fs_1.default.existsSync(storagePath)) {
        fs_1.default.mkdirSync(storagePath, { recursive: true });
    }
    return storagePath;
};
exports.getStoragePath = getStoragePath;
/**
 * Get the storage type - local or s3
 */
const getStorageType = () => {
    return process.env.STORAGE_TYPE ? process.env.STORAGE_TYPE : 'local';
};
exports.getStorageType = getStorageType;
const removeFilesFromStorage = async (...paths) => {
    const storageType = (0, exports.getStorageType)();
    if (storageType === 's3') {
        let Key = paths.reduce((acc, cur) => acc + '/' + cur, '');
        // remove the first '/' if it exists
        if (Key.startsWith('/')) {
            Key = Key.substring(1);
        }
        await _deleteS3Folder(Key);
        // check folder size after deleting all the files
        const totalSize = await (0, exports.getS3StorageSize)(paths[0]);
        return { totalSize: totalSize / 1024 / 1024 };
    }
    else if (storageType === 'gcs') {
        const { bucket } = (0, exports.getGcsClient)();
        const normalizedPath = paths.map((p) => p.replace(/\\/g, '/')).join('/');
        await bucket.deleteFiles({ prefix: `${normalizedPath}/` });
        const totalSize = await (0, exports.getGCSStorageSize)(paths[0]);
        return { totalSize: totalSize / 1024 / 1024 };
    }
    else {
        const directory = path_1.default.join((0, exports.getStoragePath)(), ...paths.map(_sanitizeFilename));
        await _deleteLocalFolderRecursive(directory);
        const totalSize = await dirSize(path_1.default.join((0, exports.getStoragePath)(), paths[0]));
        return { totalSize: totalSize / 1024 / 1024 };
    }
};
exports.removeFilesFromStorage = removeFilesFromStorage;
const removeSpecificFileFromUpload = async (filePath) => {
    const storageType = (0, exports.getStorageType)();
    if (storageType === 's3') {
        let Key = filePath;
        // remove the first '/' if it exists
        if (Key.startsWith('/')) {
            Key = Key.substring(1);
        }
        await _deleteS3Folder(Key);
    }
    else if (storageType === 'gcs') {
        const { bucket } = (0, exports.getGcsClient)();
        await bucket.file(filePath).delete();
    }
    else {
        fs_1.default.unlinkSync(filePath);
    }
};
exports.removeSpecificFileFromUpload = removeSpecificFileFromUpload;
const removeSpecificFileFromStorage = async (...paths) => {
    const storageType = (0, exports.getStorageType)();
    if (storageType === 's3') {
        let Key = paths.reduce((acc, cur) => acc + '/' + cur, '');
        // remove the first '/' if it exists
        if (Key.startsWith('/')) {
            Key = Key.substring(1);
        }
        await _deleteS3Folder(Key);
        // check folder size after deleting all the files
        const totalSize = await (0, exports.getS3StorageSize)(paths[0]);
        return { totalSize: totalSize / 1024 / 1024 };
    }
    else if (storageType === 'gcs') {
        const { bucket } = (0, exports.getGcsClient)();
        const fileName = paths.pop();
        if (fileName) {
            const sanitizedFilename = _sanitizeFilename(fileName);
            paths.push(sanitizedFilename);
        }
        const normalizedPath = paths.map((p) => p.replace(/\\/g, '/')).join('/');
        await bucket.file(normalizedPath).delete();
        const totalSize = await (0, exports.getGCSStorageSize)(paths[0]);
        return { totalSize: totalSize / 1024 / 1024 };
    }
    else {
        const fileName = paths.pop();
        if (fileName) {
            const sanitizedFilename = _sanitizeFilename(fileName);
            paths.push(sanitizedFilename);
        }
        const file = path_1.default.join((0, exports.getStoragePath)(), ...paths.map(_sanitizeFilename));
        // check if file exists, if not skip delete
        // this might happen when user tries to delete a document loader but the attached file is already deleted
        const stat = fs_1.default.statSync(file, { throwIfNoEntry: false });
        if (stat && stat.isFile()) {
            fs_1.default.unlinkSync(file);
        }
        const totalSize = await dirSize(path_1.default.join((0, exports.getStoragePath)(), paths[0]));
        return { totalSize: totalSize / 1024 / 1024 };
    }
};
exports.removeSpecificFileFromStorage = removeSpecificFileFromStorage;
const removeFolderFromStorage = async (...paths) => {
    const storageType = (0, exports.getStorageType)();
    if (storageType === 's3') {
        let Key = paths.reduce((acc, cur) => acc + '/' + cur, '');
        // remove the first '/' if it exists
        if (Key.startsWith('/')) {
            Key = Key.substring(1);
        }
        await _deleteS3Folder(Key);
        // check folder size after deleting all the files
        const totalSize = await (0, exports.getS3StorageSize)(paths[0]);
        return { totalSize: totalSize / 1024 / 1024 };
    }
    else if (storageType === 'gcs') {
        const { bucket } = (0, exports.getGcsClient)();
        const normalizedPath = paths.map((p) => p.replace(/\\/g, '/')).join('/');
        await bucket.deleteFiles({ prefix: `${normalizedPath}/` });
        const totalSize = await (0, exports.getGCSStorageSize)(paths[0]);
        return { totalSize: totalSize / 1024 / 1024 };
    }
    else {
        const directory = path_1.default.join((0, exports.getStoragePath)(), ...paths.map(_sanitizeFilename));
        await _deleteLocalFolderRecursive(directory, true);
        const totalSize = await dirSize(path_1.default.join((0, exports.getStoragePath)(), paths[0]));
        return { totalSize: totalSize / 1024 / 1024 };
    }
};
exports.removeFolderFromStorage = removeFolderFromStorage;
const _deleteLocalFolderRecursive = async (directory, deleteParentChatflowFolder) => {
    try {
        // Check if the path exists
        await fs_1.default.promises.access(directory);
        if (deleteParentChatflowFolder) {
            await fs_1.default.promises.rmdir(directory, { recursive: true });
        }
        // Get stats of the path to determine if it's a file or directory
        const stats = await fs_1.default.promises.stat(directory);
        if (stats.isDirectory()) {
            // Read all directory contents
            const files = await fs_1.default.promises.readdir(directory);
            // Recursively delete all contents
            for (const file of files) {
                const currentPath = path_1.default.join(directory, file);
                await _deleteLocalFolderRecursive(currentPath); // Recursive call
            }
            // Delete the directory itself after emptying it
            await fs_1.default.promises.rmdir(directory, { recursive: true });
        }
        else {
            // If it's a file, delete it directly
            await fs_1.default.promises.unlink(directory);
        }
    }
    catch (error) {
        // Error handling
    }
};
const _deleteS3Folder = async (location) => {
    let count = 0; // number of files deleted
    const { s3Client, Bucket } = (0, exports.getS3Config)();
    async function recursiveS3Delete(token) {
        // get the files
        const listCommand = new client_s3_1.ListObjectsV2Command({
            Bucket: Bucket,
            Prefix: location,
            ContinuationToken: token
        });
        let list = await s3Client.send(listCommand);
        if (list.KeyCount) {
            const deleteCommand = new client_s3_1.DeleteObjectsCommand({
                Bucket: Bucket,
                Delete: {
                    Objects: list.Contents?.map((item) => ({ Key: item.Key })),
                    Quiet: false
                }
            });
            let deleted = await s3Client.send(deleteCommand);
            // @ts-ignore
            count += deleted.Deleted.length;
            if (deleted.Errors) {
                deleted.Errors.map((error) => console.error(`${error.Key} could not be deleted - ${error.Code}`));
            }
        }
        // repeat if more files to delete
        if (list.NextContinuationToken) {
            await recursiveS3Delete(list.NextContinuationToken);
        }
        // return total deleted count when finished
        return `${count} files deleted from S3`;
    }
    // start the recursive function
    return recursiveS3Delete();
};
const streamStorageFile = async (chatflowId, chatId, fileName, orgId) => {
    // Validate chatflowId
    if (!chatflowId || !(0, validator_1.isValidUUID)(chatflowId)) {
        throw new Error('Invalid chatflowId format - must be a valid UUID');
    }
    // Check for path traversal attempts
    if ((0, validator_1.isPathTraversal)(chatflowId) || (0, validator_1.isPathTraversal)(chatId)) {
        throw new Error('Invalid path characters detected in chatflowId or chatId');
    }
    const storageType = (0, exports.getStorageType)();
    const sanitizedFilename = (0, sanitize_filename_1.default)(fileName);
    if (storageType === 's3') {
        const { s3Client, Bucket } = (0, exports.getS3Config)();
        const Key = orgId + '/' + chatflowId + '/' + chatId + '/' + sanitizedFilename;
        const getParams = {
            Bucket,
            Key
        };
        try {
            const response = await s3Client.send(new client_s3_1.GetObjectCommand(getParams));
            const body = response.Body;
            if (body instanceof node_stream_1.Readable) {
                const blob = await body.transformToByteArray();
                return Buffer.from(blob);
            }
        }
        catch (error) {
            // Fallback: Check if file exists without orgId
            const fallbackKey = chatflowId + '/' + chatId + '/' + sanitizedFilename;
            try {
                const fallbackParams = {
                    Bucket,
                    Key: fallbackKey
                };
                const fallbackResponse = await s3Client.send(new client_s3_1.GetObjectCommand(fallbackParams));
                const fallbackBody = fallbackResponse.Body;
                // If found, copy to correct location with orgId
                if (fallbackBody) {
                    // Get the file content
                    let fileContent;
                    if (fallbackBody instanceof node_stream_1.Readable) {
                        const blob = await fallbackBody.transformToByteArray();
                        fileContent = Buffer.from(blob);
                    }
                    else {
                        // @ts-ignore
                        fileContent = Buffer.concat(fallbackBody.toArray());
                    }
                    // Move to correct location with orgId
                    const putObjCmd = new client_s3_1.PutObjectCommand({
                        Bucket,
                        Key,
                        Body: fileContent
                    });
                    await s3Client.send(putObjCmd);
                    // Delete the old file
                    await s3Client.send(new client_s3_1.DeleteObjectsCommand({
                        Bucket,
                        Delete: {
                            Objects: [{ Key: fallbackKey }],
                            Quiet: false
                        }
                    }));
                    // Check if the directory is empty and delete recursively if needed
                    await _cleanEmptyS3Folders(s3Client, Bucket, chatflowId);
                    return fileContent;
                }
            }
            catch (fallbackError) {
                // File not found in fallback location either
                throw new Error(`File ${fileName} not found`);
            }
        }
    }
    else if (storageType === 'gcs') {
        const { bucket } = (0, exports.getGcsClient)();
        const normalizedChatflowId = chatflowId.replace(/\\/g, '/');
        const normalizedChatId = chatId.replace(/\\/g, '/');
        const normalizedFilename = sanitizedFilename.replace(/\\/g, '/');
        const filePath = `${orgId}/${normalizedChatflowId}/${normalizedChatId}/${normalizedFilename}`;
        try {
            const [buffer] = await bucket.file(filePath).download();
            return buffer;
        }
        catch (error) {
            // Fallback: Check if file exists without orgId
            const fallbackPath = `${normalizedChatflowId}/${normalizedChatId}/${normalizedFilename}`;
            try {
                const fallbackFile = bucket.file(fallbackPath);
                const [buffer] = await fallbackFile.download();
                // If found, copy to correct location with orgId
                if (buffer) {
                    const file = bucket.file(filePath);
                    await new Promise((resolve, reject) => {
                        file.createWriteStream()
                            .on('error', (err) => reject(err))
                            .on('finish', () => resolve())
                            .end(buffer);
                    });
                    // Delete the old file
                    await fallbackFile.delete();
                    // Check if the directory is empty and delete recursively if needed
                    await _cleanEmptyGCSFolders(bucket, normalizedChatflowId);
                    return buffer;
                }
            }
            catch (fallbackError) {
                // File not found in fallback location either
                throw new Error(`File ${fileName} not found`);
            }
        }
    }
    else {
        const filePath = path_1.default.join((0, exports.getStoragePath)(), orgId, chatflowId, chatId, sanitizedFilename);
        //raise error if file path is not absolute
        if (!path_1.default.isAbsolute(filePath))
            throw new Error(`Invalid file path`);
        //raise error if file path contains '..'
        if (filePath.includes('..'))
            throw new Error(`Invalid file path`);
        //only return from the storage folder
        if (!filePath.startsWith((0, exports.getStoragePath)()))
            throw new Error(`Invalid file path`);
        if (fs_1.default.existsSync(filePath)) {
            return fs_1.default.createReadStream(filePath);
        }
        else {
            // Fallback: Check if file exists without orgId
            const fallbackPath = path_1.default.join((0, exports.getStoragePath)(), chatflowId, chatId, sanitizedFilename);
            if (fs_1.default.existsSync(fallbackPath)) {
                // Create directory if it doesn't exist
                const dir = path_1.default.dirname(filePath);
                if (!fs_1.default.existsSync(dir)) {
                    fs_1.default.mkdirSync(dir, { recursive: true });
                }
                // Copy file to correct location with orgId
                fs_1.default.copyFileSync(fallbackPath, filePath);
                // Delete the old file
                fs_1.default.unlinkSync(fallbackPath);
                // Clean up empty directories recursively
                _cleanEmptyLocalFolders(path_1.default.join((0, exports.getStoragePath)(), chatflowId, chatId));
                return fs_1.default.createReadStream(filePath);
            }
            else {
                throw new Error(`File ${fileName} not found`);
            }
        }
    }
};
exports.streamStorageFile = streamStorageFile;
/**
 * Check if a local directory is empty and delete it if so,
 * then check parent directories recursively
 */
const _cleanEmptyLocalFolders = (dirPath) => {
    try {
        // Stop if we reach the storage root
        if (dirPath === (0, exports.getStoragePath)())
            return;
        // Check if directory exists
        if (!fs_1.default.existsSync(dirPath))
            return;
        // Read directory contents
        const files = fs_1.default.readdirSync(dirPath);
        // If directory is empty, delete it and check parent
        if (files.length === 0) {
            fs_1.default.rmdirSync(dirPath);
            // Recursively check parent directory
            _cleanEmptyLocalFolders(path_1.default.dirname(dirPath));
        }
    }
    catch (error) {
        // Ignore errors during cleanup
        console.error('Error cleaning empty folders:', error);
    }
};
/**
 * Check if an S3 "folder" is empty and delete it recursively
 */
const _cleanEmptyS3Folders = async (s3Client, Bucket, prefix) => {
    try {
        // Skip if prefix is empty
        if (!prefix)
            return;
        // List objects in this "folder"
        const listCmd = new client_s3_1.ListObjectsV2Command({
            Bucket,
            Prefix: prefix + '/',
            Delimiter: '/'
        });
        const response = await s3Client.send(listCmd);
        // If folder is empty (only contains common prefixes but no files)
        if ((response.Contents?.length === 0 || !response.Contents) &&
            (response.CommonPrefixes?.length === 0 || !response.CommonPrefixes)) {
            // Delete the folder marker if it exists
            await s3Client.send(new client_s3_1.DeleteObjectsCommand({
                Bucket,
                Delete: {
                    Objects: [{ Key: prefix + '/' }],
                    Quiet: true
                }
            }));
            // Recursively check parent folder
            const parentPrefix = prefix.substring(0, prefix.lastIndexOf('/'));
            if (parentPrefix) {
                await _cleanEmptyS3Folders(s3Client, Bucket, parentPrefix);
            }
        }
    }
    catch (error) {
        // Ignore errors during cleanup
        console.error('Error cleaning empty S3 folders:', error);
    }
};
/**
 * Check if a GCS "folder" is empty and delete recursively if so
 */
const _cleanEmptyGCSFolders = async (bucket, prefix) => {
    try {
        // Skip if prefix is empty
        if (!prefix)
            return;
        // List files with this prefix
        const [files] = await bucket.getFiles({
            prefix: prefix + '/',
            delimiter: '/'
        });
        // If folder is empty (no files)
        if (files.length === 0) {
            // Delete the folder marker if it exists
            try {
                await bucket.file(prefix + '/').delete();
            }
            catch (err) {
                // Folder marker might not exist, ignore
            }
            // Recursively check parent folder
            const parentPrefix = prefix.substring(0, prefix.lastIndexOf('/'));
            if (parentPrefix) {
                await _cleanEmptyGCSFolders(bucket, parentPrefix);
            }
        }
    }
    catch (error) {
        // Ignore errors during cleanup
        console.error('Error cleaning empty GCS folders:', error);
    }
};
const getGCSStorageSize = async (orgId) => {
    const { bucket } = (0, exports.getGcsClient)();
    let totalSize = 0;
    const [files] = await bucket.getFiles({ prefix: orgId });
    for (const file of files) {
        const size = file.metadata.size;
        // Handle different types that size could be
        if (typeof size === 'string') {
            totalSize += parseInt(size, 10) || 0;
        }
        else if (typeof size === 'number') {
            totalSize += size;
        }
    }
    return totalSize;
};
exports.getGCSStorageSize = getGCSStorageSize;
const getGcsClient = () => {
    const pathToGcsCredential = process.env.GOOGLE_CLOUD_STORAGE_CREDENTIAL;
    const projectId = process.env.GOOGLE_CLOUD_STORAGE_PROJ_ID;
    const bucketName = process.env.GOOGLE_CLOUD_STORAGE_BUCKET_NAME;
    if (!bucketName) {
        throw new Error('GOOGLE_CLOUD_STORAGE_BUCKET_NAME env variable is required');
    }
    const storageConfig = {
        ...(pathToGcsCredential ? { keyFilename: pathToGcsCredential } : {}),
        ...(projectId ? { projectId } : {})
    };
    const storage = new storage_1.Storage(storageConfig);
    const bucket = storage.bucket(bucketName);
    return { storage, bucket };
};
exports.getGcsClient = getGcsClient;
const getS3StorageSize = async (orgId) => {
    const { s3Client, Bucket } = (0, exports.getS3Config)();
    const getCmd = new client_s3_1.ListObjectsCommand({
        Bucket,
        Prefix: orgId
    });
    const headObj = await s3Client.send(getCmd);
    let totalSize = 0;
    for (const obj of headObj.Contents || []) {
        totalSize += obj.Size || 0;
    }
    return totalSize;
};
exports.getS3StorageSize = getS3StorageSize;
const getS3Config = () => {
    const accessKeyId = process.env.S3_STORAGE_ACCESS_KEY_ID;
    const secretAccessKey = process.env.S3_STORAGE_SECRET_ACCESS_KEY;
    const region = process.env.S3_STORAGE_REGION;
    const Bucket = process.env.S3_STORAGE_BUCKET_NAME;
    const customURL = process.env.S3_ENDPOINT_URL;
    const forcePathStyle = process.env.S3_FORCE_PATH_STYLE === 'true' ? true : false;
    if (!region || region.trim() === '' || !Bucket || Bucket.trim() === '') {
        throw new Error('S3 storage configuration is missing');
    }
    const s3Config = {
        region: region,
        forcePathStyle: forcePathStyle
    };
    // Only include endpoint if customURL is not empty
    if (customURL && customURL.trim() !== '') {
        s3Config.endpoint = customURL;
    }
    if (accessKeyId && accessKeyId.trim() !== '' && secretAccessKey && secretAccessKey.trim() !== '') {
        s3Config.credentials = {
            accessKeyId: accessKeyId,
            secretAccessKey: secretAccessKey
        };
    }
    const s3Client = new client_s3_1.S3Client(s3Config);
    return { s3Client, Bucket };
};
exports.getS3Config = getS3Config;
const _sanitizeFilename = (filename) => {
    if (filename) {
        let sanitizedFilename = (0, sanitize_filename_1.default)(filename);
        // remove all leading .
        return sanitizedFilename.replace(/^\.+/, '');
    }
    return '';
};
//# sourceMappingURL=storageUtils.js.map