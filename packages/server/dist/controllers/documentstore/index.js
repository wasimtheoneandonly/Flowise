"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const http_status_codes_1 = require("http-status-codes");
const documentstore_1 = __importDefault(require("../../services/documentstore"));
const DocumentStore_1 = require("../../database/entities/DocumentStore");
const internalFlowiseError_1 = require("../../errors/internalFlowiseError");
const Interface_1 = require("../../Interface");
const getRunningExpressApp_1 = require("../../utils/getRunningExpressApp");
const Interface_Metrics_1 = require("../../Interface.Metrics");
const pagination_1 = require("../../utils/pagination");
const createDocumentStore = async (req, res, next) => {
    try {
        if (typeof req.body === 'undefined') {
            throw new internalFlowiseError_1.InternalFlowiseError(http_status_codes_1.StatusCodes.PRECONDITION_FAILED, `Error: documentStoreController.createDocumentStore - body not provided!`);
        }
        const orgId = req.user?.activeOrganizationId;
        if (!orgId) {
            throw new internalFlowiseError_1.InternalFlowiseError(http_status_codes_1.StatusCodes.PRECONDITION_FAILED, `Error: documentStoreController.createDocumentStore - organizationId not provided!`);
        }
        const body = req.body;
        body.workspaceId = req.user?.activeWorkspaceId;
        const docStore = Interface_1.DocumentStoreDTO.toEntity(body);
        const apiResponse = await documentstore_1.default.createDocumentStore(docStore, orgId);
        return res.json(apiResponse);
    }
    catch (error) {
        next(error);
    }
};
const getAllDocumentStores = async (req, res, next) => {
    try {
        const { page, limit } = (0, pagination_1.getPageAndLimitParams)(req);
        const apiResponse = await documentstore_1.default.getAllDocumentStores(req.user?.activeWorkspaceId, page, limit);
        if (apiResponse?.total >= 0) {
            return res.json({
                total: apiResponse.total,
                data: Interface_1.DocumentStoreDTO.fromEntities(apiResponse.data)
            });
        }
        else {
            return res.json(Interface_1.DocumentStoreDTO.fromEntities(apiResponse));
        }
    }
    catch (error) {
        next(error);
    }
};
const deleteLoaderFromDocumentStore = async (req, res, next) => {
    try {
        const storeId = req.params.id;
        const loaderId = req.params.loaderId;
        if (!storeId || !loaderId) {
            throw new internalFlowiseError_1.InternalFlowiseError(http_status_codes_1.StatusCodes.PRECONDITION_FAILED, `Error: documentStoreController.deleteLoaderFromDocumentStore - missing storeId or loaderId.`);
        }
        const orgId = req.user?.activeOrganizationId;
        if (!orgId) {
            throw new internalFlowiseError_1.InternalFlowiseError(http_status_codes_1.StatusCodes.PRECONDITION_FAILED, `Error: documentStoreController.createDocumentStore - organizationId not provided!`);
        }
        const workspaceId = req.user?.activeWorkspaceId;
        if (!workspaceId) {
            throw new internalFlowiseError_1.InternalFlowiseError(http_status_codes_1.StatusCodes.PRECONDITION_FAILED, `Error: documentStoreController.createDocumentStore - workspaceId not provided!`);
        }
        const apiResponse = await documentstore_1.default.deleteLoaderFromDocumentStore(storeId, loaderId, orgId, workspaceId, (0, getRunningExpressApp_1.getRunningExpressApp)().usageCacheManager);
        return res.json(Interface_1.DocumentStoreDTO.fromEntity(apiResponse));
    }
    catch (error) {
        next(error);
    }
};
const getDocumentStoreById = async (req, res, next) => {
    try {
        if (typeof req.params.id === 'undefined' || req.params.id === '') {
            throw new internalFlowiseError_1.InternalFlowiseError(http_status_codes_1.StatusCodes.PRECONDITION_FAILED, `Error: documentStoreController.getDocumentStoreById - id not provided!`);
        }
        const apiResponse = await documentstore_1.default.getDocumentStoreById(req.params.id);
        if (apiResponse && apiResponse.whereUsed) {
            apiResponse.whereUsed = JSON.stringify(await documentstore_1.default.getUsedChatflowNames(apiResponse));
        }
        return res.json(Interface_1.DocumentStoreDTO.fromEntity(apiResponse));
    }
    catch (error) {
        next(error);
    }
};
const getDocumentStoreFileChunks = async (req, res, next) => {
    try {
        if (typeof req.params.storeId === 'undefined' || req.params.storeId === '') {
            throw new internalFlowiseError_1.InternalFlowiseError(http_status_codes_1.StatusCodes.PRECONDITION_FAILED, `Error: documentStoreController.getDocumentStoreFileChunks - storeId not provided!`);
        }
        if (typeof req.params.fileId === 'undefined' || req.params.fileId === '') {
            throw new internalFlowiseError_1.InternalFlowiseError(http_status_codes_1.StatusCodes.PRECONDITION_FAILED, `Error: documentStoreController.getDocumentStoreFileChunks - fileId not provided!`);
        }
        const appDataSource = (0, getRunningExpressApp_1.getRunningExpressApp)().AppDataSource;
        const page = req.params.pageNo ? parseInt(req.params.pageNo) : 1;
        const apiResponse = await documentstore_1.default.getDocumentStoreFileChunks(appDataSource, req.params.storeId, req.params.fileId, page);
        return res.json(apiResponse);
    }
    catch (error) {
        next(error);
    }
};
const deleteDocumentStoreFileChunk = async (req, res, next) => {
    try {
        if (typeof req.params.storeId === 'undefined' || req.params.storeId === '') {
            throw new internalFlowiseError_1.InternalFlowiseError(http_status_codes_1.StatusCodes.PRECONDITION_FAILED, `Error: documentStoreController.deleteDocumentStoreFileChunk - storeId not provided!`);
        }
        if (typeof req.params.loaderId === 'undefined' || req.params.loaderId === '') {
            throw new internalFlowiseError_1.InternalFlowiseError(http_status_codes_1.StatusCodes.PRECONDITION_FAILED, `Error: documentStoreController.deleteDocumentStoreFileChunk - loaderId not provided!`);
        }
        if (typeof req.params.chunkId === 'undefined' || req.params.chunkId === '') {
            throw new internalFlowiseError_1.InternalFlowiseError(http_status_codes_1.StatusCodes.PRECONDITION_FAILED, `Error: documentStoreController.deleteDocumentStoreFileChunk - chunkId not provided!`);
        }
        const apiResponse = await documentstore_1.default.deleteDocumentStoreFileChunk(req.params.storeId, req.params.loaderId, req.params.chunkId);
        return res.json(apiResponse);
    }
    catch (error) {
        next(error);
    }
};
const editDocumentStoreFileChunk = async (req, res, next) => {
    try {
        if (typeof req.params.storeId === 'undefined' || req.params.storeId === '') {
            throw new internalFlowiseError_1.InternalFlowiseError(http_status_codes_1.StatusCodes.PRECONDITION_FAILED, `Error: documentStoreController.editDocumentStoreFileChunk - storeId not provided!`);
        }
        if (typeof req.params.loaderId === 'undefined' || req.params.loaderId === '') {
            throw new internalFlowiseError_1.InternalFlowiseError(http_status_codes_1.StatusCodes.PRECONDITION_FAILED, `Error: documentStoreController.editDocumentStoreFileChunk - loaderId not provided!`);
        }
        if (typeof req.params.chunkId === 'undefined' || req.params.chunkId === '') {
            throw new internalFlowiseError_1.InternalFlowiseError(http_status_codes_1.StatusCodes.PRECONDITION_FAILED, `Error: documentStoreController.editDocumentStoreFileChunk - chunkId not provided!`);
        }
        const body = req.body;
        if (typeof body === 'undefined') {
            throw new internalFlowiseError_1.InternalFlowiseError(http_status_codes_1.StatusCodes.PRECONDITION_FAILED, `Error: documentStoreController.editDocumentStoreFileChunk - body not provided!`);
        }
        const apiResponse = await documentstore_1.default.editDocumentStoreFileChunk(req.params.storeId, req.params.loaderId, req.params.chunkId, body.pageContent, body.metadata);
        return res.json(apiResponse);
    }
    catch (error) {
        next(error);
    }
};
const saveProcessingLoader = async (req, res, next) => {
    try {
        const appServer = (0, getRunningExpressApp_1.getRunningExpressApp)();
        if (typeof req.body === 'undefined') {
            throw new internalFlowiseError_1.InternalFlowiseError(http_status_codes_1.StatusCodes.PRECONDITION_FAILED, `Error: documentStoreController.saveProcessingLoader - body not provided!`);
        }
        const body = req.body;
        const apiResponse = await documentstore_1.default.saveProcessingLoader(appServer.AppDataSource, body);
        return res.json(apiResponse);
    }
    catch (error) {
        next(error);
    }
};
const processLoader = async (req, res, next) => {
    try {
        if (typeof req.params.loaderId === 'undefined' || req.params.loaderId === '') {
            throw new internalFlowiseError_1.InternalFlowiseError(http_status_codes_1.StatusCodes.PRECONDITION_FAILED, `Error: documentStoreController.processLoader - loaderId not provided!`);
        }
        if (typeof req.body === 'undefined') {
            throw new internalFlowiseError_1.InternalFlowiseError(http_status_codes_1.StatusCodes.PRECONDITION_FAILED, `Error: documentStoreController.processLoader - body not provided!`);
        }
        const orgId = req.user?.activeOrganizationId;
        if (!orgId) {
            throw new internalFlowiseError_1.InternalFlowiseError(http_status_codes_1.StatusCodes.PRECONDITION_FAILED, `Error: documentStoreController.createDocumentStore - organizationId not provided!`);
        }
        const workspaceId = req.user?.activeWorkspaceId;
        if (!workspaceId) {
            throw new internalFlowiseError_1.InternalFlowiseError(http_status_codes_1.StatusCodes.PRECONDITION_FAILED, `Error: documentStoreController.createDocumentStore - workspaceId not provided!`);
        }
        const subscriptionId = req.user?.activeOrganizationSubscriptionId || '';
        const docLoaderId = req.params.loaderId;
        const body = req.body;
        const isInternalRequest = req.headers['x-request-from'] === 'internal';
        const apiResponse = await documentstore_1.default.processLoaderMiddleware(body, docLoaderId, orgId, workspaceId, subscriptionId, (0, getRunningExpressApp_1.getRunningExpressApp)().usageCacheManager, isInternalRequest);
        return res.json(apiResponse);
    }
    catch (error) {
        next(error);
    }
};
const updateDocumentStore = async (req, res, next) => {
    try {
        if (typeof req.params.id === 'undefined' || req.params.id === '') {
            throw new internalFlowiseError_1.InternalFlowiseError(http_status_codes_1.StatusCodes.PRECONDITION_FAILED, `Error: documentStoreController.updateDocumentStore - storeId not provided!`);
        }
        if (typeof req.body === 'undefined') {
            throw new internalFlowiseError_1.InternalFlowiseError(http_status_codes_1.StatusCodes.PRECONDITION_FAILED, `Error: documentStoreController.updateDocumentStore - body not provided!`);
        }
        const store = await documentstore_1.default.getDocumentStoreById(req.params.id);
        if (!store) {
            throw new internalFlowiseError_1.InternalFlowiseError(http_status_codes_1.StatusCodes.NOT_FOUND, `Error: documentStoreController.updateDocumentStore - DocumentStore ${req.params.id} not found in the database`);
        }
        const body = req.body;
        const updateDocStore = new DocumentStore_1.DocumentStore();
        Object.assign(updateDocStore, body);
        const apiResponse = await documentstore_1.default.updateDocumentStore(store, updateDocStore);
        return res.json(Interface_1.DocumentStoreDTO.fromEntity(apiResponse));
    }
    catch (error) {
        next(error);
    }
};
const deleteDocumentStore = async (req, res, next) => {
    try {
        if (typeof req.params.id === 'undefined' || req.params.id === '') {
            throw new internalFlowiseError_1.InternalFlowiseError(http_status_codes_1.StatusCodes.PRECONDITION_FAILED, `Error: documentStoreController.deleteDocumentStore - storeId not provided!`);
        }
        const orgId = req.user?.activeOrganizationId;
        if (!orgId) {
            throw new internalFlowiseError_1.InternalFlowiseError(http_status_codes_1.StatusCodes.PRECONDITION_FAILED, `Error: documentStoreController.createDocumentStore - organizationId not provided!`);
        }
        const workspaceId = req.user?.activeWorkspaceId;
        if (!workspaceId) {
            throw new internalFlowiseError_1.InternalFlowiseError(http_status_codes_1.StatusCodes.PRECONDITION_FAILED, `Error: documentStoreController.createDocumentStore - workspaceId not provided!`);
        }
        const apiResponse = await documentstore_1.default.deleteDocumentStore(req.params.id, orgId, workspaceId, (0, getRunningExpressApp_1.getRunningExpressApp)().usageCacheManager);
        return res.json(apiResponse);
    }
    catch (error) {
        next(error);
    }
};
const previewFileChunks = async (req, res, next) => {
    try {
        if (typeof req.body === 'undefined') {
            throw new internalFlowiseError_1.InternalFlowiseError(http_status_codes_1.StatusCodes.PRECONDITION_FAILED, `Error: documentStoreController.previewFileChunks - body not provided!`);
        }
        const orgId = req.user?.activeOrganizationId;
        if (!orgId) {
            throw new internalFlowiseError_1.InternalFlowiseError(http_status_codes_1.StatusCodes.PRECONDITION_FAILED, `Error: documentStoreController.createDocumentStore - organizationId not provided!`);
        }
        const workspaceId = req.user?.activeWorkspaceId;
        if (!workspaceId) {
            throw new internalFlowiseError_1.InternalFlowiseError(http_status_codes_1.StatusCodes.PRECONDITION_FAILED, `Error: documentStoreController.createDocumentStore - workspaceId not provided!`);
        }
        const subscriptionId = req.user?.activeOrganizationSubscriptionId || '';
        const body = req.body;
        body.preview = true;
        const apiResponse = await documentstore_1.default.previewChunksMiddleware(body, orgId, workspaceId, subscriptionId, (0, getRunningExpressApp_1.getRunningExpressApp)().usageCacheManager);
        return res.json(apiResponse);
    }
    catch (error) {
        next(error);
    }
};
const getDocumentLoaders = async (req, res, next) => {
    try {
        const apiResponse = await documentstore_1.default.getDocumentLoaders();
        return res.json(apiResponse);
    }
    catch (error) {
        next(error);
    }
};
const insertIntoVectorStore = async (req, res, next) => {
    try {
        if (typeof req.body === 'undefined') {
            throw new Error('Error: documentStoreController.insertIntoVectorStore - body not provided!');
        }
        const orgId = req.user?.activeOrganizationId;
        if (!orgId) {
            throw new internalFlowiseError_1.InternalFlowiseError(http_status_codes_1.StatusCodes.PRECONDITION_FAILED, `Error: documentStoreController.createDocumentStore - organizationId not provided!`);
        }
        const workspaceId = req.user?.activeWorkspaceId;
        if (!workspaceId) {
            throw new internalFlowiseError_1.InternalFlowiseError(http_status_codes_1.StatusCodes.PRECONDITION_FAILED, `Error: documentStoreController.createDocumentStore - workspaceId not provided!`);
        }
        const subscriptionId = req.user?.activeOrganizationSubscriptionId || '';
        const body = req.body;
        const apiResponse = await documentstore_1.default.insertIntoVectorStoreMiddleware(body, false, orgId, workspaceId, subscriptionId, (0, getRunningExpressApp_1.getRunningExpressApp)().usageCacheManager);
        (0, getRunningExpressApp_1.getRunningExpressApp)().metricsProvider?.incrementCounter(Interface_Metrics_1.FLOWISE_METRIC_COUNTERS.VECTORSTORE_UPSERT, {
            status: Interface_Metrics_1.FLOWISE_COUNTER_STATUS.SUCCESS
        });
        return res.json(Interface_1.DocumentStoreDTO.fromEntity(apiResponse));
    }
    catch (error) {
        (0, getRunningExpressApp_1.getRunningExpressApp)().metricsProvider?.incrementCounter(Interface_Metrics_1.FLOWISE_METRIC_COUNTERS.VECTORSTORE_UPSERT, {
            status: Interface_Metrics_1.FLOWISE_COUNTER_STATUS.FAILURE
        });
        next(error);
    }
};
const queryVectorStore = async (req, res, next) => {
    try {
        if (typeof req.body === 'undefined') {
            throw new Error('Error: documentStoreController.queryVectorStore - body not provided!');
        }
        const body = req.body;
        const apiResponse = await documentstore_1.default.queryVectorStore(body);
        return res.json(apiResponse);
    }
    catch (error) {
        next(error);
    }
};
const deleteVectorStoreFromStore = async (req, res, next) => {
    try {
        if (typeof req.params.storeId === 'undefined' || req.params.storeId === '') {
            throw new internalFlowiseError_1.InternalFlowiseError(http_status_codes_1.StatusCodes.PRECONDITION_FAILED, `Error: documentStoreController.deleteVectorStoreFromStore - storeId not provided!`);
        }
        const apiResponse = await documentstore_1.default.deleteVectorStoreFromStore(req.params.storeId);
        return res.json(apiResponse);
    }
    catch (error) {
        next(error);
    }
};
const saveVectorStoreConfig = async (req, res, next) => {
    try {
        if (typeof req.body === 'undefined') {
            throw new Error('Error: documentStoreController.saveVectorStoreConfig - body not provided!');
        }
        const body = req.body;
        const appDataSource = (0, getRunningExpressApp_1.getRunningExpressApp)().AppDataSource;
        const apiResponse = await documentstore_1.default.saveVectorStoreConfig(appDataSource, body);
        return res.json(apiResponse);
    }
    catch (error) {
        next(error);
    }
};
const updateVectorStoreConfigOnly = async (req, res, next) => {
    try {
        if (typeof req.body === 'undefined') {
            throw new Error('Error: documentStoreController.updateVectorStoreConfigOnly - body not provided!');
        }
        const body = req.body;
        const apiResponse = await documentstore_1.default.updateVectorStoreConfigOnly(body);
        return res.json(apiResponse);
    }
    catch (error) {
        next(error);
    }
};
const getEmbeddingProviders = async (req, res, next) => {
    try {
        const apiResponse = await documentstore_1.default.getEmbeddingProviders();
        return res.json(apiResponse);
    }
    catch (error) {
        next(error);
    }
};
const getVectorStoreProviders = async (req, res, next) => {
    try {
        const apiResponse = await documentstore_1.default.getVectorStoreProviders();
        return res.json(apiResponse);
    }
    catch (error) {
        next(error);
    }
};
const getRecordManagerProviders = async (req, res, next) => {
    try {
        const apiResponse = await documentstore_1.default.getRecordManagerProviders();
        return res.json(apiResponse);
    }
    catch (error) {
        next(error);
    }
};
const upsertDocStoreMiddleware = async (req, res, next) => {
    try {
        if (typeof req.params.id === 'undefined' || req.params.id === '') {
            throw new internalFlowiseError_1.InternalFlowiseError(http_status_codes_1.StatusCodes.PRECONDITION_FAILED, `Error: documentStoreController.upsertDocStoreMiddleware - storeId not provided!`);
        }
        if (typeof req.body === 'undefined') {
            throw new Error('Error: documentStoreController.upsertDocStoreMiddleware - body not provided!');
        }
        const orgId = req.user?.activeOrganizationId;
        if (!orgId) {
            throw new internalFlowiseError_1.InternalFlowiseError(http_status_codes_1.StatusCodes.PRECONDITION_FAILED, `Error: documentStoreController.createDocumentStore - organizationId not provided!`);
        }
        const workspaceId = req.user?.activeWorkspaceId;
        if (!workspaceId) {
            throw new internalFlowiseError_1.InternalFlowiseError(http_status_codes_1.StatusCodes.PRECONDITION_FAILED, `Error: documentStoreController.createDocumentStore - workspaceId not provided!`);
        }
        const subscriptionId = req.user?.activeOrganizationSubscriptionId || '';
        const body = req.body;
        const files = req.files || [];
        const apiResponse = await documentstore_1.default.upsertDocStoreMiddleware(req.params.id, body, files, orgId, workspaceId, subscriptionId, (0, getRunningExpressApp_1.getRunningExpressApp)().usageCacheManager);
        (0, getRunningExpressApp_1.getRunningExpressApp)().metricsProvider?.incrementCounter(Interface_Metrics_1.FLOWISE_METRIC_COUNTERS.VECTORSTORE_UPSERT, {
            status: Interface_Metrics_1.FLOWISE_COUNTER_STATUS.SUCCESS
        });
        return res.json(apiResponse);
    }
    catch (error) {
        (0, getRunningExpressApp_1.getRunningExpressApp)().metricsProvider?.incrementCounter(Interface_Metrics_1.FLOWISE_METRIC_COUNTERS.VECTORSTORE_UPSERT, {
            status: Interface_Metrics_1.FLOWISE_COUNTER_STATUS.FAILURE
        });
        next(error);
    }
};
const refreshDocStoreMiddleware = async (req, res, next) => {
    try {
        if (typeof req.params.id === 'undefined' || req.params.id === '') {
            throw new internalFlowiseError_1.InternalFlowiseError(http_status_codes_1.StatusCodes.PRECONDITION_FAILED, `Error: documentStoreController.refreshDocStoreMiddleware - storeId not provided!`);
        }
        const orgId = req.user?.activeOrganizationId;
        if (!orgId) {
            throw new internalFlowiseError_1.InternalFlowiseError(http_status_codes_1.StatusCodes.PRECONDITION_FAILED, `Error: documentStoreController.createDocumentStore - organizationId not provided!`);
        }
        const workspaceId = req.user?.activeWorkspaceId;
        if (!workspaceId) {
            throw new internalFlowiseError_1.InternalFlowiseError(http_status_codes_1.StatusCodes.PRECONDITION_FAILED, `Error: documentStoreController.createDocumentStore - workspaceId not provided!`);
        }
        const subscriptionId = req.user?.activeOrganizationSubscriptionId || '';
        const body = req.body;
        const apiResponse = await documentstore_1.default.refreshDocStoreMiddleware(req.params.id, body, orgId, workspaceId, subscriptionId, (0, getRunningExpressApp_1.getRunningExpressApp)().usageCacheManager);
        (0, getRunningExpressApp_1.getRunningExpressApp)().metricsProvider?.incrementCounter(Interface_Metrics_1.FLOWISE_METRIC_COUNTERS.VECTORSTORE_UPSERT, {
            status: Interface_Metrics_1.FLOWISE_COUNTER_STATUS.SUCCESS
        });
        return res.json(apiResponse);
    }
    catch (error) {
        (0, getRunningExpressApp_1.getRunningExpressApp)().metricsProvider?.incrementCounter(Interface_Metrics_1.FLOWISE_METRIC_COUNTERS.VECTORSTORE_UPSERT, {
            status: Interface_Metrics_1.FLOWISE_COUNTER_STATUS.FAILURE
        });
        next(error);
    }
};
const generateDocStoreToolDesc = async (req, res, next) => {
    try {
        if (typeof req.params.id === 'undefined' || req.params.id === '') {
            throw new internalFlowiseError_1.InternalFlowiseError(http_status_codes_1.StatusCodes.PRECONDITION_FAILED, `Error: documentStoreController.generateDocStoreToolDesc - storeId not provided!`);
        }
        if (typeof req.body === 'undefined') {
            throw new Error('Error: documentStoreController.generateDocStoreToolDesc - body not provided!');
        }
        const apiResponse = await documentstore_1.default.generateDocStoreToolDesc(req.params.id, req.body.selectedChatModel);
        return res.json(apiResponse);
    }
    catch (error) {
        next(error);
    }
};
const getDocStoreConfigs = async (req, res, next) => {
    try {
        if (typeof req.params.id === 'undefined' || req.params.id === '') {
            throw new internalFlowiseError_1.InternalFlowiseError(http_status_codes_1.StatusCodes.PRECONDITION_FAILED, `Error: documentStoreController.getDocStoreConfigs - storeId not provided!`);
        }
        if (typeof req.params.loaderId === 'undefined' || req.params.loaderId === '') {
            throw new internalFlowiseError_1.InternalFlowiseError(http_status_codes_1.StatusCodes.PRECONDITION_FAILED, `Error: documentStoreController.getDocStoreConfigs - doc loader Id not provided!`);
        }
        const apiResponse = await documentstore_1.default.findDocStoreAvailableConfigs(req.params.id, req.params.loaderId);
        return res.json(apiResponse);
    }
    catch (error) {
        next(error);
    }
};
exports.default = {
    deleteDocumentStore,
    createDocumentStore,
    getAllDocumentStores,
    deleteLoaderFromDocumentStore,
    getDocumentStoreById,
    getDocumentStoreFileChunks,
    updateDocumentStore,
    processLoader,
    previewFileChunks,
    getDocumentLoaders,
    deleteDocumentStoreFileChunk,
    editDocumentStoreFileChunk,
    insertIntoVectorStore,
    getEmbeddingProviders,
    getVectorStoreProviders,
    getRecordManagerProviders,
    saveVectorStoreConfig,
    queryVectorStore,
    deleteVectorStoreFromStore,
    updateVectorStoreConfigOnly,
    upsertDocStoreMiddleware,
    refreshDocStoreMiddleware,
    saveProcessingLoader,
    generateDocStoreToolDesc,
    getDocStoreConfigs
};
//# sourceMappingURL=index.js.map