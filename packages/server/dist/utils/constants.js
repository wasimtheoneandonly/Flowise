"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.LICENSE_QUOTAS = exports.INPUT_PARAMS_TYPE = exports.OMIT_QUEUE_JOB_DATA = exports.DOCUMENT_STORE_BASE_FOLDER = exports.WHITELIST_URLS = void 0;
const Auth0SSO_1 = __importDefault(require("../enterprise/sso/Auth0SSO"));
const AzureSSO_1 = __importDefault(require("../enterprise/sso/AzureSSO"));
const GithubSSO_1 = __importDefault(require("../enterprise/sso/GithubSSO"));
const GoogleSSO_1 = __importDefault(require("../enterprise/sso/GoogleSSO"));
exports.WHITELIST_URLS = [
    '/api/v1/verify/apikey/',
    '/api/v1/chatflows/apikey/',
    '/api/v1/public-chatflows',
    '/api/v1/public-chatbotConfig',
    '/api/v1/public-executions',
    '/api/v1/prediction/',
    '/api/v1/vector/upsert/',
    '/api/v1/node-icon/',
    '/api/v1/components-credentials-icon/',
    '/api/v1/chatflows-streaming',
    '/api/v1/chatflows-uploads',
    '/api/v1/openai-assistants-file/download',
    '/api/v1/feedback',
    '/api/v1/leads',
    '/api/v1/get-upload-file',
    '/api/v1/ip',
    '/api/v1/ping',
    '/api/v1/version',
    '/api/v1/attachments',
    '/api/v1/metrics',
    '/api/v1/nvidia-nim',
    '/api/v1/auth/resolve',
    '/api/v1/auth/login',
    '/api/v1/auth/refreshToken',
    '/api/v1/settings',
    '/api/v1/account/logout',
    '/api/v1/account/verify',
    '/api/v1/account/register',
    '/api/v1/account/resend-verification',
    '/api/v1/account/forgot-password',
    '/api/v1/account/reset-password',
    '/api/v1/account/basic-auth',
    '/api/v1/loginmethod',
    '/api/v1/pricing',
    '/api/v1/user/test',
    '/api/v1/oauth2-credential/callback',
    '/api/v1/oauth2-credential/refresh',
    '/api/v1/text-to-speech/generate',
    '/api/v1/text-to-speech/abort',
    AzureSSO_1.default.LOGIN_URI,
    AzureSSO_1.default.LOGOUT_URI,
    AzureSSO_1.default.CALLBACK_URI,
    GoogleSSO_1.default.LOGIN_URI,
    GoogleSSO_1.default.LOGOUT_URI,
    GoogleSSO_1.default.CALLBACK_URI,
    Auth0SSO_1.default.LOGIN_URI,
    Auth0SSO_1.default.LOGOUT_URI,
    Auth0SSO_1.default.CALLBACK_URI,
    GithubSSO_1.default.LOGIN_URI,
    GithubSSO_1.default.LOGOUT_URI,
    GithubSSO_1.default.CALLBACK_URI
];
exports.DOCUMENT_STORE_BASE_FOLDER = 'docustore';
exports.OMIT_QUEUE_JOB_DATA = [
    'componentNodes',
    'appDataSource',
    'sseStreamer',
    'telemetry',
    'cachePool',
    'usageCacheManager',
    'abortControllerPool'
];
exports.INPUT_PARAMS_TYPE = [
    'asyncOptions',
    'asyncMultiOptions',
    'options',
    'multiOptions',
    'array',
    'datagrid',
    'string',
    'number',
    'boolean',
    'password',
    'json',
    'code',
    'date',
    'file',
    'folder',
    'tabs'
];
exports.LICENSE_QUOTAS = {
    // Renew per month
    PREDICTIONS_LIMIT: 'quota:predictions',
    // Static
    FLOWS_LIMIT: 'quota:flows',
    USERS_LIMIT: 'quota:users',
    STORAGE_LIMIT: 'quota:storage',
    ADDITIONAL_SEATS_LIMIT: 'quota:additionalSeats'
};
//# sourceMappingURL=constants.js.map