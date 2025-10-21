"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const fs_1 = __importDefault(require("fs"));
const content_disposition_1 = __importDefault(require("content-disposition"));
const flowise_components_1 = require("flowise-components");
const http_status_codes_1 = require("http-status-codes");
const internalFlowiseError_1 = require("../../errors/internalFlowiseError");
const getRunningExpressApp_1 = require("../../utils/getRunningExpressApp");
const ChatFlow_1 = require("../../database/entities/ChatFlow");
const workspace_entity_1 = require("../../enterprise/database/entities/workspace.entity");
const streamUploadedFile = async (req, res, next) => {
    try {
        if (!req.query.chatflowId || !req.query.chatId || !req.query.fileName) {
            return res.status(500).send(`Invalid file path`);
        }
        const chatflowId = req.query.chatflowId;
        const chatId = req.query.chatId;
        const fileName = req.query.fileName;
        const download = req.query.download === 'true'; // Check if download parameter is set
        const appServer = (0, getRunningExpressApp_1.getRunningExpressApp)();
        // This can be public API, so we can only get orgId from the chatflow
        const chatflow = await appServer.AppDataSource.getRepository(ChatFlow_1.ChatFlow).findOneBy({
            id: chatflowId
        });
        if (!chatflow) {
            throw new internalFlowiseError_1.InternalFlowiseError(http_status_codes_1.StatusCodes.NOT_FOUND, `Chatflow ${chatflowId} not found`);
        }
        const chatflowWorkspaceId = chatflow.workspaceId;
        const workspace = await appServer.AppDataSource.getRepository(workspace_entity_1.Workspace).findOneBy({
            id: chatflowWorkspaceId
        });
        if (!workspace) {
            throw new internalFlowiseError_1.InternalFlowiseError(http_status_codes_1.StatusCodes.NOT_FOUND, `Workspace ${chatflowWorkspaceId} not found`);
        }
        const orgId = workspace.organizationId;
        // Set Content-Disposition header - force attachment for download
        if (download) {
            res.setHeader('Content-Disposition', (0, content_disposition_1.default)(fileName, { type: 'attachment' }));
        }
        else {
            res.setHeader('Content-Disposition', (0, content_disposition_1.default)(fileName));
        }
        const fileStream = await (0, flowise_components_1.streamStorageFile)(chatflowId, chatId, fileName, orgId);
        if (!fileStream)
            throw new internalFlowiseError_1.InternalFlowiseError(http_status_codes_1.StatusCodes.INTERNAL_SERVER_ERROR, `Error: streamStorageFile`);
        if (fileStream instanceof fs_1.default.ReadStream && fileStream?.pipe) {
            fileStream.pipe(res);
        }
        else {
            res.send(fileStream);
        }
    }
    catch (error) {
        next(error);
    }
};
exports.default = {
    streamUploadedFile
};
//# sourceMappingURL=index.js.map