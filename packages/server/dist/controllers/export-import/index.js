"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const http_status_codes_1 = require("http-status-codes");
const internalFlowiseError_1 = require("../../errors/internalFlowiseError");
const export_import_1 = __importDefault(require("../../services/export-import"));
const exportData = async (req, res, next) => {
    try {
        const apiResponse = await export_import_1.default.exportData(export_import_1.default.convertExportInput(req.body), req.user?.activeWorkspaceId);
        return res.json(apiResponse);
    }
    catch (error) {
        next(error);
    }
};
const importData = async (req, res, next) => {
    try {
        const orgId = req.user?.activeOrganizationId;
        if (!orgId) {
            throw new internalFlowiseError_1.InternalFlowiseError(http_status_codes_1.StatusCodes.NOT_FOUND, `Error: exportImportController.importData - organization ${orgId} not found!`);
        }
        const workspaceId = req.user?.activeWorkspaceId;
        if (!workspaceId) {
            throw new internalFlowiseError_1.InternalFlowiseError(http_status_codes_1.StatusCodes.NOT_FOUND, `Error: exportImportController.importData - workspace ${workspaceId} not found!`);
        }
        const subscriptionId = req.user?.activeOrganizationSubscriptionId || '';
        const importData = req.body;
        if (!importData) {
            throw new internalFlowiseError_1.InternalFlowiseError(http_status_codes_1.StatusCodes.BAD_REQUEST, 'Error: exportImportController.importData - importData is required!');
        }
        await export_import_1.default.importData(importData, orgId, workspaceId, subscriptionId);
        return res.status(http_status_codes_1.StatusCodes.OK).json({ message: 'success' });
    }
    catch (error) {
        next(error);
    }
};
exports.default = {
    exportData,
    importData
};
//# sourceMappingURL=index.js.map