import { AzureChatOpenAI as LangchainAzureChatOpenAI, OpenAIChatInput, AzureOpenAIInput, ClientOptions } from '@langchain/openai';
import { IMultiModalOption, IVisionChatModal } from '../../../src';
import { BaseChatModelParams } from '@langchain/core/language_models/chat_models';
export declare class AzureChatOpenAI extends LangchainAzureChatOpenAI implements IVisionChatModal {
    configuredModel: string;
    configuredMaxToken?: number;
    multiModalOption: IMultiModalOption;
    builtInTools: Record<string, any>[];
    id: string;
    constructor(id: string, fields?: Partial<OpenAIChatInput> & Partial<AzureOpenAIInput> & {
        openAIApiKey?: string;
        openAIApiVersion?: string;
        openAIBasePath?: string;
        deploymentName?: string;
    } & BaseChatModelParams & {
        configuration?: ClientOptions;
    });
    revertToOriginalModel(): void;
    setMultiModalOption(multiModalOption: IMultiModalOption): void;
    setVisionModel(): void;
    addBuiltInTools(builtInTool: Record<string, any>): void;
}
