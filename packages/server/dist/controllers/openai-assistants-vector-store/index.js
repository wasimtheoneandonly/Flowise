"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const http_status_codes_1 = require("http-status-codes");
const internalFlowiseError_1 = require("../../errors/internalFlowiseError");
const openai_assistants_vector_store_1 = __importDefault(require("../../services/openai-assistants-vector-store"));
const getAssistantVectorStore = async (req, res, next) => {
    try {
        if (typeof req.params === 'undefined' || !req.params.id) {
            throw new internalFlowiseError_1.InternalFlowiseError(http_status_codes_1.StatusCodes.PRECONDITION_FAILED, `Error: openaiAssistantsVectorStoreController.getAssistantVectorStore - id not provided!`);
        }
        if (typeof req.query === 'undefined' || !req.query.credential) {
            throw new internalFlowiseError_1.InternalFlowiseError(http_status_codes_1.StatusCodes.PRECONDITION_FAILED, `Error: openaiAssistantsVectorStoreController.getAssistantVectorStore - credential not provided!`);
        }
        const apiResponse = await openai_assistants_vector_store_1.default.getAssistantVectorStore(req.query.credential, req.params.id);
        return res.json(apiResponse);
    }
    catch (error) {
        next(error);
    }
};
const listAssistantVectorStore = async (req, res, next) => {
    try {
        if (typeof req.query === 'undefined' || !req.query.credential) {
            throw new internalFlowiseError_1.InternalFlowiseError(http_status_codes_1.StatusCodes.PRECONDITION_FAILED, `Error: openaiAssistantsVectorStoreController.listAssistantVectorStore - credential not provided!`);
        }
        const apiResponse = await openai_assistants_vector_store_1.default.listAssistantVectorStore(req.query.credential);
        return res.json(apiResponse);
    }
    catch (error) {
        next(error);
    }
};
const createAssistantVectorStore = async (req, res, next) => {
    try {
        if (!req.body) {
            throw new internalFlowiseError_1.InternalFlowiseError(http_status_codes_1.StatusCodes.PRECONDITION_FAILED, `Error: openaiAssistantsVectorStoreController.createAssistantVectorStore - body not provided!`);
        }
        if (typeof req.query === 'undefined' || !req.query.credential) {
            throw new internalFlowiseError_1.InternalFlowiseError(http_status_codes_1.StatusCodes.PRECONDITION_FAILED, `Error: openaiAssistantsVectorStoreController.createAssistantVectorStore - credential not provided!`);
        }
        const apiResponse = await openai_assistants_vector_store_1.default.createAssistantVectorStore(req.query.credential, req.body);
        return res.json(apiResponse);
    }
    catch (error) {
        next(error);
    }
};
const updateAssistantVectorStore = async (req, res, next) => {
    try {
        if (typeof req.params === 'undefined' || !req.params.id) {
            throw new internalFlowiseError_1.InternalFlowiseError(http_status_codes_1.StatusCodes.PRECONDITION_FAILED, `Error: openaiAssistantsVectorStoreController.updateAssistantVectorStore - id not provided!`);
        }
        if (typeof req.query === 'undefined' || !req.query.credential) {
            throw new internalFlowiseError_1.InternalFlowiseError(http_status_codes_1.StatusCodes.PRECONDITION_FAILED, `Error: openaiAssistantsVectorStoreController.updateAssistantVectorStore - credential not provided!`);
        }
        if (!req.body) {
            throw new internalFlowiseError_1.InternalFlowiseError(http_status_codes_1.StatusCodes.PRECONDITION_FAILED, `Error: openaiAssistantsVectorStoreController.updateAssistantVectorStore - body not provided!`);
        }
        const apiResponse = await openai_assistants_vector_store_1.default.updateAssistantVectorStore(req.query.credential, req.params.id, req.body);
        return res.json(apiResponse);
    }
    catch (error) {
        next(error);
    }
};
const deleteAssistantVectorStore = async (req, res, next) => {
    try {
        if (typeof req.params === 'undefined' || !req.params.id) {
            throw new internalFlowiseError_1.InternalFlowiseError(http_status_codes_1.StatusCodes.PRECONDITION_FAILED, `Error: openaiAssistantsVectorStoreController.deleteAssistantVectorStore - id not provided!`);
        }
        if (typeof req.query === 'undefined' || !req.query.credential) {
            throw new internalFlowiseError_1.InternalFlowiseError(http_status_codes_1.StatusCodes.PRECONDITION_FAILED, `Error: openaiAssistantsVectorStoreController.updateAssistantVectorStore - credential not provided!`);
        }
        const apiResponse = await openai_assistants_vector_store_1.default.deleteAssistantVectorStore(req.query.credential, req.params.id);
        return res.json(apiResponse);
    }
    catch (error) {
        next(error);
    }
};
const uploadFilesToAssistantVectorStore = async (req, res, next) => {
    try {
        if (!req.body) {
            throw new internalFlowiseError_1.InternalFlowiseError(http_status_codes_1.StatusCodes.PRECONDITION_FAILED, `Error: openaiAssistantsVectorStoreController.uploadFilesToAssistantVectorStore - body not provided!`);
        }
        if (typeof req.params === 'undefined' || !req.params.id) {
            throw new internalFlowiseError_1.InternalFlowiseError(http_status_codes_1.StatusCodes.PRECONDITION_FAILED, `Error: openaiAssistantsVectorStoreController.uploadFilesToAssistantVectorStore - id not provided!`);
        }
        if (typeof req.query === 'undefined' || !req.query.credential) {
            throw new internalFlowiseError_1.InternalFlowiseError(http_status_codes_1.StatusCodes.PRECONDITION_FAILED, `Error: openaiAssistantsVectorStoreController.uploadFilesToAssistantVectorStore - credential not provided!`);
        }
        const files = req.files ?? [];
        const uploadFiles = [];
        if (Array.isArray(files)) {
            for (const file of files) {
                // Address file name with special characters: https://github.com/expressjs/multer/issues/1104
                file.originalname = Buffer.from(file.originalname, 'latin1').toString('utf8');
                uploadFiles.push({
                    filePath: file.path ?? file.key,
                    fileName: file.originalname
                });
            }
        }
        const apiResponse = await openai_assistants_vector_store_1.default.uploadFilesToAssistantVectorStore(req.query.credential, req.params.id, uploadFiles);
        return res.json(apiResponse);
    }
    catch (error) {
        next(error);
    }
};
const deleteFilesFromAssistantVectorStore = async (req, res, next) => {
    try {
        if (!req.body) {
            throw new internalFlowiseError_1.InternalFlowiseError(http_status_codes_1.StatusCodes.PRECONDITION_FAILED, `Error: openaiAssistantsVectorStoreController.deleteFilesFromAssistantVectorStore - body not provided!`);
        }
        if (typeof req.params === 'undefined' || !req.params.id) {
            throw new internalFlowiseError_1.InternalFlowiseError(http_status_codes_1.StatusCodes.PRECONDITION_FAILED, `Error: openaiAssistantsVectorStoreController.deleteFilesFromAssistantVectorStore - id not provided!`);
        }
        if (typeof req.query === 'undefined' || !req.query.credential) {
            throw new internalFlowiseError_1.InternalFlowiseError(http_status_codes_1.StatusCodes.PRECONDITION_FAILED, `Error: openaiAssistantsVectorStoreController.deleteFilesFromAssistantVectorStore - credential not provided!`);
        }
        const apiResponse = await openai_assistants_vector_store_1.default.deleteFilesFromAssistantVectorStore(req.query.credential, req.params.id, req.body.file_ids);
        return res.json(apiResponse);
    }
    catch (error) {
        next(error);
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