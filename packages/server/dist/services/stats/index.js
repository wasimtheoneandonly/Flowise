"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const http_status_codes_1 = require("http-status-codes");
const getChatMessage_1 = require("../../utils/getChatMessage");
const internalFlowiseError_1 = require("../../errors/internalFlowiseError");
const utils_1 = require("../../errors/utils");
// get stats for showing in chatflow
const getChatflowStats = async (chatflowid, chatTypes, startDate, endDate, messageId, feedback, feedbackTypes, activeWorkspaceId) => {
    try {
        const chatmessages = (await (0, getChatMessage_1.utilGetChatMessage)({
            chatflowid,
            chatTypes,
            startDate,
            endDate,
            messageId,
            feedback,
            feedbackTypes,
            activeWorkspaceId
        }));
        const totalMessages = chatmessages.length;
        const totalFeedback = chatmessages.filter((message) => message?.feedback).length;
        const positiveFeedback = chatmessages.filter((message) => message?.feedback?.rating === 'THUMBS_UP').length;
        // count the number of unique sessions in the chatmessages - count unique sessionId
        const uniqueSessions = new Set(chatmessages.map((message) => message.sessionId));
        const totalSessions = uniqueSessions.size;
        const dbResponse = {
            totalMessages,
            totalFeedback,
            positiveFeedback,
            totalSessions
        };
        return dbResponse;
    }
    catch (error) {
        throw new internalFlowiseError_1.InternalFlowiseError(http_status_codes_1.StatusCodes.INTERNAL_SERVER_ERROR, `Error: statsService.getChatflowStats - ${(0, utils_1.getErrorMessage)(error)}`);
    }
};
exports.default = {
    getChatflowStats
};
//# sourceMappingURL=index.js.map