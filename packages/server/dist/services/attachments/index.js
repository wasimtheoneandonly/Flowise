"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const http_status_codes_1 = require("http-status-codes");
const createAttachment_1 = require("../../utils/createAttachment");
const internalFlowiseError_1 = require("../../errors/internalFlowiseError");
const utils_1 = require("../../errors/utils");
const createAttachment = async (req) => {
    try {
        return await (0, createAttachment_1.createFileAttachment)(req);
    }
    catch (error) {
        throw new internalFlowiseError_1.InternalFlowiseError(http_status_codes_1.StatusCodes.INTERNAL_SERVER_ERROR, `Error: attachmentService.createAttachment - ${(0, utils_1.getErrorMessage)(error)}`);
    }
};
exports.default = {
    createAttachment
};
//# sourceMappingURL=index.js.map