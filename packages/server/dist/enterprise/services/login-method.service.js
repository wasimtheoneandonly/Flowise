"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.LoginMethodService = void 0;
const getRunningExpressApp_1 = require("../../utils/getRunningExpressApp");
const validation_util_1 = require("../utils/validation.util");
const internalFlowiseError_1 = require("../../errors/internalFlowiseError");
const http_status_codes_1 = require("http-status-codes");
const login_method_entity_1 = require("../database/entities/login-method.entity");
const encryption_util_1 = require("../utils/encryption.util");
const user_service_1 = require("./user.service");
const organization_service_1 = require("./organization.service");
const typeorm_1 = require("typeorm");
class LoginMethodService {
    constructor() {
        const appServer = (0, getRunningExpressApp_1.getRunningExpressApp)();
        this.dataSource = appServer.AppDataSource;
        this.userService = new user_service_1.UserService();
        this.organizationService = new organization_service_1.OrganizationService();
    }
    validateLoginMethodId(id) {
        if ((0, validation_util_1.isInvalidUUID)(id))
            throw new internalFlowiseError_1.InternalFlowiseError(http_status_codes_1.StatusCodes.BAD_REQUEST, "Invalid Login Method Id" /* LoginMethodErrorMessage.INVALID_LOGIN_METHOD_ID */);
    }
    async readLoginMethodById(id, queryRunner) {
        this.validateLoginMethodId(id);
        return await queryRunner.manager.findOneBy(login_method_entity_1.LoginMethod, { id });
    }
    validateLoginMethodName(name) {
        if ((0, validation_util_1.isInvalidName)(name))
            throw new internalFlowiseError_1.InternalFlowiseError(http_status_codes_1.StatusCodes.BAD_REQUEST, "Invalid Login Method Name" /* LoginMethodErrorMessage.INVALID_LOGIN_METHOD_NAME */);
    }
    validateLoginMethodStatus(status) {
        if (status && !Object.values(login_method_entity_1.LoginMethodStatus).includes(status))
            throw new internalFlowiseError_1.InternalFlowiseError(http_status_codes_1.StatusCodes.BAD_REQUEST, "Invalid Login Method Status" /* LoginMethodErrorMessage.INVALID_LOGIN_METHOD_STATUS */);
    }
    async readLoginMethodByOrganizationId(organizationId, queryRunner) {
        if (organizationId) {
            const organization = await this.organizationService.readOrganizationById(organizationId, queryRunner);
            if (!organization)
                throw new internalFlowiseError_1.InternalFlowiseError(http_status_codes_1.StatusCodes.NOT_FOUND, "Organization Not Found" /* OrganizationErrorMessage.ORGANIZATION_NOT_FOUND */);
            return await queryRunner.manager.findBy(login_method_entity_1.LoginMethod, { organizationId });
        }
        else {
            return await queryRunner.manager.findBy(login_method_entity_1.LoginMethod, { organizationId: (0, typeorm_1.IsNull)() });
        }
    }
    async encryptLoginMethodConfig(config) {
        if (!config)
            throw new internalFlowiseError_1.InternalFlowiseError(http_status_codes_1.StatusCodes.BAD_REQUEST, "Invalid Login Method Status" /* LoginMethodErrorMessage.INVALID_LOGIN_METHOD_STATUS */);
        return await (0, encryption_util_1.encrypt)(config);
    }
    async decryptLoginMethodConfig(config) {
        if (!config)
            throw new internalFlowiseError_1.InternalFlowiseError(http_status_codes_1.StatusCodes.BAD_REQUEST, "Invalid Login Method Status" /* LoginMethodErrorMessage.INVALID_LOGIN_METHOD_STATUS */);
        return await (0, encryption_util_1.decrypt)(config);
    }
    async saveLoginMethod(data, queryRunner) {
        return await queryRunner.manager.save(login_method_entity_1.LoginMethod, data);
    }
    async createLoginMethod(data) {
        let queryRunner;
        let newLoginMethod;
        try {
            queryRunner = this.dataSource.createQueryRunner();
            await queryRunner.connect();
            const createdBy = await this.userService.readUserById(data.createdBy, queryRunner);
            if (!createdBy)
                throw new internalFlowiseError_1.InternalFlowiseError(http_status_codes_1.StatusCodes.NOT_FOUND, "User Not Found" /* UserErrorMessage.USER_NOT_FOUND */);
            const organization = await this.organizationService.readOrganizationById(data.organizationId, queryRunner);
            if (!organization)
                throw new internalFlowiseError_1.InternalFlowiseError(http_status_codes_1.StatusCodes.NOT_FOUND, "Organization Not Found" /* OrganizationErrorMessage.ORGANIZATION_NOT_FOUND */);
            this.validateLoginMethodName(data.name);
            this.validateLoginMethodStatus(data.status);
            data.config = await this.encryptLoginMethodConfig(data.config);
            data.updatedBy = createdBy.id;
            newLoginMethod = await queryRunner.manager.create(login_method_entity_1.LoginMethod, data);
            await queryRunner.startTransaction();
            newLoginMethod = await this.saveLoginMethod(newLoginMethod, queryRunner);
            await queryRunner.commitTransaction();
        }
        catch (error) {
            if (queryRunner && !queryRunner.isTransactionActive)
                await queryRunner.rollbackTransaction();
            throw error;
        }
        finally {
            if (queryRunner && !queryRunner.isReleased)
                await queryRunner.release();
        }
        return newLoginMethod;
    }
    async createOrUpdateConfig(body) {
        let organizationId = body.organizationId;
        let providers = body.providers;
        let userId = body.userId;
        let queryRunner;
        try {
            queryRunner = this.dataSource.createQueryRunner();
            await queryRunner.connect();
            await queryRunner.startTransaction();
            const createdOrUpdatedByUser = await this.userService.readUserById(userId, queryRunner);
            if (!createdOrUpdatedByUser)
                throw new internalFlowiseError_1.InternalFlowiseError(http_status_codes_1.StatusCodes.NOT_FOUND, "User Not Found" /* UserErrorMessage.USER_NOT_FOUND */);
            const organization = await this.organizationService.readOrganizationById(organizationId, queryRunner);
            if (!organization)
                throw new internalFlowiseError_1.InternalFlowiseError(http_status_codes_1.StatusCodes.NOT_FOUND, "Organization Not Found" /* OrganizationErrorMessage.ORGANIZATION_NOT_FOUND */);
            for (let provider of providers) {
                this.validateLoginMethodName(provider.providerName);
                this.validateLoginMethodStatus(provider.status);
                const name = provider.providerName;
                const loginMethod = await queryRunner.manager.findOneBy(login_method_entity_1.LoginMethod, { organizationId, name });
                if (loginMethod) {
                    /* empty */
                    loginMethod.status = provider.status;
                    loginMethod.config = await this.encryptLoginMethodConfig(JSON.stringify(provider.config));
                    loginMethod.updatedBy = userId;
                    await this.saveLoginMethod(loginMethod, queryRunner);
                }
                else {
                    const encryptedConfig = await this.encryptLoginMethodConfig(JSON.stringify(provider.config));
                    let newLoginMethod = queryRunner.manager.create(login_method_entity_1.LoginMethod, {
                        organizationId,
                        name,
                        status: provider.status,
                        config: encryptedConfig,
                        createdBy: userId,
                        updatedBy: userId
                    });
                    await this.saveLoginMethod(newLoginMethod, queryRunner);
                }
            }
            await queryRunner.commitTransaction();
        }
        catch (error) {
            if (queryRunner)
                await queryRunner.rollbackTransaction();
            throw error;
        }
        finally {
            if (queryRunner)
                await queryRunner.release();
        }
        return { status: 'OK', organizationId: organizationId };
    }
    async updateLoginMethod(newLoginMethod) {
        const queryRunner = this.dataSource.createQueryRunner();
        await queryRunner.connect();
        const oldLoginMethod = await this.readLoginMethodById(newLoginMethod.id, queryRunner);
        if (!oldLoginMethod)
            throw new internalFlowiseError_1.InternalFlowiseError(http_status_codes_1.StatusCodes.NOT_FOUND, "Login Method Not Found" /* LoginMethodErrorMessage.LOGIN_METHOD_NOT_FOUND */);
        const updatedBy = await this.userService.readUserById(newLoginMethod.updatedBy, queryRunner);
        if (!updatedBy)
            throw new internalFlowiseError_1.InternalFlowiseError(http_status_codes_1.StatusCodes.NOT_FOUND, "User Not Found" /* UserErrorMessage.USER_NOT_FOUND */);
        if (newLoginMethod.organizationId) {
            const organization = await this.organizationService.readOrganizationById(newLoginMethod.organizationId, queryRunner);
            if (!organization)
                throw new internalFlowiseError_1.InternalFlowiseError(http_status_codes_1.StatusCodes.NOT_FOUND, "Organization Not Found" /* OrganizationErrorMessage.ORGANIZATION_NOT_FOUND */);
        }
        if (newLoginMethod.name)
            this.validateLoginMethodName(newLoginMethod.name);
        if (newLoginMethod.config)
            newLoginMethod.config = await this.encryptLoginMethodConfig(newLoginMethod.config);
        if (newLoginMethod.status)
            this.validateLoginMethodStatus(newLoginMethod.status);
        newLoginMethod.createdBy = oldLoginMethod.createdBy;
        let updateLoginMethod = queryRunner.manager.merge(login_method_entity_1.LoginMethod, newLoginMethod);
        try {
            await queryRunner.startTransaction();
            updateLoginMethod = await this.saveLoginMethod(updateLoginMethod, queryRunner);
            await queryRunner.commitTransaction();
        }
        catch (error) {
            await queryRunner.rollbackTransaction();
            throw error;
        }
        finally {
            await queryRunner.release();
        }
        return updateLoginMethod;
    }
}
exports.LoginMethodService = LoginMethodService;
//# sourceMappingURL=login-method.service.js.map