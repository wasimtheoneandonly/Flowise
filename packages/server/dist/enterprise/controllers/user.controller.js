"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.UserController = void 0;
const http_status_codes_1 = require("http-status-codes");
const internalFlowiseError_1 = require("../../errors/internalFlowiseError");
const getRunningExpressApp_1 = require("../../utils/getRunningExpressApp");
const user_service_1 = require("../services/user.service");
class UserController {
    async create(req, res, next) {
        try {
            const userService = new user_service_1.UserService();
            const user = await userService.createUser(req.body);
            return res.status(http_status_codes_1.StatusCodes.CREATED).json(user);
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
            const userService = new user_service_1.UserService();
            let user;
            if (query.id) {
                user = await userService.readUserById(query.id, queryRunner);
                if (!user)
                    throw new internalFlowiseError_1.InternalFlowiseError(http_status_codes_1.StatusCodes.NOT_FOUND, "User Not Found" /* UserErrorMessage.USER_NOT_FOUND */);
            }
            else if (query.email) {
                user = await userService.readUserByEmail(query.email, queryRunner);
                if (!user)
                    throw new internalFlowiseError_1.InternalFlowiseError(http_status_codes_1.StatusCodes.NOT_FOUND, "User Not Found" /* UserErrorMessage.USER_NOT_FOUND */);
            }
            else {
                throw new internalFlowiseError_1.InternalFlowiseError(http_status_codes_1.StatusCodes.BAD_REQUEST, "Unhandled Edge Case" /* GeneralErrorMessage.UNHANDLED_EDGE_CASE */);
            }
            if (user) {
                delete user.credential;
                delete user.tempToken;
                delete user.tokenExpiry;
            }
            return res.status(http_status_codes_1.StatusCodes.OK).json(user);
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
        try {
            const userService = new user_service_1.UserService();
            const currentUser = req.user;
            if (!currentUser) {
                throw new internalFlowiseError_1.InternalFlowiseError(http_status_codes_1.StatusCodes.UNAUTHORIZED, "User Not Found" /* UserErrorMessage.USER_NOT_FOUND */);
            }
            const { id } = req.body;
            if (currentUser.id !== id) {
                throw new internalFlowiseError_1.InternalFlowiseError(http_status_codes_1.StatusCodes.FORBIDDEN, "User Not Found" /* UserErrorMessage.USER_NOT_FOUND */);
            }
            const user = await userService.updateUser(req.body);
            return res.status(http_status_codes_1.StatusCodes.OK).json(user);
        }
        catch (error) {
            next(error);
        }
    }
    async test(req, res, next) {
        try {
            return res.status(http_status_codes_1.StatusCodes.OK).json({ message: 'Hello World' });
        }
        catch (error) {
            next(error);
        }
    }
}
exports.UserController = UserController;
//# sourceMappingURL=user.controller.js.map