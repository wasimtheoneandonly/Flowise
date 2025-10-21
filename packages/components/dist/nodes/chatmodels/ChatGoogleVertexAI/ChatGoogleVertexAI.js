"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const google_vertexai_1 = require("@langchain/google-vertexai");
const google_utils_1 = require("../../../src/google-utils");
const modelLoader_1 = require("../../../src/modelLoader");
const utils_1 = require("../../../src/utils");
const DEFAULT_IMAGE_MAX_TOKEN = 8192;
const DEFAULT_IMAGE_MODEL = 'gemini-1.5-flash-latest';
class ChatVertexAI extends google_vertexai_1.ChatVertexAI {
    constructor(id, fields) {
        // @ts-ignore
        if (fields?.model) {
            fields.modelName = fields.model;
            delete fields.model;
        }
        super(fields ?? {});
        this.id = id;
        this.configuredModel = fields?.modelName || '';
        this.configuredMaxToken = fields?.maxOutputTokens ?? 2048;
    }
    revertToOriginalModel() {
        this.modelName = this.configuredModel;
        this.maxOutputTokens = this.configuredMaxToken;
    }
    setMultiModalOption(multiModalOption) {
        this.multiModalOption = multiModalOption;
    }
    setVisionModel() {
        if (!this.modelName.startsWith('claude-3')) {
            this.modelName = DEFAULT_IMAGE_MODEL;
            this.maxOutputTokens = this.configuredMaxToken ? this.configuredMaxToken : DEFAULT_IMAGE_MAX_TOKEN;
        }
    }
}
class GoogleVertexAI_ChatModels {
    constructor() {
        //@ts-ignore
        this.loadMethods = {
            async listModels() {
                return await (0, modelLoader_1.getModels)(modelLoader_1.MODEL_TYPE.CHAT, 'chatGoogleVertexAI');
            },
            async listRegions() {
                return await (0, modelLoader_1.getRegions)(modelLoader_1.MODEL_TYPE.CHAT, 'chatGoogleVertexAI');
            }
        };
        this.label = 'ChatGoogleVertexAI';
        this.name = 'chatGoogleVertexAI';
        this.version = 5.3;
        this.type = 'ChatGoogleVertexAI';
        this.icon = 'GoogleVertex.svg';
        this.category = 'Chat Models';
        this.description = 'Wrapper around VertexAI large language models that use the Chat endpoint';
        this.baseClasses = [this.type, ...(0, utils_1.getBaseClasses)(ChatVertexAI)];
        this.credential = {
            label: 'Connect Credential',
            name: 'credential',
            type: 'credential',
            credentialNames: ['googleVertexAuth'],
            optional: true,
            description: 'Google Vertex AI credential. If you are using a GCP service like Cloud Run, or if you have installed default credentials on your local machine, you do not need to set this credential.'
        };
        this.inputs = [
            {
                label: 'Cache',
                name: 'cache',
                type: 'BaseCache',
                optional: true
            },
            {
                label: 'Region',
                description: 'Region to use for the model.',
                name: 'region',
                type: 'asyncOptions',
                loadMethod: 'listRegions',
                optional: true
            },
            {
                label: 'Model Name',
                name: 'modelName',
                type: 'asyncOptions',
                loadMethod: 'listModels'
            },
            {
                label: 'Custom Model Name',
                name: 'customModelName',
                type: 'string',
                placeholder: 'gemini-1.5-pro-exp-0801',
                description: 'Custom model name to use. If provided, it will override the model selected',
                additionalParams: true,
                optional: true
            },
            {
                label: 'Temperature',
                name: 'temperature',
                type: 'number',
                step: 0.1,
                default: 0.9,
                optional: true
            },
            {
                label: 'Allow Image Uploads',
                name: 'allowImageUploads',
                type: 'boolean',
                description: 'Allow image input. Refer to the <a href="https://docs.flowiseai.com/using-flowise/uploads#image" target="_blank">docs</a> for more details.',
                default: false,
                optional: true
            },
            {
                label: 'Streaming',
                name: 'streaming',
                type: 'boolean',
                default: true,
                optional: true,
                additionalParams: true
            },
            {
                label: 'Max Output Tokens',
                name: 'maxOutputTokens',
                type: 'number',
                step: 1,
                optional: true,
                additionalParams: true
            },
            {
                label: 'Top Probability',
                name: 'topP',
                type: 'number',
                step: 0.1,
                optional: true,
                additionalParams: true
            },
            {
                label: 'Top Next Highest Probability Tokens',
                name: 'topK',
                type: 'number',
                description: `Decode using top-k sampling: consider the set of top_k most probable tokens. Must be positive`,
                step: 1,
                optional: true,
                additionalParams: true
            },
            {
                label: 'Thinking Budget',
                name: 'thinkingBudget',
                type: 'number',
                description: 'Number of tokens to use for thinking process (0 to disable)',
                step: 1,
                placeholder: '1024',
                optional: true,
                additionalParams: true
            }
        ];
    }
    async init(nodeData, _, options) {
        const temperature = nodeData.inputs?.temperature;
        const modelName = nodeData.inputs?.modelName;
        const customModelName = nodeData.inputs?.customModelName;
        const maxOutputTokens = nodeData.inputs?.maxOutputTokens;
        const topP = nodeData.inputs?.topP;
        const cache = nodeData.inputs?.cache;
        const topK = nodeData.inputs?.topK;
        const streaming = nodeData.inputs?.streaming;
        const thinkingBudget = nodeData.inputs?.thinkingBudget;
        const region = nodeData.inputs?.region;
        const allowImageUploads = nodeData.inputs?.allowImageUploads;
        const multiModalOption = {
            image: {
                allowImageUploads: allowImageUploads ?? false
            }
        };
        const obj = {
            temperature: parseFloat(temperature),
            modelName: customModelName || modelName,
            streaming: streaming ?? true
        };
        const authOptions = await (0, google_utils_1.buildGoogleCredentials)(nodeData, options);
        if (authOptions && Object.keys(authOptions).length !== 0)
            obj.authOptions = authOptions;
        if (maxOutputTokens)
            obj.maxOutputTokens = parseInt(maxOutputTokens, 10);
        if (topP)
            obj.topP = parseFloat(topP);
        if (cache)
            obj.cache = cache;
        if (topK)
            obj.topK = parseFloat(topK);
        if (thinkingBudget)
            obj.thinkingBudget = parseInt(thinkingBudget, 10);
        if (region)
            obj.location = region;
        const model = new ChatVertexAI(nodeData.id, obj);
        model.setMultiModalOption(multiModalOption);
        return model;
    }
}
module.exports = { nodeClass: GoogleVertexAI_ChatModels };
//# sourceMappingURL=ChatGoogleVertexAI.js.map