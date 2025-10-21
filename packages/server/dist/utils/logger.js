"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.expressRequestLogger = expressRequestLogger;
const path = __importStar(require("path"));
const fs = __importStar(require("fs"));
const node_os_1 = require("node:os");
const config_1 = __importDefault(require("./config")); // should be replaced by node-config or similar
const winston_1 = require("winston");
const winston_daily_rotate_file_1 = __importDefault(require("winston-daily-rotate-file"));
const logging_winston_1 = require("@google-cloud/logging-winston");
const { S3StreamLogger } = require('s3-streamlogger');
const { combine, timestamp, printf, errors } = winston_1.format;
let s3ServerStream;
let s3ErrorStream;
let s3ServerReqStream;
let gcsServerStream;
let gcsErrorStream;
let gcsServerReqStream;
let requestLogger;
if (process.env.STORAGE_TYPE === 's3') {
    const accessKeyId = process.env.S3_STORAGE_ACCESS_KEY_ID;
    const secretAccessKey = process.env.S3_STORAGE_SECRET_ACCESS_KEY;
    const region = process.env.S3_STORAGE_REGION;
    const s3Bucket = process.env.S3_STORAGE_BUCKET_NAME;
    const customURL = process.env.S3_ENDPOINT_URL;
    const forcePathStyle = process.env.S3_FORCE_PATH_STYLE === 'true';
    if (!region || region.trim() === '' || !s3Bucket || s3Bucket.trim() === '') {
        throw new Error('S3 storage configuration is missing');
    }
    const s3Config = {
        region: region,
        forcePathStyle: forcePathStyle
    };
    // Only include endpoint if customURL is not empty
    if (customURL && customURL.trim() !== '') {
        s3Config.endpoint = customURL;
    }
    if (accessKeyId && accessKeyId.trim() !== '' && secretAccessKey && secretAccessKey.trim() !== '') {
        s3Config.credentials = {
            accessKeyId: accessKeyId,
            secretAccessKey: secretAccessKey
        };
    }
    s3ServerStream = new S3StreamLogger({
        bucket: s3Bucket,
        folder: 'logs/server',
        name_format: `server-%Y-%m-%d-%H-%M-%S-%L-${(0, node_os_1.hostname)()}.log`,
        config: s3Config
    });
    s3ErrorStream = new S3StreamLogger({
        bucket: s3Bucket,
        folder: 'logs/error',
        name_format: `server-error-%Y-%m-%d-%H-%M-%S-%L-${(0, node_os_1.hostname)()}.log`,
        config: s3Config
    });
    s3ServerReqStream = new S3StreamLogger({
        bucket: s3Bucket,
        folder: 'logs/requests',
        name_format: `server-requests-%Y-%m-%d-%H-%M-%S-%L-${(0, node_os_1.hostname)()}.log.jsonl`,
        config: s3Config
    });
}
if (process.env.STORAGE_TYPE === 'gcs') {
    const config = {
        projectId: process.env.GOOGLE_CLOUD_STORAGE_PROJ_ID,
        keyFilename: process.env.GOOGLE_CLOUD_STORAGE_CREDENTIAL,
        defaultCallback: (err) => {
            if (err) {
                console.error('Error logging to GCS: ' + err);
            }
        }
    };
    gcsServerStream = new logging_winston_1.LoggingWinston({
        ...config,
        logName: 'server'
    });
    gcsErrorStream = new logging_winston_1.LoggingWinston({
        ...config,
        logName: 'error'
    });
    gcsServerReqStream = new logging_winston_1.LoggingWinston({
        ...config,
        logName: 'requests'
    });
}
// expect the log dir be relative to the projects root
const logDir = config_1.default.logging.dir;
// Create the log directory if it doesn't exist
if (!fs.existsSync(logDir)) {
    fs.mkdirSync(logDir);
}
const logger = (0, winston_1.createLogger)({
    format: combine(timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }), winston_1.format.json(), printf(({ level, message, timestamp, stack }) => {
        const text = `${timestamp} [${level.toUpperCase()}]: ${message}`;
        return stack ? text + '\n' + stack : text;
    }), errors({ stack: true })),
    defaultMeta: {
        package: 'server'
    },
    exitOnError: false,
    transports: [
        new winston_1.transports.Console(),
        ...(!process.env.STORAGE_TYPE || process.env.STORAGE_TYPE === 'local'
            ? [
                new winston_daily_rotate_file_1.default({
                    filename: path.join(logDir, config_1.default.logging.server.filename ?? 'server-%DATE%.log'),
                    datePattern: 'YYYY-MM-DD-HH',
                    maxSize: '20m',
                    level: config_1.default.logging.server.level ?? 'info'
                })
            ]
            : []),
        ...(process.env.STORAGE_TYPE === 's3'
            ? [
                new winston_1.transports.Stream({
                    stream: s3ServerStream
                })
            ]
            : []),
        ...(process.env.STORAGE_TYPE === 'gcs' ? [gcsServerStream] : [])
    ],
    exceptionHandlers: [
        ...(process.env.DEBUG && process.env.DEBUG === 'true' ? [new winston_1.transports.Console()] : []),
        ...(process.env.STORAGE_TYPE === 's3'
            ? [
                new winston_1.transports.Stream({
                    stream: s3ErrorStream
                })
            ]
            : []),
        ...(process.env.STORAGE_TYPE === 'gcs' ? [gcsErrorStream] : [])
    ],
    rejectionHandlers: [
        ...(process.env.DEBUG && process.env.DEBUG === 'true' ? [new winston_1.transports.Console()] : []),
        ...(process.env.STORAGE_TYPE === 's3'
            ? [
                new winston_1.transports.Stream({
                    stream: s3ErrorStream
                })
            ]
            : []),
        ...(process.env.STORAGE_TYPE === 'gcs' ? [gcsErrorStream] : []),
        // Always provide a fallback rejection handler when no other handlers are configured
        ...((!process.env.DEBUG || process.env.DEBUG !== 'true') && process.env.STORAGE_TYPE !== 's3' && process.env.STORAGE_TYPE !== 'gcs'
            ? [new winston_1.transports.Console()]
            : [])
    ]
});
requestLogger = (0, winston_1.createLogger)({
    format: combine(timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }), winston_1.format.json(), errors({ stack: true })),
    defaultMeta: {
        package: 'server'
    },
    transports: [
        ...(process.env.DEBUG && process.env.DEBUG === 'true' ? [new winston_1.transports.Console()] : []),
        ...(!process.env.STORAGE_TYPE || process.env.STORAGE_TYPE === 'local'
            ? [
                new winston_1.transports.File({
                    filename: path.join(logDir, config_1.default.logging.express.filename ?? 'server-requests.log.jsonl'),
                    level: config_1.default.logging.express.level ?? 'debug'
                })
            ]
            : []),
        ...(process.env.STORAGE_TYPE === 's3'
            ? [
                new winston_1.transports.Stream({
                    stream: s3ServerReqStream
                })
            ]
            : []),
        ...(process.env.STORAGE_TYPE === 'gcs' ? [gcsServerReqStream] : [])
    ]
});
function expressRequestLogger(req, res, next) {
    const unwantedLogURLs = ['/api/v1/node-icon/', '/api/v1/components-credentials-icon/', '/api/v1/ping'];
    if (/\/api\/v1\//i.test(req.url) && !unwantedLogURLs.some((url) => new RegExp(url, 'i').test(req.url))) {
        // Create a sanitized copy of the request body
        const sanitizedBody = { ...req.body };
        if (sanitizedBody.password) {
            sanitizedBody.password = '********';
        }
        // Use the shared requestLogger with request-specific metadata
        const requestMetadata = {
            request: {
                method: req.method,
                url: req.url,
                body: sanitizedBody, // Use sanitized body instead of raw body
                query: req.query,
                params: req.params,
                headers: req.headers
            }
        };
        const getRequestEmoji = (method) => {
            const requetsEmojis = {
                GET: '⬇️',
                POST: '⬆️',
                PUT: '🖊',
                DELETE: '❌',
                OPTION: '🔗'
            };
            return requetsEmojis[method] || '?';
        };
        if (req.method !== 'GET') {
            requestLogger.info(`${getRequestEmoji(req.method)} ${req.method} ${req.url}`, requestMetadata);
            logger.info(`${getRequestEmoji(req.method)} ${req.method} ${req.url}`);
        }
        else {
            requestLogger.http(`${getRequestEmoji(req.method)} ${req.method} ${req.url}`, requestMetadata);
        }
    }
    next();
}
exports.default = logger;
//# sourceMappingURL=logger.js.map