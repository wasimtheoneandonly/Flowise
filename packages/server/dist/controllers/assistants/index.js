"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const http_status_codes_1 = require("http-status-codes");
const internalFlowiseError_1 = require("../../errors/internalFlowiseError");
const assistants_1 = __importDefault(require("../../services/assistants"));
const getRunningExpressApp_1 = require("../../utils/getRunningExpressApp");
const quotaUsage_1 = require("../../utils/quotaUsage");
const createAssistant = async (req, res, next) => {
    try {
        if (!req.body) {
            throw new internalFlowiseError_1.InternalFlowiseError(http_status_codes_1.StatusCodes.PRECONDITION_FAILED, `Error: assistantsController.createAssistant - body not provided!`);
        }
        const body = req.body;
        const orgId = req.user?.activeOrganizationId;
        if (!orgId) {
            throw new internalFlowiseError_1.InternalFlowiseError(http_status_codes_1.StatusCodes.NOT_FOUND, `Error: assistantsController.createAssistant - organization ${orgId} not found!`);
        }
        const workspaceId = req.user?.activeWorkspaceId;
        if (!workspaceId) {
            throw new internalFlowiseError_1.InternalFlowiseError(http_status_codes_1.StatusCodes.NOT_FOUND, `Error: assistantsController.createAssistant - workspace ${workspaceId} not found!`);
        }
        const subscriptionId = req.user?.activeOrganizationSubscriptionId || '';
        const existingAssistantCount = await assistants_1.default.getAssistantsCountByOrganization(body.type, orgId);
        const newAssistantCount = 1;
        await (0, quotaUsage_1.checkUsageLimit)('flows', subscriptionId, (0, getRunningExpressApp_1.getRunningExpressApp)().usageCacheManager, existingAssistantCount + newAssistantCount);
        body.workspaceId = workspaceId;
        const apiResponse = await assistants_1.default.createAssistant(body, orgId);
        return res.json(apiResponse);
    }
    catch (error) {
        next(error);
    }
};
const deleteAssistant = async (req, res, next) => {
    try {
        if (typeof req.params === 'undefined' || !req.params.id) {
            throw new internalFlowiseError_1.InternalFlowiseError(http_status_codes_1.StatusCodes.PRECONDITION_FAILED, `Error: assistantsController.deleteAssistant - id not provided!`);
        }
        const apiResponse = await assistants_1.default.deleteAssistant(req.params.id, req.query.isDeleteBoth);
        return res.json(apiResponse);
    }
    catch (error) {
        next(error);
    }
};
const getAllAssistants = async (req, res, next) => {
    try {
        const type = req.query.type;
        const apiResponse = await assistants_1.default.getAllAssistants(type, req.user?.activeWorkspaceId);
        return res.json(apiResponse);
    }
    catch (error) {
        next(error);
    }
};
const getAssistantById = async (req, res, next) => {
    try {
        if (typeof req.params === 'undefined' || !req.params.id) {
            throw new internalFlowiseError_1.InternalFlowiseError(http_status_codes_1.StatusCodes.PRECONDITION_FAILED, `Error: assistantsController.getAssistantById - id not provided!`);
        }
        const apiResponse = await assistants_1.default.getAssistantById(req.params.id);
        return res.json(apiResponse);
    }
    catch (error) {
        next(error);
    }
};
const updateAssistant = async (req, res, next) => {
    try {
        if (typeof req.params === 'undefined' || !req.params.id) {
            throw new internalFlowiseError_1.InternalFlowiseError(http_status_codes_1.StatusCodes.PRECONDITION_FAILED, `Error: assistantsController.updateAssistant - id not provided!`);
        }
        if (!req.body) {
            throw new internalFlowiseError_1.InternalFlowiseError(http_status_codes_1.StatusCodes.PRECONDITION_FAILED, `Error: assistantsController.updateAssistant - body not provided!`);
        }
        const apiResponse = await assistants_1.default.updateAssistant(req.params.id, req.body);
        return res.json(apiResponse);
    }
    catch (error) {
        next(error);
    }
};
const getChatModels = async (req, res, next) => {
    try {
        const apiResponse = await assistants_1.default.getChatModels();
        return res.json(apiResponse);
    }
    catch (error) {
        next(error);
    }
};
const getDocumentStores = async (req, res, next) => {
    try {
        const apiResponse = await assistants_1.default.getDocumentStores(req.user?.activeWorkspaceId);
        return res.json(apiResponse);
    }
    catch (error) {
        next(error);
    }
};
const getTools = async (req, res, next) => {
    try {
        const apiResponse = await assistants_1.default.getTools();
        return res.json(apiResponse);
    }
    catch (error) {
        next(error);
    }
};
const generateAssistantInstruction = async (req, res, next) => {
    try {
        if (!req.body) {
            throw new internalFlowiseError_1.InternalFlowiseError(http_status_codes_1.StatusCodes.PRECONDITION_FAILED, `Error: assistantsController.generateAssistantInstruction - body not provided!`);
        }
        const apiResponse = await assistants_1.default.generateAssistantInstruction(req.body.task, req.body.selectedChatModel);
        return res.json(apiResponse);
    }
    catch (error) {
        next(error);
    }
};
exports.default = {
    createAssistant,
    deleteAssistant,
    getAllAssistants,
    getAssistantById,
    updateAssistant,
    getChatModels,
    getDocumentStores,
    getTools,
    generateAssistantInstruction
};
//# sourceMappingURL=index.js.map