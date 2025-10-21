"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const typeorm_1 = require("typeorm");
const http_status_codes_1 = require("http-status-codes");
const getRunningExpressApp_1 = require("../../utils/getRunningExpressApp");
const UpsertHistory_1 = require("../../database/entities/UpsertHistory");
const internalFlowiseError_1 = require("../../errors/internalFlowiseError");
const utils_1 = require("../../errors/utils");
const getAllUpsertHistory = async (sortOrder, chatflowid, startDate, endDate) => {
    try {
        const appServer = (0, getRunningExpressApp_1.getRunningExpressApp)();
        let createdDateQuery;
        if (startDate || endDate) {
            if (startDate && endDate) {
                createdDateQuery = (0, typeorm_1.Between)(new Date(startDate), new Date(endDate));
            }
            else if (startDate) {
                createdDateQuery = (0, typeorm_1.MoreThanOrEqual)(new Date(startDate));
            }
            else if (endDate) {
                createdDateQuery = (0, typeorm_1.LessThanOrEqual)(new Date(endDate));
            }
        }
        let upsertHistory = await appServer.AppDataSource.getRepository(UpsertHistory_1.UpsertHistory).find({
            where: {
                chatflowid,
                date: createdDateQuery
            },
            order: {
                date: sortOrder === 'DESC' ? 'DESC' : 'ASC'
            }
        });
        upsertHistory = upsertHistory.map((hist) => {
            return {
                ...hist,
                result: hist.result ? JSON.parse(hist.result) : {},
                flowData: hist.flowData ? JSON.parse(hist.flowData) : {}
            };
        });
        return upsertHistory;
    }
    catch (error) {
        throw new internalFlowiseError_1.InternalFlowiseError(http_status_codes_1.StatusCodes.INTERNAL_SERVER_ERROR, `Error: upsertHistoryServices.getAllUpsertHistory - ${(0, utils_1.getErrorMessage)(error)}`);
    }
};
const patchDeleteUpsertHistory = async (ids = []) => {
    try {
        const appServer = (0, getRunningExpressApp_1.getRunningExpressApp)();
        const dbResponse = await appServer.AppDataSource.getRepository(UpsertHistory_1.UpsertHistory).delete(ids);
        return dbResponse;
    }
    catch (error) {
        throw new internalFlowiseError_1.InternalFlowiseError(http_status_codes_1.StatusCodes.INTERNAL_SERVER_ERROR, `Error: upsertHistoryServices.patchDeleteUpsertHistory - ${(0, utils_1.getErrorMessage)(error)}`);
    }
};
exports.default = {
    getAllUpsertHistory,
    patchDeleteUpsertHistory
};
//# sourceMappingURL=index.js.map