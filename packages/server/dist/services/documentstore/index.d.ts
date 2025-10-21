import { ICommonObject, IDocument } from 'flowise-components';
import { DataSource } from 'typeorm';
import { IDocumentStoreFileChunkPagedResponse, IDocumentStoreLoader, IDocumentStoreLoaderForPreview, IDocumentStoreRefreshData, IDocumentStoreUpsertData, IDocumentStoreWhereUsed, IExecuteDocStoreUpsert, IExecutePreviewLoader, IExecuteProcessLoader, IExecuteVectorStoreInsert, IOverrideConfig } from '../../Interface';
import { UsageCacheManager } from '../../UsageCacheManager';
import { DocumentStore } from '../../database/entities/DocumentStore';
import { DocumentStoreFileChunk } from '../../database/entities/DocumentStoreFileChunk';
export declare const previewChunks: ({ appDataSource, componentNodes, data, orgId }: IExecutePreviewLoader) => Promise<{
    chunks: IDocument<Record<string, any>>[];
    totalChunks: number;
    previewChunkCount: number | undefined;
}>;
export declare const processLoader: ({ appDataSource, componentNodes, data, docLoaderId, orgId, workspaceId, subscriptionId, usageCacheManager }: IExecuteProcessLoader) => Promise<IDocumentStoreFileChunkPagedResponse>;
export declare const insertIntoVectorStore: ({ appDataSource, componentNodes, telemetry, data, isStrictSave, orgId }: IExecuteVectorStoreInsert) => Promise<any>;
export declare const executeDocStoreUpsert: ({ appDataSource, componentNodes, telemetry, storeId, totalItems, files, isRefreshAPI, orgId, workspaceId, subscriptionId, usageCacheManager }: IExecuteDocStoreUpsert) => Promise<any>;
export declare const findDocStoreAvailableConfigs: (storeId: string, docId: string) => Promise<IOverrideConfig[]>;
declare const _default: {
    updateDocumentStoreUsage: (chatId: string, storeId: string | undefined, workspaceId?: string) => Promise<void>;
    deleteDocumentStore: (storeId: string, orgId: string, workspaceId: string, usageCacheManager: UsageCacheManager) => Promise<{
        deleted: number | null | undefined;
    }>;
    createDocumentStore: (newDocumentStore: DocumentStore, orgId: string) => Promise<DocumentStore>;
    deleteLoaderFromDocumentStore: (storeId: string, docId: string, orgId: string, workspaceId: string, usageCacheManager: UsageCacheManager) => Promise<DocumentStore>;
    getAllDocumentStores: (workspaceId?: string, page?: number, limit?: number) => Promise<DocumentStore[] | {
        data: DocumentStore[];
        total: number;
    }>;
    getAllDocumentFileChunksByDocumentStoreIds: (documentStoreIds: string[]) => Promise<DocumentStoreFileChunk[]>;
    getDocumentStoreById: (storeId: string) => Promise<DocumentStore>;
    getUsedChatflowNames: (entity: DocumentStore) => Promise<IDocumentStoreWhereUsed[]>;
    getDocumentStoreFileChunks: (appDataSource: DataSource, storeId: string, docId: string, pageNo?: number) => Promise<IDocumentStoreFileChunkPagedResponse>;
    updateDocumentStore: (documentStore: DocumentStore, updatedDocumentStore: DocumentStore) => Promise<DocumentStore>;
    previewChunksMiddleware: (data: IDocumentStoreLoaderForPreview, orgId: string, workspaceId: string, subscriptionId: string, usageCacheManager: UsageCacheManager) => Promise<any>;
    saveProcessingLoader: (appDataSource: DataSource, data: IDocumentStoreLoaderForPreview) => Promise<IDocumentStoreLoader>;
    processLoaderMiddleware: (data: IDocumentStoreLoaderForPreview, docLoaderId: string, orgId: string, workspaceId: string, subscriptionId: string, usageCacheManager: UsageCacheManager, isInternalRequest?: boolean) => Promise<any>;
    deleteDocumentStoreFileChunk: (storeId: string, docId: string, chunkId: string) => Promise<IDocumentStoreFileChunkPagedResponse>;
    editDocumentStoreFileChunk: (storeId: string, docId: string, chunkId: string, content: string, metadata: ICommonObject) => Promise<IDocumentStoreFileChunkPagedResponse>;
    getDocumentLoaders: () => Promise<import("flowise-components").INode[]>;
    insertIntoVectorStoreMiddleware: (data: ICommonObject, isStrictSave: boolean | undefined, orgId: string, workspaceId: string, subscriptionId: string, usageCacheManager: UsageCacheManager) => Promise<any>;
    getEmbeddingProviders: () => Promise<import("flowise-components").INode[]>;
    getVectorStoreProviders: () => Promise<import("flowise-components").INode[]>;
    getRecordManagerProviders: () => Promise<import("flowise-components").INode[]>;
    saveVectorStoreConfig: (appDataSource: DataSource, data: ICommonObject, isStrictSave?: boolean) => Promise<DocumentStore>;
    queryVectorStore: (data: ICommonObject) => Promise<{
        timeTaken: number;
        docs: any;
    }>;
    deleteVectorStoreFromStore: (storeId: string) => Promise<void>;
    updateVectorStoreConfigOnly: (data: ICommonObject) => Promise<{}>;
    upsertDocStoreMiddleware: (storeId: string, data: IDocumentStoreUpsertData, files: Express.Multer.File[] | undefined, orgId: string, workspaceId: string, subscriptionId: string, usageCacheManager: UsageCacheManager) => Promise<any>;
    refreshDocStoreMiddleware: (storeId: string, data: IDocumentStoreRefreshData, orgId: string, workspaceId: string, subscriptionId: string, usageCacheManager: UsageCacheManager) => Promise<any>;
    generateDocStoreToolDesc: (docStoreId: string, selectedChatModel: ICommonObject) => Promise<string>;
    findDocStoreAvailableConfigs: (storeId: string, docId: string) => Promise<IOverrideConfig[]>;
};
export default _default;
