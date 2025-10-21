"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const getRunningExpressApp_1 = require("../../../utils/getRunningExpressApp");
const EnterpriseEntities_1 = require("../../database/entities/EnterpriseEntities");
const internalFlowiseError_1 = require("../../../errors/internalFlowiseError");
const http_status_codes_1 = require("http-status-codes");
const utils_1 = require("../../../errors/utils");
const typeorm_1 = require("typeorm");
const Interface_1 = require("../../../Interface");
const PAGE_SIZE = 10;
const aMonthAgo = () => {
    const date = new Date();
    date.setMonth(new Date().getMonth() - 1);
    return date;
};
const setDateToStartOrEndOfDay = (dateTimeStr, setHours) => {
    const date = new Date(dateTimeStr);
    if (isNaN(date.getTime())) {
        return undefined;
    }
    setHours === 'start' ? date.setHours(0, 0, 0, 0) : date.setHours(23, 59, 59, 999);
    return date;
};
const fetchLoginActivity = async (body) => {
    try {
        const page = body.pageNo ? parseInt(body.pageNo) : 1;
        const skip = (page - 1) * PAGE_SIZE;
        const take = PAGE_SIZE;
        const appServer = (0, getRunningExpressApp_1.getRunningExpressApp)();
        let fromDate;
        if (body.startDate)
            fromDate = setDateToStartOrEndOfDay(body.startDate, 'start');
        let toDate;
        if (body.endDate)
            toDate = setDateToStartOrEndOfDay(body.endDate, 'end');
        const whereCondition = {
            attemptedDateTime: (0, typeorm_1.Between)(fromDate ?? aMonthAgo(), toDate ?? new Date())
        };
        if (body.activityCodes && body.activityCodes?.length > 0) {
            whereCondition['activityCode'] = (0, typeorm_1.In)(body.activityCodes);
        }
        const count = await appServer.AppDataSource.getRepository(EnterpriseEntities_1.LoginActivity).count({
            where: whereCondition
        });
        const pagedResults = await appServer.AppDataSource.getRepository(EnterpriseEntities_1.LoginActivity).find({
            where: whereCondition,
            order: {
                attemptedDateTime: 'DESC'
            },
            skip,
            take
        });
        return {
            data: pagedResults,
            count: count,
            currentPage: page,
            pageSize: PAGE_SIZE
        };
    }
    catch (error) {
        throw new internalFlowiseError_1.InternalFlowiseError(http_status_codes_1.StatusCodes.INTERNAL_SERVER_ERROR, `Error: auditService.getLoginActivity - ${(0, utils_1.getErrorMessage)(error)}`);
    }
};
const recordLoginActivity = async (username, activityCode, message, ssoProvider) => {
    try {
        const appServer = (0, getRunningExpressApp_1.getRunningExpressApp)();
        const platform = appServer.identityManager.getPlatformType();
        if (platform !== Interface_1.Platform.ENTERPRISE) {
            return;
        }
        const loginMode = ssoProvider ?? 'Email/Password';
        const loginActivity = appServer.AppDataSource.getRepository(EnterpriseEntities_1.LoginActivity).create({
            username,
            activityCode,
            message,
            loginMode
        });
        const result = await appServer.AppDataSource.getRepository(EnterpriseEntities_1.LoginActivity).save(loginActivity);
        return result;
    }
    catch (error) {
        throw new internalFlowiseError_1.InternalFlowiseError(http_status_codes_1.StatusCodes.INTERNAL_SERVER_ERROR, `Error: authService.loginActivity - ${(0, utils_1.getErrorMessage)(error)}`);
    }
};
const deleteLoginActivity = async (body) => {
    try {
        const appServer = (0, getRunningExpressApp_1.getRunningExpressApp)();
        await appServer.AppDataSource.getRepository(EnterpriseEntities_1.LoginActivity).delete({
            id: (0, typeorm_1.In)(body.selected)
        });
        return 'OK';
    }
    catch (error) {
        throw new internalFlowiseError_1.InternalFlowiseError(http_status_codes_1.StatusCodes.INTERNAL_SERVER_ERROR, `Error: authService.loginActivity - ${(0, utils_1.getErrorMessage)(error)}`);
    }
};
exports.default = {
    recordLoginActivity,
    deleteLoginActivity,
    fetchLoginActivity
};
//# sourceMappingURL=index.js.map