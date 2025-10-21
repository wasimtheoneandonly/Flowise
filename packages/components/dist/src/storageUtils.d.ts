import { S3Client } from '@aws-sdk/client-s3';
import { Storage } from '@google-cloud/storage';
import fs from 'fs';
export declare const addBase64FilesToStorage: (fileBase64: string, chatflowid: string, fileNames: string[], orgId: string) => Promise<{
    path: string;
    totalSize: number;
}>;
export declare const addArrayFilesToStorage: (mime: string, bf: Buffer, fileName: string, fileNames: string[], ...paths: string[]) => Promise<{
    path: string;
    totalSize: number;
}>;
export declare const addSingleFileToStorage: (mime: string, bf: Buffer, fileName: string, ...paths: string[]) => Promise<{
    path: string;
    totalSize: number;
}>;
export declare const getFileFromUpload: (filePath: string) => Promise<Buffer>;
export declare const getFileFromStorage: (file: string, ...paths: string[]) => Promise<Buffer>;
export declare const getFilesListFromStorage: (...paths: string[]) => Promise<Array<{
    name: string;
    path: string;
    size: number;
}>>;
/**
 * Prepare storage path
 */
export declare const getStoragePath: () => string;
/**
 * Get the storage type - local or s3
 */
export declare const getStorageType: () => string;
export declare const removeFilesFromStorage: (...paths: string[]) => Promise<{
    totalSize: number;
}>;
export declare const removeSpecificFileFromUpload: (filePath: string) => Promise<void>;
export declare const removeSpecificFileFromStorage: (...paths: string[]) => Promise<{
    totalSize: number;
}>;
export declare const removeFolderFromStorage: (...paths: string[]) => Promise<{
    totalSize: number;
}>;
export declare const streamStorageFile: (chatflowId: string, chatId: string, fileName: string, orgId: string) => Promise<fs.ReadStream | Buffer | undefined>;
export declare const getGCSStorageSize: (orgId: string) => Promise<number>;
export declare const getGcsClient: () => {
    storage: Storage;
    bucket: import("@google-cloud/storage").Bucket;
};
export declare const getS3StorageSize: (orgId: string) => Promise<number>;
export declare const getS3Config: () => {
    s3Client: S3Client;
    Bucket: string;
};
