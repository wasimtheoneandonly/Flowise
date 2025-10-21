"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const lodash_1 = require("lodash");
const http_status_codes_1 = require("http-status-codes");
const getRunningExpressApp_1 = require("../../utils/getRunningExpressApp");
const Credential_1 = require("../../database/entities/Credential");
const utils_1 = require("../../utils");
const internalFlowiseError_1 = require("../../errors/internalFlowiseError");
const utils_2 = require("../../errors/utils");
const ControllerServiceUtils_1 = require("../../enterprise/utils/ControllerServiceUtils");
const EnterpriseEntities_1 = require("../../enterprise/database/entities/EnterpriseEntities");
const workspace_service_1 = require("../../enterprise/services/workspace.service");
const createCredential = async (requestBody) => {
    try {
        const appServer = (0, getRunningExpressApp_1.getRunningExpressApp)();
        const newCredential = await (0, utils_1.transformToCredentialEntity)(requestBody);
        if (requestBody.id) {
            newCredential.id = requestBody.id;
        }
        const credential = await appServer.AppDataSource.getRepository(Credential_1.Credential).create(newCredential);
        const dbResponse = await appServer.AppDataSource.getRepository(Credential_1.Credential).save(credential);
        return dbResponse;
    }
    catch (error) {
        throw new internalFlowiseError_1.InternalFlowiseError(http_status_codes_1.StatusCodes.INTERNAL_SERVER_ERROR, `Error: credentialsService.createCredential - ${(0, utils_2.getErrorMessage)(error)}`);
    }
};
// Delete all credentials from chatflowid
const deleteCredentials = async (credentialId) => {
    try {
        const appServer = (0, getRunningExpressApp_1.getRunningExpressApp)();
        const dbResponse = await appServer.AppDataSource.getRepository(Credential_1.Credential).delete({ id: credentialId });
        if (!dbResponse) {
            throw new internalFlowiseError_1.InternalFlowiseError(http_status_codes_1.StatusCodes.NOT_FOUND, `Credential ${credentialId} not found`);
        }
        return dbResponse;
    }
    catch (error) {
        throw new internalFlowiseError_1.InternalFlowiseError(http_status_codes_1.StatusCodes.INTERNAL_SERVER_ERROR, `Error: credentialsService.deleteCredential - ${(0, utils_2.getErrorMessage)(error)}`);
    }
};
const getAllCredentials = async (paramCredentialName, workspaceId) => {
    try {
        const appServer = (0, getRunningExpressApp_1.getRunningExpressApp)();
        let dbResponse = [];
        if (paramCredentialName) {
            if (Array.isArray(paramCredentialName)) {
                for (let i = 0; i < paramCredentialName.length; i += 1) {
                    const name = paramCredentialName[i];
                    const searchOptions = {
                        credentialName: name,
                        ...(0, ControllerServiceUtils_1.getWorkspaceSearchOptions)(workspaceId)
                    };
                    const credentials = await appServer.AppDataSource.getRepository(Credential_1.Credential).findBy(searchOptions);
                    dbResponse.push(...credentials);
                }
            }
            else {
                const searchOptions = {
                    credentialName: paramCredentialName,
                    ...(0, ControllerServiceUtils_1.getWorkspaceSearchOptions)(workspaceId)
                };
                const credentials = await appServer.AppDataSource.getRepository(Credential_1.Credential).findBy(searchOptions);
                dbResponse = [...credentials];
            }
            // get shared credentials
            if (workspaceId) {
                const workspaceService = new workspace_service_1.WorkspaceService();
                const sharedItems = (await workspaceService.getSharedItemsForWorkspace(workspaceId, 'credential'));
                if (sharedItems.length) {
                    for (const sharedItem of sharedItems) {
                        // Check if paramCredentialName is array
                        if (Array.isArray(paramCredentialName)) {
                            for (let i = 0; i < paramCredentialName.length; i += 1) {
                                const name = paramCredentialName[i];
                                if (sharedItem.credentialName === name) {
                                    // @ts-ignore
                                    sharedItem.shared = true;
                                    dbResponse.push(sharedItem);
                                }
                            }
                        }
                        else {
                            if (sharedItem.credentialName === paramCredentialName) {
                                // @ts-ignore
                                sharedItem.shared = true;
                                dbResponse.push(sharedItem);
                            }
                        }
                    }
                }
            }
        }
        else {
            const credentials = await appServer.AppDataSource.getRepository(Credential_1.Credential).findBy((0, ControllerServiceUtils_1.getWorkspaceSearchOptions)(workspaceId));
            for (const credential of credentials) {
                dbResponse.push((0, lodash_1.omit)(credential, ['encryptedData']));
            }
            // get shared credentials
            if (workspaceId) {
                const workspaceService = new workspace_service_1.WorkspaceService();
                const sharedItems = (await workspaceService.getSharedItemsForWorkspace(workspaceId, 'credential'));
                if (sharedItems.length) {
                    for (const sharedItem of sharedItems) {
                        // @ts-ignore
                        sharedItem.shared = true;
                        dbResponse.push(sharedItem);
                    }
                }
            }
        }
        return dbResponse;
    }
    catch (error) {
        throw new internalFlowiseError_1.InternalFlowiseError(http_status_codes_1.StatusCodes.INTERNAL_SERVER_ERROR, `Error: credentialsService.getAllCredentials - ${(0, utils_2.getErrorMessage)(error)}`);
    }
};
const getCredentialById = async (credentialId, workspaceId) => {
    try {
        const appServer = (0, getRunningExpressApp_1.getRunningExpressApp)();
        const credential = await appServer.AppDataSource.getRepository(Credential_1.Credential).findOneBy({
            id: credentialId
        });
        if (!credential) {
            throw new internalFlowiseError_1.InternalFlowiseError(http_status_codes_1.StatusCodes.NOT_FOUND, `Credential ${credentialId} not found`);
        }
        // Decrpyt credentialData
        const decryptedCredentialData = await (0, utils_1.decryptCredentialData)(credential.encryptedData, credential.credentialName, appServer.nodesPool.componentCredentials);
        const returnCredential = {
            ...credential,
            plainDataObj: decryptedCredentialData
        };
        const dbResponse = (0, lodash_1.omit)(returnCredential, ['encryptedData']);
        if (workspaceId) {
            const shared = await appServer.AppDataSource.getRepository(EnterpriseEntities_1.WorkspaceShared).count({
                where: {
                    workspaceId: workspaceId,
                    sharedItemId: credentialId,
                    itemType: 'credential'
                }
            });
            if (shared > 0) {
                dbResponse.shared = true;
            }
        }
        return dbResponse;
    }
    catch (error) {
        throw new internalFlowiseError_1.InternalFlowiseError(http_status_codes_1.StatusCodes.INTERNAL_SERVER_ERROR, `Error: credentialsService.createCredential - ${(0, utils_2.getErrorMessage)(error)}`);
    }
};
const updateCredential = async (credentialId, requestBody) => {
    try {
        const appServer = (0, getRunningExpressApp_1.getRunningExpressApp)();
        const credential = await appServer.AppDataSource.getRepository(Credential_1.Credential).findOneBy({
            id: credentialId
        });
        if (!credential) {
            throw new internalFlowiseError_1.InternalFlowiseError(http_status_codes_1.StatusCodes.NOT_FOUND, `Credential ${credentialId} not found`);
        }
        const decryptedCredentialData = await (0, utils_1.decryptCredentialData)(credential.encryptedData);
        requestBody.plainDataObj = { ...decryptedCredentialData, ...requestBody.plainDataObj };
        const updateCredential = await (0, utils_1.transformToCredentialEntity)(requestBody);
        await appServer.AppDataSource.getRepository(Credential_1.Credential).merge(credential, updateCredential);
        const dbResponse = await appServer.AppDataSource.getRepository(Credential_1.Credential).save(credential);
        return dbResponse;
    }
    catch (error) {
        throw new internalFlowiseError_1.InternalFlowiseError(http_status_codes_1.StatusCodes.INTERNAL_SERVER_ERROR, `Error: credentialsService.updateCredential - ${(0, utils_2.getErrorMessage)(error)}`);
    }
};
exports.default = {
    createCredential,
    deleteCredentials,
    getAllCredentials,
    getCredentialById,
    updateCredential
};
//# sourceMappingURL=index.js.map