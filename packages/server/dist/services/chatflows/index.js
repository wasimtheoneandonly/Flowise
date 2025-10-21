"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.validateChatflowType = validateChatflowType;
const flowise_components_1 = require("flowise-components");
const http_status_codes_1 = require("http-status-codes");
const typeorm_1 = require("typeorm");
const Interface_Metrics_1 = require("../../Interface.Metrics");
const ChatFlow_1 = require("../../database/entities/ChatFlow");
const ChatMessage_1 = require("../../database/entities/ChatMessage");
const ChatMessageFeedback_1 = require("../../database/entities/ChatMessageFeedback");
const UpsertHistory_1 = require("../../database/entities/UpsertHistory");
const workspace_entity_1 = require("../../enterprise/database/entities/workspace.entity");
const ControllerServiceUtils_1 = require("../../enterprise/utils/ControllerServiceUtils");
const internalFlowiseError_1 = require("../../errors/internalFlowiseError");
const utils_1 = require("../../errors/utils");
const documentstore_1 = __importDefault(require("../../services/documentstore"));
const utils_2 = require("../../utils");
const fileRepository_1 = require("../../utils/fileRepository");
const getRunningExpressApp_1 = require("../../utils/getRunningExpressApp");
const getUploadsConfig_1 = require("../../utils/getUploadsConfig");
const logger_1 = __importDefault(require("../../utils/logger"));
const quotaUsage_1 = require("../../utils/quotaUsage");
function validateChatflowType(type) {
    if (!Object.values(ChatFlow_1.EnumChatflowType).includes(type))
        throw new internalFlowiseError_1.InternalFlowiseError(http_status_codes_1.StatusCodes.BAD_REQUEST, "Invalid Chatflow Type" /* ChatflowErrorMessage.INVALID_CHATFLOW_TYPE */);
}
// Check if chatflow valid for streaming
const checkIfChatflowIsValidForStreaming = async (chatflowId) => {
    try {
        const appServer = (0, getRunningExpressApp_1.getRunningExpressApp)();
        //**
        const chatflow = await appServer.AppDataSource.getRepository(ChatFlow_1.ChatFlow).findOneBy({
            id: chatflowId
        });
        if (!chatflow) {
            throw new internalFlowiseError_1.InternalFlowiseError(http_status_codes_1.StatusCodes.NOT_FOUND, `Chatflow ${chatflowId} not found`);
        }
        /* Check for post-processing settings, if available isStreamValid is always false */
        let chatflowConfig = {};
        if (chatflow.chatbotConfig) {
            chatflowConfig = JSON.parse(chatflow.chatbotConfig);
            if (chatflowConfig?.postProcessing?.enabled === true) {
                return { isStreaming: false };
            }
        }
        if (chatflow.type === 'AGENTFLOW') {
            return { isStreaming: true };
        }
        /*** Get Ending Node with Directed Graph  ***/
        const flowData = chatflow.flowData;
        const parsedFlowData = JSON.parse(flowData);
        const nodes = parsedFlowData.nodes;
        const edges = parsedFlowData.edges;
        const { graph, nodeDependencies } = (0, utils_2.constructGraphs)(nodes, edges);
        const endingNodes = (0, utils_2.getEndingNodes)(nodeDependencies, graph, nodes);
        let isStreaming = false;
        for (const endingNode of endingNodes) {
            const endingNodeData = endingNode.data;
            const isEndingNode = endingNodeData?.outputs?.output === 'EndingNode';
            // Once custom function ending node exists, flow is always unavailable to stream
            if (isEndingNode) {
                return { isStreaming: false };
            }
            isStreaming = (0, utils_2.isFlowValidForStream)(nodes, endingNodeData);
        }
        // If it is a Multi/Sequential Agents, always enable streaming
        if (endingNodes.filter((node) => node.data.category === 'Multi Agents' || node.data.category === 'Sequential Agents').length > 0) {
            return { isStreaming: true };
        }
        const dbResponse = { isStreaming: isStreaming };
        return dbResponse;
    }
    catch (error) {
        throw new internalFlowiseError_1.InternalFlowiseError(http_status_codes_1.StatusCodes.INTERNAL_SERVER_ERROR, `Error: chatflowsService.checkIfChatflowIsValidForStreaming - ${(0, utils_1.getErrorMessage)(error)}`);
    }
};
// Check if chatflow valid for uploads
const checkIfChatflowIsValidForUploads = async (chatflowId) => {
    try {
        const dbResponse = await (0, getUploadsConfig_1.utilGetUploadsConfig)(chatflowId);
        return dbResponse;
    }
    catch (error) {
        throw new internalFlowiseError_1.InternalFlowiseError(http_status_codes_1.StatusCodes.INTERNAL_SERVER_ERROR, `Error: chatflowsService.checkIfChatflowIsValidForUploads - ${(0, utils_1.getErrorMessage)(error)}`);
    }
};
const deleteChatflow = async (chatflowId, orgId, workspaceId) => {
    try {
        const appServer = (0, getRunningExpressApp_1.getRunningExpressApp)();
        const dbResponse = await appServer.AppDataSource.getRepository(ChatFlow_1.ChatFlow).delete({ id: chatflowId });
        // Update document store usage
        await documentstore_1.default.updateDocumentStoreUsage(chatflowId, undefined, workspaceId);
        // Delete all chat messages
        await appServer.AppDataSource.getRepository(ChatMessage_1.ChatMessage).delete({ chatflowid: chatflowId });
        // Delete all chat feedback
        await appServer.AppDataSource.getRepository(ChatMessageFeedback_1.ChatMessageFeedback).delete({ chatflowid: chatflowId });
        // Delete all upsert history
        await appServer.AppDataSource.getRepository(UpsertHistory_1.UpsertHistory).delete({ chatflowid: chatflowId });
        try {
            // Delete all uploads corresponding to this chatflow
            const { totalSize } = await (0, flowise_components_1.removeFolderFromStorage)(orgId, chatflowId);
            await (0, quotaUsage_1.updateStorageUsage)(orgId, workspaceId, totalSize, appServer.usageCacheManager);
        }
        catch (e) {
            logger_1.default.error(`[server]: Error deleting file storage for chatflow ${chatflowId}`);
        }
        return dbResponse;
    }
    catch (error) {
        throw new internalFlowiseError_1.InternalFlowiseError(http_status_codes_1.StatusCodes.INTERNAL_SERVER_ERROR, `Error: chatflowsService.deleteChatflow - ${(0, utils_1.getErrorMessage)(error)}`);
    }
};
const getAllChatflows = async (type, workspaceId, page = -1, limit = -1) => {
    try {
        const appServer = (0, getRunningExpressApp_1.getRunningExpressApp)();
        const queryBuilder = appServer.AppDataSource.getRepository(ChatFlow_1.ChatFlow)
            .createQueryBuilder('chat_flow')
            .orderBy('chat_flow.updatedDate', 'DESC');
        if (page > 0 && limit > 0) {
            queryBuilder.skip((page - 1) * limit);
            queryBuilder.take(limit);
        }
        if (type === 'MULTIAGENT') {
            queryBuilder.andWhere('chat_flow.type = :type', { type: 'MULTIAGENT' });
        }
        else if (type === 'AGENTFLOW') {
            queryBuilder.andWhere('chat_flow.type = :type', { type: 'AGENTFLOW' });
        }
        else if (type === 'ASSISTANT') {
            queryBuilder.andWhere('chat_flow.type = :type', { type: 'ASSISTANT' });
        }
        else if (type === 'CHATFLOW') {
            // fetch all chatflows that are not agentflow
            queryBuilder.andWhere('chat_flow.type = :type', { type: 'CHATFLOW' });
        }
        if (workspaceId)
            queryBuilder.andWhere('chat_flow.workspaceId = :workspaceId', { workspaceId });
        const [data, total] = await queryBuilder.getManyAndCount();
        if (page > 0 && limit > 0) {
            return { data, total };
        }
        else {
            return data;
        }
    }
    catch (error) {
        throw new internalFlowiseError_1.InternalFlowiseError(http_status_codes_1.StatusCodes.INTERNAL_SERVER_ERROR, `Error: chatflowsService.getAllChatflows - ${(0, utils_1.getErrorMessage)(error)}`);
    }
};
async function getAllChatflowsCountByOrganization(type, organizationId) {
    try {
        const appServer = (0, getRunningExpressApp_1.getRunningExpressApp)();
        const workspaces = await appServer.AppDataSource.getRepository(workspace_entity_1.Workspace).findBy({ organizationId });
        const workspaceIds = workspaces.map((workspace) => workspace.id);
        const chatflowsCount = await appServer.AppDataSource.getRepository(ChatFlow_1.ChatFlow).countBy({
            type,
            workspaceId: (0, typeorm_1.In)(workspaceIds)
        });
        return chatflowsCount;
    }
    catch (error) {
        throw new internalFlowiseError_1.InternalFlowiseError(http_status_codes_1.StatusCodes.INTERNAL_SERVER_ERROR, `Error: chatflowsService.getAllChatflowsCountByOrganization - ${(0, utils_1.getErrorMessage)(error)}`);
    }
}
const getAllChatflowsCount = async (type, workspaceId) => {
    try {
        const appServer = (0, getRunningExpressApp_1.getRunningExpressApp)();
        if (type) {
            const dbResponse = await appServer.AppDataSource.getRepository(ChatFlow_1.ChatFlow).countBy({
                type,
                ...(0, ControllerServiceUtils_1.getWorkspaceSearchOptions)(workspaceId)
            });
            return dbResponse;
        }
        const dbResponse = await appServer.AppDataSource.getRepository(ChatFlow_1.ChatFlow).countBy((0, ControllerServiceUtils_1.getWorkspaceSearchOptions)(workspaceId));
        return dbResponse;
    }
    catch (error) {
        throw new internalFlowiseError_1.InternalFlowiseError(http_status_codes_1.StatusCodes.INTERNAL_SERVER_ERROR, `Error: chatflowsService.getAllChatflowsCount - ${(0, utils_1.getErrorMessage)(error)}`);
    }
};
const getChatflowByApiKey = async (apiKeyId, keyonly) => {
    try {
        // Here we only get chatflows that are bounded by the apikeyid and chatflows that are not bounded by any apikey
        const appServer = (0, getRunningExpressApp_1.getRunningExpressApp)();
        let query = appServer.AppDataSource.getRepository(ChatFlow_1.ChatFlow)
            .createQueryBuilder('cf')
            .where('cf.apikeyid = :apikeyid', { apikeyid: apiKeyId });
        if (keyonly === undefined) {
            query = query.orWhere('cf.apikeyid IS NULL').orWhere('cf.apikeyid = ""');
        }
        const dbResponse = await query.orderBy('cf.name', 'ASC').getMany();
        if (dbResponse.length < 1) {
            throw new internalFlowiseError_1.InternalFlowiseError(http_status_codes_1.StatusCodes.NOT_FOUND, `Chatflow not found in the database!`);
        }
        return dbResponse;
    }
    catch (error) {
        throw new internalFlowiseError_1.InternalFlowiseError(http_status_codes_1.StatusCodes.INTERNAL_SERVER_ERROR, `Error: chatflowsService.getChatflowByApiKey - ${(0, utils_1.getErrorMessage)(error)}`);
    }
};
const getChatflowById = async (chatflowId) => {
    try {
        const appServer = (0, getRunningExpressApp_1.getRunningExpressApp)();
        const dbResponse = await appServer.AppDataSource.getRepository(ChatFlow_1.ChatFlow).findOneBy({
            id: chatflowId
        });
        if (!dbResponse) {
            throw new internalFlowiseError_1.InternalFlowiseError(http_status_codes_1.StatusCodes.NOT_FOUND, `Chatflow ${chatflowId} not found in the database!`);
        }
        return dbResponse;
    }
    catch (error) {
        throw new internalFlowiseError_1.InternalFlowiseError(http_status_codes_1.StatusCodes.INTERNAL_SERVER_ERROR, `Error: chatflowsService.getChatflowById - ${(0, utils_1.getErrorMessage)(error)}`);
    }
};
const saveChatflow = async (newChatFlow, orgId, workspaceId, subscriptionId, usageCacheManager) => {
    validateChatflowType(newChatFlow.type);
    const appServer = (0, getRunningExpressApp_1.getRunningExpressApp)();
    let dbResponse;
    if ((0, fileRepository_1.containsBase64File)(newChatFlow)) {
        // we need a 2-step process, as we need to save the chatflow first and then update the file paths
        // this is because we need the chatflow id to create the file paths
        // step 1 - save with empty flowData
        const incomingFlowData = newChatFlow.flowData;
        newChatFlow.flowData = JSON.stringify({});
        const chatflow = appServer.AppDataSource.getRepository(ChatFlow_1.ChatFlow).create(newChatFlow);
        const step1Results = await appServer.AppDataSource.getRepository(ChatFlow_1.ChatFlow).save(chatflow);
        // step 2 - convert base64 to file paths and update the chatflow
        step1Results.flowData = await (0, fileRepository_1.updateFlowDataWithFilePaths)(step1Results.id, incomingFlowData, orgId, workspaceId, subscriptionId, usageCacheManager);
        await _checkAndUpdateDocumentStoreUsage(step1Results, newChatFlow.workspaceId);
        dbResponse = await appServer.AppDataSource.getRepository(ChatFlow_1.ChatFlow).save(step1Results);
    }
    else {
        const chatflow = appServer.AppDataSource.getRepository(ChatFlow_1.ChatFlow).create(newChatFlow);
        dbResponse = await appServer.AppDataSource.getRepository(ChatFlow_1.ChatFlow).save(chatflow);
    }
    const productId = await appServer.identityManager.getProductIdFromSubscription(subscriptionId);
    await appServer.telemetry.sendTelemetry('chatflow_created', {
        version: await (0, utils_2.getAppVersion)(),
        chatflowId: dbResponse.id,
        flowGraph: (0, utils_2.getTelemetryFlowObj)(JSON.parse(dbResponse.flowData)?.nodes, JSON.parse(dbResponse.flowData)?.edges),
        productId,
        subscriptionId
    }, orgId);
    appServer.metricsProvider?.incrementCounter(dbResponse?.type === 'MULTIAGENT' ? Interface_Metrics_1.FLOWISE_METRIC_COUNTERS.AGENTFLOW_CREATED : Interface_Metrics_1.FLOWISE_METRIC_COUNTERS.CHATFLOW_CREATED, { status: Interface_Metrics_1.FLOWISE_COUNTER_STATUS.SUCCESS });
    return dbResponse;
};
const updateChatflow = async (chatflow, updateChatFlow, orgId, workspaceId, subscriptionId) => {
    const appServer = (0, getRunningExpressApp_1.getRunningExpressApp)();
    if (updateChatFlow.flowData && (0, fileRepository_1.containsBase64File)(updateChatFlow)) {
        updateChatFlow.flowData = await (0, fileRepository_1.updateFlowDataWithFilePaths)(chatflow.id, updateChatFlow.flowData, orgId, workspaceId, subscriptionId, appServer.usageCacheManager);
    }
    if (updateChatFlow.type || updateChatFlow.type === '') {
        validateChatflowType(updateChatFlow.type);
    }
    else {
        updateChatFlow.type = chatflow.type;
    }
    const newDbChatflow = appServer.AppDataSource.getRepository(ChatFlow_1.ChatFlow).merge(chatflow, updateChatFlow);
    await _checkAndUpdateDocumentStoreUsage(newDbChatflow, chatflow.workspaceId);
    const dbResponse = await appServer.AppDataSource.getRepository(ChatFlow_1.ChatFlow).save(newDbChatflow);
    return dbResponse;
};
// Get specific chatflow chatbotConfig via id (PUBLIC endpoint, used to retrieve config for embedded chat)
// Safe as public endpoint as chatbotConfig doesn't contain sensitive credential
const getSinglePublicChatbotConfig = async (chatflowId) => {
    try {
        const appServer = (0, getRunningExpressApp_1.getRunningExpressApp)();
        const dbResponse = await appServer.AppDataSource.getRepository(ChatFlow_1.ChatFlow).findOneBy({
            id: chatflowId
        });
        if (!dbResponse) {
            throw new internalFlowiseError_1.InternalFlowiseError(http_status_codes_1.StatusCodes.NOT_FOUND, `Chatflow ${chatflowId} not found`);
        }
        const uploadsConfig = await (0, getUploadsConfig_1.utilGetUploadsConfig)(chatflowId);
        // even if chatbotConfig is not set but uploads are enabled
        // send uploadsConfig to the chatbot
        if (dbResponse.chatbotConfig || uploadsConfig) {
            try {
                const parsedConfig = dbResponse.chatbotConfig ? JSON.parse(dbResponse.chatbotConfig) : {};
                const ttsConfig = typeof dbResponse.textToSpeech === 'string' ? JSON.parse(dbResponse.textToSpeech) : dbResponse.textToSpeech;
                let isTTSEnabled = false;
                if (ttsConfig) {
                    Object.keys(ttsConfig).forEach((provider) => {
                        if (provider !== 'none' && ttsConfig?.[provider]?.status) {
                            isTTSEnabled = true;
                        }
                    });
                }
                return { ...parsedConfig, uploads: uploadsConfig, flowData: dbResponse.flowData, isTTSEnabled };
            }
            catch (e) {
                throw new internalFlowiseError_1.InternalFlowiseError(http_status_codes_1.StatusCodes.INTERNAL_SERVER_ERROR, `Error parsing Chatbot Config for Chatflow ${chatflowId}`);
            }
        }
        return 'OK';
    }
    catch (error) {
        throw new internalFlowiseError_1.InternalFlowiseError(http_status_codes_1.StatusCodes.INTERNAL_SERVER_ERROR, `Error: chatflowsService.getSinglePublicChatbotConfig - ${(0, utils_1.getErrorMessage)(error)}`);
    }
};
const _checkAndUpdateDocumentStoreUsage = async (chatflow, workspaceId) => {
    const parsedFlowData = JSON.parse(chatflow.flowData);
    const nodes = parsedFlowData.nodes;
    // from the nodes array find if there is a node with name == documentStore)
    const node = nodes.length > 0 && nodes.find((node) => node.data.name === 'documentStore');
    if (!node || !node.data || !node.data.inputs || node.data.inputs['selectedStore'] === undefined) {
        await documentstore_1.default.updateDocumentStoreUsage(chatflow.id, undefined, workspaceId);
    }
    else {
        await documentstore_1.default.updateDocumentStoreUsage(chatflow.id, node.data.inputs['selectedStore'], workspaceId);
    }
};
const checkIfChatflowHasChanged = async (chatflowId, lastUpdatedDateTime) => {
    try {
        const appServer = (0, getRunningExpressApp_1.getRunningExpressApp)();
        //**
        const chatflow = await appServer.AppDataSource.getRepository(ChatFlow_1.ChatFlow).findOneBy({
            id: chatflowId
        });
        if (!chatflow) {
            throw new internalFlowiseError_1.InternalFlowiseError(http_status_codes_1.StatusCodes.NOT_FOUND, `Chatflow ${chatflowId} not found`);
        }
        // parse the lastUpdatedDateTime as a date and
        //check if the updatedDate is the same as the lastUpdatedDateTime
        return { hasChanged: chatflow.updatedDate.toISOString() !== lastUpdatedDateTime };
    }
    catch (error) {
        throw new internalFlowiseError_1.InternalFlowiseError(http_status_codes_1.StatusCodes.INTERNAL_SERVER_ERROR, `Error: chatflowsService.checkIfChatflowHasChanged - ${(0, utils_1.getErrorMessage)(error)}`);
    }
};
exports.default = {
    checkIfChatflowIsValidForStreaming,
    checkIfChatflowIsValidForUploads,
    deleteChatflow,
    getAllChatflows,
    getAllChatflowsCount,
    getChatflowByApiKey,
    getChatflowById,
    saveChatflow,
    updateChatflow,
    getSinglePublicChatbotConfig,
    checkIfChatflowHasChanged,
    getAllChatflowsCountByOrganization
};
//# sourceMappingURL=index.js.map