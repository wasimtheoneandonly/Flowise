import { ICommonObject } from 'flowise-components';
import { Evaluation } from '../../database/entities/Evaluation';
import { IEvaluationResult } from '../../Interface';
import { EvaluationRun } from '../../database/entities/EvaluationRun';
declare const _default: {
    createEvaluation: (body: ICommonObject, baseURL: string, orgId: string) => Promise<IEvaluationResult[] | {
        total: number;
        data: IEvaluationResult[];
    }>;
    getAllEvaluations: (workspaceId?: string, page?: number, limit?: number) => Promise<IEvaluationResult[] | {
        total: number;
        data: IEvaluationResult[];
    }>;
    deleteEvaluation: (id: string, activeWorkspaceId?: string) => Promise<Evaluation[]>;
    getEvaluation: (id: string) => Promise<{
        versionCount: number;
        versionNo: number;
        rows: EvaluationRun[];
        id: string;
        average_metrics: string;
        additionalConfig: string;
        name: string;
        evaluationType: string;
        chatflowId: string;
        chatflowName: string;
        datasetId: string;
        datasetName: string;
        status: string;
        runDate: Date;
        workspaceId?: string;
    }>;
    isOutdated: (id: string) => Promise<ICommonObject>;
    runAgain: (id: string, baseURL: string, orgId: string) => Promise<IEvaluationResult[] | {
        total: number;
        data: IEvaluationResult[];
    }>;
    getVersions: (id: string) => Promise<{
        versions: {
            id: string;
            runDate: Date;
            version: number;
        }[];
    }>;
    patchDeleteEvaluations: (ids?: string[], isDeleteAllVersion?: boolean, activeWorkspaceId?: string) => Promise<Evaluation[]>;
};
export default _default;
