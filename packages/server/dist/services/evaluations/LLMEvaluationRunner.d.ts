import { ICommonObject } from 'flowise-components';
export declare class LLMEvaluationRunner {
    private llm;
    runLLMEvaluators(data: ICommonObject, actualOutputArray: string[], errorArray: string[], llmEvaluatorMap: any[]): Promise<any[]>;
    createLLM(data: ICommonObject): Promise<any>;
}
