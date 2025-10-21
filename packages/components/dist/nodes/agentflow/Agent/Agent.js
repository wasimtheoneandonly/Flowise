"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const messages_1 = require("@langchain/core/messages");
const prompt_1 = require("../prompt");
const agents_1 = require("../../../src/agents");
const lodash_1 = require("lodash");
const zod_to_json_schema_1 = __importDefault(require("zod-to-json-schema"));
const error_1 = require("../../../src/error");
const utils_1 = require("../utils");
const utils_2 = require("../../../src/utils");
const storageUtils_1 = require("../../../src/storageUtils");
const node_fetch_1 = __importDefault(require("node-fetch"));
class Agent_Agentflow {
    constructor() {
        //@ts-ignore
        this.loadMethods = {
            async listModels(_, options) {
                const componentNodes = options.componentNodes;
                const returnOptions = [];
                for (const nodeName in componentNodes) {
                    const componentNode = componentNodes[nodeName];
                    if (componentNode.category === 'Chat Models') {
                        if (componentNode.tags?.includes('LlamaIndex')) {
                            continue;
                        }
                        returnOptions.push({
                            label: componentNode.label,
                            name: nodeName,
                            imageSrc: componentNode.icon
                        });
                    }
                }
                return returnOptions;
            },
            async listEmbeddings(_, options) {
                const componentNodes = options.componentNodes;
                const returnOptions = [];
                for (const nodeName in componentNodes) {
                    const componentNode = componentNodes[nodeName];
                    if (componentNode.category === 'Embeddings') {
                        if (componentNode.tags?.includes('LlamaIndex')) {
                            continue;
                        }
                        returnOptions.push({
                            label: componentNode.label,
                            name: nodeName,
                            imageSrc: componentNode.icon
                        });
                    }
                }
                return returnOptions;
            },
            async listTools(_, options) {
                const componentNodes = options.componentNodes;
                const removeTools = ['chainTool', 'retrieverTool', 'webBrowser'];
                const returnOptions = [];
                for (const nodeName in componentNodes) {
                    const componentNode = componentNodes[nodeName];
                    if (componentNode.category === 'Tools' || componentNode.category === 'Tools (MCP)') {
                        if (componentNode.tags?.includes('LlamaIndex')) {
                            continue;
                        }
                        if (removeTools.includes(nodeName)) {
                            continue;
                        }
                        returnOptions.push({
                            label: componentNode.label,
                            name: nodeName,
                            imageSrc: componentNode.icon
                        });
                    }
                }
                return returnOptions;
            },
            async listRuntimeStateKeys(_, options) {
                const previousNodes = options.previousNodes;
                const startAgentflowNode = previousNodes.find((node) => node.name === 'startAgentflow');
                const state = startAgentflowNode?.inputs?.startState;
                return state.map((item) => ({ label: item.key, name: item.key }));
            },
            async listStores(_, options) {
                const returnData = [];
                const appDataSource = options.appDataSource;
                const databaseEntities = options.databaseEntities;
                if (appDataSource === undefined || !appDataSource) {
                    return returnData;
                }
                const searchOptions = options.searchOptions || {};
                const stores = await appDataSource.getRepository(databaseEntities['DocumentStore']).findBy(searchOptions);
                for (const store of stores) {
                    if (store.status === 'UPSERTED') {
                        const obj = {
                            name: `${store.id}:${store.name}`,
                            label: store.name,
                            description: store.description
                        };
                        returnData.push(obj);
                    }
                }
                return returnData;
            },
            async listVectorStores(_, options) {
                const componentNodes = options.componentNodes;
                const returnOptions = [];
                for (const nodeName in componentNodes) {
                    const componentNode = componentNodes[nodeName];
                    if (componentNode.category === 'Vector Stores') {
                        if (componentNode.tags?.includes('LlamaIndex')) {
                            continue;
                        }
                        returnOptions.push({
                            label: componentNode.label,
                            name: nodeName,
                            imageSrc: componentNode.icon
                        });
                    }
                }
                return returnOptions;
            }
        };
        this.label = 'Agent';
        this.name = 'agentAgentflow';
        this.version = 2.2;
        this.type = 'Agent';
        this.category = 'Agent Flows';
        this.description = 'Dynamically choose and utilize tools during runtime, enabling multi-step reasoning';
        this.color = '#4DD0E1';
        this.baseClasses = [this.type];
        this.inputs = [
            {
                label: 'Model',
                name: 'agentModel',
                type: 'asyncOptions',
                loadMethod: 'listModels',
                loadConfig: true
            },
            {
                label: 'Messages',
                name: 'agentMessages',
                type: 'array',
                optional: true,
                acceptVariable: true,
                array: [
                    {
                        label: 'Role',
                        name: 'role',
                        type: 'options',
                        options: [
                            {
                                label: 'System',
                                name: 'system'
                            },
                            {
                                label: 'Assistant',
                                name: 'assistant'
                            },
                            {
                                label: 'Developer',
                                name: 'developer'
                            },
                            {
                                label: 'User',
                                name: 'user'
                            }
                        ]
                    },
                    {
                        label: 'Content',
                        name: 'content',
                        type: 'string',
                        acceptVariable: true,
                        generateInstruction: true,
                        rows: 4
                    }
                ]
            },
            {
                label: 'OpenAI Built-in Tools',
                name: 'agentToolsBuiltInOpenAI',
                type: 'multiOptions',
                optional: true,
                options: [
                    {
                        label: 'Web Search',
                        name: 'web_search_preview',
                        description: 'Search the web for the latest information'
                    },
                    {
                        label: 'Code Interpreter',
                        name: 'code_interpreter',
                        description: 'Write and run Python code in a sandboxed environment'
                    },
                    {
                        label: 'Image Generation',
                        name: 'image_generation',
                        description: 'Generate images based on a text prompt'
                    }
                ],
                show: {
                    agentModel: 'chatOpenAI'
                }
            },
            {
                label: 'Gemini Built-in Tools',
                name: 'agentToolsBuiltInGemini',
                type: 'multiOptions',
                optional: true,
                options: [
                    {
                        label: 'URL Context',
                        name: 'urlContext',
                        description: 'Extract content from given URLs'
                    },
                    {
                        label: 'Google Search',
                        name: 'googleSearch',
                        description: 'Search real-time web content'
                    }
                ],
                show: {
                    agentModel: 'chatGoogleGenerativeAI'
                }
            },
            {
                label: 'Anthropic Built-in Tools',
                name: 'agentToolsBuiltInAnthropic',
                type: 'multiOptions',
                optional: true,
                options: [
                    {
                        label: 'Web Search',
                        name: 'web_search_20250305',
                        description: 'Search the web for the latest information'
                    },
                    {
                        label: 'Web Fetch',
                        name: 'web_fetch_20250910',
                        description: 'Retrieve full content from specified web pages'
                    }
                    /*
                    * Not supported yet as we need to get bash_code_execution_tool_result from content:
                    https://docs.claude.com/en/docs/agents-and-tools/tool-use/code-execution-tool#retrieve-generated-files
                    {
                        label: 'Code Interpreter',
                        name: 'code_execution_20250825',
                        description: 'Write and run Python code in a sandboxed environment'
                    }*/
                ],
                show: {
                    agentModel: 'chatAnthropic'
                }
            },
            {
                label: 'Tools',
                name: 'agentTools',
                type: 'array',
                optional: true,
                array: [
                    {
                        label: 'Tool',
                        name: 'agentSelectedTool',
                        type: 'asyncOptions',
                        loadMethod: 'listTools',
                        loadConfig: true
                    },
                    {
                        label: 'Require Human Input',
                        name: 'agentSelectedToolRequiresHumanInput',
                        type: 'boolean',
                        optional: true
                    }
                ]
            },
            {
                label: 'Knowledge (Document Stores)',
                name: 'agentKnowledgeDocumentStores',
                type: 'array',
                description: 'Give your agent context about different document sources. Document stores must be upserted in advance.',
                array: [
                    {
                        label: 'Document Store',
                        name: 'documentStore',
                        type: 'asyncOptions',
                        loadMethod: 'listStores'
                    },
                    {
                        label: 'Describe Knowledge',
                        name: 'docStoreDescription',
                        type: 'string',
                        generateDocStoreDescription: true,
                        placeholder: 'Describe what the knowledge base is about, this is useful for the AI to know when and how to search for correct information',
                        rows: 4
                    },
                    {
                        label: 'Return Source Documents',
                        name: 'returnSourceDocuments',
                        type: 'boolean',
                        optional: true
                    }
                ],
                optional: true
            },
            {
                label: 'Knowledge (Vector Embeddings)',
                name: 'agentKnowledgeVSEmbeddings',
                type: 'array',
                description: 'Give your agent context about different document sources from existing vector stores and embeddings',
                array: [
                    {
                        label: 'Vector Store',
                        name: 'vectorStore',
                        type: 'asyncOptions',
                        loadMethod: 'listVectorStores',
                        loadConfig: true
                    },
                    {
                        label: 'Embedding Model',
                        name: 'embeddingModel',
                        type: 'asyncOptions',
                        loadMethod: 'listEmbeddings',
                        loadConfig: true
                    },
                    {
                        label: 'Knowledge Name',
                        name: 'knowledgeName',
                        type: 'string',
                        placeholder: 'A short name for the knowledge base, this is useful for the AI to know when and how to search for correct information'
                    },
                    {
                        label: 'Describe Knowledge',
                        name: 'knowledgeDescription',
                        type: 'string',
                        placeholder: 'Describe what the knowledge base is about, this is useful for the AI to know when and how to search for correct information',
                        rows: 4
                    },
                    {
                        label: 'Return Source Documents',
                        name: 'returnSourceDocuments',
                        type: 'boolean',
                        optional: true
                    }
                ],
                optional: true
            },
            {
                label: 'Enable Memory',
                name: 'agentEnableMemory',
                type: 'boolean',
                description: 'Enable memory for the conversation thread',
                default: true,
                optional: true
            },
            {
                label: 'Memory Type',
                name: 'agentMemoryType',
                type: 'options',
                options: [
                    {
                        label: 'All Messages',
                        name: 'allMessages',
                        description: 'Retrieve all messages from the conversation'
                    },
                    {
                        label: 'Window Size',
                        name: 'windowSize',
                        description: 'Uses a fixed window size to surface the last N messages'
                    },
                    {
                        label: 'Conversation Summary',
                        name: 'conversationSummary',
                        description: 'Summarizes the whole conversation'
                    },
                    {
                        label: 'Conversation Summary Buffer',
                        name: 'conversationSummaryBuffer',
                        description: 'Summarize conversations once token limit is reached. Default to 2000'
                    }
                ],
                optional: true,
                default: 'allMessages',
                show: {
                    agentEnableMemory: true
                }
            },
            {
                label: 'Window Size',
                name: 'agentMemoryWindowSize',
                type: 'number',
                default: '20',
                description: 'Uses a fixed window size to surface the last N messages',
                show: {
                    agentMemoryType: 'windowSize'
                }
            },
            {
                label: 'Max Token Limit',
                name: 'agentMemoryMaxTokenLimit',
                type: 'number',
                default: '2000',
                description: 'Summarize conversations once token limit is reached. Default to 2000',
                show: {
                    agentMemoryType: 'conversationSummaryBuffer'
                }
            },
            {
                label: 'Input Message',
                name: 'agentUserMessage',
                type: 'string',
                description: 'Add an input message as user message at the end of the conversation',
                rows: 4,
                optional: true,
                acceptVariable: true,
                show: {
                    agentEnableMemory: true
                }
            },
            {
                label: 'Return Response As',
                name: 'agentReturnResponseAs',
                type: 'options',
                options: [
                    {
                        label: 'User Message',
                        name: 'userMessage'
                    },
                    {
                        label: 'Assistant Message',
                        name: 'assistantMessage'
                    }
                ],
                default: 'userMessage'
            },
            {
                label: 'Update Flow State',
                name: 'agentUpdateState',
                description: 'Update runtime state during the execution of the workflow',
                type: 'array',
                optional: true,
                acceptVariable: true,
                array: [
                    {
                        label: 'Key',
                        name: 'key',
                        type: 'asyncOptions',
                        loadMethod: 'listRuntimeStateKeys',
                        freeSolo: true
                    },
                    {
                        label: 'Value',
                        name: 'value',
                        type: 'string',
                        acceptVariable: true,
                        acceptNodeOutputAsVariable: true
                    }
                ]
            }
        ];
    }
    async run(nodeData, input, options) {
        let llmIds;
        let analyticHandlers = options.analyticHandlers;
        try {
            const abortController = options.abortController;
            // Extract input parameters
            const model = nodeData.inputs?.agentModel;
            const modelConfig = nodeData.inputs?.agentModelConfig;
            if (!model) {
                throw new Error('Model is required');
            }
            // Extract tools
            const tools = nodeData.inputs?.agentTools;
            const toolsInstance = [];
            for (const tool of tools) {
                const toolConfig = tool.agentSelectedToolConfig;
                const nodeInstanceFilePath = options.componentNodes[tool.agentSelectedTool].filePath;
                const nodeModule = await Promise.resolve(`${nodeInstanceFilePath}`).then(s => __importStar(require(s)));
                const newToolNodeInstance = new nodeModule.nodeClass();
                const newNodeData = {
                    ...nodeData,
                    credential: toolConfig['FLOWISE_CREDENTIAL_ID'],
                    inputs: {
                        ...nodeData.inputs,
                        ...toolConfig
                    }
                };
                const toolInstance = await newToolNodeInstance.init(newNodeData, '', options);
                // toolInstance might returns a list of tools like MCP tools
                if (Array.isArray(toolInstance)) {
                    for (const subTool of toolInstance) {
                        const subToolInstance = subTool;
                        subToolInstance.agentSelectedTool = tool.agentSelectedTool;
                        if (tool.agentSelectedToolRequiresHumanInput) {
                            ;
                            subToolInstance.requiresHumanInput = true;
                        }
                        toolsInstance.push(subToolInstance);
                    }
                }
                else {
                    if (tool.agentSelectedToolRequiresHumanInput) {
                        toolInstance.requiresHumanInput = true;
                    }
                    toolsInstance.push(toolInstance);
                }
            }
            const availableTools = toolsInstance.map((tool, index) => {
                const originalTool = tools[index];
                let agentSelectedTool = tool?.agentSelectedTool;
                if (!agentSelectedTool) {
                    agentSelectedTool = originalTool?.agentSelectedTool;
                }
                const componentNode = options.componentNodes[agentSelectedTool];
                const jsonSchema = (0, zod_to_json_schema_1.default)(tool.schema);
                if (jsonSchema.$schema) {
                    delete jsonSchema.$schema;
                }
                return {
                    name: tool.name,
                    description: tool.description,
                    schema: jsonSchema,
                    toolNode: {
                        label: componentNode?.label || tool.name,
                        name: componentNode?.name || tool.name
                    }
                };
            });
            // Extract knowledge
            const knowledgeBases = nodeData.inputs?.agentKnowledgeDocumentStores;
            if (knowledgeBases && knowledgeBases.length > 0) {
                for (const knowledgeBase of knowledgeBases) {
                    const nodeInstanceFilePath = options.componentNodes['retrieverTool'].filePath;
                    const nodeModule = await Promise.resolve(`${nodeInstanceFilePath}`).then(s => __importStar(require(s)));
                    const newRetrieverToolNodeInstance = new nodeModule.nodeClass();
                    const [storeId, storeName] = knowledgeBase.documentStore.split(':');
                    const docStoreVectorInstanceFilePath = options.componentNodes['documentStoreVS'].filePath;
                    const docStoreVectorModule = await Promise.resolve(`${docStoreVectorInstanceFilePath}`).then(s => __importStar(require(s)));
                    const newDocStoreVectorInstance = new docStoreVectorModule.nodeClass();
                    const docStoreVectorInstance = await newDocStoreVectorInstance.init({
                        ...nodeData,
                        inputs: {
                            ...nodeData.inputs,
                            selectedStore: storeId
                        },
                        outputs: {
                            output: 'retriever'
                        }
                    }, '', options);
                    const newRetrieverToolNodeData = {
                        ...nodeData,
                        inputs: {
                            ...nodeData.inputs,
                            name: storeName
                                .toLowerCase()
                                .replace(/ /g, '_')
                                .replace(/[^a-z0-9_-]/g, ''),
                            description: knowledgeBase.docStoreDescription,
                            retriever: docStoreVectorInstance,
                            returnSourceDocuments: knowledgeBase.returnSourceDocuments
                        }
                    };
                    const retrieverToolInstance = await newRetrieverToolNodeInstance.init(newRetrieverToolNodeData, '', options);
                    toolsInstance.push(retrieverToolInstance);
                    const jsonSchema = (0, zod_to_json_schema_1.default)(retrieverToolInstance.schema);
                    if (jsonSchema.$schema) {
                        delete jsonSchema.$schema;
                    }
                    const componentNode = options.componentNodes['retrieverTool'];
                    availableTools.push({
                        name: storeName
                            .toLowerCase()
                            .replace(/ /g, '_')
                            .replace(/[^a-z0-9_-]/g, ''),
                        description: knowledgeBase.docStoreDescription,
                        schema: jsonSchema,
                        toolNode: {
                            label: componentNode?.label || retrieverToolInstance.name,
                            name: componentNode?.name || retrieverToolInstance.name
                        }
                    });
                }
            }
            const knowledgeBasesForVSEmbeddings = nodeData.inputs?.agentKnowledgeVSEmbeddings;
            if (knowledgeBasesForVSEmbeddings && knowledgeBasesForVSEmbeddings.length > 0) {
                for (const knowledgeBase of knowledgeBasesForVSEmbeddings) {
                    const nodeInstanceFilePath = options.componentNodes['retrieverTool'].filePath;
                    const nodeModule = await Promise.resolve(`${nodeInstanceFilePath}`).then(s => __importStar(require(s)));
                    const newRetrieverToolNodeInstance = new nodeModule.nodeClass();
                    const selectedEmbeddingModel = knowledgeBase.embeddingModel;
                    const selectedEmbeddingModelConfig = knowledgeBase.embeddingModelConfig;
                    const embeddingInstanceFilePath = options.componentNodes[selectedEmbeddingModel].filePath;
                    const embeddingModule = await Promise.resolve(`${embeddingInstanceFilePath}`).then(s => __importStar(require(s)));
                    const newEmbeddingInstance = new embeddingModule.nodeClass();
                    const newEmbeddingNodeData = {
                        ...nodeData,
                        credential: selectedEmbeddingModelConfig['FLOWISE_CREDENTIAL_ID'],
                        inputs: {
                            ...nodeData.inputs,
                            ...selectedEmbeddingModelConfig
                        }
                    };
                    const embeddingInstance = await newEmbeddingInstance.init(newEmbeddingNodeData, '', options);
                    const selectedVectorStore = knowledgeBase.vectorStore;
                    const selectedVectorStoreConfig = knowledgeBase.vectorStoreConfig;
                    const vectorStoreInstanceFilePath = options.componentNodes[selectedVectorStore].filePath;
                    const vectorStoreModule = await Promise.resolve(`${vectorStoreInstanceFilePath}`).then(s => __importStar(require(s)));
                    const newVectorStoreInstance = new vectorStoreModule.nodeClass();
                    const newVSNodeData = {
                        ...nodeData,
                        credential: selectedVectorStoreConfig['FLOWISE_CREDENTIAL_ID'],
                        inputs: {
                            ...nodeData.inputs,
                            ...selectedVectorStoreConfig,
                            embeddings: embeddingInstance
                        },
                        outputs: {
                            output: 'retriever'
                        }
                    };
                    const vectorStoreInstance = await newVectorStoreInstance.init(newVSNodeData, '', options);
                    const knowledgeName = knowledgeBase.knowledgeName || '';
                    const newRetrieverToolNodeData = {
                        ...nodeData,
                        inputs: {
                            ...nodeData.inputs,
                            name: knowledgeName
                                .toLowerCase()
                                .replace(/ /g, '_')
                                .replace(/[^a-z0-9_-]/g, ''),
                            description: knowledgeBase.knowledgeDescription,
                            retriever: vectorStoreInstance,
                            returnSourceDocuments: knowledgeBase.returnSourceDocuments
                        }
                    };
                    const retrieverToolInstance = await newRetrieverToolNodeInstance.init(newRetrieverToolNodeData, '', options);
                    toolsInstance.push(retrieverToolInstance);
                    const jsonSchema = (0, zod_to_json_schema_1.default)(retrieverToolInstance.schema);
                    if (jsonSchema.$schema) {
                        delete jsonSchema.$schema;
                    }
                    const componentNode = options.componentNodes['retrieverTool'];
                    availableTools.push({
                        name: knowledgeName
                            .toLowerCase()
                            .replace(/ /g, '_')
                            .replace(/[^a-z0-9_-]/g, ''),
                        description: knowledgeBase.knowledgeDescription,
                        schema: jsonSchema,
                        toolNode: {
                            label: componentNode?.label || retrieverToolInstance.name,
                            name: componentNode?.name || retrieverToolInstance.name
                        }
                    });
                }
            }
            // Extract memory and configuration options
            const enableMemory = nodeData.inputs?.agentEnableMemory;
            const memoryType = nodeData.inputs?.agentMemoryType;
            const userMessage = nodeData.inputs?.agentUserMessage;
            const _agentUpdateState = nodeData.inputs?.agentUpdateState;
            const agentMessages = nodeData.inputs?.agentMessages ?? [];
            // Extract runtime state and history
            const state = options.agentflowRuntime?.state;
            const pastChatHistory = options.pastChatHistory ?? [];
            const runtimeChatHistory = options.agentflowRuntime?.chatHistory ?? [];
            const prependedChatHistory = options.prependedChatHistory;
            const chatId = options.chatId;
            // Initialize the LLM model instance
            const nodeInstanceFilePath = options.componentNodes[model].filePath;
            const nodeModule = await Promise.resolve(`${nodeInstanceFilePath}`).then(s => __importStar(require(s)));
            const newLLMNodeInstance = new nodeModule.nodeClass();
            const newNodeData = {
                ...nodeData,
                credential: modelConfig['FLOWISE_CREDENTIAL_ID'],
                inputs: {
                    ...nodeData.inputs,
                    ...modelConfig
                }
            };
            const llmWithoutToolsBind = (await newLLMNodeInstance.init(newNodeData, '', options));
            let llmNodeInstance = llmWithoutToolsBind;
            const agentToolsBuiltInOpenAI = (0, utils_2.convertMultiOptionsToStringArray)(nodeData.inputs?.agentToolsBuiltInOpenAI);
            if (agentToolsBuiltInOpenAI && agentToolsBuiltInOpenAI.length > 0) {
                for (const tool of agentToolsBuiltInOpenAI) {
                    const builtInTool = {
                        type: tool
                    };
                    if (tool === 'code_interpreter') {
                        builtInTool.container = { type: 'auto' };
                    }
                    ;
                    toolsInstance.push(builtInTool);
                    availableTools.push({
                        name: tool,
                        toolNode: {
                            label: tool,
                            name: tool
                        }
                    });
                }
            }
            const agentToolsBuiltInGemini = (0, utils_2.convertMultiOptionsToStringArray)(nodeData.inputs?.agentToolsBuiltInGemini);
            if (agentToolsBuiltInGemini && agentToolsBuiltInGemini.length > 0) {
                for (const tool of agentToolsBuiltInGemini) {
                    const builtInTool = {
                        [tool]: {}
                    };
                    toolsInstance.push(builtInTool);
                    availableTools.push({
                        name: tool,
                        toolNode: {
                            label: tool,
                            name: tool
                        }
                    });
                }
            }
            const agentToolsBuiltInAnthropic = (0, utils_2.convertMultiOptionsToStringArray)(nodeData.inputs?.agentToolsBuiltInAnthropic);
            if (agentToolsBuiltInAnthropic && agentToolsBuiltInAnthropic.length > 0) {
                for (const tool of agentToolsBuiltInAnthropic) {
                    // split _ to get the tool name by removing the last part (date)
                    const toolName = tool.split('_').slice(0, -1).join('_');
                    if (tool === 'code_execution_20250825') {
                        ;
                        llmNodeInstance.clientOptions = {
                            defaultHeaders: {
                                'anthropic-beta': ['code-execution-2025-08-25', 'files-api-2025-04-14']
                            }
                        };
                    }
                    if (tool === 'web_fetch_20250910') {
                        ;
                        llmNodeInstance.clientOptions = {
                            defaultHeaders: {
                                'anthropic-beta': ['web-fetch-2025-09-10']
                            }
                        };
                    }
                    const builtInTool = {
                        type: tool,
                        name: toolName
                    };
                    toolsInstance.push(builtInTool);
                    availableTools.push({
                        name: tool,
                        toolNode: {
                            label: tool,
                            name: tool
                        }
                    });
                }
            }
            if (llmNodeInstance && toolsInstance.length > 0) {
                if (llmNodeInstance.bindTools === undefined) {
                    throw new Error(`Agent needs to have a function calling capable models.`);
                }
                // @ts-ignore
                llmNodeInstance = llmNodeInstance.bindTools(toolsInstance);
            }
            // Prepare messages array
            const messages = [];
            // Use to store messages with image file references as we do not want to store the base64 data into database
            let runtimeImageMessagesWithFileRef = [];
            // Use to keep track of past messages with image file references
            let pastImageMessagesWithFileRef = [];
            // Prepend history ONLY if it is the first node
            if (prependedChatHistory.length > 0 && !runtimeChatHistory.length) {
                for (const msg of prependedChatHistory) {
                    const role = msg.role === 'apiMessage' ? 'assistant' : 'user';
                    const content = msg.content ?? '';
                    messages.push({
                        role,
                        content
                    });
                }
            }
            for (const msg of agentMessages) {
                const role = msg.role;
                const content = msg.content;
                if (role && content) {
                    if (role === 'system') {
                        messages.unshift({ role, content });
                    }
                    else {
                        messages.push({ role, content });
                    }
                }
            }
            // Handle memory management if enabled
            if (enableMemory) {
                await this.handleMemory({
                    messages,
                    memoryType,
                    pastChatHistory,
                    runtimeChatHistory,
                    llmNodeInstance,
                    nodeData,
                    userMessage,
                    input,
                    abortController,
                    options,
                    modelConfig,
                    runtimeImageMessagesWithFileRef,
                    pastImageMessagesWithFileRef
                });
            }
            else if (!runtimeChatHistory.length) {
                /*
                 * If this is the first node:
                 * - Add images to messages if exist
                 * - Add user message if it does not exist in the agentMessages array
                 */
                if (options.uploads) {
                    const imageContents = await (0, utils_1.getUniqueImageMessages)(options, messages, modelConfig);
                    if (imageContents) {
                        const { imageMessageWithBase64, imageMessageWithFileRef } = imageContents;
                        messages.push(imageMessageWithBase64);
                        runtimeImageMessagesWithFileRef.push(imageMessageWithFileRef);
                    }
                }
                if (input && typeof input === 'string' && !agentMessages.some((msg) => msg.role === 'user')) {
                    messages.push({
                        role: 'user',
                        content: input
                    });
                }
            }
            delete nodeData.inputs?.agentMessages;
            // Initialize response and determine if streaming is possible
            let response = new messages_1.AIMessageChunk('');
            const isLastNode = options.isLastNode;
            const isStreamable = isLastNode && options.sseStreamer !== undefined && modelConfig?.streaming !== false;
            // Start analytics
            if (analyticHandlers && options.parentTraceIds) {
                const llmLabel = options?.componentNodes?.[model]?.label || model;
                llmIds = await analyticHandlers.onLLMStart(llmLabel, messages, options.parentTraceIds);
            }
            // Track execution time
            const startTime = Date.now();
            // Get initial response from LLM
            const sseStreamer = options.sseStreamer;
            // Handle tool calls with support for recursion
            let usedTools = [];
            let sourceDocuments = [];
            let artifacts = [];
            let fileAnnotations = [];
            let additionalTokens = 0;
            let isWaitingForHumanInput = false;
            // Store the current messages length to track which messages are added during tool calls
            const messagesBeforeToolCalls = [...messages];
            let _toolCallMessages = [];
            // Check if this is hummanInput for tool calls
            const _humanInput = nodeData.inputs?.humanInput;
            const humanInput = typeof _humanInput === 'string' ? JSON.parse(_humanInput) : _humanInput;
            const humanInputAction = options.humanInputAction;
            const iterationContext = options.iterationContext;
            if (humanInput) {
                if (humanInput.type !== 'proceed' && humanInput.type !== 'reject') {
                    throw new Error(`Invalid human input type. Expected 'proceed' or 'reject', but got '${humanInput.type}'`);
                }
                const result = await this.handleResumedToolCalls({
                    humanInput,
                    humanInputAction,
                    messages,
                    toolsInstance,
                    sseStreamer,
                    chatId,
                    input,
                    options,
                    abortController,
                    llmWithoutToolsBind,
                    isStreamable,
                    isLastNode,
                    iterationContext
                });
                response = result.response;
                usedTools = result.usedTools;
                sourceDocuments = result.sourceDocuments;
                artifacts = result.artifacts;
                additionalTokens = result.totalTokens;
                isWaitingForHumanInput = result.isWaitingForHumanInput || false;
                // Calculate which messages were added during tool calls
                _toolCallMessages = messages.slice(messagesBeforeToolCalls.length);
                // Stream additional data if this is the last node
                if (isLastNode && sseStreamer) {
                    if (usedTools.length > 0) {
                        sseStreamer.streamUsedToolsEvent(chatId, (0, lodash_1.flatten)(usedTools));
                    }
                    if (sourceDocuments.length > 0) {
                        sseStreamer.streamSourceDocumentsEvent(chatId, (0, lodash_1.flatten)(sourceDocuments));
                    }
                    if (artifacts.length > 0) {
                        sseStreamer.streamArtifactsEvent(chatId, (0, lodash_1.flatten)(artifacts));
                    }
                }
            }
            else {
                if (isStreamable) {
                    response = await this.handleStreamingResponse(sseStreamer, llmNodeInstance, messages, chatId, abortController);
                }
                else {
                    response = await llmNodeInstance.invoke(messages, { signal: abortController?.signal });
                }
            }
            // Address built in tools (after artifacts are processed)
            const builtInUsedTools = await this.extractBuiltInUsedTools(response, []);
            if (!humanInput && response.tool_calls && response.tool_calls.length > 0) {
                const result = await this.handleToolCalls({
                    response,
                    messages,
                    toolsInstance,
                    sseStreamer,
                    chatId,
                    input,
                    options,
                    abortController,
                    llmNodeInstance,
                    isStreamable,
                    isLastNode,
                    iterationContext
                });
                response = result.response;
                usedTools = result.usedTools;
                sourceDocuments = result.sourceDocuments;
                artifacts = result.artifacts;
                additionalTokens = result.totalTokens;
                isWaitingForHumanInput = result.isWaitingForHumanInput || false;
                // Calculate which messages were added during tool calls
                _toolCallMessages = messages.slice(messagesBeforeToolCalls.length);
                // Stream additional data if this is the last node
                if (isLastNode && sseStreamer) {
                    if (usedTools.length > 0) {
                        sseStreamer.streamUsedToolsEvent(chatId, (0, lodash_1.flatten)(usedTools));
                    }
                    if (sourceDocuments.length > 0) {
                        sseStreamer.streamSourceDocumentsEvent(chatId, (0, lodash_1.flatten)(sourceDocuments));
                    }
                    if (artifacts.length > 0) {
                        sseStreamer.streamArtifactsEvent(chatId, (0, lodash_1.flatten)(artifacts));
                    }
                }
            }
            else if (!humanInput && !isStreamable && isLastNode && sseStreamer) {
                // Stream whole response back to UI if not streaming and no tool calls
                let finalResponse = '';
                if (response.content && Array.isArray(response.content)) {
                    finalResponse = response.content.map((item) => item.text).join('\n');
                }
                else if (response.content && typeof response.content === 'string') {
                    finalResponse = response.content;
                }
                else {
                    finalResponse = JSON.stringify(response, null, 2);
                }
                sseStreamer.streamTokenEvent(chatId, finalResponse);
            }
            // Calculate execution time
            const endTime = Date.now();
            const timeDelta = endTime - startTime;
            // Update flow state if needed
            let newState = { ...state };
            if (_agentUpdateState && Array.isArray(_agentUpdateState) && _agentUpdateState.length > 0) {
                newState = (0, utils_1.updateFlowState)(state, _agentUpdateState);
            }
            // Clean up empty inputs
            for (const key in nodeData.inputs) {
                if (nodeData.inputs[key] === '') {
                    delete nodeData.inputs[key];
                }
            }
            // Prepare final response and output object
            let finalResponse = '';
            if (response.content && Array.isArray(response.content)) {
                finalResponse = response.content.map((item) => item.text).join('\n');
            }
            else if (response.content && typeof response.content === 'string') {
                finalResponse = response.content;
            }
            else {
                finalResponse = JSON.stringify(response, null, 2);
            }
            // Address built in tools
            const additionalBuiltInUsedTools = await this.extractBuiltInUsedTools(response, builtInUsedTools);
            if (additionalBuiltInUsedTools.length > 0) {
                usedTools = [...new Set([...usedTools, ...additionalBuiltInUsedTools])];
                // Stream used tools if this is the last node
                if (isLastNode && sseStreamer) {
                    sseStreamer.streamUsedToolsEvent(chatId, (0, lodash_1.flatten)(usedTools));
                }
            }
            // Extract artifacts from annotations in response metadata
            if (response.response_metadata) {
                const { artifacts: extractedArtifacts, fileAnnotations: extractedFileAnnotations } = await this.extractArtifactsFromResponse(response.response_metadata, newNodeData, options);
                if (extractedArtifacts.length > 0) {
                    artifacts = [...artifacts, ...extractedArtifacts];
                    // Stream artifacts if this is the last node
                    if (isLastNode && sseStreamer) {
                        sseStreamer.streamArtifactsEvent(chatId, extractedArtifacts);
                    }
                }
                if (extractedFileAnnotations.length > 0) {
                    fileAnnotations = [...fileAnnotations, ...extractedFileAnnotations];
                    // Stream file annotations if this is the last node
                    if (isLastNode && sseStreamer) {
                        sseStreamer.streamFileAnnotationsEvent(chatId, fileAnnotations);
                    }
                }
            }
            // Replace sandbox links with proper download URLs. Example: [Download the script](sandbox:/mnt/data/dummy_bar_graph.py)
            if (finalResponse.includes('sandbox:/')) {
                finalResponse = await this.processSandboxLinks(finalResponse, options.baseURL, options.chatflowid, chatId);
            }
            const output = this.prepareOutputObject(response, availableTools, finalResponse, startTime, endTime, timeDelta, usedTools, sourceDocuments, artifacts, additionalTokens, isWaitingForHumanInput, fileAnnotations);
            // End analytics tracking
            if (analyticHandlers && llmIds) {
                await analyticHandlers.onLLMEnd(llmIds, finalResponse);
            }
            // Send additional streaming events if needed
            if (isStreamable) {
                this.sendStreamingEvents(options, chatId, response);
            }
            // Stream file annotations if any were extracted
            if (fileAnnotations.length > 0 && isLastNode && sseStreamer) {
                sseStreamer.streamFileAnnotationsEvent(chatId, fileAnnotations);
            }
            // Process template variables in state
            newState = (0, utils_2.processTemplateVariables)(newState, finalResponse);
            // Replace the actual messages array with one that includes the file references for images instead of base64 data
            const messagesWithFileReferences = (0, utils_1.replaceBase64ImagesWithFileReferences)(messages, runtimeImageMessagesWithFileRef, pastImageMessagesWithFileRef);
            // Only add to runtime chat history if this is the first node
            const inputMessages = [];
            if (!runtimeChatHistory.length) {
                if (runtimeImageMessagesWithFileRef.length) {
                    inputMessages.push(...runtimeImageMessagesWithFileRef);
                }
                if (input && typeof input === 'string') {
                    if (!enableMemory) {
                        if (!agentMessages.some((msg) => msg.role === 'user')) {
                            inputMessages.push({ role: 'user', content: input });
                        }
                        else {
                            agentMessages.map((msg) => {
                                if (msg.role === 'user') {
                                    inputMessages.push({ role: 'user', content: msg.content });
                                }
                            });
                        }
                    }
                    else {
                        inputMessages.push({ role: 'user', content: input });
                    }
                }
            }
            const returnResponseAs = nodeData.inputs?.agentReturnResponseAs;
            let returnRole = 'user';
            if (returnResponseAs === 'assistantMessage') {
                returnRole = 'assistant';
            }
            // Prepare and return the final output
            return {
                id: nodeData.id,
                name: this.name,
                input: {
                    messages: messagesWithFileReferences,
                    ...nodeData.inputs
                },
                output,
                state: newState,
                chatHistory: [
                    ...inputMessages,
                    // Add the messages that were specifically added during tool calls, this enable other nodes to see the full tool call history, temporaraily disabled
                    // ...toolCallMessages,
                    // End with the final assistant response
                    {
                        role: returnRole,
                        content: finalResponse,
                        name: nodeData?.label ? nodeData?.label.toLowerCase().replace(/\s/g, '_').trim() : nodeData?.id,
                        ...(((artifacts && artifacts.length > 0) ||
                            (fileAnnotations && fileAnnotations.length > 0) ||
                            (usedTools && usedTools.length > 0)) && {
                            additional_kwargs: {
                                ...(artifacts && artifacts.length > 0 && { artifacts }),
                                ...(fileAnnotations && fileAnnotations.length > 0 && { fileAnnotations }),
                                ...(usedTools && usedTools.length > 0 && { usedTools })
                            }
                        })
                    }
                ]
            };
        }
        catch (error) {
            if (options.analyticHandlers && llmIds) {
                await options.analyticHandlers.onLLMError(llmIds, error instanceof Error ? error.message : String(error));
            }
            if (error instanceof Error && error.message === 'Aborted') {
                throw error;
            }
            throw new Error(`Error in Agent node: ${error instanceof Error ? error.message : String(error)}`);
        }
    }
    /**
     * Extracts built-in used tools from response metadata and processes image generation results
     */
    async extractBuiltInUsedTools(response, builtInUsedTools = []) {
        if (!response.response_metadata) {
            return builtInUsedTools;
        }
        const { output, tools, groundingMetadata, urlContextMetadata } = response.response_metadata;
        // Handle OpenAI built-in tools
        if (output && Array.isArray(output) && output.length > 0 && tools && Array.isArray(tools) && tools.length > 0) {
            for (const outputItem of output) {
                if (outputItem.type && outputItem.type.endsWith('_call')) {
                    let toolInput = outputItem.action ?? outputItem.code;
                    let toolOutput = outputItem.status === 'completed' ? 'Success' : outputItem.status;
                    // Handle image generation calls specially
                    if (outputItem.type === 'image_generation_call') {
                        // Create input summary for image generation
                        toolInput = {
                            prompt: outputItem.revised_prompt || 'Image generation request',
                            size: outputItem.size || '1024x1024',
                            quality: outputItem.quality || 'standard',
                            output_format: outputItem.output_format || 'png'
                        };
                        // Check if image has been processed (base64 replaced with file path)
                        if (outputItem.result && !outputItem.result.startsWith('data:') && !outputItem.result.includes('base64')) {
                            toolOutput = `Image generated and saved`;
                        }
                        else {
                            toolOutput = `Image generated (base64)`;
                        }
                    }
                    // Remove "_call" suffix to get the base tool name
                    const baseToolName = outputItem.type.replace('_call', '');
                    // Find matching tool that includes the base name in its type
                    const matchingTool = tools.find((tool) => tool.type && tool.type.includes(baseToolName));
                    if (matchingTool) {
                        // Check for duplicates
                        if (builtInUsedTools.find((tool) => tool.tool === matchingTool.type)) {
                            continue;
                        }
                        builtInUsedTools.push({
                            tool: matchingTool.type,
                            toolInput,
                            toolOutput
                        });
                    }
                }
            }
        }
        // Handle Gemini googleSearch tool
        if (groundingMetadata && groundingMetadata.webSearchQueries && Array.isArray(groundingMetadata.webSearchQueries)) {
            // Check for duplicates
            if (!builtInUsedTools.find((tool) => tool.tool === 'googleSearch')) {
                builtInUsedTools.push({
                    tool: 'googleSearch',
                    toolInput: {
                        queries: groundingMetadata.webSearchQueries
                    },
                    toolOutput: `Searched for: ${groundingMetadata.webSearchQueries.join(', ')}`
                });
            }
        }
        // Handle Gemini urlContext tool
        if (urlContextMetadata && urlContextMetadata.urlMetadata && Array.isArray(urlContextMetadata.urlMetadata)) {
            // Check for duplicates
            if (!builtInUsedTools.find((tool) => tool.tool === 'urlContext')) {
                builtInUsedTools.push({
                    tool: 'urlContext',
                    toolInput: {
                        urlMetadata: urlContextMetadata.urlMetadata
                    },
                    toolOutput: `Processed ${urlContextMetadata.urlMetadata.length} URL(s)`
                });
            }
        }
        return builtInUsedTools;
    }
    /**
     * Saves base64 image data to storage and returns file information
     */
    async saveBase64Image(outputItem, options) {
        try {
            if (!outputItem.result) {
                return null;
            }
            // Extract base64 data and create buffer
            const base64Data = outputItem.result;
            const imageBuffer = Buffer.from(base64Data, 'base64');
            // Determine file extension and MIME type
            const outputFormat = outputItem.output_format || 'png';
            const fileName = `generated_image_${outputItem.id || Date.now()}.${outputFormat}`;
            const mimeType = outputFormat === 'png' ? 'image/png' : 'image/jpeg';
            // Save the image using the existing storage utility
            const { path, totalSize } = await (0, storageUtils_1.addSingleFileToStorage)(mimeType, imageBuffer, fileName, options.orgId, options.chatflowid, options.chatId);
            return { filePath: path, fileName, totalSize };
        }
        catch (error) {
            console.error('Error saving base64 image:', error);
            return null;
        }
    }
    /**
     * Handles memory management based on the specified memory type
     */
    async handleMemory({ messages, memoryType, pastChatHistory, runtimeChatHistory, llmNodeInstance, nodeData, userMessage, input, abortController, options, modelConfig, runtimeImageMessagesWithFileRef, pastImageMessagesWithFileRef }) {
        const { updatedPastMessages, transformedPastMessages } = await (0, utils_1.getPastChatHistoryImageMessages)(pastChatHistory, options);
        pastChatHistory = updatedPastMessages;
        pastImageMessagesWithFileRef.push(...transformedPastMessages);
        let pastMessages = [...pastChatHistory, ...runtimeChatHistory];
        if (!runtimeChatHistory.length && input && typeof input === 'string') {
            /*
             * If this is the first node:
             * - Add images to messages if exist
             * - Add user message
             */
            if (options.uploads) {
                const imageContents = await (0, utils_1.getUniqueImageMessages)(options, messages, modelConfig);
                if (imageContents) {
                    const { imageMessageWithBase64, imageMessageWithFileRef } = imageContents;
                    pastMessages.push(imageMessageWithBase64);
                    runtimeImageMessagesWithFileRef.push(imageMessageWithFileRef);
                }
            }
            pastMessages.push({
                role: 'user',
                content: input
            });
        }
        const { updatedMessages, transformedMessages } = await (0, utils_1.processMessagesWithImages)(pastMessages, options);
        pastMessages = updatedMessages;
        pastImageMessagesWithFileRef.push(...transformedMessages);
        if (pastMessages.length > 0) {
            if (memoryType === 'windowSize') {
                // Window memory: Keep the last N messages
                const windowSize = nodeData.inputs?.agentMemoryWindowSize;
                const windowedMessages = pastMessages.slice(-windowSize * 2);
                messages.push(...windowedMessages);
            }
            else if (memoryType === 'conversationSummary') {
                // Summary memory: Summarize all past messages
                const summary = await llmNodeInstance.invoke([
                    {
                        role: 'user',
                        content: prompt_1.DEFAULT_SUMMARIZER_TEMPLATE.replace('{conversation}', pastMessages.map((msg) => `${msg.role}: ${msg.content}`).join('\n'))
                    }
                ], { signal: abortController?.signal });
                messages.push({ role: 'assistant', content: summary.content });
            }
            else if (memoryType === 'conversationSummaryBuffer') {
                // Summary buffer: Summarize messages that exceed token limit
                await this.handleSummaryBuffer(messages, pastMessages, llmNodeInstance, nodeData, abortController);
            }
            else {
                // Default: Use all messages
                messages.push(...pastMessages);
            }
        }
        // Add user message
        if (userMessage) {
            messages.push({
                role: 'user',
                content: userMessage
            });
        }
    }
    /**
     * Handles conversation summary buffer memory type
     */
    async handleSummaryBuffer(messages, pastMessages, llmNodeInstance, nodeData, abortController) {
        const maxTokenLimit = nodeData.inputs?.agentMemoryMaxTokenLimit || 2000;
        // Convert past messages to a format suitable for token counting
        const messagesString = pastMessages.map((msg) => `${msg.role}: ${msg.content}`).join('\n');
        const tokenCount = await llmNodeInstance.getNumTokens(messagesString);
        if (tokenCount > maxTokenLimit) {
            // Calculate how many messages to summarize (messages that exceed the token limit)
            let currBufferLength = tokenCount;
            const messagesToSummarize = [];
            const remainingMessages = [...pastMessages];
            // Remove messages from the beginning until we're under the token limit
            while (currBufferLength > maxTokenLimit && remainingMessages.length > 0) {
                const poppedMessage = remainingMessages.shift();
                if (poppedMessage) {
                    messagesToSummarize.push(poppedMessage);
                    // Recalculate token count for remaining messages
                    const remainingMessagesString = remainingMessages.map((msg) => `${msg.role}: ${msg.content}`).join('\n');
                    currBufferLength = await llmNodeInstance.getNumTokens(remainingMessagesString);
                }
            }
            // Summarize the messages that were removed
            const messagesToSummarizeString = messagesToSummarize.map((msg) => `${msg.role}: ${msg.content}`).join('\n');
            const summary = await llmNodeInstance.invoke([
                {
                    role: 'user',
                    content: prompt_1.DEFAULT_SUMMARIZER_TEMPLATE.replace('{conversation}', messagesToSummarizeString)
                }
            ], { signal: abortController?.signal });
            // Add summary as a system message at the beginning, then add remaining messages
            messages.push({ role: 'system', content: `Previous conversation summary: ${summary.content}` });
            messages.push(...remainingMessages);
        }
        else {
            // If under token limit, use all messages
            messages.push(...pastMessages);
        }
    }
    /**
     * Handles streaming response from the LLM
     */
    async handleStreamingResponse(sseStreamer, llmNodeInstance, messages, chatId, abortController) {
        let response = new messages_1.AIMessageChunk('');
        try {
            for await (const chunk of await llmNodeInstance.stream(messages, { signal: abortController?.signal })) {
                if (sseStreamer) {
                    let content = '';
                    if (Array.isArray(chunk.content) && chunk.content.length > 0) {
                        const contents = chunk.content;
                        content = contents.map((item) => item.text).join('');
                    }
                    else {
                        content = chunk.content.toString();
                    }
                    sseStreamer.streamTokenEvent(chatId, content);
                }
                response = response.concat(chunk);
            }
        }
        catch (error) {
            console.error('Error during streaming:', error);
            throw error;
        }
        if (Array.isArray(response.content) && response.content.length > 0) {
            const responseContents = response.content;
            response.content = responseContents.map((item) => item.text).join('');
        }
        return response;
    }
    /**
     * Prepares the output object with response and metadata
     */
    prepareOutputObject(response, availableTools, finalResponse, startTime, endTime, timeDelta, usedTools, sourceDocuments, artifacts, additionalTokens = 0, isWaitingForHumanInput = false, fileAnnotations = []) {
        const output = {
            content: finalResponse,
            timeMetadata: {
                start: startTime,
                end: endTime,
                delta: timeDelta
            }
        };
        if (response.tool_calls) {
            output.calledTools = response.tool_calls;
        }
        // Include token usage metadata with accumulated tokens from tool calls
        if (response.usage_metadata) {
            const originalTokens = response.usage_metadata.total_tokens || 0;
            output.usageMetadata = {
                ...response.usage_metadata,
                total_tokens: originalTokens + additionalTokens,
                tool_call_tokens: additionalTokens
            };
        }
        else if (additionalTokens > 0) {
            // If no original usage metadata but we have tool tokens
            output.usageMetadata = {
                total_tokens: additionalTokens,
                tool_call_tokens: additionalTokens
            };
        }
        if (response.response_metadata) {
            output.responseMetadata = response.response_metadata;
        }
        // Add used tools, source documents and artifacts to output
        if (usedTools && usedTools.length > 0) {
            output.usedTools = (0, lodash_1.flatten)(usedTools);
        }
        if (sourceDocuments && sourceDocuments.length > 0) {
            output.sourceDocuments = (0, lodash_1.flatten)(sourceDocuments);
        }
        if (artifacts && artifacts.length > 0) {
            output.artifacts = (0, lodash_1.flatten)(artifacts);
        }
        if (availableTools && availableTools.length > 0) {
            output.availableTools = availableTools;
        }
        if (isWaitingForHumanInput) {
            output.isWaitingForHumanInput = isWaitingForHumanInput;
        }
        if (fileAnnotations && fileAnnotations.length > 0) {
            output.fileAnnotations = fileAnnotations;
        }
        return output;
    }
    /**
     * Sends additional streaming events for tool calls and metadata
     */
    sendStreamingEvents(options, chatId, response) {
        const sseStreamer = options.sseStreamer;
        if (response.tool_calls) {
            sseStreamer.streamCalledToolsEvent(chatId, response.tool_calls);
        }
        if (response.usage_metadata) {
            sseStreamer.streamUsageMetadataEvent(chatId, response.usage_metadata);
        }
        sseStreamer.streamEndEvent(chatId);
    }
    /**
     * Handles tool calls and their responses, with support for recursive tool calling
     */
    async handleToolCalls({ response, messages, toolsInstance, sseStreamer, chatId, input, options, abortController, llmNodeInstance, isStreamable, isLastNode, iterationContext }) {
        // Track total tokens used throughout this process
        let totalTokens = response.usage_metadata?.total_tokens || 0;
        const usedTools = [];
        let sourceDocuments = [];
        let artifacts = [];
        let isWaitingForHumanInput;
        if (!response.tool_calls || response.tool_calls.length === 0) {
            return { response, usedTools: [], sourceDocuments: [], artifacts: [], totalTokens };
        }
        // Stream tool calls if available
        if (sseStreamer) {
            sseStreamer.streamCalledToolsEvent(chatId, JSON.stringify(response.tool_calls));
        }
        // Remove tool calls with no id
        const toBeRemovedToolCalls = [];
        for (let i = 0; i < response.tool_calls.length; i++) {
            const toolCall = response.tool_calls[i];
            if (!toolCall.id) {
                toBeRemovedToolCalls.push(toolCall);
                usedTools.push({
                    tool: toolCall.name || 'tool',
                    toolInput: toolCall.args,
                    toolOutput: response.content
                });
            }
        }
        for (const toolCall of toBeRemovedToolCalls) {
            response.tool_calls.splice(response.tool_calls.indexOf(toolCall), 1);
        }
        // Add LLM response with tool calls to messages
        messages.push({
            id: response.id,
            role: 'assistant',
            content: response.content,
            tool_calls: response.tool_calls,
            usage_metadata: response.usage_metadata
        });
        // Process each tool call
        for (let i = 0; i < response.tool_calls.length; i++) {
            const toolCall = response.tool_calls[i];
            const selectedTool = toolsInstance.find((tool) => tool.name === toolCall.name);
            if (selectedTool) {
                let parsedDocs;
                let parsedArtifacts;
                let isToolRequireHumanInput = selectedTool.requiresHumanInput && (!iterationContext || Object.keys(iterationContext).length === 0);
                const flowConfig = {
                    chatflowId: options.chatflowid,
                    sessionId: options.sessionId,
                    chatId: options.chatId,
                    input: input,
                    state: options.agentflowRuntime?.state
                };
                if (isToolRequireHumanInput) {
                    const toolCallDetails = '```json\n' + JSON.stringify(toolCall, null, 2) + '\n```';
                    const responseContent = response.content + `\nAttempting to use tool:\n${toolCallDetails}`;
                    response.content = responseContent;
                    sseStreamer?.streamTokenEvent(chatId, responseContent);
                    return { response, usedTools, sourceDocuments, artifacts, totalTokens, isWaitingForHumanInput: true };
                }
                let toolIds;
                if (options.analyticHandlers) {
                    toolIds = await options.analyticHandlers.onToolStart(toolCall.name, toolCall.args, options.parentTraceIds);
                }
                try {
                    //@ts-ignore
                    let toolOutput = await selectedTool.call(toolCall.args, { signal: abortController?.signal }, undefined, flowConfig);
                    if (options.analyticHandlers && toolIds) {
                        await options.analyticHandlers.onToolEnd(toolIds, toolOutput);
                    }
                    // Extract source documents if present
                    if (typeof toolOutput === 'string' && toolOutput.includes(agents_1.SOURCE_DOCUMENTS_PREFIX)) {
                        const [output, docs] = toolOutput.split(agents_1.SOURCE_DOCUMENTS_PREFIX);
                        toolOutput = output;
                        try {
                            parsedDocs = JSON.parse(docs);
                            sourceDocuments.push(parsedDocs);
                        }
                        catch (e) {
                            console.error('Error parsing source documents from tool:', e);
                        }
                    }
                    // Extract artifacts if present
                    if (typeof toolOutput === 'string' && toolOutput.includes(agents_1.ARTIFACTS_PREFIX)) {
                        const [output, artifact] = toolOutput.split(agents_1.ARTIFACTS_PREFIX);
                        toolOutput = output;
                        try {
                            parsedArtifacts = JSON.parse(artifact);
                            artifacts.push(parsedArtifacts);
                        }
                        catch (e) {
                            console.error('Error parsing artifacts from tool:', e);
                        }
                    }
                    let toolInput;
                    if (typeof toolOutput === 'string' && toolOutput.includes(agents_1.TOOL_ARGS_PREFIX)) {
                        const [output, args] = toolOutput.split(agents_1.TOOL_ARGS_PREFIX);
                        toolOutput = output;
                        try {
                            toolInput = JSON.parse(args);
                        }
                        catch (e) {
                            console.error('Error parsing tool input from tool:', e);
                        }
                    }
                    // Add tool message to conversation
                    messages.push({
                        role: 'tool',
                        content: toolOutput,
                        tool_call_id: toolCall.id,
                        name: toolCall.name,
                        additional_kwargs: {
                            artifacts: parsedArtifacts,
                            sourceDocuments: parsedDocs
                        }
                    });
                    // Track used tools
                    usedTools.push({
                        tool: toolCall.name,
                        toolInput: toolInput ?? toolCall.args,
                        toolOutput
                    });
                }
                catch (e) {
                    if (options.analyticHandlers && toolIds) {
                        await options.analyticHandlers.onToolEnd(toolIds, e);
                    }
                    console.error('Error invoking tool:', e);
                    const errMsg = (0, error_1.getErrorMessage)(e);
                    let toolInput = toolCall.args;
                    if (typeof errMsg === 'string' && errMsg.includes(agents_1.TOOL_ARGS_PREFIX)) {
                        const [_, args] = errMsg.split(agents_1.TOOL_ARGS_PREFIX);
                        try {
                            toolInput = JSON.parse(args);
                        }
                        catch (e) {
                            console.error('Error parsing tool input from tool:', e);
                        }
                    }
                    usedTools.push({
                        tool: selectedTool.name,
                        toolInput,
                        toolOutput: '',
                        error: (0, error_1.getErrorMessage)(e)
                    });
                    sseStreamer?.streamUsedToolsEvent(chatId, (0, lodash_1.flatten)(usedTools));
                    throw new Error((0, error_1.getErrorMessage)(e));
                }
            }
        }
        // Return direct tool output if there's exactly one tool with returnDirect
        if (response.tool_calls.length === 1) {
            const selectedTool = toolsInstance.find((tool) => tool.name === response.tool_calls?.[0]?.name);
            if (selectedTool && selectedTool.returnDirect) {
                const lastToolOutput = usedTools[0]?.toolOutput || '';
                const lastToolOutputString = typeof lastToolOutput === 'string' ? lastToolOutput : JSON.stringify(lastToolOutput, null, 2);
                if (sseStreamer) {
                    sseStreamer.streamTokenEvent(chatId, lastToolOutputString);
                }
                return {
                    response: new messages_1.AIMessageChunk(lastToolOutputString),
                    usedTools,
                    sourceDocuments,
                    artifacts,
                    totalTokens
                };
            }
        }
        if (response.tool_calls.length === 0) {
            const responseContent = typeof response.content === 'string' ? response.content : JSON.stringify(response.content, null, 2);
            return {
                response: new messages_1.AIMessageChunk(responseContent),
                usedTools,
                sourceDocuments,
                artifacts,
                totalTokens
            };
        }
        // Get LLM response after tool calls
        let newResponse;
        if (isStreamable) {
            newResponse = await this.handleStreamingResponse(sseStreamer, llmNodeInstance, messages, chatId, abortController);
        }
        else {
            newResponse = await llmNodeInstance.invoke(messages, { signal: abortController?.signal });
            // Stream non-streaming response if this is the last node
            if (isLastNode && sseStreamer) {
                let responseContent = JSON.stringify(newResponse, null, 2);
                if (typeof newResponse.content === 'string') {
                    responseContent = newResponse.content;
                }
                sseStreamer.streamTokenEvent(chatId, responseContent);
            }
        }
        // Add tokens from this response
        if (newResponse.usage_metadata?.total_tokens) {
            totalTokens += newResponse.usage_metadata.total_tokens;
        }
        // Check for recursive tool calls and handle them
        if (newResponse.tool_calls && newResponse.tool_calls.length > 0) {
            const { response: recursiveResponse, usedTools: recursiveUsedTools, sourceDocuments: recursiveSourceDocuments, artifacts: recursiveArtifacts, totalTokens: recursiveTokens, isWaitingForHumanInput: recursiveIsWaitingForHumanInput } = await this.handleToolCalls({
                response: newResponse,
                messages,
                toolsInstance,
                sseStreamer,
                chatId,
                input,
                options,
                abortController,
                llmNodeInstance,
                isStreamable,
                isLastNode,
                iterationContext
            });
            // Merge results from recursive tool calls
            newResponse = recursiveResponse;
            usedTools.push(...recursiveUsedTools);
            sourceDocuments = [...sourceDocuments, ...recursiveSourceDocuments];
            artifacts = [...artifacts, ...recursiveArtifacts];
            totalTokens += recursiveTokens;
            isWaitingForHumanInput = recursiveIsWaitingForHumanInput;
        }
        return { response: newResponse, usedTools, sourceDocuments, artifacts, totalTokens, isWaitingForHumanInput };
    }
    /**
     * Handles tool calls and their responses, with support for recursive tool calling
     */
    async handleResumedToolCalls({ humanInput, humanInputAction, messages, toolsInstance, sseStreamer, chatId, input, options, abortController, llmWithoutToolsBind, isStreamable, isLastNode, iterationContext }) {
        let llmNodeInstance = llmWithoutToolsBind;
        const usedTools = [];
        let sourceDocuments = [];
        let artifacts = [];
        let isWaitingForHumanInput;
        const lastCheckpointMessages = humanInputAction?.data?.input?.messages ?? [];
        if (!lastCheckpointMessages.length) {
            return { response: new messages_1.AIMessageChunk(''), usedTools: [], sourceDocuments: [], artifacts: [], totalTokens: 0 };
        }
        // Use the last message as the response
        const response = lastCheckpointMessages[lastCheckpointMessages.length - 1];
        // Replace messages array
        messages.length = 0;
        messages.push(...lastCheckpointMessages.slice(0, lastCheckpointMessages.length - 1));
        // Track total tokens used throughout this process
        let totalTokens = response.usage_metadata?.total_tokens || 0;
        if (!response.tool_calls || response.tool_calls.length === 0) {
            return { response, usedTools: [], sourceDocuments: [], artifacts: [], totalTokens };
        }
        // Stream tool calls if available
        if (sseStreamer) {
            sseStreamer.streamCalledToolsEvent(chatId, JSON.stringify(response.tool_calls));
        }
        // Remove tool calls with no id
        const toBeRemovedToolCalls = [];
        for (let i = 0; i < response.tool_calls.length; i++) {
            const toolCall = response.tool_calls[i];
            if (!toolCall.id) {
                toBeRemovedToolCalls.push(toolCall);
                usedTools.push({
                    tool: toolCall.name || 'tool',
                    toolInput: toolCall.args,
                    toolOutput: response.content
                });
            }
        }
        for (const toolCall of toBeRemovedToolCalls) {
            response.tool_calls.splice(response.tool_calls.indexOf(toolCall), 1);
        }
        // Add LLM response with tool calls to messages
        messages.push({
            id: response.id,
            role: 'assistant',
            content: response.content,
            tool_calls: response.tool_calls,
            usage_metadata: response.usage_metadata
        });
        // Process each tool call
        for (let i = 0; i < response.tool_calls.length; i++) {
            const toolCall = response.tool_calls[i];
            const selectedTool = toolsInstance.find((tool) => tool.name === toolCall.name);
            if (selectedTool) {
                let parsedDocs;
                let parsedArtifacts;
                const flowConfig = {
                    chatflowId: options.chatflowid,
                    sessionId: options.sessionId,
                    chatId: options.chatId,
                    input: input,
                    state: options.agentflowRuntime?.state
                };
                if (humanInput.type === 'reject') {
                    messages.pop();
                    const toBeRemovedTool = toolsInstance.find((tool) => tool.name === toolCall.name);
                    if (toBeRemovedTool) {
                        toolsInstance = toolsInstance.filter((tool) => tool.name !== toolCall.name);
                        // Remove other tools with the same agentSelectedTool such as MCP tools
                        toolsInstance = toolsInstance.filter((tool) => tool.agentSelectedTool !== toBeRemovedTool.agentSelectedTool);
                    }
                }
                if (humanInput.type === 'proceed') {
                    let toolIds;
                    if (options.analyticHandlers) {
                        toolIds = await options.analyticHandlers.onToolStart(toolCall.name, toolCall.args, options.parentTraceIds);
                    }
                    try {
                        //@ts-ignore
                        let toolOutput = await selectedTool.call(toolCall.args, { signal: abortController?.signal }, undefined, flowConfig);
                        if (options.analyticHandlers && toolIds) {
                            await options.analyticHandlers.onToolEnd(toolIds, toolOutput);
                        }
                        // Extract source documents if present
                        if (typeof toolOutput === 'string' && toolOutput.includes(agents_1.SOURCE_DOCUMENTS_PREFIX)) {
                            const [output, docs] = toolOutput.split(agents_1.SOURCE_DOCUMENTS_PREFIX);
                            toolOutput = output;
                            try {
                                parsedDocs = JSON.parse(docs);
                                sourceDocuments.push(parsedDocs);
                            }
                            catch (e) {
                                console.error('Error parsing source documents from tool:', e);
                            }
                        }
                        // Extract artifacts if present
                        if (typeof toolOutput === 'string' && toolOutput.includes(agents_1.ARTIFACTS_PREFIX)) {
                            const [output, artifact] = toolOutput.split(agents_1.ARTIFACTS_PREFIX);
                            toolOutput = output;
                            try {
                                parsedArtifacts = JSON.parse(artifact);
                                artifacts.push(parsedArtifacts);
                            }
                            catch (e) {
                                console.error('Error parsing artifacts from tool:', e);
                            }
                        }
                        let toolInput;
                        if (typeof toolOutput === 'string' && toolOutput.includes(agents_1.TOOL_ARGS_PREFIX)) {
                            const [output, args] = toolOutput.split(agents_1.TOOL_ARGS_PREFIX);
                            toolOutput = output;
                            try {
                                toolInput = JSON.parse(args);
                            }
                            catch (e) {
                                console.error('Error parsing tool input from tool:', e);
                            }
                        }
                        // Add tool message to conversation
                        messages.push({
                            role: 'tool',
                            content: toolOutput,
                            tool_call_id: toolCall.id,
                            name: toolCall.name,
                            additional_kwargs: {
                                artifacts: parsedArtifacts,
                                sourceDocuments: parsedDocs
                            }
                        });
                        // Track used tools
                        usedTools.push({
                            tool: toolCall.name,
                            toolInput: toolInput ?? toolCall.args,
                            toolOutput
                        });
                    }
                    catch (e) {
                        if (options.analyticHandlers && toolIds) {
                            await options.analyticHandlers.onToolEnd(toolIds, e);
                        }
                        console.error('Error invoking tool:', e);
                        const errMsg = (0, error_1.getErrorMessage)(e);
                        let toolInput = toolCall.args;
                        if (typeof errMsg === 'string' && errMsg.includes(agents_1.TOOL_ARGS_PREFIX)) {
                            const [_, args] = errMsg.split(agents_1.TOOL_ARGS_PREFIX);
                            try {
                                toolInput = JSON.parse(args);
                            }
                            catch (e) {
                                console.error('Error parsing tool input from tool:', e);
                            }
                        }
                        usedTools.push({
                            tool: selectedTool.name,
                            toolInput,
                            toolOutput: '',
                            error: (0, error_1.getErrorMessage)(e)
                        });
                        sseStreamer?.streamUsedToolsEvent(chatId, (0, lodash_1.flatten)(usedTools));
                        throw new Error((0, error_1.getErrorMessage)(e));
                    }
                }
            }
        }
        // Return direct tool output if there's exactly one tool with returnDirect
        if (response.tool_calls.length === 1) {
            const selectedTool = toolsInstance.find((tool) => tool.name === response.tool_calls?.[0]?.name);
            if (selectedTool && selectedTool.returnDirect) {
                const lastToolOutput = usedTools[0]?.toolOutput || '';
                const lastToolOutputString = typeof lastToolOutput === 'string' ? lastToolOutput : JSON.stringify(lastToolOutput, null, 2);
                if (sseStreamer) {
                    sseStreamer.streamTokenEvent(chatId, lastToolOutputString);
                }
                return {
                    response: new messages_1.AIMessageChunk(lastToolOutputString),
                    usedTools,
                    sourceDocuments,
                    artifacts,
                    totalTokens
                };
            }
        }
        // Get LLM response after tool calls
        let newResponse;
        if (llmNodeInstance && llmNodeInstance.builtInTools && llmNodeInstance.builtInTools.length > 0) {
            toolsInstance.push(...llmNodeInstance.builtInTools);
        }
        if (llmNodeInstance && toolsInstance.length > 0) {
            if (llmNodeInstance.bindTools === undefined) {
                throw new Error(`Agent needs to have a function calling capable models.`);
            }
            // @ts-ignore
            llmNodeInstance = llmNodeInstance.bindTools(toolsInstance);
        }
        if (isStreamable) {
            newResponse = await this.handleStreamingResponse(sseStreamer, llmNodeInstance, messages, chatId, abortController);
        }
        else {
            newResponse = await llmNodeInstance.invoke(messages, { signal: abortController?.signal });
            // Stream non-streaming response if this is the last node
            if (isLastNode && sseStreamer) {
                let responseContent = JSON.stringify(newResponse, null, 2);
                if (typeof newResponse.content === 'string') {
                    responseContent = newResponse.content;
                }
                sseStreamer.streamTokenEvent(chatId, responseContent);
            }
        }
        // Add tokens from this response
        if (newResponse.usage_metadata?.total_tokens) {
            totalTokens += newResponse.usage_metadata.total_tokens;
        }
        // Check for recursive tool calls and handle them
        if (newResponse.tool_calls && newResponse.tool_calls.length > 0) {
            const { response: recursiveResponse, usedTools: recursiveUsedTools, sourceDocuments: recursiveSourceDocuments, artifacts: recursiveArtifacts, totalTokens: recursiveTokens, isWaitingForHumanInput: recursiveIsWaitingForHumanInput } = await this.handleToolCalls({
                response: newResponse,
                messages,
                toolsInstance,
                sseStreamer,
                chatId,
                input,
                options,
                abortController,
                llmNodeInstance,
                isStreamable,
                isLastNode,
                iterationContext
            });
            // Merge results from recursive tool calls
            newResponse = recursiveResponse;
            usedTools.push(...recursiveUsedTools);
            sourceDocuments = [...sourceDocuments, ...recursiveSourceDocuments];
            artifacts = [...artifacts, ...recursiveArtifacts];
            totalTokens += recursiveTokens;
            isWaitingForHumanInput = recursiveIsWaitingForHumanInput;
        }
        return { response: newResponse, usedTools, sourceDocuments, artifacts, totalTokens, isWaitingForHumanInput };
    }
    /**
     * Extracts artifacts from response metadata (both annotations and built-in tools)
     */
    async extractArtifactsFromResponse(responseMetadata, modelNodeData, options) {
        const artifacts = [];
        const fileAnnotations = [];
        if (!responseMetadata?.output || !Array.isArray(responseMetadata.output)) {
            return { artifacts, fileAnnotations };
        }
        for (const outputItem of responseMetadata.output) {
            // Handle container file citations from annotations
            if (outputItem.type === 'message' && outputItem.content && Array.isArray(outputItem.content)) {
                for (const contentItem of outputItem.content) {
                    if (contentItem.annotations && Array.isArray(contentItem.annotations)) {
                        for (const annotation of contentItem.annotations) {
                            if (annotation.type === 'container_file_citation' && annotation.file_id && annotation.filename) {
                                try {
                                    // Download and store the file content
                                    const downloadResult = await this.downloadContainerFile(annotation.container_id, annotation.file_id, annotation.filename, modelNodeData, options);
                                    if (downloadResult) {
                                        const fileType = this.getArtifactTypeFromFilename(annotation.filename);
                                        if (fileType === 'png' || fileType === 'jpeg' || fileType === 'jpg') {
                                            const artifact = {
                                                type: fileType,
                                                data: downloadResult.filePath
                                            };
                                            artifacts.push(artifact);
                                        }
                                        else {
                                            fileAnnotations.push({
                                                filePath: downloadResult.filePath,
                                                fileName: annotation.filename
                                            });
                                        }
                                    }
                                }
                                catch (error) {
                                    console.error('Error processing annotation:', error);
                                }
                            }
                        }
                    }
                }
            }
            // Handle built-in tool artifacts (like image generation)
            if (outputItem.type === 'image_generation_call' && outputItem.result) {
                try {
                    const savedImageResult = await this.saveBase64Image(outputItem, options);
                    if (savedImageResult) {
                        // Replace the base64 result with the file path in the response metadata
                        outputItem.result = savedImageResult.filePath;
                        // Create artifact in the same format as other image artifacts
                        const fileType = this.getArtifactTypeFromFilename(savedImageResult.fileName);
                        artifacts.push({
                            type: fileType,
                            data: savedImageResult.filePath
                        });
                    }
                }
                catch (error) {
                    console.error('Error processing image generation artifact:', error);
                }
            }
        }
        return { artifacts, fileAnnotations };
    }
    /**
     * Downloads file content from container file citation
     */
    async downloadContainerFile(containerId, fileId, filename, modelNodeData, options) {
        try {
            const credentialData = await (0, utils_2.getCredentialData)(modelNodeData.credential ?? '', options);
            const openAIApiKey = (0, utils_2.getCredentialParam)('openAIApiKey', credentialData, modelNodeData);
            if (!openAIApiKey) {
                console.warn('No OpenAI API key available for downloading container file');
                return null;
            }
            // Download the file using OpenAI Container API
            const response = await (0, node_fetch_1.default)(`https://api.openai.com/v1/containers/${containerId}/files/${fileId}/content`, {
                method: 'GET',
                headers: {
                    Accept: '*/*',
                    Authorization: `Bearer ${openAIApiKey}`
                }
            });
            if (!response.ok) {
                console.warn(`Failed to download container file ${fileId} from container ${containerId}: ${response.status} ${response.statusText}`);
                return null;
            }
            // Extract the binary data from the Response object
            const data = await response.arrayBuffer();
            const dataBuffer = Buffer.from(data);
            const mimeType = this.getMimeTypeFromFilename(filename);
            // Store the file using the same storage utility as OpenAIAssistant
            const { path, totalSize } = await (0, storageUtils_1.addSingleFileToStorage)(mimeType, dataBuffer, filename, options.orgId, options.chatflowid, options.chatId);
            return { filePath: path, totalSize };
        }
        catch (error) {
            console.error('Error downloading container file:', error);
            return null;
        }
    }
    /**
     * Gets MIME type from filename extension
     */
    getMimeTypeFromFilename(filename) {
        const extension = filename.toLowerCase().split('.').pop();
        const mimeTypes = {
            png: 'image/png',
            jpg: 'image/jpeg',
            jpeg: 'image/jpeg',
            gif: 'image/gif',
            pdf: 'application/pdf',
            txt: 'text/plain',
            csv: 'text/csv',
            json: 'application/json',
            html: 'text/html',
            xml: 'application/xml'
        };
        return mimeTypes[extension || ''] || 'application/octet-stream';
    }
    /**
     * Gets artifact type from filename extension for UI rendering
     */
    getArtifactTypeFromFilename(filename) {
        const extension = filename.toLowerCase().split('.').pop();
        const artifactTypes = {
            png: 'png',
            jpg: 'jpeg',
            jpeg: 'jpeg',
            html: 'html',
            htm: 'html',
            md: 'markdown',
            markdown: 'markdown',
            json: 'json',
            js: 'javascript',
            javascript: 'javascript',
            tex: 'latex',
            latex: 'latex',
            txt: 'text',
            csv: 'text',
            pdf: 'text'
        };
        return artifactTypes[extension || ''] || 'text';
    }
    /**
     * Processes sandbox links in the response text and converts them to file annotations
     */
    async processSandboxLinks(text, baseURL, chatflowId, chatId) {
        let processedResponse = text;
        // Regex to match sandbox links: [text](sandbox:/path/to/file)
        const sandboxLinkRegex = /\[([^\]]+)\]\(sandbox:\/([^)]+)\)/g;
        const matches = Array.from(text.matchAll(sandboxLinkRegex));
        for (const match of matches) {
            const fullMatch = match[0];
            const linkText = match[1];
            const filePath = match[2];
            try {
                // Extract filename from the file path
                const fileName = filePath.split('/').pop() || filePath;
                // Replace sandbox link with proper download URL
                const downloadUrl = `${baseURL}/api/v1/get-upload-file?chatflowId=${chatflowId}&chatId=${chatId}&fileName=${fileName}&download=true`;
                const newLink = `[${linkText}](${downloadUrl})`;
                processedResponse = processedResponse.replace(fullMatch, newLink);
            }
            catch (error) {
                console.error('Error processing sandbox link:', error);
                // If there's an error, remove the sandbox link as fallback
                processedResponse = processedResponse.replace(fullMatch, linkText);
            }
        }
        return processedResponse;
    }
}
module.exports = { nodeClass: Agent_Agentflow };
//# sourceMappingURL=Agent.js.map