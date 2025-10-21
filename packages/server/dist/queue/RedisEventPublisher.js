"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.RedisEventPublisher = void 0;
const redis_1 = require("redis");
const logger_1 = __importDefault(require("../utils/logger"));
class RedisEventPublisher {
    constructor() {
        if (process.env.REDIS_URL) {
            this.redisPublisher = (0, redis_1.createClient)({
                url: process.env.REDIS_URL,
                socket: {
                    keepAlive: process.env.REDIS_KEEP_ALIVE && !isNaN(parseInt(process.env.REDIS_KEEP_ALIVE, 10))
                        ? parseInt(process.env.REDIS_KEEP_ALIVE, 10)
                        : undefined
                },
                pingInterval: process.env.REDIS_KEEP_ALIVE && !isNaN(parseInt(process.env.REDIS_KEEP_ALIVE, 10))
                    ? parseInt(process.env.REDIS_KEEP_ALIVE, 10)
                    : undefined
            });
        }
        else {
            this.redisPublisher = (0, redis_1.createClient)({
                username: process.env.REDIS_USERNAME || undefined,
                password: process.env.REDIS_PASSWORD || undefined,
                socket: {
                    host: process.env.REDIS_HOST || 'localhost',
                    port: parseInt(process.env.REDIS_PORT || '6379'),
                    tls: process.env.REDIS_TLS === 'true',
                    cert: process.env.REDIS_CERT ? Buffer.from(process.env.REDIS_CERT, 'base64') : undefined,
                    key: process.env.REDIS_KEY ? Buffer.from(process.env.REDIS_KEY, 'base64') : undefined,
                    ca: process.env.REDIS_CA ? Buffer.from(process.env.REDIS_CA, 'base64') : undefined,
                    keepAlive: process.env.REDIS_KEEP_ALIVE && !isNaN(parseInt(process.env.REDIS_KEEP_ALIVE, 10))
                        ? parseInt(process.env.REDIS_KEEP_ALIVE, 10)
                        : undefined
                },
                pingInterval: process.env.REDIS_KEEP_ALIVE && !isNaN(parseInt(process.env.REDIS_KEEP_ALIVE, 10))
                    ? parseInt(process.env.REDIS_KEEP_ALIVE, 10)
                    : undefined
            });
        }
        this.setupEventListeners();
    }
    setupEventListeners() {
        this.redisPublisher.on('connect', () => {
            logger_1.default.info(`[RedisEventPublisher] Redis client connecting...`);
        });
        this.redisPublisher.on('ready', () => {
            logger_1.default.info(`[RedisEventPublisher] Redis client ready and connected`);
        });
        this.redisPublisher.on('error', (err) => {
            logger_1.default.error(`[RedisEventPublisher] Redis client error:`, {
                error: err,
                isReady: this.redisPublisher.isReady,
                isOpen: this.redisPublisher.isOpen
            });
        });
        this.redisPublisher.on('end', () => {
            logger_1.default.warn(`[RedisEventPublisher] Redis client connection ended`);
        });
        this.redisPublisher.on('reconnecting', () => {
            logger_1.default.info(`[RedisEventPublisher] Redis client reconnecting...`);
        });
    }
    isConnected() {
        return this.redisPublisher.isReady;
    }
    async connect() {
        await this.redisPublisher.connect();
    }
    streamCustomEvent(chatId, eventType, data) {
        try {
            this.redisPublisher.publish(chatId, JSON.stringify({
                chatId,
                eventType,
                data
            }));
        }
        catch (error) {
            console.error('Error streaming custom event:', error);
        }
    }
    streamStartEvent(chatId, data) {
        try {
            this.redisPublisher.publish(chatId, JSON.stringify({
                chatId,
                eventType: 'start',
                data
            }));
        }
        catch (error) {
            console.error('Error streaming start event:', error);
        }
    }
    streamTokenEvent(chatId, data) {
        try {
            this.redisPublisher.publish(chatId, JSON.stringify({
                chatId,
                eventType: 'token',
                data
            }));
        }
        catch (error) {
            console.error('Error streaming token event:', error);
        }
    }
    streamSourceDocumentsEvent(chatId, data) {
        try {
            this.redisPublisher.publish(chatId, JSON.stringify({
                chatId,
                eventType: 'sourceDocuments',
                data
            }));
        }
        catch (error) {
            console.error('Error streaming sourceDocuments event:', error);
        }
    }
    streamArtifactsEvent(chatId, data) {
        try {
            this.redisPublisher.publish(chatId, JSON.stringify({
                chatId,
                eventType: 'artifacts',
                data
            }));
        }
        catch (error) {
            console.error('Error streaming artifacts event:', error);
        }
    }
    streamUsedToolsEvent(chatId, data) {
        try {
            this.redisPublisher.publish(chatId, JSON.stringify({
                chatId,
                eventType: 'usedTools',
                data
            }));
        }
        catch (error) {
            console.error('Error streaming usedTools event:', error);
        }
    }
    streamCalledToolsEvent(chatId, data) {
        try {
            this.redisPublisher.publish(chatId, JSON.stringify({
                chatId,
                eventType: 'calledTools',
                data
            }));
        }
        catch (error) {
            console.error('Error streaming calledTools event:', error);
        }
    }
    streamFileAnnotationsEvent(chatId, data) {
        try {
            this.redisPublisher.publish(chatId, JSON.stringify({
                chatId,
                eventType: 'fileAnnotations',
                data
            }));
        }
        catch (error) {
            console.error('Error streaming fileAnnotations event:', error);
        }
    }
    streamToolEvent(chatId, data) {
        try {
            this.redisPublisher.publish(chatId, JSON.stringify({
                chatId,
                eventType: 'tool',
                data
            }));
        }
        catch (error) {
            console.error('Error streaming tool event:', error);
        }
    }
    streamAgentReasoningEvent(chatId, data) {
        try {
            this.redisPublisher.publish(chatId, JSON.stringify({
                chatId,
                eventType: 'agentReasoning',
                data
            }));
        }
        catch (error) {
            console.error('Error streaming agentReasoning event:', error);
        }
    }
    streamAgentFlowEvent(chatId, data) {
        try {
            this.redisPublisher.publish(chatId, JSON.stringify({
                chatId,
                eventType: 'agentFlowEvent',
                data
            }));
        }
        catch (error) {
            console.error('Error streaming agentFlow event:', error);
        }
    }
    streamAgentFlowExecutedDataEvent(chatId, data) {
        try {
            this.redisPublisher.publish(chatId, JSON.stringify({
                chatId,
                eventType: 'agentFlowExecutedData',
                data
            }));
        }
        catch (error) {
            console.error('Error streaming agentFlowExecutedData event:', error);
        }
    }
    streamNextAgentEvent(chatId, data) {
        try {
            this.redisPublisher.publish(chatId, JSON.stringify({
                chatId,
                eventType: 'nextAgent',
                data
            }));
        }
        catch (error) {
            console.error('Error streaming nextAgent event:', error);
        }
    }
    streamNextAgentFlowEvent(chatId, data) {
        try {
            this.redisPublisher.publish(chatId, JSON.stringify({
                chatId,
                eventType: 'nextAgentFlow',
                data
            }));
        }
        catch (error) {
            console.error('Error streaming nextAgentFlow event:', error);
        }
    }
    streamActionEvent(chatId, data) {
        try {
            this.redisPublisher.publish(chatId, JSON.stringify({
                chatId,
                eventType: 'action',
                data
            }));
        }
        catch (error) {
            console.error('Error streaming action event:', error);
        }
    }
    streamAbortEvent(chatId) {
        try {
            this.redisPublisher.publish(chatId, JSON.stringify({
                chatId,
                eventType: 'abort',
                data: '[DONE]'
            }));
        }
        catch (error) {
            console.error('Error streaming abort event:', error);
        }
    }
    streamEndEvent(_) {
        // placeholder for future use
    }
    streamErrorEvent(chatId, msg) {
        try {
            this.redisPublisher.publish(chatId, JSON.stringify({
                chatId,
                eventType: 'error',
                data: msg
            }));
        }
        catch (error) {
            console.error('Error streaming error event:', error);
        }
    }
    streamMetadataEvent(chatId, apiResponse) {
        try {
            const metadataJson = {};
            if (apiResponse.chatId) {
                metadataJson['chatId'] = apiResponse.chatId;
            }
            if (apiResponse.chatMessageId) {
                metadataJson['chatMessageId'] = apiResponse.chatMessageId;
            }
            if (apiResponse.question) {
                metadataJson['question'] = apiResponse.question;
            }
            if (apiResponse.sessionId) {
                metadataJson['sessionId'] = apiResponse.sessionId;
            }
            if (apiResponse.memoryType) {
                metadataJson['memoryType'] = apiResponse.memoryType;
            }
            if (Object.keys(metadataJson).length > 0) {
                this.streamCustomEvent(chatId, 'metadata', metadataJson);
            }
        }
        catch (error) {
            console.error('Error streaming metadata event:', error);
        }
    }
    streamUsageMetadataEvent(chatId, data) {
        try {
            this.redisPublisher.publish(chatId, JSON.stringify({
                chatId,
                eventType: 'usageMetadata',
                data
            }));
        }
        catch (error) {
            console.error('Error streaming usage metadata event:', error);
        }
    }
    streamTTSStartEvent(chatId, chatMessageId, format) {
        try {
            this.redisPublisher.publish(chatId, JSON.stringify({
                chatId,
                chatMessageId,
                eventType: 'tts_start',
                data: { format }
            }));
        }
        catch (error) {
            console.error('Error streaming TTS start event:', error);
        }
    }
    streamTTSDataEvent(chatId, chatMessageId, audioChunk) {
        try {
            this.redisPublisher.publish(chatId, JSON.stringify({
                chatId,
                chatMessageId,
                eventType: 'tts_data',
                data: audioChunk
            }));
        }
        catch (error) {
            console.error('Error streaming TTS data event:', error);
        }
    }
    streamTTSEndEvent(chatId, chatMessageId) {
        try {
            this.redisPublisher.publish(chatId, JSON.stringify({
                chatId,
                chatMessageId,
                eventType: 'tts_end',
                data: {}
            }));
        }
        catch (error) {
            console.error('Error streaming TTS end event:', error);
        }
    }
    streamTTSAbortEvent(chatId, chatMessageId) {
        try {
            this.redisPublisher.publish(chatId, JSON.stringify({
                chatId,
                chatMessageId,
                eventType: 'tts_abort',
                data: {}
            }));
        }
        catch (error) {
            console.error('Error streaming TTS abort event:', error);
        }
    }
    async disconnect() {
        if (this.redisPublisher) {
            await this.redisPublisher.quit();
        }
    }
}
exports.RedisEventPublisher = RedisEventPublisher;
//# sourceMappingURL=RedisEventPublisher.js.map