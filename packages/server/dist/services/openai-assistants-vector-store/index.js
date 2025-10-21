"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const openai_1 = __importDefault(require("openai"));
const http_status_codes_1 = require("http-status-codes");
const Credential_1 = require("../../database/entities/Credential");
const internalFlowiseError_1 = require("../../errors/internalFlowiseError");
const utils_1 = require("../../errors/utils");
const getRunningExpressApp_1 = require("../../utils/getRunningExpressApp");
const utils_2 = require("../../utils");
const flowise_components_1 = require("flowise-components");
const getAssistantVectorStore = async (credentialId, vectorStoreId) => {
    try {
        const appServer = (0, getRunningExpressApp_1.getRunningExpressApp)();
        const credential = await appServer.AppDataSource.getRepository(Credential_1.Credential).findOneBy({
            id: credentialId
        });
        if (!credential) {
            throw new internalFlowiseError_1.InternalFlowiseError(http_status_codes_1.StatusCodes.NOT_FOUND, `Credential ${credentialId} not found in the database!`);
        }
        // Decrpyt credentialData
        const decryptedCredentialData = await (0, utils_2.decryptCredentialData)(credential.encryptedData);
        const openAIApiKey = decryptedCredentialData['openAIApiKey'];
        if (!openAIApiKey) {
            throw new internalFlowiseError_1.InternalFlowiseError(http_status_codes_1.StatusCodes.NOT_FOUND, `OpenAI ApiKey not found`);
        }
        const openai = new openai_1.default({ apiKey: openAIApiKey });
        const dbResponse = await openai.vectorStores.retrieve(vectorStoreId);
        return dbResponse;
    }
    catch (error) {
        throw new internalFlowiseError_1.InternalFlowiseError(http_status_codes_1.StatusCodes.INTERNAL_SERVER_ERROR, `Error: openaiAssistantsVectorStoreService.getAssistantVectorStore - ${(0, utils_1.getErrorMessage)(error)}`);
    }
};
const listAssistantVectorStore = async (credentialId) => {
    try {
        const appServer = (0, getRunningExpressApp_1.getRunningExpressApp)();
        const credential = await appServer.AppDataSource.getRepository(Credential_1.Credential).findOneBy({
            id: credentialId
        });
        if (!credential) {
            throw new internalFlowiseError_1.InternalFlowiseError(http_status_codes_1.StatusCodes.NOT_FOUND, `Credential ${credentialId} not found in the database!`);
        }
        // Decrpyt credentialData
        const decryptedCredentialData = await (0, utils_2.decryptCredentialData)(credential.encryptedData);
        const openAIApiKey = decryptedCredentialData['openAIApiKey'];
        if (!openAIApiKey) {
            throw new internalFlowiseError_1.InternalFlowiseError(http_status_codes_1.StatusCodes.NOT_FOUND, `OpenAI ApiKey not found`);
        }
        const openai = new openai_1.default({ apiKey: openAIApiKey });
        const dbResponse = await openai.vectorStores.list();
        return dbResponse.data;
    }
    catch (error) {
        throw new internalFlowiseError_1.InternalFlowiseError(http_status_codes_1.StatusCodes.INTERNAL_SERVER_ERROR, `Error: openaiAssistantsVectorStoreService.listAssistantVectorStore - ${(0, utils_1.getErrorMessage)(error)}`);
    }
};
const createAssistantVectorStore = async (credentialId, obj) => {
    try {
        const appServer = (0, getRunningExpressApp_1.getRunningExpressApp)();
        const credential = await appServer.AppDataSource.getRepository(Credential_1.Credential).findOneBy({
            id: credentialId
        });
        if (!credential) {
            throw new internalFlowiseError_1.InternalFlowiseError(http_status_codes_1.StatusCodes.NOT_FOUND, `Credential ${credentialId} not found in the database!`);
        }
        // Decrpyt credentialData
        const decryptedCredentialData = await (0, utils_2.decryptCredentialData)(credential.encryptedData);
        const openAIApiKey = decryptedCredentialData['openAIApiKey'];
        if (!openAIApiKey) {
            throw new internalFlowiseError_1.InternalFlowiseError(http_status_codes_1.StatusCodes.NOT_FOUND, `OpenAI ApiKey not found`);
        }
        const openai = new openai_1.default({ apiKey: openAIApiKey });
        const dbResponse = await openai.vectorStores.create(obj);
        return dbResponse;
    }
    catch (error) {
        throw new internalFlowiseError_1.InternalFlowiseError(http_status_codes_1.StatusCodes.INTERNAL_SERVER_ERROR, `Error: openaiAssistantsVectorStoreService.createAssistantVectorStore - ${(0, utils_1.getErrorMessage)(error)}`);
    }
};
const updateAssistantVectorStore = async (credentialId, vectorStoreId, obj) => {
    try {
        const appServer = (0, getRunningExpressApp_1.getRunningExpressApp)();
        const credential = await appServer.AppDataSource.getRepository(Credential_1.Credential).findOneBy({
            id: credentialId
        });
        if (!credential) {
            throw new internalFlowiseError_1.InternalFlowiseError(http_status_codes_1.StatusCodes.NOT_FOUND, `Credential ${credentialId} not found in the database!`);
        }
        // Decrpyt credentialData
        const decryptedCredentialData = await (0, utils_2.decryptCredentialData)(credential.encryptedData);
        const openAIApiKey = decryptedCredentialData['openAIApiKey'];
        if (!openAIApiKey) {
            throw new internalFlowiseError_1.InternalFlowiseError(http_status_codes_1.StatusCodes.NOT_FOUND, `OpenAI ApiKey not found`);
        }
        const openai = new openai_1.default({ apiKey: openAIApiKey });
        const dbResponse = await openai.vectorStores.update(vectorStoreId, obj);
        const vectorStoreFiles = await openai.vectorStores.files.list(vectorStoreId);
        if (vectorStoreFiles.data?.length) {
            const files = [];
            for (const file of vectorStoreFiles.data) {
                const fileData = await openai.files.retrieve(file.id);
                files.push(fileData);
            }
            ;
            dbResponse.files = files;
        }
        return dbResponse;
    }
    catch (error) {
        throw new internalFlowiseError_1.InternalFlowiseError(http_status_codes_1.StatusCodes.INTERNAL_SERVER_ERROR, `Error: openaiAssistantsVectorStoreService.updateAssistantVectorStore - ${(0, utils_1.getErrorMessage)(error)}`);
    }
};
const deleteAssistantVectorStore = async (credentialId, vectorStoreId) => {
    try {
        const appServer = (0, getRunningExpressApp_1.getRunningExpressApp)();
        const credential = await appServer.AppDataSource.getRepository(Credential_1.Credential).findOneBy({
            id: credentialId
        });
        if (!credential) {
            throw new internalFlowiseError_1.InternalFlowiseError(http_status_codes_1.StatusCodes.NOT_FOUND, `Credential ${credentialId} not found in the database!`);
        }
        // Decrpyt credentialData
        const decryptedCredentialData = await (0, utils_2.decryptCredentialData)(credential.encryptedData);
        const openAIApiKey = decryptedCredentialData['openAIApiKey'];
        if (!openAIApiKey) {
            throw new internalFlowiseError_1.InternalFlowiseError(http_status_codes_1.StatusCodes.NOT_FOUND, `OpenAI ApiKey not found`);
        }
        const openai = new openai_1.default({ apiKey: openAIApiKey });
        const dbResponse = await openai.vectorStores.del(vectorStoreId);
        return dbResponse;
    }
    catch (error) {
        throw new internalFlowiseError_1.InternalFlowiseError(http_status_codes_1.StatusCodes.INTERNAL_SERVER_ERROR, `Error: openaiAssistantsVectorStoreService.deleteAssistantVectorStore - ${(0, utils_1.getErrorMessage)(error)}`);
    }
};
const uploadFilesToAssistantVectorStore = async (credentialId, vectorStoreId, files) => {
    try {
        const appServer = (0, getRunningExpressApp_1.getRunningExpressApp)();
        const credential = await appServer.AppDataSource.getRepository(Credential_1.Credential).findOneBy({
            id: credentialId
        });
        if (!credential) {
            throw new internalFlowiseError_1.InternalFlowiseError(http_status_codes_1.StatusCodes.NOT_FOUND, `Credential ${credentialId} not found in the database!`);
        }
        // Decrpyt credentialData
        const decryptedCredentialData = await (0, utils_2.decryptCredentialData)(credential.encryptedData);
        const openAIApiKey = decryptedCredentialData['openAIApiKey'];
        if (!openAIApiKey) {
            throw new internalFlowiseError_1.InternalFlowiseError(http_status_codes_1.StatusCodes.NOT_FOUND, `OpenAI ApiKey not found`);
        }
        const openai = new openai_1.default({ apiKey: openAIApiKey });
        const uploadedFiles = [];
        for (const file of files) {
            const fileBuffer = await (0, flowise_components_1.getFileFromUpload)(file.filePath);
            const toFile = await openai_1.default.toFile(fileBuffer, file.fileName);
            const createdFile = await openai.files.create({
                file: toFile,
                purpose: 'assistants'
            });
            uploadedFiles.push(createdFile);
            await (0, flowise_components_1.removeSpecificFileFromUpload)(file.filePath);
        }
        const file_ids = [...uploadedFiles.map((file) => file.id)];
        const res = await openai.vectorStores.fileBatches.createAndPoll(vectorStoreId, {
            file_ids
        });
        if (res.status === 'completed' && res.file_counts.completed === uploadedFiles.length)
            return uploadedFiles;
        else if (res.status === 'failed')
            throw new internalFlowiseError_1.InternalFlowiseError(http_status_codes_1.StatusCodes.INTERNAL_SERVER_ERROR, 'Error: openaiAssistantsVectorStoreService.uploadFilesToAssistantVectorStore - Upload failed!');
        else
            throw new internalFlowiseError_1.InternalFlowiseError(http_status_codes_1.StatusCodes.INTERNAL_SERVER_ERROR, 'Error: openaiAssistantsVectorStoreService.uploadFilesToAssistantVectorStore - Upload cancelled!');
    }
    catch (error) {
        throw new internalFlowiseError_1.InternalFlowiseError(http_status_codes_1.StatusCodes.INTERNAL_SERVER_ERROR, `Error: openaiAssistantsVectorStoreService.uploadFilesToAssistantVectorStore - ${(0, utils_1.getErrorMessage)(error)}`);
    }
};
const deleteFilesFromAssistantVectorStore = async (credentialId, vectorStoreId, file_ids) => {
    try {
        const appServer = (0, getRunningExpressApp_1.getRunningExpressApp)();
        const credential = await appServer.AppDataSource.getRepository(Credential_1.Credential).findOneBy({
            id: credentialId
        });
        if (!credential) {
            throw new internalFlowiseError_1.InternalFlowiseError(http_status_codes_1.StatusCodes.NOT_FOUND, `Credential ${credentialId} not found in the database!`);
        }
        // Decrpyt credentialData
        const decryptedCredentialData = await (0, utils_2.decryptCredentialData)(credential.encryptedData);
        const openAIApiKey = decryptedCredentialData['openAIApiKey'];
        if (!openAIApiKey) {
            throw new internalFlowiseError_1.InternalFlowiseError(http_status_codes_1.StatusCodes.NOT_FOUND, `OpenAI ApiKey not found`);
        }
        const openai = new openai_1.default({ apiKey: openAIApiKey });
        const deletedFileIds = [];
        let count = 0;
        for (const file of file_ids) {
            const res = await openai.vectorStores.files.del(vectorStoreId, file);
            if (res.deleted) {
                deletedFileIds.push(file);
                count += 1;
            }
        }
        return { deletedFileIds, count };
    }
    catch (error) {
        throw new internalFlowiseError_1.InternalFlowiseError(http_status_codes_1.StatusCodes.INTERNAL_SERVER_ERROR, `Error: openaiAssistantsVectorStoreService.uploadFilesToAssistantVectorStore - ${(0, utils_1.getErrorMessage)(error)}`);
    }
};
exports.default = {
    getAssistantVectorStore,
    listAssistantVectorStore,
    createAssistantVectorStore,
    updateAssistantVectorStore,
    deleteAssistantVectorStore,
    uploadFilesToAssistantVectorStore,
    deleteFilesFromAssistantVectorStore
};
//# sourceMappingURL=index.js.map