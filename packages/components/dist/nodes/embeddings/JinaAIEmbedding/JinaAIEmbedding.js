"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const utils_1 = require("../../../src/utils");
const jina_1 = require("@langchain/community/embeddings/jina");
class ExtendedJinaEmbeddings extends jina_1.JinaEmbeddings {
    constructor(fields) {
        const { late_chunking = false, ...restFields } = fields;
        super(restFields);
        this.late_chunking = late_chunking;
    }
}
class JinaAIEmbedding_Embeddings {
    constructor() {
        this.label = 'Jina Embeddings';
        this.name = 'jinaEmbeddings';
        this.version = 3.0;
        this.type = 'JinaEmbeddings';
        this.icon = 'JinaAIEmbedding.svg';
        this.category = 'Embeddings';
        this.description = 'JinaAI API to generate embeddings for a given text';
        this.baseClasses = [this.type, ...(0, utils_1.getBaseClasses)(jina_1.JinaEmbeddings)];
        this.credential = {
            label: 'Connect Credential',
            name: 'credential',
            type: 'credential',
            credentialNames: ['jinaAIApi']
        };
        this.inputs = [
            {
                label: 'Model Name',
                name: 'modelName',
                type: 'string',
                default: 'jina-embeddings-v3',
                description: 'Refer to <a href="https://jina.ai/embeddings/" target="_blank">JinaAI documentation</a> for available models'
            },
            {
                label: 'Dimensions',
                name: 'modelDimensions',
                type: 'number',
                default: 1024,
                description: 'Refer to <a href="https://jina.ai/embeddings/" target="_blank">JinaAI documentation</a> for available dimensions'
            },
            {
                label: 'Allow Late Chunking',
                name: 'allowLateChunking',
                type: 'boolean',
                description: 'Refer to <a href="https://jina.ai/embeddings/" target="_blank">JinaAI documentation</a> guidance on late chunking',
                default: false,
                optional: true
            }
        ];
    }
    async init(nodeData, _, options) {
        const modelName = nodeData.inputs?.modelName;
        const modelDimensions = nodeData.inputs?.modelDimensions;
        const allowLateChunking = nodeData.inputs?.modelDimensions;
        const credentialData = await (0, utils_1.getCredentialData)(nodeData.credential ?? '', options);
        const apiKey = (0, utils_1.getCredentialParam)('jinaAIAPIKey', credentialData, nodeData);
        const model = new ExtendedJinaEmbeddings({
            apiKey: apiKey,
            model: modelName,
            dimensions: modelDimensions,
            late_chunking: allowLateChunking
        });
        return model;
    }
}
module.exports = { nodeClass: JinaAIEmbedding_Embeddings };
//# sourceMappingURL=JinaAIEmbedding.js.map