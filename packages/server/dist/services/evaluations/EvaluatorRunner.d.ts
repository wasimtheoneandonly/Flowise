import { ICommonObject } from 'flowise-components';
export declare const runAdditionalEvaluators: (metricsArray: ICommonObject[], actualOutputArray: string[], errorArray: string[], selectedEvaluators: string[]) => Promise<{
    results: any[];
    evaluatorMetrics: {
        passCount: number;
        failCount: number;
        errorCount: number;
    };
}>;
