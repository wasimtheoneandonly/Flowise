import { IApiKey } from '../../Interface';
export declare class ApiKey implements IApiKey {
    id: string;
    apiKey: string;
    apiSecret: string;
    keyName: string;
    updatedDate: Date;
    workspaceId?: string;
}
