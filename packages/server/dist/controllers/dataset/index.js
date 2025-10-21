"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const internalFlowiseError_1 = require("../../errors/internalFlowiseError");
const dataset_1 = __importDefault(require("../../services/dataset"));
const http_status_codes_1 = require("http-status-codes");
const pagination_1 = require("../../utils/pagination");
const getAllDatasets = async (req, res, next) => {
    try {
        const { page, limit } = (0, pagination_1.getPageAndLimitParams)(req);
        const apiResponse = await dataset_1.default.getAllDatasets(req.user?.activeWorkspaceId, page, limit);
        return res.json(apiResponse);
    }
    catch (error) {
        next(error);
    }
};
const getDataset = async (req, res, next) => {
    try {
        if (typeof req.params === 'undefined' || !req.params.id) {
            throw new internalFlowiseError_1.InternalFlowiseError(http_status_codes_1.StatusCodes.PRECONDITION_FAILED, `Error: datasetService.getDataset - id not provided!`);
        }
        const { page, limit } = (0, pagination_1.getPageAndLimitParams)(req);
        const apiResponse = await dataset_1.default.getDataset(req.params.id, page, limit);
        return res.json(apiResponse);
    }
    catch (error) {
        next(error);
    }
};
const createDataset = async (req, res, next) => {
    try {
        if (!req.body) {
            throw new internalFlowiseError_1.InternalFlowiseError(http_status_codes_1.StatusCodes.PRECONDITION_FAILED, `Error: datasetService.createDataset - body not provided!`);
        }
        const body = req.body;
        body.workspaceId = req.user?.activeWorkspaceId;
        const apiResponse = await dataset_1.default.createDataset(body);
        return res.json(apiResponse);
    }
    catch (error) {
        next(error);
    }
};
const updateDataset = async (req, res, next) => {
    try {
        if (!req.body) {
            throw new internalFlowiseError_1.InternalFlowiseError(http_status_codes_1.StatusCodes.PRECONDITION_FAILED, `Error: datasetService.updateDataset - body not provided!`);
        }
        if (typeof req.params === 'undefined' || !req.params.id) {
            throw new internalFlowiseError_1.InternalFlowiseError(http_status_codes_1.StatusCodes.PRECONDITION_FAILED, `Error: datasetService.updateDataset - id not provided!`);
        }
        const apiResponse = await dataset_1.default.updateDataset(req.params.id, req.body);
        return res.json(apiResponse);
    }
    catch (error) {
        next(error);
    }
};
const deleteDataset = async (req, res, next) => {
    try {
        if (typeof req.params === 'undefined' || !req.params.id) {
            throw new internalFlowiseError_1.InternalFlowiseError(http_status_codes_1.StatusCodes.PRECONDITION_FAILED, `Error: datasetService.deleteDataset - id not provided!`);
        }
        const apiResponse = await dataset_1.default.deleteDataset(req.params.id);
        return res.json(apiResponse);
    }
    catch (error) {
        next(error);
    }
};
const addDatasetRow = async (req, res, next) => {
    try {
        if (!req.body) {
            throw new internalFlowiseError_1.InternalFlowiseError(http_status_codes_1.StatusCodes.PRECONDITION_FAILED, `Error: datasetService.addDatasetRow - body not provided!`);
        }
        if (!req.body.datasetId) {
            throw new internalFlowiseError_1.InternalFlowiseError(http_status_codes_1.StatusCodes.PRECONDITION_FAILED, `Error: datasetService.addDatasetRow - datasetId not provided!`);
        }
        const apiResponse = await dataset_1.default.addDatasetRow(req.body);
        return res.json(apiResponse);
    }
    catch (error) {
        next(error);
    }
};
const updateDatasetRow = async (req, res, next) => {
    try {
        if (!req.body) {
            throw new internalFlowiseError_1.InternalFlowiseError(http_status_codes_1.StatusCodes.PRECONDITION_FAILED, `Error: datasetService.updateDatasetRow - body not provided!`);
        }
        if (typeof req.params === 'undefined' || !req.params.id) {
            throw new internalFlowiseError_1.InternalFlowiseError(http_status_codes_1.StatusCodes.PRECONDITION_FAILED, `Error: datasetService.updateDatasetRow - id not provided!`);
        }
        const apiResponse = await dataset_1.default.updateDatasetRow(req.params.id, req.body);
        return res.json(apiResponse);
    }
    catch (error) {
        next(error);
    }
};
const deleteDatasetRow = async (req, res, next) => {
    try {
        if (typeof req.params === 'undefined' || !req.params.id) {
            throw new internalFlowiseError_1.InternalFlowiseError(http_status_codes_1.StatusCodes.PRECONDITION_FAILED, `Error: datasetService.deleteDatasetRow - id not provided!`);
        }
        const apiResponse = await dataset_1.default.deleteDatasetRow(req.params.id);
        return res.json(apiResponse);
    }
    catch (error) {
        next(error);
    }
};
const patchDeleteRows = async (req, res, next) => {
    try {
        const ids = req.body.ids ?? [];
        const apiResponse = await dataset_1.default.patchDeleteRows(ids);
        return res.json(apiResponse);
    }
    catch (error) {
        next(error);
    }
};
const reorderDatasetRow = async (req, res, next) => {
    try {
        if (!req.body) {
            throw new internalFlowiseError_1.InternalFlowiseError(http_status_codes_1.StatusCodes.PRECONDITION_FAILED, `Error: datasetService.reorderDatasetRow - body not provided!`);
        }
        const apiResponse = await dataset_1.default.reorderDatasetRow(req.body.datasetId, req.body.rows);
        return res.json(apiResponse);
    }
    catch (error) {
        next(error);
    }
};
exports.default = {
    getAllDatasets,
    getDataset,
    createDataset,
    updateDataset,
    deleteDataset,
    addDatasetRow,
    updateDatasetRow,
    deleteDatasetRow,
    patchDeleteRows,
    reorderDatasetRow
};
//# sourceMappingURL=index.js.map