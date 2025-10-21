"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const http_status_codes_1 = require("http-status-codes");
const ChatFlow_1 = require("../../database/entities/ChatFlow");
const internalFlowiseError_1 = require("../../errors/internalFlowiseError");
const apikey_1 = __importDefault(require("../../services/apikey"));
const chatflows_1 = __importDefault(require("../../services/chatflows"));
const getRunningExpressApp_1 = require("../../utils/getRunningExpressApp");
const quotaUsage_1 = require("../../utils/quotaUsage");
const rateLimit_1 = require("../../utils/rateLimit");
const pagination_1 = require("../../utils/pagination");
const workspace_user_service_1 = require("../../enterprise/services/workspace-user.service");
const checkIfChatflowIsValidForStreaming = async (req, res, next) => {
    try {
        if (typeof req.params === 'undefined' || !req.params.id) {
            throw new internalFlowiseError_1.InternalFlowiseError(http_status_codes_1.StatusCodes.PRECONDITION_FAILED, `Error: chatflowsController.checkIfChatflowIsValidForStreaming - id not provided!`);
        }
        const apiResponse = await chatflows_1.default.checkIfChatflowIsValidForStreaming(req.params.id);
        return res.json(apiResponse);
    }
    catch (error) {
        next(error);
    }
};
const checkIfChatflowIsValidForUploads = async (req, res, next) => {
    try {
        if (typeof req.params === 'undefined' || !req.params.id) {
            throw new internalFlowiseError_1.InternalFlowiseError(http_status_codes_1.StatusCodes.PRECONDITION_FAILED, `Error: chatflowsController.checkIfChatflowIsValidForUploads - id not provided!`);
        }
        const apiResponse = await chatflows_1.default.checkIfChatflowIsValidForUploads(req.params.id);
        return res.json(apiResponse);
    }
    catch (error) {
        next(error);
    }
};
const deleteChatflow = async (req, res, next) => {
    try {
        if (typeof req.params === 'undefined' || !req.params.id) {
            throw new internalFlowiseError_1.InternalFlowiseError(http_status_codes_1.StatusCodes.PRECONDITION_FAILED, `Error: chatflowsController.deleteChatflow - id not provided!`);
        }
        const orgId = req.user?.activeOrganizationId;
        if (!orgId) {
            throw new internalFlowiseError_1.InternalFlowiseError(http_status_codes_1.StatusCodes.NOT_FOUND, `Error: chatflowsController.deleteChatflow - organization ${orgId} not found!`);
        }
        const workspaceId = req.user?.activeWorkspaceId;
        if (!workspaceId) {
            throw new internalFlowiseError_1.InternalFlowiseError(http_status_codes_1.StatusCodes.NOT_FOUND, `Error: chatflowsController.deleteChatflow - workspace ${workspaceId} not found!`);
        }
        const apiResponse = await chatflows_1.default.deleteChatflow(req.params.id, orgId, workspaceId);
        return res.json(apiResponse);
    }
    catch (error) {
        next(error);
    }
};
const getAllChatflows = async (req, res, next) => {
    try {
        const { page, limit } = (0, pagination_1.getPageAndLimitParams)(req);
        const apiResponse = await chatflows_1.default.getAllChatflows(req.query?.type, req.user?.activeWorkspaceId, page, limit);
        return res.json(apiResponse);
    }
    catch (error) {
        next(error);
    }
};
// Get specific chatflow via api key
const getChatflowByApiKey = async (req, res, next) => {
    try {
        if (typeof req.params === 'undefined' || !req.params.apikey) {
            throw new internalFlowiseError_1.InternalFlowiseError(http_status_codes_1.StatusCodes.PRECONDITION_FAILED, `Error: chatflowsController.getChatflowByApiKey - apikey not provided!`);
        }
        const apikey = await apikey_1.default.getApiKey(req.params.apikey);
        if (!apikey) {
            return res.status(401).send('Unauthorized');
        }
        const apiResponse = await chatflows_1.default.getChatflowByApiKey(apikey.id, req.query.keyonly);
        return res.json(apiResponse);
    }
    catch (error) {
        next(error);
    }
};
const getChatflowById = async (req, res, next) => {
    try {
        if (typeof req.params === 'undefined' || !req.params.id) {
            throw new internalFlowiseError_1.InternalFlowiseError(http_status_codes_1.StatusCodes.PRECONDITION_FAILED, `Error: chatflowsController.getChatflowById - id not provided!`);
        }
        const apiResponse = await chatflows_1.default.getChatflowById(req.params.id);
        return res.json(apiResponse);
    }
    catch (error) {
        next(error);
    }
};
const saveChatflow = async (req, res, next) => {
    try {
        if (!req.body) {
            throw new internalFlowiseError_1.InternalFlowiseError(http_status_codes_1.StatusCodes.PRECONDITION_FAILED, `Error: chatflowsController.saveChatflow - body not provided!`);
        }
        const orgId = req.user?.activeOrganizationId;
        if (!orgId) {
            throw new internalFlowiseError_1.InternalFlowiseError(http_status_codes_1.StatusCodes.NOT_FOUND, `Error: chatflowsController.saveChatflow - organization ${orgId} not found!`);
        }
        const workspaceId = req.user?.activeWorkspaceId;
        if (!workspaceId) {
            throw new internalFlowiseError_1.InternalFlowiseError(http_status_codes_1.StatusCodes.NOT_FOUND, `Error: chatflowsController.saveChatflow - workspace ${workspaceId} not found!`);
        }
        const subscriptionId = req.user?.activeOrganizationSubscriptionId || '';
        const body = req.body;
        const existingChatflowCount = await chatflows_1.default.getAllChatflowsCountByOrganization(body.type, orgId);
        const newChatflowCount = 1;
        await (0, quotaUsage_1.checkUsageLimit)('flows', subscriptionId, (0, getRunningExpressApp_1.getRunningExpressApp)().usageCacheManager, existingChatflowCount + newChatflowCount);
        const newChatFlow = new ChatFlow_1.ChatFlow();
        Object.assign(newChatFlow, body);
        newChatFlow.workspaceId = workspaceId;
        const apiResponse = await chatflows_1.default.saveChatflow(newChatFlow, orgId, workspaceId, subscriptionId, (0, getRunningExpressApp_1.getRunningExpressApp)().usageCacheManager);
        return res.json(apiResponse);
    }
    catch (error) {
        next(error);
    }
};
const updateChatflow = async (req, res, next) => {
    try {
        if (typeof req.params === 'undefined' || !req.params.id) {
            throw new internalFlowiseError_1.InternalFlowiseError(http_status_codes_1.StatusCodes.PRECONDITION_FAILED, `Error: chatflowsController.updateChatflow - id not provided!`);
        }
        const chatflow = await chatflows_1.default.getChatflowById(req.params.id);
        if (!chatflow) {
            return res.status(404).send(`Chatflow ${req.params.id} not found`);
        }
        const orgId = req.user?.activeOrganizationId;
        if (!orgId) {
            throw new internalFlowiseError_1.InternalFlowiseError(http_status_codes_1.StatusCodes.NOT_FOUND, `Error: chatflowsController.saveChatflow - organization ${orgId} not found!`);
        }
        const workspaceId = req.user?.activeWorkspaceId;
        if (!workspaceId) {
            throw new internalFlowiseError_1.InternalFlowiseError(http_status_codes_1.StatusCodes.NOT_FOUND, `Error: chatflowsController.saveChatflow - workspace ${workspaceId} not found!`);
        }
        const subscriptionId = req.user?.activeOrganizationSubscriptionId || '';
        const body = req.body;
        const updateChatFlow = new ChatFlow_1.ChatFlow();
        Object.assign(updateChatFlow, body);
        updateChatFlow.id = chatflow.id;
        const rateLimiterManager = rateLimit_1.RateLimiterManager.getInstance();
        await rateLimiterManager.updateRateLimiter(updateChatFlow);
        const apiResponse = await chatflows_1.default.updateChatflow(chatflow, updateChatFlow, orgId, workspaceId, subscriptionId);
        return res.json(apiResponse);
    }
    catch (error) {
        next(error);
    }
};
const getSinglePublicChatflow = async (req, res, next) => {
    let queryRunner;
    try {
        if (typeof req.params === 'undefined' || !req.params.id) {
            throw new internalFlowiseError_1.InternalFlowiseError(http_status_codes_1.StatusCodes.PRECONDITION_FAILED, `Error: chatflowsController.getSinglePublicChatflow - id not provided!`);
        }
        const chatflow = await chatflows_1.default.getChatflowById(req.params.id);
        if (!chatflow)
            return res.status(http_status_codes_1.StatusCodes.NOT_FOUND).json({ message: 'Chatflow not found' });
        if (chatflow.isPublic)
            return res.status(http_status_codes_1.StatusCodes.OK).json(chatflow);
        if (!req.user)
            return res.status(http_status_codes_1.StatusCodes.UNAUTHORIZED).json({ message: "Unauthorized" /* GeneralErrorMessage.UNAUTHORIZED */ });
        queryRunner = (0, getRunningExpressApp_1.getRunningExpressApp)().AppDataSource.createQueryRunner();
        const workspaceUserService = new workspace_user_service_1.WorkspaceUserService();
        const workspaceUser = await workspaceUserService.readWorkspaceUserByUserId(req.user.id, queryRunner);
        if (workspaceUser.length === 0)
            return res.status(http_status_codes_1.StatusCodes.NOT_FOUND).json({ message: "Workspace User Not Found" /* WorkspaceUserErrorMessage.WORKSPACE_USER_NOT_FOUND */ });
        const workspaceIds = workspaceUser.map((user) => user.workspaceId);
        if (!workspaceIds.includes(chatflow.workspaceId))
            return res.status(http_status_codes_1.StatusCodes.BAD_REQUEST).json({ message: 'You are not in the workspace that owns this chatflow' });
        return res.status(http_status_codes_1.StatusCodes.OK).json(chatflow);
    }
    catch (error) {
        next(error);
    }
    finally {
        if (queryRunner)
            await queryRunner.release();
    }
};
const getSinglePublicChatbotConfig = async (req, res, next) => {
    try {
        if (typeof req.params === 'undefined' || !req.params.id) {
            throw new internalFlowiseError_1.InternalFlowiseError(http_status_codes_1.StatusCodes.PRECONDITION_FAILED, `Error: chatflowsController.getSinglePublicChatbotConfig - id not provided!`);
        }
        const apiResponse = await chatflows_1.default.getSinglePublicChatbotConfig(req.params.id);
        return res.json(apiResponse);
    }
    catch (error) {
        next(error);
    }
};
const checkIfChatflowHasChanged = async (req, res, next) => {
    try {
        if (typeof req.params === 'undefined' || !req.params.id) {
            throw new internalFlowiseError_1.InternalFlowiseError(http_status_codes_1.StatusCodes.PRECONDITION_FAILED, `Error: chatflowsController.checkIfChatflowHasChanged - id not provided!`);
        }
        if (!req.params.lastUpdatedDateTime) {
            throw new internalFlowiseError_1.InternalFlowiseError(http_status_codes_1.StatusCodes.PRECONDITION_FAILED, `Error: chatflowsController.checkIfChatflowHasChanged - lastUpdatedDateTime not provided!`);
        }
        const apiResponse = await chatflows_1.default.checkIfChatflowHasChanged(req.params.id, req.params.lastUpdatedDateTime);
        return res.json(apiResponse);
    }
    catch (error) {
        next(error);
    }
};
exports.default = {
    checkIfChatflowIsValidForStreaming,
    checkIfChatflowIsValidForUploads,
    deleteChatflow,
    getAllChatflows,
    getChatflowByApiKey,
    getChatflowById,
    saveChatflow,
    updateChatflow,
    getSinglePublicChatflow,
    getSinglePublicChatbotConfig,
    checkIfChatflowHasChanged
};
//# sourceMappingURL=index.js.map