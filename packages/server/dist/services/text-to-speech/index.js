"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TextToSpeechProvider = void 0;
const http_status_codes_1 = require("http-status-codes");
const getRunningExpressApp_1 = require("../../utils/getRunningExpressApp");
const internalFlowiseError_1 = require("../../errors/internalFlowiseError");
const utils_1 = require("../../errors/utils");
const flowise_components_1 = require("flowise-components");
const utils_2 = require("../../utils");
var TextToSpeechProvider;
(function (TextToSpeechProvider) {
    TextToSpeechProvider["OPENAI"] = "openai";
    TextToSpeechProvider["ELEVEN_LABS"] = "elevenlabs";
})(TextToSpeechProvider || (exports.TextToSpeechProvider = TextToSpeechProvider = {}));
const getVoicesForProvider = async (provider, credentialId) => {
    try {
        if (!credentialId) {
            throw new internalFlowiseError_1.InternalFlowiseError(http_status_codes_1.StatusCodes.BAD_REQUEST, 'Credential ID required for this provider');
        }
        const appServer = (0, getRunningExpressApp_1.getRunningExpressApp)();
        const options = {
            orgId: '',
            chatflowid: '',
            chatId: '',
            appDataSource: appServer.AppDataSource,
            databaseEntities: utils_2.databaseEntities
        };
        return await (0, flowise_components_1.getVoices)(provider, credentialId, options);
    }
    catch (error) {
        throw new internalFlowiseError_1.InternalFlowiseError(http_status_codes_1.StatusCodes.INTERNAL_SERVER_ERROR, `Error: textToSpeechService.getVoices - ${(0, utils_1.getErrorMessage)(error)}`);
    }
};
exports.default = {
    getVoices: getVoicesForProvider
};
//# sourceMappingURL=index.js.map