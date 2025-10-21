"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.WorkspaceUserController = void 0;
const http_status_codes_1 = require("http-status-codes");
const internalFlowiseError_1 = require("../../errors/internalFlowiseError");
const getRunningExpressApp_1 = require("../../utils/getRunningExpressApp");
const workspace_user_service_1 = require("../services/workspace-user.service");
class WorkspaceUserController {
    async create(req, res, next) {
        try {
            const workspaceUserService = new workspace_user_service_1.WorkspaceUserService();
            const newWorkspaceUser = await workspaceUserService.createWorkspaceUser(req.body);
            return res.status(http_status_codes_1.StatusCodes.CREATED).json(newWorkspaceUser);
        }
        catch (error) {
            next(error);
        }
    }
    async read(req, res, next) {
        let queryRunner;
        try {
            queryRunner = (0, getRunningExpressApp_1.getRunningExpressApp)().AppDataSource.createQueryRunner();
            await queryRunner.connect();
            const query = req.query;
            const workspaceUserService = new workspace_user_service_1.WorkspaceUserService();
            let workspaceUser;
            if (query.workspaceId && query.userId) {
                workspaceUser = await workspaceUserService.readWorkspaceUserByWorkspaceIdUserId(query.workspaceId, query.userId, queryRunner);
            }
            else if (query.workspaceId) {
                workspaceUser = await workspaceUserService.readWorkspaceUserByWorkspaceId(query.workspaceId, queryRunner);
            }
            else if (query.organizationId && query.userId) {
                workspaceUser = await workspaceUserService.readWorkspaceUserByOrganizationIdUserId(query.organizationId, query.userId, queryRunner);
            }
            else if (query.userId) {
                workspaceUser = await workspaceUserService.readWorkspaceUserByUserId(query.userId, queryRunner);
            }
            else if (query.roleId) {
                workspaceUser = await workspaceUserService.readWorkspaceUserByRoleId(query.roleId, queryRunner);
            }
            else {
                throw new internalFlowiseError_1.InternalFlowiseError(http_status_codes_1.StatusCodes.BAD_REQUEST, "Unhandled Edge Case" /* GeneralErrorMessage.UNHANDLED_EDGE_CASE */);
            }
            return res.status(http_status_codes_1.StatusCodes.OK).json(workspaceUser);
        }
        catch (error) {
            next(error);
        }
        finally {
            if (queryRunner)
                await queryRunner.release();
        }
    }
    async update(req, res, next) {
        let queryRunner;
        try {
            queryRunner = (0, getRunningExpressApp_1.getRunningExpressApp)().AppDataSource.createQueryRunner();
            await queryRunner.connect();
            const workspaceUserService = new workspace_user_service_1.WorkspaceUserService();
            const workspaceUser = await workspaceUserService.updateWorkspaceUser(req.body, queryRunner);
            return res.status(http_status_codes_1.StatusCodes.OK).json(workspaceUser);
        }
        catch (error) {
            if (queryRunner && queryRunner.isTransactionActive)
                await queryRunner.rollbackTransaction();
            next(error);
        }
        finally {
            if (queryRunner && !queryRunner.isReleased)
                await queryRunner.release();
        }
    }
    async delete(req, res, next) {
        try {
            const query = req.query;
            const workspaceUserService = new workspace_user_service_1.WorkspaceUserService();
            const workspaceUser = await workspaceUserService.deleteWorkspaceUser(query.workspaceId, query.userId);
            return res.status(http_status_codes_1.StatusCodes.OK).json(workspaceUser);
        }
        catch (error) {
            next(error);
        }
    }
}
exports.WorkspaceUserController = WorkspaceUserController;
//# sourceMappingURL=workspace-user.controller.js.map