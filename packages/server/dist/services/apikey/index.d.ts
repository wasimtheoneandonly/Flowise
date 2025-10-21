import { ApiKey } from '../../database/entities/ApiKey';
declare const _default: {
    createApiKey: (keyName: string, workspaceId?: string) => Promise<any>;
    deleteApiKey: (id: string, workspaceId?: string) => Promise<import("typeorm").DeleteResult>;
    getAllApiKeys: (workspaceId?: string, autoCreateNewKey?: boolean, page?: number, limit?: number) => Promise<any>;
    updateApiKey: (id: string, keyName: string, workspaceId?: string) => Promise<any>;
    verifyApiKey: (paramApiKey: string) => Promise<string>;
    getApiKey: (apiKey: string) => Promise<ApiKey | undefined>;
    getApiKeyById: (apiKeyId: string) => Promise<ApiKey | undefined>;
    importKeys: (body: any) => Promise<any>;
};
export default _default;
