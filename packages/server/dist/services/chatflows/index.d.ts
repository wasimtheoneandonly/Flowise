import { ChatflowType } from '../../Interface';
import { UsageCacheManager } from '../../UsageCacheManager';
import { ChatFlow } from '../../database/entities/ChatFlow';
export declare const enum ChatflowErrorMessage {
    INVALID_CHATFLOW_TYPE = "Invalid Chatflow Type"
}
export declare function validateChatflowType(type: ChatflowType | undefined): void;
declare function getAllChatflowsCountByOrganization(type: ChatflowType, organizationId: string): Promise<number>;
declare const _default: {
    checkIfChatflowIsValidForStreaming: (chatflowId: string) => Promise<any>;
    checkIfChatflowIsValidForUploads: (chatflowId: string) => Promise<any>;
    deleteChatflow: (chatflowId: string, orgId: string, workspaceId: string) => Promise<any>;
    getAllChatflows: (type?: ChatflowType, workspaceId?: string, page?: number, limit?: number) => Promise<ChatFlow[] | {
        data: ChatFlow[];
        total: number;
    }>;
    getAllChatflowsCount: (type?: ChatflowType, workspaceId?: string) => Promise<number>;
    getChatflowByApiKey: (apiKeyId: string, keyonly?: unknown) => Promise<any>;
    getChatflowById: (chatflowId: string) => Promise<any>;
    saveChatflow: (newChatFlow: ChatFlow, orgId: string, workspaceId: string, subscriptionId: string, usageCacheManager: UsageCacheManager) => Promise<any>;
    updateChatflow: (chatflow: ChatFlow, updateChatFlow: ChatFlow, orgId: string, workspaceId: string, subscriptionId: string) => Promise<any>;
    getSinglePublicChatbotConfig: (chatflowId: string) => Promise<any>;
    checkIfChatflowHasChanged: (chatflowId: string, lastUpdatedDateTime: string) => Promise<any>;
    getAllChatflowsCountByOrganization: typeof getAllChatflowsCountByOrganization;
};
export default _default;
