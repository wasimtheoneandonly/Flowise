import { Dataset } from '../../database/entities/Dataset';
import { DatasetRow } from '../../database/entities/DatasetRow';
declare const _default: {
    getAllDatasets: (workspaceId?: string, page?: number, limit?: number) => Promise<Dataset[] | {
        total: number;
        data: Dataset[];
    }>;
    getDataset: (id: string, page?: number, limit?: number) => Promise<{
        rows: DatasetRow[];
        total: number;
        id?: string | undefined;
        name?: string | undefined;
        description?: string | undefined;
        createdDate?: Date | undefined;
        updatedDate?: Date | undefined;
        workspaceId?: string;
    }>;
    createDataset: (body: any) => Promise<Dataset>;
    updateDataset: (id: string, body: any) => Promise<Dataset>;
    deleteDataset: (id: string) => Promise<import("typeorm").DeleteResult>;
    addDatasetRow: (body: any) => Promise<DatasetRow | {
        message: string;
    }>;
    updateDatasetRow: (id: string, body: any) => Promise<DatasetRow>;
    deleteDatasetRow: (id: string) => Promise<import("typeorm").DeleteResult>;
    patchDeleteRows: (ids?: string[]) => Promise<import("typeorm").DeleteResult>;
    reorderDatasetRow: (datasetId: string, rows: any[]) => Promise<{
        message: string;
    }>;
};
export default _default;
