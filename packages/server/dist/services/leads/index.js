"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const uuid_1 = require("uuid");
const http_status_codes_1 = require("http-status-codes");
const getRunningExpressApp_1 = require("../../utils/getRunningExpressApp");
const Lead_1 = require("../../database/entities/Lead");
const internalFlowiseError_1 = require("../../errors/internalFlowiseError");
const utils_1 = require("../../errors/utils");
const getAllLeads = async (chatflowid) => {
    try {
        const appServer = (0, getRunningExpressApp_1.getRunningExpressApp)();
        const dbResponse = await appServer.AppDataSource.getRepository(Lead_1.Lead).find({
            where: {
                chatflowid
            }
        });
        return dbResponse;
    }
    catch (error) {
        throw new internalFlowiseError_1.InternalFlowiseError(http_status_codes_1.StatusCodes.INTERNAL_SERVER_ERROR, `Error: leadsService.getAllLeads - ${(0, utils_1.getErrorMessage)(error)}`);
    }
};
const createLead = async (body) => {
    try {
        const chatId = body.chatId ?? (0, uuid_1.v4)();
        const newLead = new Lead_1.Lead();
        Object.assign(newLead, body);
        Object.assign(newLead, { chatId });
        const appServer = (0, getRunningExpressApp_1.getRunningExpressApp)();
        const lead = appServer.AppDataSource.getRepository(Lead_1.Lead).create(newLead);
        const dbResponse = await appServer.AppDataSource.getRepository(Lead_1.Lead).save(lead);
        return dbResponse;
    }
    catch (error) {
        throw new internalFlowiseError_1.InternalFlowiseError(http_status_codes_1.StatusCodes.INTERNAL_SERVER_ERROR, `Error: leadsService.createLead - ${(0, utils_1.getErrorMessage)(error)}`);
    }
};
exports.default = {
    createLead,
    getAllLeads
};
//# sourceMappingURL=index.js.map