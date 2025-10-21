"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.UserService = void 0;
const http_status_codes_1 = require("http-status-codes");
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const internalFlowiseError_1 = require("../../errors/internalFlowiseError");
const getRunningExpressApp_1 = require("../../utils/getRunningExpressApp");
const telemetry_1 = require("../../utils/telemetry");
const user_entity_1 = require("../database/entities/user.entity");
const validation_util_1 = require("../utils/validation.util");
const typeorm_1 = require("typeorm");
const utils_1 = require("../../utils");
const encryption_util_1 = require("../utils/encryption.util");
const sanitize_util_1 = require("../../utils/sanitize.util");
class UserService {
    constructor() {
        const appServer = (0, getRunningExpressApp_1.getRunningExpressApp)();
        this.dataSource = appServer.AppDataSource;
        this.telemetry = appServer.telemetry;
    }
    validateUserId(id) {
        if ((0, validation_util_1.isInvalidUUID)(id))
            throw new internalFlowiseError_1.InternalFlowiseError(http_status_codes_1.StatusCodes.BAD_REQUEST, "Invalid User Id" /* UserErrorMessage.INVALID_USER_ID */);
    }
    async readUserById(id, queryRunner) {
        this.validateUserId(id);
        return await queryRunner.manager.findOneBy(user_entity_1.User, { id });
    }
    validateUserName(name) {
        if ((0, validation_util_1.isInvalidName)(name))
            throw new internalFlowiseError_1.InternalFlowiseError(http_status_codes_1.StatusCodes.BAD_REQUEST, "Invalid User Name" /* UserErrorMessage.INVALID_USER_NAME */);
    }
    validateUserEmail(email) {
        if ((0, validation_util_1.isInvalidEmail)(email))
            throw new internalFlowiseError_1.InternalFlowiseError(http_status_codes_1.StatusCodes.BAD_REQUEST, "Invalid User Email" /* UserErrorMessage.INVALID_USER_EMAIL */);
    }
    async readUserByEmail(email, queryRunner) {
        if (!email)
            throw new internalFlowiseError_1.InternalFlowiseError(http_status_codes_1.StatusCodes.BAD_REQUEST, "Invalid User Email" /* UserErrorMessage.INVALID_USER_EMAIL */);
        this.validateUserEmail(email);
        return await queryRunner.manager.findOneBy(user_entity_1.User, { email: (0, typeorm_1.ILike)(email) });
    }
    async readUserByToken(token, queryRunner) {
        return await queryRunner.manager.findOneBy(user_entity_1.User, { tempToken: token });
    }
    validateUserStatus(status) {
        if (status && !Object.values(user_entity_1.UserStatus).includes(status))
            throw new internalFlowiseError_1.InternalFlowiseError(http_status_codes_1.StatusCodes.BAD_REQUEST, "Invalid User Status" /* UserErrorMessage.INVALID_USER_STATUS */);
    }
    async readUser(queryRunner) {
        return await queryRunner.manager.find(user_entity_1.User);
    }
    encryptUserCredential(credential) {
        if (!credential || (0, validation_util_1.isInvalidPassword)(credential))
            throw new internalFlowiseError_1.InternalFlowiseError(http_status_codes_1.StatusCodes.BAD_REQUEST, "Invalid Password" /* GeneralErrorMessage.INVALID_PASSWORD */);
        return (0, encryption_util_1.getHash)(credential);
    }
    async createNewUser(data, queryRunner) {
        const user = await this.readUserByEmail(data.email, queryRunner);
        if (user)
            throw new internalFlowiseError_1.InternalFlowiseError(http_status_codes_1.StatusCodes.BAD_REQUEST, "User Email Already Exists" /* UserErrorMessage.USER_EMAIL_ALREADY_EXISTS */);
        if (data.credential)
            data.credential = this.encryptUserCredential(data.credential);
        if (!data.name)
            data.name = data.email;
        this.validateUserName(data.name);
        if (data.status)
            this.validateUserStatus(data.status);
        data.id = (0, utils_1.generateId)();
        if (data.createdBy) {
            const createdBy = await this.readUserById(data.createdBy, queryRunner);
            if (!createdBy)
                throw new internalFlowiseError_1.InternalFlowiseError(http_status_codes_1.StatusCodes.NOT_FOUND, "User Not Found" /* UserErrorMessage.USER_NOT_FOUND */);
            data.createdBy = createdBy.id;
            data.updatedBy = data.createdBy;
        }
        else {
            data.createdBy = data.id;
            data.updatedBy = data.id;
        }
        const userObj = queryRunner.manager.create(user_entity_1.User, data);
        this.telemetry.sendTelemetry(telemetry_1.TelemetryEventType.USER_CREATED, {
            userId: userObj.id,
            createdBy: userObj.createdBy
        }, userObj.id);
        return userObj;
    }
    async saveUser(data, queryRunner) {
        return await queryRunner.manager.save(user_entity_1.User, data);
    }
    async createUser(data) {
        const queryRunner = this.dataSource.createQueryRunner();
        await queryRunner.connect();
        let newUser = await this.createNewUser(data, queryRunner);
        try {
            await queryRunner.startTransaction();
            newUser = await this.saveUser(newUser, queryRunner);
            await queryRunner.commitTransaction();
        }
        catch (error) {
            await queryRunner.rollbackTransaction();
            throw error;
        }
        finally {
            await queryRunner.release();
        }
        return newUser;
    }
    async updateUser(newUserData) {
        let queryRunner;
        let updatedUser;
        try {
            queryRunner = this.dataSource.createQueryRunner();
            await queryRunner.connect();
            const oldUserData = await this.readUserById(newUserData.id, queryRunner);
            if (!oldUserData)
                throw new internalFlowiseError_1.InternalFlowiseError(http_status_codes_1.StatusCodes.NOT_FOUND, "User Not Found" /* UserErrorMessage.USER_NOT_FOUND */);
            if (newUserData.updatedBy) {
                const updateUserData = await this.readUserById(newUserData.updatedBy, queryRunner);
                if (!updateUserData)
                    throw new internalFlowiseError_1.InternalFlowiseError(http_status_codes_1.StatusCodes.NOT_FOUND, "User Not Found" /* UserErrorMessage.USER_NOT_FOUND */);
            }
            newUserData.createdBy = oldUserData.createdBy;
            if (newUserData.name) {
                this.validateUserName(newUserData.name);
            }
            if (newUserData.status) {
                this.validateUserStatus(newUserData.status);
            }
            if (newUserData.password) {
                const salt = bcryptjs_1.default.genSaltSync(parseInt(process.env.PASSWORD_SALT_HASH_ROUNDS || '5'));
                // @ts-ignore
                const hash = bcryptjs_1.default.hashSync(newUserData.password, salt);
                newUserData.credential = hash;
                newUserData.tempToken = '';
                newUserData.tokenExpiry = undefined;
            }
            updatedUser = queryRunner.manager.merge(user_entity_1.User, oldUserData, newUserData);
            await queryRunner.startTransaction();
            await this.saveUser(updatedUser, queryRunner);
            await queryRunner.commitTransaction();
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
        return (0, sanitize_util_1.sanitizeUser)(updatedUser);
    }
}
exports.UserService = UserService;
//# sourceMappingURL=user.service.js.map