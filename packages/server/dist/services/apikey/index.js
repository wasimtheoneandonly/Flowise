"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const http_status_codes_1 = require("http-status-codes");
const apiKey_1 = require("../../utils/apiKey");
const addChatflowsCount_1 = require("../../utils/addChatflowsCount");
const internalFlowiseError_1 = require("../../errors/internalFlowiseError");
const utils_1 = require("../../errors/utils");
const getRunningExpressApp_1 = require("../../utils/getRunningExpressApp");
const ApiKey_1 = require("../../database/entities/ApiKey");
const typeorm_1 = require("typeorm");
const ControllerServiceUtils_1 = require("../../enterprise/utils/ControllerServiceUtils");
const uuid_1 = require("uuid");
const getAllApiKeysFromDB = async (workspaceId, page = -1, limit = -1) => {
    const appServer = (0, getRunningExpressApp_1.getRunningExpressApp)();
    const queryBuilder = appServer.AppDataSource.getRepository(ApiKey_1.ApiKey).createQueryBuilder('api_key').orderBy('api_key.updatedDate', 'DESC');
    if (page > 0 && limit > 0) {
        queryBuilder.skip((page - 1) * limit);
        queryBuilder.take(limit);
    }
    if (workspaceId)
        queryBuilder.andWhere('api_key.workspaceId = :workspaceId', { workspaceId });
    const [data, total] = await queryBuilder.getManyAndCount();
    const keysWithChatflows = await (0, addChatflowsCount_1.addChatflowsCount)(data);
    if (page > 0 && limit > 0) {
        return { total, data: keysWithChatflows };
    }
    else {
        return keysWithChatflows;
    }
};
const getAllApiKeys = async (workspaceId, autoCreateNewKey, page = -1, limit = -1) => {
    try {
        let keys = await getAllApiKeysFromDB(workspaceId, page, limit);
        const isEmpty = keys?.total === 0 || (Array.isArray(keys) && keys?.length === 0);
        if (isEmpty && autoCreateNewKey) {
            await createApiKey('DefaultKey', workspaceId);
            keys = await getAllApiKeysFromDB(workspaceId, page, limit);
        }
        return keys;
    }
    catch (error) {
        throw new internalFlowiseError_1.InternalFlowiseError(http_status_codes_1.StatusCodes.INTERNAL_SERVER_ERROR, `Error: apikeyService.getAllApiKeys - ${(0, utils_1.getErrorMessage)(error)}`);
    }
};
const getApiKey = async (apiKey) => {
    try {
        const appServer = (0, getRunningExpressApp_1.getRunningExpressApp)();
        const currentKey = await appServer.AppDataSource.getRepository(ApiKey_1.ApiKey).findOneBy({
            apiKey: apiKey
        });
        if (!currentKey) {
            return undefined;
        }
        return currentKey;
    }
    catch (error) {
        throw new internalFlowiseError_1.InternalFlowiseError(http_status_codes_1.StatusCodes.INTERNAL_SERVER_ERROR, `Error: apikeyService.getApiKey - ${(0, utils_1.getErrorMessage)(error)}`);
    }
};
const getApiKeyById = async (apiKeyId) => {
    try {
        const appServer = (0, getRunningExpressApp_1.getRunningExpressApp)();
        const currentKey = await appServer.AppDataSource.getRepository(ApiKey_1.ApiKey).findOneBy({
            id: apiKeyId
        });
        if (!currentKey) {
            return undefined;
        }
        return currentKey;
    }
    catch (error) {
        throw new internalFlowiseError_1.InternalFlowiseError(http_status_codes_1.StatusCodes.INTERNAL_SERVER_ERROR, `Error: apikeyService.getApiKeyById - ${(0, utils_1.getErrorMessage)(error)}`);
    }
};
const createApiKey = async (keyName, workspaceId) => {
    try {
        const apiKey = (0, apiKey_1.generateAPIKey)();
        const apiSecret = (0, apiKey_1.generateSecretHash)(apiKey);
        const appServer = (0, getRunningExpressApp_1.getRunningExpressApp)();
        const newKey = new ApiKey_1.ApiKey();
        newKey.id = (0, uuid_1.v4)();
        newKey.apiKey = apiKey;
        newKey.apiSecret = apiSecret;
        newKey.keyName = keyName;
        newKey.workspaceId = workspaceId;
        const key = appServer.AppDataSource.getRepository(ApiKey_1.ApiKey).create(newKey);
        await appServer.AppDataSource.getRepository(ApiKey_1.ApiKey).save(key);
        return await getAllApiKeysFromDB(workspaceId);
    }
    catch (error) {
        throw new internalFlowiseError_1.InternalFlowiseError(http_status_codes_1.StatusCodes.INTERNAL_SERVER_ERROR, `Error: apikeyService.createApiKey - ${(0, utils_1.getErrorMessage)(error)}`);
    }
};
// Update api key
const updateApiKey = async (id, keyName, workspaceId) => {
    try {
        const appServer = (0, getRunningExpressApp_1.getRunningExpressApp)();
        const currentKey = await appServer.AppDataSource.getRepository(ApiKey_1.ApiKey).findOneBy({
            id: id
        });
        if (!currentKey) {
            throw new internalFlowiseError_1.InternalFlowiseError(http_status_codes_1.StatusCodes.NOT_FOUND, `ApiKey ${currentKey} not found`);
        }
        currentKey.keyName = keyName;
        await appServer.AppDataSource.getRepository(ApiKey_1.ApiKey).save(currentKey);
        return await getAllApiKeysFromDB(workspaceId);
    }
    catch (error) {
        throw new internalFlowiseError_1.InternalFlowiseError(http_status_codes_1.StatusCodes.INTERNAL_SERVER_ERROR, `Error: apikeyService.updateApiKey - ${(0, utils_1.getErrorMessage)(error)}`);
    }
};
const deleteApiKey = async (id, workspaceId) => {
    try {
        const appServer = (0, getRunningExpressApp_1.getRunningExpressApp)();
        const dbResponse = await appServer.AppDataSource.getRepository(ApiKey_1.ApiKey).delete({ id, workspaceId });
        if (!dbResponse) {
            throw new internalFlowiseError_1.InternalFlowiseError(http_status_codes_1.StatusCodes.NOT_FOUND, `ApiKey ${id} not found`);
        }
        return dbResponse;
    }
    catch (error) {
        throw new internalFlowiseError_1.InternalFlowiseError(http_status_codes_1.StatusCodes.INTERNAL_SERVER_ERROR, `Error: apikeyService.deleteApiKey - ${(0, utils_1.getErrorMessage)(error)}`);
    }
};
const importKeys = async (body) => {
    try {
        const jsonFile = body.jsonFile;
        const workspaceId = body.workspaceId;
        const splitDataURI = jsonFile.split(',');
        if (splitDataURI[0] !== 'data:application/json;base64') {
            throw new internalFlowiseError_1.InternalFlowiseError(http_status_codes_1.StatusCodes.INTERNAL_SERVER_ERROR, `Invalid dataURI`);
        }
        const bf = Buffer.from(splitDataURI[1] || '', 'base64');
        const plain = bf.toString('utf8');
        const keys = JSON.parse(plain);
        // Validate schema of imported keys
        if (!Array.isArray(keys)) {
            throw new internalFlowiseError_1.InternalFlowiseError(http_status_codes_1.StatusCodes.BAD_REQUEST, `Invalid format: Expected an array of API keys`);
        }
        const requiredFields = ['keyName', 'apiKey', 'apiSecret', 'createdAt', 'id'];
        for (let i = 0; i < keys.length; i++) {
            const key = keys[i];
            if (typeof key !== 'object' || key === null) {
                throw new internalFlowiseError_1.InternalFlowiseError(http_status_codes_1.StatusCodes.BAD_REQUEST, `Invalid format: Key at index ${i} is not an object`);
            }
            for (const field of requiredFields) {
                if (!(field in key)) {
                    throw new internalFlowiseError_1.InternalFlowiseError(http_status_codes_1.StatusCodes.BAD_REQUEST, `Invalid format: Key at index ${i} is missing required field '${field}'`);
                }
                if (typeof key[field] !== 'string') {
                    throw new internalFlowiseError_1.InternalFlowiseError(http_status_codes_1.StatusCodes.BAD_REQUEST, `Invalid format: Key at index ${i} field '${field}' must be a string`);
                }
                if (key[field].trim() === '') {
                    throw new internalFlowiseError_1.InternalFlowiseError(http_status_codes_1.StatusCodes.BAD_REQUEST, `Invalid format: Key at index ${i} field '${field}' cannot be empty`);
                }
            }
        }
        const appServer = (0, getRunningExpressApp_1.getRunningExpressApp)();
        const allApiKeys = await appServer.AppDataSource.getRepository(ApiKey_1.ApiKey).findBy((0, ControllerServiceUtils_1.getWorkspaceSearchOptions)(workspaceId));
        if (body.importMode === 'replaceAll') {
            await appServer.AppDataSource.getRepository(ApiKey_1.ApiKey).delete({
                id: (0, typeorm_1.Not)((0, typeorm_1.IsNull)()),
                workspaceId: workspaceId
            });
        }
        if (body.importMode === 'errorIfExist') {
            // if importMode is errorIfExist, check for existing keys and raise error before any modification to the DB
            for (const key of keys) {
                const keyNameExists = allApiKeys.find((k) => k.keyName === key.keyName);
                if (keyNameExists) {
                    throw new internalFlowiseError_1.InternalFlowiseError(http_status_codes_1.StatusCodes.INTERNAL_SERVER_ERROR, `Key with name ${key.keyName} already exists`);
                }
            }
        }
        // iterate through the keys and add them to the database
        for (const key of keys) {
            const keyNameExists = allApiKeys.find((k) => k.keyName === key.keyName);
            if (keyNameExists) {
                const keyIndex = allApiKeys.findIndex((k) => k.keyName === key.keyName);
                switch (body.importMode) {
                    case 'overwriteIfExist':
                    case 'replaceAll': {
                        const currentKey = allApiKeys[keyIndex];
                        currentKey.id = (0, uuid_1.v4)();
                        currentKey.apiKey = key.apiKey;
                        currentKey.apiSecret = key.apiSecret;
                        currentKey.workspaceId = workspaceId;
                        await appServer.AppDataSource.getRepository(ApiKey_1.ApiKey).save(currentKey);
                        break;
                    }
                    case 'ignoreIfExist': {
                        // ignore this key and continue
                        continue;
                    }
                    case 'errorIfExist': {
                        // should not reach here as we have already checked for existing keys
                        throw new Error(`Key with name ${key.keyName} already exists`);
                    }
                    default: {
                        throw new Error(`Unknown overwrite option ${body.importMode}`);
                    }
                }
            }
            else {
                const newKey = new ApiKey_1.ApiKey();
                newKey.id = (0, uuid_1.v4)();
                newKey.apiKey = key.apiKey;
                newKey.apiSecret = key.apiSecret;
                newKey.keyName = key.keyName;
                newKey.workspaceId = workspaceId;
                const newKeyEntity = appServer.AppDataSource.getRepository(ApiKey_1.ApiKey).create(newKey);
                await appServer.AppDataSource.getRepository(ApiKey_1.ApiKey).save(newKeyEntity);
            }
        }
        return await getAllApiKeysFromDB(workspaceId);
    }
    catch (error) {
        throw new internalFlowiseError_1.InternalFlowiseError(http_status_codes_1.StatusCodes.INTERNAL_SERVER_ERROR, `Error: apikeyService.importKeys - ${(0, utils_1.getErrorMessage)(error)}`);
    }
};
const verifyApiKey = async (paramApiKey) => {
    try {
        const appServer = (0, getRunningExpressApp_1.getRunningExpressApp)();
        const apiKey = await appServer.AppDataSource.getRepository(ApiKey_1.ApiKey).findOneBy({
            apiKey: paramApiKey
        });
        if (!apiKey) {
            throw new internalFlowiseError_1.InternalFlowiseError(http_status_codes_1.StatusCodes.UNAUTHORIZED, `Unauthorized`);
        }
        return 'OK';
    }
    catch (error) {
        if (error instanceof internalFlowiseError_1.InternalFlowiseError && error.statusCode === http_status_codes_1.StatusCodes.UNAUTHORIZED) {
            throw error;
        }
        else {
            throw new internalFlowiseError_1.InternalFlowiseError(http_status_codes_1.StatusCodes.INTERNAL_SERVER_ERROR, `Error: apikeyService.verifyApiKey - ${(0, utils_1.getErrorMessage)(error)}`);
        }
    }
};
exports.default = {
    createApiKey,
    deleteApiKey,
    getAllApiKeys,
    updateApiKey,
    verifyApiKey,
    getApiKey,
    getApiKeyById,
    importKeys
};
//# sourceMappingURL=index.js.map