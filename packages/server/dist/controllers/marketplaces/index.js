"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const marketplaces_1 = __importDefault(require("../../services/marketplaces"));
const internalFlowiseError_1 = require("../../errors/internalFlowiseError");
const http_status_codes_1 = require("http-status-codes");
// Get all templates for marketplaces
const getAllTemplates = async (req, res, next) => {
    try {
        const apiResponse = await marketplaces_1.default.getAllTemplates();
        return res.json(apiResponse);
    }
    catch (error) {
        next(error);
    }
};
const deleteCustomTemplate = async (req, res, next) => {
    try {
        if (typeof req.params === 'undefined' || !req.params.id) {
            throw new internalFlowiseError_1.InternalFlowiseError(http_status_codes_1.StatusCodes.PRECONDITION_FAILED, `Error: marketplacesService.deleteCustomTemplate - id not provided!`);
        }
        const apiResponse = await marketplaces_1.default.deleteCustomTemplate(req.params.id);
        return res.json(apiResponse);
    }
    catch (error) {
        next(error);
    }
};
const getAllCustomTemplates = async (req, res, next) => {
    try {
        const apiResponse = await marketplaces_1.default.getAllCustomTemplates(req.user?.activeWorkspaceId);
        return res.json(apiResponse);
    }
    catch (error) {
        next(error);
    }
};
const saveCustomTemplate = async (req, res, next) => {
    try {
        if ((!req.body && !(req.body.chatflowId || req.body.tool)) || !req.body.name) {
            throw new internalFlowiseError_1.InternalFlowiseError(http_status_codes_1.StatusCodes.PRECONDITION_FAILED, `Error: marketplacesService.saveCustomTemplate - body not provided!`);
        }
        const body = req.body;
        body.workspaceId = req.user?.activeWorkspaceId;
        const apiResponse = await marketplaces_1.default.saveCustomTemplate(body);
        return res.json(apiResponse);
    }
    catch (error) {
        next(error);
    }
};
exports.default = {
    getAllTemplates,
    getAllCustomTemplates,
    saveCustomTemplate,
    deleteCustomTemplate
};
//# sourceMappingURL=index.js.map