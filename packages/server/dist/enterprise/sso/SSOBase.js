"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const getRunningExpressApp_1 = require("../../utils/getRunningExpressApp");
const user_service_1 = require("../services/user.service");
const workspace_user_service_1 = require("../services/workspace-user.service");
const account_service_1 = require("../services/account.service");
const organization_service_1 = require("../services/organization.service");
const role_entity_1 = require("../database/entities/role.entity");
const role_service_1 = require("../services/role.service");
const internalFlowiseError_1 = require("../../errors/internalFlowiseError");
const http_status_codes_1 = require("http-status-codes");
const Interface_1 = require("../../Interface");
const user_entity_1 = require("../database/entities/user.entity");
class SSOBase {
    constructor(app, ssoConfig) {
        this.app = app;
        this.ssoConfig = ssoConfig;
    }
    setSSOConfig(ssoConfig) {
        this.ssoConfig = ssoConfig;
    }
    getSSOConfig() {
        return this.ssoConfig;
    }
    async verifyAndLogin(app, email, done, profile, accessToken, refreshToken) {
        let queryRunner;
        const ssoProviderName = this.getProviderName();
        try {
            queryRunner = (0, getRunningExpressApp_1.getRunningExpressApp)().AppDataSource.createQueryRunner();
            await queryRunner.connect();
            const userService = new user_service_1.UserService();
            const organizationService = new organization_service_1.OrganizationService();
            const workspaceUserService = new workspace_user_service_1.WorkspaceUserService();
            let user = await userService.readUserByEmail(email, queryRunner);
            let wu = {};
            if (!user) {
                // In ENTERPRISE mode, we don't want to create a new user if the user is not found
                if ((0, getRunningExpressApp_1.getRunningExpressApp)().identityManager.getPlatformType() === Interface_1.Platform.ENTERPRISE) {
                    throw new internalFlowiseError_1.InternalFlowiseError(http_status_codes_1.StatusCodes.NOT_FOUND, "User Not Found" /* UserErrorMessage.USER_NOT_FOUND */);
                }
                // no user found, register the user
                const data = {
                    user: {
                        email: email,
                        name: profile.displayName || email,
                        status: user_entity_1.UserStatus.ACTIVE,
                        credential: undefined
                    }
                };
                if ((0, getRunningExpressApp_1.getRunningExpressApp)().identityManager.getPlatformType() === Interface_1.Platform.CLOUD) {
                    const accountService = new account_service_1.AccountService();
                    const newAccount = await accountService.register(data);
                    wu = newAccount.workspaceUser;
                    wu.workspace = newAccount.workspace;
                    user = newAccount.user;
                }
            }
            else {
                if (user.status === user_entity_1.UserStatus.INVITED) {
                    const data = {
                        user: {
                            ...user,
                            email,
                            name: profile.displayName || '',
                            status: user_entity_1.UserStatus.ACTIVE,
                            credential: undefined
                        }
                    };
                    const accountService = new account_service_1.AccountService();
                    const newAccount = await accountService.register(data);
                    user = newAccount.user;
                }
                let wsUserOrUsers = await workspaceUserService.readWorkspaceUserByLastLogin(user?.id, queryRunner);
                wu = Array.isArray(wsUserOrUsers) && wsUserOrUsers.length > 0 ? wsUserOrUsers[0] : wsUserOrUsers;
            }
            const workspaceUser = wu;
            let roleService = new role_service_1.RoleService();
            const ownerRole = await roleService.readGeneralRoleByName(role_entity_1.GeneralRole.OWNER, queryRunner);
            const role = await roleService.readRoleById(workspaceUser.roleId, queryRunner);
            if (!role)
                throw new internalFlowiseError_1.InternalFlowiseError(http_status_codes_1.StatusCodes.NOT_FOUND, "Role Not Found" /* RoleErrorMessage.ROLE_NOT_FOUND */);
            const workspaceUsers = await workspaceUserService.readWorkspaceUserByUserId(workspaceUser.userId, queryRunner);
            const assignedWorkspaces = workspaceUsers.map((workspaceUser) => {
                return {
                    id: workspaceUser.workspace.id,
                    name: workspaceUser.workspace.name,
                    role: workspaceUser.role?.name,
                    organizationId: workspaceUser.workspace.organizationId
                };
            });
            const organization = await organizationService.readOrganizationById(workspaceUser.workspace.organizationId, queryRunner);
            if (!organization)
                throw new internalFlowiseError_1.InternalFlowiseError(http_status_codes_1.StatusCodes.NOT_FOUND, 'Organization not found');
            const subscriptionId = organization.subscriptionId;
            const customerId = organization.customerId;
            const features = await (0, getRunningExpressApp_1.getRunningExpressApp)().identityManager.getFeaturesByPlan(subscriptionId);
            const productId = await (0, getRunningExpressApp_1.getRunningExpressApp)().identityManager.getProductIdFromSubscription(subscriptionId);
            const loggedInUser = {
                id: workspaceUser.userId,
                email: user?.email || '',
                name: user?.name || '',
                roleId: workspaceUser.roleId,
                activeOrganizationId: organization.id,
                activeOrganizationSubscriptionId: subscriptionId,
                activeOrganizationCustomerId: customerId,
                activeOrganizationProductId: productId,
                isOrganizationAdmin: workspaceUser.roleId === ownerRole?.id,
                activeWorkspaceId: workspaceUser.workspaceId,
                activeWorkspace: workspaceUser.workspace.name,
                assignedWorkspaces,
                isApiKeyValidated: true,
                ssoToken: accessToken,
                ssoRefreshToken: refreshToken,
                ssoProvider: ssoProviderName,
                permissions: [...JSON.parse(role.permissions)],
                features
            };
            return done(null, loggedInUser, { message: 'Logged in Successfully' });
        }
        catch (error) {
            return done({ name: 'SSO_LOGIN_FAILED', message: ssoProviderName + ' Login failed! Please contact your administrator.' }, undefined);
        }
        finally {
            if (queryRunner && !queryRunner.isReleased)
                await queryRunner.release();
        }
    }
}
exports.default = SSOBase;
//# sourceMappingURL=SSOBase.js.map