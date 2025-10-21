"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.migrateApiKeysFromJsonToDb = exports.getApiKey = exports.getAPIKeys = exports.compareKeys = exports.generateSecretHash = exports.generateAPIKey = exports.getAPIKeyPath = void 0;
const crypto_1 = require("crypto");
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const ApiKey_1 = require("../database/entities/ApiKey");
const workspace_entity_1 = require("../enterprise/database/entities/workspace.entity");
const uuid_1 = require("uuid");
const ChatFlow_1 = require("../database/entities/ChatFlow");
const addChatflowsCount_1 = require("./addChatflowsCount");
const Interface_1 = require("../Interface");
/**
 * Returns the api key path
 * @returns {string}
 */
const getAPIKeyPath = () => {
    return process.env.APIKEY_PATH ? path_1.default.join(process.env.APIKEY_PATH, 'api.json') : path_1.default.join(__dirname, '..', '..', 'api.json');
};
exports.getAPIKeyPath = getAPIKeyPath;
/**
 * Generate the api key
 * @returns {string}
 */
const generateAPIKey = () => {
    const buffer = (0, crypto_1.randomBytes)(32);
    return buffer.toString('base64url');
};
exports.generateAPIKey = generateAPIKey;
/**
 * Generate the secret key
 * @param {string} apiKey
 * @returns {string}
 */
const generateSecretHash = (apiKey) => {
    const salt = (0, crypto_1.randomBytes)(8).toString('hex');
    const buffer = (0, crypto_1.scryptSync)(apiKey, salt, 64);
    return `${buffer.toString('hex')}.${salt}`;
};
exports.generateSecretHash = generateSecretHash;
/**
 * Verify valid keys
 * @param {string} storedKey
 * @param {string} suppliedKey
 * @returns {boolean}
 */
const compareKeys = (storedKey, suppliedKey) => {
    const [hashedPassword, salt] = storedKey.split('.');
    const buffer = (0, crypto_1.scryptSync)(suppliedKey, salt, 64);
    return (0, crypto_1.timingSafeEqual)(Buffer.from(hashedPassword, 'hex'), buffer);
};
exports.compareKeys = compareKeys;
/**
 * Get API keys
 * @returns {Promise<ICommonObject[]>}
 */
const getAPIKeys = async () => {
    try {
        const content = await fs_1.default.promises.readFile((0, exports.getAPIKeyPath)(), 'utf8');
        return JSON.parse(content);
    }
    catch (error) {
        return [];
    }
};
exports.getAPIKeys = getAPIKeys;
/**
 * Get API Key details
 * @param {string} apiKey
 * @returns {Promise<ICommonObject[]>}
 */
const getApiKey = async (apiKey) => {
    const existingAPIKeys = await (0, exports.getAPIKeys)();
    const keyIndex = existingAPIKeys.findIndex((key) => key.apiKey === apiKey);
    if (keyIndex < 0)
        return undefined;
    return existingAPIKeys[keyIndex];
};
exports.getApiKey = getApiKey;
const migrateApiKeysFromJsonToDb = async (appDataSource, platformType) => {
    if (platformType === Interface_1.Platform.CLOUD) {
        return;
    }
    if (!process.env.APIKEY_STORAGE_TYPE || process.env.APIKEY_STORAGE_TYPE === 'json') {
        const keys = await (0, exports.getAPIKeys)();
        if (keys.length > 0) {
            try {
                // Get all available workspaces
                const workspaces = await appDataSource.getRepository(workspace_entity_1.Workspace).find();
                for (const key of keys) {
                    const existingKey = await appDataSource.getRepository(ApiKey_1.ApiKey).findOneBy({
                        apiKey: key.apiKey
                    });
                    // Only add if key doesn't already exist in DB
                    if (!existingKey) {
                        // Create a new API key for each workspace
                        if (workspaces.length > 0) {
                            for (const workspace of workspaces) {
                                const newKey = new ApiKey_1.ApiKey();
                                newKey.id = (0, uuid_1.v4)();
                                newKey.apiKey = key.apiKey;
                                newKey.apiSecret = key.apiSecret;
                                newKey.keyName = key.keyName;
                                newKey.workspaceId = workspace.id;
                                const keyEntity = appDataSource.getRepository(ApiKey_1.ApiKey).create(newKey);
                                await appDataSource.getRepository(ApiKey_1.ApiKey).save(keyEntity);
                                const chatflows = await appDataSource.getRepository(ChatFlow_1.ChatFlow).findBy({
                                    apikeyid: key.id,
                                    workspaceId: workspace.id
                                });
                                for (const chatflow of chatflows) {
                                    chatflow.apikeyid = newKey.id;
                                    await appDataSource.getRepository(ChatFlow_1.ChatFlow).save(chatflow);
                                }
                                await (0, addChatflowsCount_1.addChatflowsCount)(chatflows);
                            }
                        }
                        else {
                            // If no workspaces exist, create the key without a workspace ID and later will be updated by setNullWorkspaceId
                            const newKey = new ApiKey_1.ApiKey();
                            newKey.id = (0, uuid_1.v4)();
                            newKey.apiKey = key.apiKey;
                            newKey.apiSecret = key.apiSecret;
                            newKey.keyName = key.keyName;
                            const keyEntity = appDataSource.getRepository(ApiKey_1.ApiKey).create(newKey);
                            await appDataSource.getRepository(ApiKey_1.ApiKey).save(keyEntity);
                            const chatflows = await appDataSource.getRepository(ChatFlow_1.ChatFlow).findBy({
                                apikeyid: key.id
                            });
                            for (const chatflow of chatflows) {
                                chatflow.apikeyid = newKey.id;
                                await appDataSource.getRepository(ChatFlow_1.ChatFlow).save(chatflow);
                            }
                            await (0, addChatflowsCount_1.addChatflowsCount)(chatflows);
                        }
                    }
                }
                // Delete the JSON file
                if (fs_1.default.existsSync((0, exports.getAPIKeyPath)())) {
                    fs_1.default.unlinkSync((0, exports.getAPIKeyPath)());
                }
            }
            catch (error) {
                console.error('Error migrating API keys from JSON to DB', error);
            }
        }
    }
};
exports.migrateApiKeysFromJsonToDb = migrateApiKeysFromJsonToDb;
//# sourceMappingURL=apiKey.js.map