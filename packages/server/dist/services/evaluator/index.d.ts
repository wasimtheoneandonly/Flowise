import { EvaluatorDTO } from '../../Interface.Evaluation';
declare const _default: {
    getAllEvaluators: (workspaceId?: string, page?: number, limit?: number) => Promise<EvaluatorDTO[] | {
        total: number;
        data: EvaluatorDTO[];
    }>;
    getEvaluator: (id: string) => Promise<EvaluatorDTO>;
    createEvaluator: (body: any) => Promise<EvaluatorDTO>;
    updateEvaluator: (id: string, body: any) => Promise<EvaluatorDTO>;
    deleteEvaluator: (id: string) => Promise<import("typeorm").DeleteResult>;
};
export default _default;
