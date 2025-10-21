"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AccountService = void 0;
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const http_status_codes_1 = require("http-status-codes");
const moment_1 = __importDefault(require("moment"));
const internalFlowiseError_1 = require("../../errors/internalFlowiseError");
const Interface_1 = require("../../Interface");
const getRunningExpressApp_1 = require("../../utils/getRunningExpressApp");
const quotaUsage_1 = require("../../utils/quotaUsage");
const organization_user_entity_1 = require("../database/entities/organization-user.entity");
const organization_entity_1 = require("../database/entities/organization.entity");
const role_entity_1 = require("../database/entities/role.entity");
const user_entity_1 = require("../database/entities/user.entity");
const workspace_user_entity_1 = require("../database/entities/workspace-user.entity");
const workspace_entity_1 = require("../database/entities/workspace.entity");
const Interface_Enterprise_1 = require("../Interface.Enterprise");
const encryption_util_1 = require("../utils/encryption.util");
const sendEmail_1 = require("../utils/sendEmail");
const tempTokenUtils_1 = require("../utils/tempTokenUtils");
const audit_1 = __importDefault(require("./audit"));
const organization_user_service_1 = require("./organization-user.service");
const organization_service_1 = require("./organization.service");
const role_service_1 = require("./role.service");
const user_service_1 = require("./user.service");
const workspace_user_service_1 = require("./workspace-user.service");
const workspace_service_1 = require("./workspace.service");
const sanitize_util_1 = require("../../utils/sanitize.util");
class AccountService {
    constructor() {
        const appServer = (0, getRunningExpressApp_1.getRunningExpressApp)();
        this.dataSource = appServer.AppDataSource;
        this.userService = new user_service_1.UserService();
        this.organizationservice = new organization_service_1.OrganizationService();
        this.workspaceService = new workspace_service_1.WorkspaceService();
        this.roleService = new role_service_1.RoleService();
        this.organizationUserService = new organization_user_service_1.OrganizationUserService();
        this.workspaceUserService = new workspace_user_service_1.WorkspaceUserService();
        this.identityManager = appServer.identityManager;
    }
    initializeAccountDTO(data) {
        data.organization = data.organization || {};
        data.organizationUser = data.organizationUser || {};
        data.workspace = data.workspace || {};
        data.workspaceUser = data.workspaceUser || {};
        data.role = data.role || {};
        return data;
    }
    async resendVerificationEmail({ email }) {
        const queryRunner = this.dataSource.createQueryRunner();
        await queryRunner.connect();
        try {
            await queryRunner.startTransaction();
            const user = await this.userService.readUserByEmail(email, queryRunner);
            if (!user)
                throw new internalFlowiseError_1.InternalFlowiseError(http_status_codes_1.StatusCodes.NOT_FOUND, "User Not Found" /* UserErrorMessage.USER_NOT_FOUND */);
            if (user && user.status === user_entity_1.UserStatus.ACTIVE)
                throw new internalFlowiseError_1.InternalFlowiseError(http_status_codes_1.StatusCodes.NOT_FOUND, "User Email Already Exists" /* UserErrorMessage.USER_EMAIL_ALREADY_EXISTS */);
            if (!user.email)
                throw new internalFlowiseError_1.InternalFlowiseError(http_status_codes_1.StatusCodes.BAD_REQUEST, "Invalid User Email" /* UserErrorMessage.INVALID_USER_EMAIL */);
            const updateUserData = {};
            updateUserData.tempToken = (0, tempTokenUtils_1.generateTempToken)();
            const tokenExpiry = new Date();
            const expiryInHours = process.env.INVITE_TOKEN_EXPIRY_IN_HOURS ? parseInt(process.env.INVITE_TOKEN_EXPIRY_IN_HOURS) : 24;
            tokenExpiry.setHours(tokenExpiry.getHours() + expiryInHours);
            updateUserData.tokenExpiry = tokenExpiry;
            // Update user with new token and expiry
            const updatedUser = queryRunner.manager.merge(user_entity_1.User, user, updateUserData);
            await queryRunner.manager.save(user_entity_1.User, updatedUser);
            // resend invite
            const verificationLink = `${process.env.APP_URL}/verify?token=${updateUserData.tempToken}`;
            await (0, sendEmail_1.sendVerificationEmailForCloud)(email, verificationLink);
            await queryRunner.commitTransaction();
        }
        catch (error) {
            await queryRunner.rollbackTransaction();
            throw error;
        }
        finally {
            await queryRunner.release();
        }
    }
    async ensureOneOrganizationOnly(queryRunner) {
        const organizations = await this.organizationservice.readOrganization(queryRunner);
        if (organizations.length > 0)
            throw new internalFlowiseError_1.InternalFlowiseError(http_status_codes_1.StatusCodes.BAD_REQUEST, 'You can only have one organization');
    }
    async createRegisterAccount(data, queryRunner) {
        data = this.initializeAccountDTO(data);
        const platform = this.identityManager.getPlatformType();
        switch (platform) {
            case Interface_1.Platform.OPEN_SOURCE:
                await this.ensureOneOrganizationOnly(queryRunner);
                data.organization.name = organization_entity_1.OrganizationName.DEFAULT_ORGANIZATION;
                data.organizationUser.role = await this.roleService.readGeneralRoleByName(role_entity_1.GeneralRole.OWNER, queryRunner);
                data.workspace.name = workspace_entity_1.WorkspaceName.DEFAULT_WORKSPACE;
                data.workspaceUser.role = data.organizationUser.role;
                data.user.status = user_entity_1.UserStatus.ACTIVE;
                data.user = await this.userService.createNewUser(data.user, queryRunner);
                break;
            case Interface_1.Platform.CLOUD: {
                const user = await this.userService.readUserByEmail(data.user.email, queryRunner);
                if (user && (user.status === user_entity_1.UserStatus.ACTIVE || user.status === user_entity_1.UserStatus.UNVERIFIED))
                    throw new internalFlowiseError_1.InternalFlowiseError(http_status_codes_1.StatusCodes.NOT_FOUND, "User Email Already Exists" /* UserErrorMessage.USER_EMAIL_ALREADY_EXISTS */);
                if (!data.user.email)
                    throw new internalFlowiseError_1.InternalFlowiseError(http_status_codes_1.StatusCodes.BAD_REQUEST, "Invalid User Email" /* UserErrorMessage.INVALID_USER_EMAIL */);
                const { customerId, subscriptionId } = await this.identityManager.createStripeUserAndSubscribe({
                    email: data.user.email,
                    userPlan: Interface_1.UserPlan.FREE,
                    // @ts-ignore
                    referral: data.user.referral || ''
                });
                data.organization.customerId = customerId;
                data.organization.subscriptionId = subscriptionId;
                // if credential exists then the user is signing up with email/password
                // if not then the user is signing up with oauth/sso
                if (data.user.credential) {
                    data.user.status = user_entity_1.UserStatus.UNVERIFIED;
                    data.user.tempToken = (0, tempTokenUtils_1.generateTempToken)();
                    const tokenExpiry = new Date();
                    const expiryInHours = process.env.INVITE_TOKEN_EXPIRY_IN_HOURS ? parseInt(process.env.INVITE_TOKEN_EXPIRY_IN_HOURS) : 24;
                    tokenExpiry.setHours(tokenExpiry.getHours() + expiryInHours);
                    data.user.tokenExpiry = tokenExpiry;
                }
                else {
                    data.user.status = user_entity_1.UserStatus.ACTIVE;
                    data.user.tempToken = '';
                    data.user.tokenExpiry = null;
                }
                data.organization.name = organization_entity_1.OrganizationName.DEFAULT_ORGANIZATION;
                data.organizationUser.role = await this.roleService.readGeneralRoleByName(role_entity_1.GeneralRole.OWNER, queryRunner);
                data.workspace.name = workspace_entity_1.WorkspaceName.DEFAULT_WORKSPACE;
                data.workspaceUser.role = data.organizationUser.role;
                if (!user) {
                    data.user = await this.userService.createNewUser(data.user, queryRunner);
                }
                else {
                    if (data.user.credential)
                        data.user.credential = this.userService.encryptUserCredential(data.user.credential);
                    data.user.updatedBy = user.id;
                    data.user = queryRunner.manager.merge(user_entity_1.User, user, data.user);
                }
                // send verification email only if user signed up with email/password
                if (data.user.credential) {
                    const verificationLink = `${process.env.APP_URL}/verify?token=${data.user.tempToken}`;
                    await (0, sendEmail_1.sendVerificationEmailForCloud)(data.user.email, verificationLink);
                }
                break;
            }
            case Interface_1.Platform.ENTERPRISE: {
                if (data.user.tempToken) {
                    const user = await this.userService.readUserByToken(data.user.tempToken, queryRunner);
                    if (!user)
                        throw new internalFlowiseError_1.InternalFlowiseError(http_status_codes_1.StatusCodes.NOT_FOUND, "User Not Found" /* UserErrorMessage.USER_NOT_FOUND */);
                    if (user.email.toLowerCase() !== data.user.email?.toLowerCase())
                        throw new internalFlowiseError_1.InternalFlowiseError(http_status_codes_1.StatusCodes.BAD_REQUEST, "Invalid User Email" /* UserErrorMessage.INVALID_USER_EMAIL */);
                    const name = data.user.name;
                    if (data.user.credential)
                        user.credential = this.userService.encryptUserCredential(data.user.credential);
                    data.user = user;
                    const organizationUser = await this.organizationUserService.readOrganizationUserByUserId(user.id, queryRunner);
                    if (!organizationUser)
                        throw new internalFlowiseError_1.InternalFlowiseError(http_status_codes_1.StatusCodes.NOT_FOUND, "Organization User Not Found" /* OrganizationUserErrorMessage.ORGANIZATION_USER_NOT_FOUND */);
                    const assignedOrganization = await this.organizationservice.readOrganizationById(organizationUser[0].organizationId, queryRunner);
                    if (!assignedOrganization)
                        throw new internalFlowiseError_1.InternalFlowiseError(http_status_codes_1.StatusCodes.NOT_FOUND, "Organization Not Found" /* OrganizationErrorMessage.ORGANIZATION_NOT_FOUND */);
                    data.organization = assignedOrganization;
                    const tokenExpiry = new Date(user.tokenExpiry);
                    const today = new Date();
                    if (today > tokenExpiry)
                        throw new internalFlowiseError_1.InternalFlowiseError(http_status_codes_1.StatusCodes.BAD_REQUEST, "Expired Temporary Token" /* UserErrorMessage.EXPIRED_TEMP_TOKEN */);
                    data.user.tempToken = '';
                    data.user.tokenExpiry = null;
                    data.user.name = name;
                    data.user.status = user_entity_1.UserStatus.ACTIVE;
                    data.organizationUser.status = organization_user_entity_1.OrganizationUserStatus.ACTIVE;
                    data.organizationUser.role = await this.roleService.readGeneralRoleByName(role_entity_1.GeneralRole.MEMBER, queryRunner);
                    data.workspace.name = workspace_entity_1.WorkspaceName.DEFAULT_PERSONAL_WORKSPACE;
                    data.workspaceUser.role = await this.roleService.readGeneralRoleByName(role_entity_1.GeneralRole.PERSONAL_WORKSPACE, queryRunner);
                }
                else {
                    await this.ensureOneOrganizationOnly(queryRunner);
                    data.organizationUser.role = await this.roleService.readGeneralRoleByName(role_entity_1.GeneralRole.OWNER, queryRunner);
                    data.workspace.name = workspace_entity_1.WorkspaceName.DEFAULT_WORKSPACE;
                    data.workspaceUser.role = data.organizationUser.role;
                    data.user.status = user_entity_1.UserStatus.ACTIVE;
                    data.user = await this.userService.createNewUser(data.user, queryRunner);
                }
                break;
            }
            default:
                throw new internalFlowiseError_1.InternalFlowiseError(http_status_codes_1.StatusCodes.BAD_REQUEST, "Unhandled Edge Case" /* GeneralErrorMessage.UNHANDLED_EDGE_CASE */);
        }
        if (!data.organization.id) {
            data.organization.createdBy = data.user.createdBy;
            data.organization = this.organizationservice.createNewOrganization(data.organization, queryRunner, true);
        }
        data.organizationUser.organizationId = data.organization.id;
        data.organizationUser.userId = data.user.id;
        data.organizationUser.createdBy = data.user.createdBy;
        data.organizationUser = this.organizationUserService.createNewOrganizationUser(data.organizationUser, queryRunner);
        data.workspace.organizationId = data.organization.id;
        data.workspace.createdBy = data.user.createdBy;
        data.workspace = this.workspaceService.createNewWorkspace(data.workspace, queryRunner, true);
        data.workspaceUser.workspaceId = data.workspace.id;
        data.workspaceUser.userId = data.user.id;
        data.workspaceUser.createdBy = data.user.createdBy;
        data.workspaceUser.status = workspace_user_entity_1.WorkspaceUserStatus.ACTIVE;
        data.workspaceUser = this.workspaceUserService.createNewWorkspaceUser(data.workspaceUser, queryRunner);
        return data;
    }
    async saveRegisterAccount(data) {
        const queryRunner = this.dataSource.createQueryRunner();
        await queryRunner.connect();
        const platform = this.identityManager.getPlatformType();
        const ownerRole = await this.roleService.readGeneralRoleByName(role_entity_1.GeneralRole.OWNER, queryRunner);
        try {
            data = await this.createRegisterAccount(data, queryRunner);
            await queryRunner.startTransaction();
            data.user = await this.userService.saveUser(data.user, queryRunner);
            data.organization = await this.organizationservice.saveOrganization(data.organization, queryRunner);
            data.organizationUser = await this.organizationUserService.saveOrganizationUser(data.organizationUser, queryRunner);
            data.workspace = await this.workspaceService.saveWorkspace(data.workspace, queryRunner);
            data.workspaceUser = await this.workspaceUserService.saveWorkspaceUser(data.workspaceUser, queryRunner);
            if (data.workspace.id &&
                (platform === Interface_1.Platform.OPEN_SOURCE || platform === Interface_1.Platform.ENTERPRISE) &&
                ownerRole.id === data.organizationUser.roleId) {
                await this.workspaceService.setNullWorkspaceId(queryRunner, data.workspace.id);
            }
            await queryRunner.commitTransaction();
            delete data.user.credential;
            delete data.user.tempToken;
            delete data.user.tokenExpiry;
            return data;
        }
        catch (error) {
            if (queryRunner && queryRunner.isTransactionActive)
                await queryRunner.rollbackTransaction();
            throw error;
        }
        finally {
            if (queryRunner && !queryRunner.isReleased)
                await queryRunner.release();
        }
    }
    async register(data) {
        return await this.saveRegisterAccount(data);
    }
    async saveInviteAccount(data, currentUser) {
        data = this.initializeAccountDTO(data);
        const queryRunner = this.dataSource.createQueryRunner();
        await queryRunner.connect();
        try {
            const workspace = await this.workspaceService.readWorkspaceById(data.workspace.id, queryRunner);
            if (!workspace)
                throw new internalFlowiseError_1.InternalFlowiseError(http_status_codes_1.StatusCodes.NOT_FOUND, "Workspace Not Found" /* WorkspaceErrorMessage.WORKSPACE_NOT_FOUND */);
            data.workspace = workspace;
            const totalOrgUsers = await this.organizationUserService.readOrgUsersCountByOrgId(data.workspace.organizationId || '');
            const subscriptionId = currentUser?.activeOrganizationSubscriptionId || '';
            const role = await this.roleService.readRoleByRoleIdOrganizationId(data.role.id, data.workspace.organizationId, queryRunner);
            if (!role)
                throw new internalFlowiseError_1.InternalFlowiseError(http_status_codes_1.StatusCodes.NOT_FOUND, "Role Not Found" /* RoleErrorMessage.ROLE_NOT_FOUND */);
            data.role = role;
            const user = await this.userService.readUserByEmail(data.user.email, queryRunner);
            if (!user) {
                await (0, quotaUsage_1.checkUsageLimit)('users', subscriptionId, (0, getRunningExpressApp_1.getRunningExpressApp)().usageCacheManager, totalOrgUsers + 1);
                // generate a temporary token
                data.user.tempToken = (0, tempTokenUtils_1.generateTempToken)();
                const tokenExpiry = new Date();
                // set expiry based on env setting and fallback to 24 hours
                const expiryInHours = process.env.INVITE_TOKEN_EXPIRY_IN_HOURS ? parseInt(process.env.INVITE_TOKEN_EXPIRY_IN_HOURS) : 24;
                tokenExpiry.setHours(tokenExpiry.getHours() + expiryInHours);
                data.user.tokenExpiry = tokenExpiry;
                data.user.status = user_entity_1.UserStatus.INVITED;
                // send invite
                const registerLink = this.identityManager.getPlatformType() === Interface_1.Platform.ENTERPRISE
                    ? `${process.env.APP_URL}/register?token=${data.user.tempToken}`
                    : `${process.env.APP_URL}/register`;
                await (0, sendEmail_1.sendWorkspaceInvite)(data.user.email, data.workspace.name, registerLink, this.identityManager.getPlatformType());
                data.user = await this.userService.createNewUser(data.user, queryRunner);
                data.organizationUser.organizationId = data.workspace.organizationId;
                data.organizationUser.userId = data.user.id;
                const roleMember = await this.roleService.readGeneralRoleByName(role_entity_1.GeneralRole.MEMBER, queryRunner);
                data.organizationUser.roleId = roleMember.id;
                data.organizationUser.createdBy = data.user.createdBy;
                data.organizationUser.status = organization_user_entity_1.OrganizationUserStatus.INVITED;
                data.organizationUser = await this.organizationUserService.createNewOrganizationUser(data.organizationUser, queryRunner);
                workspace.updatedBy = data.user.createdBy;
                data.workspaceUser.workspaceId = data.workspace.id;
                data.workspaceUser.userId = data.user.id;
                data.workspaceUser.roleId = data.role.id;
                data.workspaceUser.createdBy = data.user.createdBy;
                data.workspaceUser.status = workspace_user_entity_1.WorkspaceUserStatus.INVITED;
                data.workspaceUser = await this.workspaceUserService.createNewWorkspaceUser(data.workspaceUser, queryRunner);
                await queryRunner.startTransaction();
                data.user = await this.userService.saveUser(data.user, queryRunner);
                await this.workspaceService.saveWorkspace(workspace, queryRunner);
                data.organizationUser = await this.organizationUserService.saveOrganizationUser(data.organizationUser, queryRunner);
                data.workspaceUser = await this.workspaceUserService.saveWorkspaceUser(data.workspaceUser, queryRunner);
                data.role = await this.roleService.saveRole(data.role, queryRunner);
                await queryRunner.commitTransaction();
                delete data.user.credential;
                delete data.user.tempToken;
                delete data.user.tokenExpiry;
                return data;
            }
            const { organizationUser } = await this.organizationUserService.readOrganizationUserByOrganizationIdUserId(data.workspace.organizationId, user.id, queryRunner);
            if (!organizationUser) {
                await (0, quotaUsage_1.checkUsageLimit)('users', subscriptionId, (0, getRunningExpressApp_1.getRunningExpressApp)().usageCacheManager, totalOrgUsers + 1);
                data.organizationUser.organizationId = data.workspace.organizationId;
                data.organizationUser.userId = user.id;
                const roleMember = await this.roleService.readGeneralRoleByName(role_entity_1.GeneralRole.MEMBER, queryRunner);
                data.organizationUser.roleId = roleMember.id;
                data.organizationUser.createdBy = data.user.createdBy;
                data.organizationUser.status = organization_user_entity_1.OrganizationUserStatus.INVITED;
                data.organizationUser = await this.organizationUserService.createNewOrganizationUser(data.organizationUser, queryRunner);
            }
            else {
                data.organizationUser = organizationUser;
            }
            let oldWorkspaceUser;
            if (data.organizationUser.status === organization_user_entity_1.OrganizationUserStatus.INVITED) {
                const workspaceUser = await this.workspaceUserService.readWorkspaceUserByOrganizationIdUserId(data.workspace.organizationId, user.id, queryRunner);
                let registerLink;
                if (this.identityManager.getPlatformType() === Interface_1.Platform.ENTERPRISE) {
                    data.user = user;
                    data.user.tempToken = (0, tempTokenUtils_1.generateTempToken)();
                    const tokenExpiry = new Date();
                    const expiryInHours = process.env.INVITE_TOKEN_EXPIRY_IN_HOURS ? parseInt(process.env.INVITE_TOKEN_EXPIRY_IN_HOURS) : 24;
                    tokenExpiry.setHours(tokenExpiry.getHours() + expiryInHours);
                    data.user.tokenExpiry = tokenExpiry;
                    await this.userService.saveUser(data.user, queryRunner);
                    registerLink = `${process.env.APP_URL}/register?token=${data.user.tempToken}`;
                }
                else {
                    registerLink = `${process.env.APP_URL}/register`;
                }
                if (workspaceUser.length === 1) {
                    oldWorkspaceUser = workspaceUser[0];
                    if (oldWorkspaceUser.workspace.name === workspace_entity_1.WorkspaceName.DEFAULT_PERSONAL_WORKSPACE) {
                        await (0, sendEmail_1.sendWorkspaceInvite)(data.user.email, data.workspace.name, registerLink, this.identityManager.getPlatformType());
                    }
                    else {
                        await (0, sendEmail_1.sendWorkspaceInvite)(data.user.email, data.workspace.name, registerLink, this.identityManager.getPlatformType(), 'update');
                    }
                }
                else {
                    await (0, sendEmail_1.sendWorkspaceInvite)(data.user.email, data.workspace.name, registerLink, this.identityManager.getPlatformType());
                }
            }
            else {
                data.organizationUser.updatedBy = data.user.createdBy;
                const dashboardLink = `${process.env.APP_URL}`;
                await (0, sendEmail_1.sendWorkspaceAdd)(data.user.email, data.workspace.name, dashboardLink);
            }
            workspace.updatedBy = data.user.createdBy;
            data.workspaceUser.workspaceId = data.workspace.id;
            data.workspaceUser.userId = user.id;
            data.workspaceUser.roleId = data.role.id;
            data.workspaceUser.createdBy = data.user.createdBy;
            data.workspaceUser.status = workspace_user_entity_1.WorkspaceUserStatus.INVITED;
            data.workspaceUser = await this.workspaceUserService.createNewWorkspaceUser(data.workspaceUser, queryRunner);
            const personalWorkspaceRole = await this.roleService.readGeneralRoleByName(role_entity_1.GeneralRole.PERSONAL_WORKSPACE, queryRunner);
            if (oldWorkspaceUser && oldWorkspaceUser.roleId !== personalWorkspaceRole.id) {
                await this.workspaceUserService.deleteWorkspaceUser(oldWorkspaceUser.workspaceId, user.id);
            }
            await queryRunner.startTransaction();
            data.organizationUser = await this.organizationUserService.saveOrganizationUser(data.organizationUser, queryRunner);
            await this.workspaceService.saveWorkspace(workspace, queryRunner);
            data.workspaceUser = await this.workspaceUserService.saveWorkspaceUser(data.workspaceUser, queryRunner);
            data.role = await this.roleService.saveRole(data.role, queryRunner);
            await queryRunner.commitTransaction();
            return data;
        }
        catch (error) {
            if (queryRunner && queryRunner.isTransactionActive)
                await queryRunner.rollbackTransaction();
            throw error;
        }
        finally {
            if (queryRunner && !queryRunner.isReleased)
                await queryRunner.release();
        }
    }
    async invite(data, user) {
        return await this.saveInviteAccount(data, user);
    }
    async login(data) {
        data = this.initializeAccountDTO(data);
        const queryRunner = this.dataSource.createQueryRunner();
        await queryRunner.connect();
        const platform = this.identityManager.getPlatformType();
        try {
            if (!data.user.credential) {
                await audit_1.default.recordLoginActivity(data.user.email || '', Interface_Enterprise_1.LoginActivityCode.INCORRECT_CREDENTIAL, 'Login Failed');
                throw new internalFlowiseError_1.InternalFlowiseError(http_status_codes_1.StatusCodes.BAD_REQUEST, "Invalid User Credential" /* UserErrorMessage.INVALID_USER_CREDENTIAL */);
            }
            const user = await this.userService.readUserByEmail(data.user.email, queryRunner);
            if (!user) {
                await audit_1.default.recordLoginActivity(data.user.email || '', Interface_Enterprise_1.LoginActivityCode.UNKNOWN_USER, 'Login Failed');
                throw new internalFlowiseError_1.InternalFlowiseError(http_status_codes_1.StatusCodes.NOT_FOUND, "User Not Found" /* UserErrorMessage.USER_NOT_FOUND */);
            }
            if (!user.credential) {
                await audit_1.default.recordLoginActivity(user.email || '', Interface_Enterprise_1.LoginActivityCode.INCORRECT_CREDENTIAL, 'Login Failed');
                throw new internalFlowiseError_1.InternalFlowiseError(http_status_codes_1.StatusCodes.BAD_REQUEST, "Invalid User Credential" /* UserErrorMessage.INVALID_USER_CREDENTIAL */);
            }
            if (!(0, encryption_util_1.compareHash)(data.user.credential, user.credential)) {
                await audit_1.default.recordLoginActivity(user.email || '', Interface_Enterprise_1.LoginActivityCode.INCORRECT_CREDENTIAL, 'Login Failed');
                throw new internalFlowiseError_1.InternalFlowiseError(http_status_codes_1.StatusCodes.UNAUTHORIZED, "Incorrect Email or Password" /* UserErrorMessage.INCORRECT_USER_EMAIL_OR_CREDENTIALS */);
            }
            if (user.status === user_entity_1.UserStatus.UNVERIFIED) {
                await audit_1.default.recordLoginActivity(data.user.email || '', Interface_Enterprise_1.LoginActivityCode.REGISTRATION_PENDING, 'Login Failed');
                throw new internalFlowiseError_1.InternalFlowiseError(http_status_codes_1.StatusCodes.UNAUTHORIZED, "User Email Unverified" /* UserErrorMessage.USER_EMAIL_UNVERIFIED */);
            }
            let wsUserOrUsers = await this.workspaceUserService.readWorkspaceUserByLastLogin(user.id, queryRunner);
            if (Array.isArray(wsUserOrUsers)) {
                if (wsUserOrUsers.length > 0) {
                    wsUserOrUsers = wsUserOrUsers[0];
                }
                else {
                    await audit_1.default.recordLoginActivity(user.email || '', Interface_Enterprise_1.LoginActivityCode.NO_ASSIGNED_WORKSPACE, 'Login Failed');
                    throw new internalFlowiseError_1.InternalFlowiseError(http_status_codes_1.StatusCodes.NOT_FOUND, "Workspace User Not Found" /* WorkspaceUserErrorMessage.WORKSPACE_USER_NOT_FOUND */);
                }
            }
            if (platform === Interface_1.Platform.ENTERPRISE) {
                await audit_1.default.recordLoginActivity(user.email, Interface_Enterprise_1.LoginActivityCode.LOGIN_SUCCESS, 'Login Success');
            }
            return { user, workspaceDetails: wsUserOrUsers };
        }
        finally {
            await queryRunner.release();
        }
    }
    async verify(data) {
        data = this.initializeAccountDTO(data);
        const queryRunner = this.dataSource.createQueryRunner();
        await queryRunner.connect();
        try {
            await queryRunner.startTransaction();
            if (!data.user.tempToken)
                throw new internalFlowiseError_1.InternalFlowiseError(http_status_codes_1.StatusCodes.BAD_REQUEST, "Invalid Temporary Token" /* UserErrorMessage.INVALID_TEMP_TOKEN */);
            const user = await this.userService.readUserByToken(data.user.tempToken, queryRunner);
            if (!user)
                throw new internalFlowiseError_1.InternalFlowiseError(http_status_codes_1.StatusCodes.NOT_FOUND, "User Not Found" /* UserErrorMessage.USER_NOT_FOUND */);
            data.user = user;
            data.user.tempToken = '';
            data.user.tokenExpiry = null;
            data.user.status = user_entity_1.UserStatus.ACTIVE;
            data.user = await this.userService.saveUser(data.user, queryRunner);
            await queryRunner.commitTransaction();
        }
        catch (error) {
            await queryRunner.rollbackTransaction();
            throw error;
        }
        finally {
            await queryRunner.release();
        }
        return data;
    }
    async forgotPassword(data) {
        data = this.initializeAccountDTO(data);
        const queryRunner = this.dataSource.createQueryRunner();
        await queryRunner.connect();
        try {
            await queryRunner.startTransaction();
            const user = await this.userService.readUserByEmail(data.user.email, queryRunner);
            if (!user)
                throw new internalFlowiseError_1.InternalFlowiseError(http_status_codes_1.StatusCodes.NOT_FOUND, "User Not Found" /* UserErrorMessage.USER_NOT_FOUND */);
            data.user = user;
            data.user.tempToken = (0, tempTokenUtils_1.generateTempToken)();
            const tokenExpiry = new Date();
            const expiryInMins = process.env.PASSWORD_RESET_TOKEN_EXPIRY_IN_MINUTES
                ? parseInt(process.env.PASSWORD_RESET_TOKEN_EXPIRY_IN_MINUTES)
                : 15;
            tokenExpiry.setMinutes(tokenExpiry.getMinutes() + expiryInMins);
            data.user.tokenExpiry = tokenExpiry;
            data.user = await this.userService.saveUser(data.user, queryRunner);
            const resetLink = `${process.env.APP_URL}/reset-password?token=${data.user.tempToken}`;
            await (0, sendEmail_1.sendPasswordResetEmail)(data.user.email, resetLink);
            await queryRunner.commitTransaction();
        }
        catch (error) {
            await queryRunner.rollbackTransaction();
            throw error;
        }
        finally {
            await queryRunner.release();
        }
        return (0, sanitize_util_1.sanitizeUser)(data.user);
    }
    async resetPassword(data) {
        data = this.initializeAccountDTO(data);
        const queryRunner = this.dataSource.createQueryRunner();
        await queryRunner.connect();
        try {
            const user = await this.userService.readUserByEmail(data.user.email, queryRunner);
            if (!user)
                throw new internalFlowiseError_1.InternalFlowiseError(http_status_codes_1.StatusCodes.NOT_FOUND, "User Not Found" /* UserErrorMessage.USER_NOT_FOUND */);
            if (user.tempToken !== data.user.tempToken)
                throw new internalFlowiseError_1.InternalFlowiseError(http_status_codes_1.StatusCodes.BAD_REQUEST, "Invalid Temporary Token" /* UserErrorMessage.INVALID_TEMP_TOKEN */);
            const tokenExpiry = user.tokenExpiry;
            const now = (0, moment_1.default)();
            const expiryInMins = process.env.PASSWORD_RESET_TOKEN_EXPIRY_IN_MINUTES
                ? parseInt(process.env.PASSWORD_RESET_TOKEN_EXPIRY_IN_MINUTES)
                : 15;
            const diff = now.diff(tokenExpiry, 'minutes');
            if (Math.abs(diff) > expiryInMins)
                throw new internalFlowiseError_1.InternalFlowiseError(http_status_codes_1.StatusCodes.BAD_REQUEST, "Expired Temporary Token" /* UserErrorMessage.EXPIRED_TEMP_TOKEN */);
            // all checks are done, now update the user password, don't forget to hash it and do not forget to clear the temp token
            // leave the user status and other details as is
            const salt = bcryptjs_1.default.genSaltSync(parseInt(process.env.PASSWORD_SALT_HASH_ROUNDS || '5'));
            // @ts-ignore
            const hash = bcryptjs_1.default.hashSync(data.user.password, salt);
            data.user = user;
            data.user.credential = hash;
            data.user.tempToken = '';
            data.user.tokenExpiry = undefined;
            data.user.status = user_entity_1.UserStatus.ACTIVE;
            await queryRunner.startTransaction();
            data.user = await this.userService.saveUser(data.user, queryRunner);
            await queryRunner.commitTransaction();
        }
        catch (error) {
            await queryRunner.rollbackTransaction();
            throw error;
        }
        finally {
            await queryRunner.release();
        }
        return (0, sanitize_util_1.sanitizeUser)(data.user);
    }
    async logout(user) {
        const platform = this.identityManager.getPlatformType();
        if (platform === Interface_1.Platform.ENTERPRISE) {
            await audit_1.default.recordLoginActivity(user.email, Interface_Enterprise_1.LoginActivityCode.LOGOUT_SUCCESS, 'Logout Success', user.ssoToken ? 'SSO' : 'Email/Password');
        }
    }
}
exports.AccountService = AccountService;
//# sourceMappingURL=account.service.js.map