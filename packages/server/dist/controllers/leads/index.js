"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const leads_1 = __importDefault(require("../../services/leads"));
const http_status_codes_1 = require("http-status-codes");
const internalFlowiseError_1 = require("../../errors/internalFlowiseError");
const getAllLeadsForChatflow = async (req, res, next) => {
    try {
        if (typeof req.params.id === 'undefined' || req.params.id === '') {
            throw new internalFlowiseError_1.InternalFlowiseError(http_status_codes_1.StatusCodes.PRECONDITION_FAILED, `Error: leadsController.getAllLeadsForChatflow - id not provided!`);
        }
        const chatflowid = req.params.id;
        const apiResponse = await leads_1.default.getAllLeads(chatflowid);
        return res.json(apiResponse);
    }
    catch (error) {
        next(error);
    }
};
const createLeadInChatflow = async (req, res, next) => {
    try {
        if (typeof req.body === 'undefined' || req.body === '') {
            throw new internalFlowiseError_1.InternalFlowiseError(http_status_codes_1.StatusCodes.PRECONDITION_FAILED, `Error: leadsController.createLeadInChatflow - body not provided!`);
        }
        const apiResponse = await leads_1.default.createLead(req.body);
        return res.json(apiResponse);
    }
    catch (error) {
        next(error);
    }
};
exports.default = {
    createLeadInChatflow,
    getAllLeadsForChatflow
};
//# sourceMappingURL=index.js.map