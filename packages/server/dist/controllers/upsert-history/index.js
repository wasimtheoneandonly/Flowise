"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const upsert_history_1 = __importDefault(require("../../services/upsert-history"));
const getAllUpsertHistory = async (req, res, next) => {
    try {
        const sortOrder = req.query?.order;
        const chatflowid = req.params?.id;
        const startDate = req.query?.startDate;
        const endDate = req.query?.endDate;
        const apiResponse = await upsert_history_1.default.getAllUpsertHistory(sortOrder, chatflowid, startDate, endDate);
        return res.json(apiResponse);
    }
    catch (error) {
        next(error);
    }
};
const patchDeleteUpsertHistory = async (req, res, next) => {
    try {
        const ids = req.body.ids ?? [];
        const apiResponse = await upsert_history_1.default.patchDeleteUpsertHistory(ids);
        return res.json(apiResponse);
    }
    catch (error) {
        next(error);
    }
};
exports.default = {
    getAllUpsertHistory,
    patchDeleteUpsertHistory
};
//# sourceMappingURL=index.js.map