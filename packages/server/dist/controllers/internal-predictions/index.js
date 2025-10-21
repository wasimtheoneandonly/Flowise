"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const buildChatflow_1 = require("../../utils/buildChatflow");
const getRunningExpressApp_1 = require("../../utils/getRunningExpressApp");
const utils_1 = require("../../errors/utils");
const Interface_1 = require("../../Interface");
// Send input message and get prediction result (Internal)
const createInternalPrediction = async (req, res, next) => {
    try {
        if (req.body.streaming || req.body.streaming === 'true') {
            createAndStreamInternalPrediction(req, res, next);
            return;
        }
        else {
            const apiResponse = await (0, buildChatflow_1.utilBuildChatflow)(req, true);
            if (apiResponse)
                return res.json(apiResponse);
        }
    }
    catch (error) {
        next(error);
    }
};
// Send input message and stream prediction result using SSE (Internal)
const createAndStreamInternalPrediction = async (req, res, next) => {
    const chatId = req.body.chatId;
    const sseStreamer = (0, getRunningExpressApp_1.getRunningExpressApp)().sseStreamer;
    try {
        sseStreamer.addClient(chatId, res);
        res.setHeader('Content-Type', 'text/event-stream');
        res.setHeader('Cache-Control', 'no-cache');
        res.setHeader('Connection', 'keep-alive');
        res.setHeader('X-Accel-Buffering', 'no'); //nginx config: https://serverfault.com/a/801629
        res.flushHeaders();
        if (process.env.MODE === Interface_1.MODE.QUEUE) {
            (0, getRunningExpressApp_1.getRunningExpressApp)().redisSubscriber.subscribe(chatId);
        }
        const apiResponse = await (0, buildChatflow_1.utilBuildChatflow)(req, true);
        sseStreamer.streamMetadataEvent(apiResponse.chatId, apiResponse);
    }
    catch (error) {
        if (chatId) {
            sseStreamer.streamErrorEvent(chatId, (0, utils_1.getErrorMessage)(error));
        }
        next(error);
    }
    finally {
        sseStreamer.removeClient(chatId);
    }
};
exports.default = {
    createInternalPrediction
};
//# sourceMappingURL=index.js.map