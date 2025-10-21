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
Object.defineProperty(exports, "__esModule", { value: true });
const messages_1 = require("@langchain/core/messages");
const prompt_1 = require("../prompt");
const zod_1 = require("zod");
const utils_1 = require("../utils");
const utils_2 = require("../../../src/utils");
class LLM_Agentflow {
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
            async listRuntimeStateKeys(_, options) {
                const previousNodes = options.previousNodes;
                const startAgentflowNode = previousNodes.find((node) => node.name === 'startAgentflow');
                const state = startAgentflowNode?.inputs?.startState;
                return state.map((item) => ({ label: item.key, name: item.key }));
            }
        };
        this.label = 'LLM';
        this.name = 'llmAgentflow';
        this.version = 1.0;
        this.type = 'LLM';
        this.category = 'Agent Flows';
        this.description = 'Large language models to analyze user-provided inputs and generate responses';
        this.color = '#64B5F6';
        this.baseClasses = [this.type];
        this.inputs = [
            {
                label: 'Model',
                name: 'llmModel',
                type: 'asyncOptions',
                loadMethod: 'listModels',
                loadConfig: true
            },
            {
                label: 'Messages',
                name: 'llmMessages',
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
                label: 'Enable Memory',
                name: 'llmEnableMemory',
                type: 'boolean',
                description: 'Enable memory for the conversation thread',
                default: true,
                optional: true
            },
            {
                label: 'Memory Type',
                name: 'llmMemoryType',
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
                    llmEnableMemory: true
                }
            },
            {
                label: 'Window Size',
                name: 'llmMemoryWindowSize',
                type: 'number',
                default: '20',
                description: 'Uses a fixed window size to surface the last N messages',
                show: {
                    llmMemoryType: 'windowSize'
                }
            },
            {
                label: 'Max Token Limit',
                name: 'llmMemoryMaxTokenLimit',
                type: 'number',
                default: '2000',
                description: 'Summarize conversations once token limit is reached. Default to 2000',
                show: {
                    llmMemoryType: 'conversationSummaryBuffer'
                }
            },
            {
                label: 'Input Message',
                name: 'llmUserMessage',
                type: 'string',
                description: 'Add an input message as user message at the end of the conversation',
                rows: 4,
                optional: true,
                acceptVariable: true,
                show: {
                    llmEnableMemory: true
                }
            },
            {
                label: 'Return Response As',
                name: 'llmReturnResponseAs',
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
                label: 'JSON Structured Output',
                name: 'llmStructuredOutput',
                description: 'Instruct the LLM to give output in a JSON structured schema',
                type: 'array',
                optional: true,
                acceptVariable: true,
                array: [
                    {
                        label: 'Key',
                        name: 'key',
                        type: 'string'
                    },
                    {
                        label: 'Type',
                        name: 'type',
                        type: 'options',
                        options: [
                            {
                                label: 'String',
                                name: 'string'
                            },
                            {
                                label: 'String Array',
                                name: 'stringArray'
                            },
                            {
                                label: 'Number',
                                name: 'number'
                            },
                            {
                                label: 'Boolean',
                                name: 'boolean'
                            },
                            {
                                label: 'Enum',
                                name: 'enum'
                            },
                            {
                                label: 'JSON Array',
                                name: 'jsonArray'
                            }
                        ]
                    },
                    {
                        label: 'Enum Values',
                        name: 'enumValues',
                        type: 'string',
                        placeholder: 'value1, value2, value3',
                        description: 'Enum values. Separated by comma',
                        optional: true,
                        show: {
                            'llmStructuredOutput[$index].type': 'enum'
                        }
                    },
                    {
                        label: 'JSON Schema',
                        name: 'jsonSchema',
                        type: 'code',
                        placeholder: `{
    "answer": {
        "type": "string",
        "description": "Value of the answer"
    },
    "reason": {
        "type": "string",
        "description": "Reason for the answer"
    },
    "optional": {
        "type": "boolean"
    },
    "count": {
        "type": "number"
    },
    "children": {
        "type": "array",
        "items": {
            "type": "object",
            "properties": {
                "value": {
                    "type": "string",
                    "description": "Value of the children's answer"
                }
            }
        }
    }
}`,
                        description: 'JSON schema for the structured output',
                        optional: true,
                        hideCodeExecute: true,
                        show: {
                            'llmStructuredOutput[$index].type': 'jsonArray'
                        }
                    },
                    {
                        label: 'Description',
                        name: 'description',
                        type: 'string',
                        placeholder: 'Description of the key'
                    }
                ]
            },
            {
                label: 'Update Flow State',
                name: 'llmUpdateState',
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
            const model = nodeData.inputs?.llmModel;
            const modelConfig = nodeData.inputs?.llmModelConfig;
            if (!model) {
                throw new Error('Model is required');
            }
            // Extract memory and configuration options
            const enableMemory = nodeData.inputs?.llmEnableMemory;
            const memoryType = nodeData.inputs?.llmMemoryType;
            const userMessage = nodeData.inputs?.llmUserMessage;
            const _llmUpdateState = nodeData.inputs?.llmUpdateState;
            const _llmStructuredOutput = nodeData.inputs?.llmStructuredOutput;
            const llmMessages = nodeData.inputs?.llmMessages ?? [];
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
            let llmNodeInstance = (await newLLMNodeInstance.init(newNodeData, '', options));
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
            for (const msg of llmMessages) {
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
                 * - Add user message if it does not exist in the llmMessages array
                 */
                if (options.uploads) {
                    const imageContents = await (0, utils_1.getUniqueImageMessages)(options, messages, modelConfig);
                    if (imageContents) {
                        const { imageMessageWithBase64, imageMessageWithFileRef } = imageContents;
                        messages.push(imageMessageWithBase64);
                        runtimeImageMessagesWithFileRef.push(imageMessageWithFileRef);
                    }
                }
                if (input && typeof input === 'string' && !llmMessages.some((msg) => msg.role === 'user')) {
                    messages.push({
                        role: 'user',
                        content: input
                    });
                }
            }
            delete nodeData.inputs?.llmMessages;
            // Configure structured output if specified
            const isStructuredOutput = _llmStructuredOutput && Array.isArray(_llmStructuredOutput) && _llmStructuredOutput.length > 0;
            if (isStructuredOutput) {
                llmNodeInstance = this.configureStructuredOutput(llmNodeInstance, _llmStructuredOutput);
            }
            // Initialize response and determine if streaming is possible
            let response = new messages_1.AIMessageChunk('');
            const isLastNode = options.isLastNode;
            const isStreamable = isLastNode && options.sseStreamer !== undefined && modelConfig?.streaming !== false && !isStructuredOutput;
            // Start analytics
            if (analyticHandlers && options.parentTraceIds) {
                const llmLabel = options?.componentNodes?.[model]?.label || model;
                llmIds = await analyticHandlers.onLLMStart(llmLabel, messages, options.parentTraceIds);
            }
            // Track execution time
            const startTime = Date.now();
            const sseStreamer = options.sseStreamer;
            if (isStreamable) {
                response = await this.handleStreamingResponse(sseStreamer, llmNodeInstance, messages, chatId, abortController);
            }
            else {
                response = await llmNodeInstance.invoke(messages, { signal: abortController?.signal });
                // Stream whole response back to UI if this is the last node
                if (isLastNode && options.sseStreamer) {
                    const sseStreamer = options.sseStreamer;
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
            }
            // Calculate execution time
            const endTime = Date.now();
            const timeDelta = endTime - startTime;
            // Update flow state if needed
            let newState = { ...state };
            if (_llmUpdateState && Array.isArray(_llmUpdateState) && _llmUpdateState.length > 0) {
                newState = (0, utils_1.updateFlowState)(state, _llmUpdateState);
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
            const output = this.prepareOutputObject(response, finalResponse, startTime, endTime, timeDelta, isStructuredOutput);
            // End analytics tracking
            if (analyticHandlers && llmIds) {
                await analyticHandlers.onLLMEnd(llmIds, finalResponse);
            }
            // Send additional streaming events if needed
            if (isStreamable) {
                this.sendStreamingEvents(options, chatId, response);
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
                        if (!llmMessages.some((msg) => msg.role === 'user')) {
                            inputMessages.push({ role: 'user', content: input });
                        }
                        else {
                            llmMessages.map((msg) => {
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
            const returnResponseAs = nodeData.inputs?.llmReturnResponseAs;
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
                    // LLM response
                    {
                        role: returnRole,
                        content: finalResponse,
                        name: nodeData?.label ? nodeData?.label.toLowerCase().replace(/\s/g, '_').trim() : nodeData?.id
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
            throw new Error(`Error in LLM node: ${error instanceof Error ? error.message : String(error)}`);
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
                const windowSize = nodeData.inputs?.llmMemoryWindowSize;
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
        const maxTokenLimit = nodeData.inputs?.llmMemoryMaxTokenLimit || 2000;
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
     * Configures structured output for the LLM
     */
    configureStructuredOutput(llmNodeInstance, llmStructuredOutput) {
        try {
            const zodObj = {};
            for (const sch of llmStructuredOutput) {
                if (sch.type === 'string') {
                    zodObj[sch.key] = zod_1.z.string().describe(sch.description || '');
                }
                else if (sch.type === 'stringArray') {
                    zodObj[sch.key] = zod_1.z.array(zod_1.z.string()).describe(sch.description || '');
                }
                else if (sch.type === 'number') {
                    zodObj[sch.key] = zod_1.z.number().describe(sch.description || '');
                }
                else if (sch.type === 'boolean') {
                    zodObj[sch.key] = zod_1.z.boolean().describe(sch.description || '');
                }
                else if (sch.type === 'enum') {
                    const enumValues = sch.enumValues?.split(',').map((item) => item.trim()) || [];
                    zodObj[sch.key] = zod_1.z
                        .enum(enumValues.length ? enumValues : ['default'])
                        .describe(sch.description || '');
                }
                else if (sch.type === 'jsonArray') {
                    const jsonSchema = sch.jsonSchema;
                    if (jsonSchema) {
                        try {
                            // Parse the JSON schema
                            const schemaObj = JSON.parse(jsonSchema);
                            // Create a Zod schema from the JSON schema
                            const itemSchema = this.createZodSchemaFromJSON(schemaObj);
                            // Create an array schema of the item schema
                            zodObj[sch.key] = zod_1.z.array(itemSchema).describe(sch.description || '');
                        }
                        catch (err) {
                            console.error(`Error parsing JSON schema for ${sch.key}:`, err);
                            // Fallback to generic array of records
                            zodObj[sch.key] = zod_1.z.array(zod_1.z.record(zod_1.z.any())).describe(sch.description || '');
                        }
                    }
                    else {
                        // If no schema provided, use generic array of records
                        zodObj[sch.key] = zod_1.z.array(zod_1.z.record(zod_1.z.any())).describe(sch.description || '');
                    }
                }
            }
            const structuredOutput = zod_1.z.object(zodObj);
            // @ts-ignore
            return llmNodeInstance.withStructuredOutput(structuredOutput);
        }
        catch (exception) {
            console.error(exception);
            return llmNodeInstance;
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
    prepareOutputObject(response, finalResponse, startTime, endTime, timeDelta, isStructuredOutput) {
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
        if (response.usage_metadata) {
            output.usageMetadata = response.usage_metadata;
        }
        if (isStructuredOutput && typeof response === 'object') {
            const structuredOutput = response;
            for (const key in structuredOutput) {
                if (structuredOutput[key] !== undefined && structuredOutput[key] !== null) {
                    output[key] = structuredOutput[key];
                }
            }
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
     * Creates a Zod schema from a JSON schema object
     * @param jsonSchema The JSON schema object
     * @returns A Zod schema
     */
    createZodSchemaFromJSON(jsonSchema) {
        // If the schema is an object with properties, create an object schema
        if (typeof jsonSchema === 'object' && jsonSchema !== null) {
            const schemaObj = {};
            // Process each property in the schema
            for (const [key, value] of Object.entries(jsonSchema)) {
                if (value === null) {
                    // Handle null values
                    schemaObj[key] = zod_1.z.null();
                }
                else if (typeof value === 'object' && !Array.isArray(value)) {
                    // Check if the property has a type definition
                    if ('type' in value) {
                        const type = value.type;
                        const description = ('description' in value ? value.description : '') || '';
                        // Create the appropriate Zod type based on the type property
                        if (type === 'string') {
                            schemaObj[key] = zod_1.z.string().describe(description);
                        }
                        else if (type === 'number') {
                            schemaObj[key] = zod_1.z.number().describe(description);
                        }
                        else if (type === 'boolean') {
                            schemaObj[key] = zod_1.z.boolean().describe(description);
                        }
                        else if (type === 'array') {
                            // If it's an array type, check if items is defined
                            if ('items' in value && value.items) {
                                const itemSchema = this.createZodSchemaFromJSON(value.items);
                                schemaObj[key] = zod_1.z.array(itemSchema).describe(description);
                            }
                            else {
                                // Default to array of any if items not specified
                                schemaObj[key] = zod_1.z.array(zod_1.z.any()).describe(description);
                            }
                        }
                        else if (type === 'object') {
                            // If it's an object type, check if properties is defined
                            if ('properties' in value && value.properties) {
                                const nestedSchema = this.createZodSchemaFromJSON(value.properties);
                                schemaObj[key] = nestedSchema.describe(description);
                            }
                            else {
                                // Default to record of any if properties not specified
                                schemaObj[key] = zod_1.z.record(zod_1.z.any()).describe(description);
                            }
                        }
                        else {
                            // Default to any for unknown types
                            schemaObj[key] = zod_1.z.any().describe(description);
                        }
                        // Check if the property is optional
                        if ('optional' in value && value.optional === true) {
                            schemaObj[key] = schemaObj[key].optional();
                        }
                    }
                    else if (Array.isArray(value)) {
                        // Array values without a type property
                        if (value.length > 0) {
                            // If the array has items, recursively create a schema for the first item
                            const itemSchema = this.createZodSchemaFromJSON(value[0]);
                            schemaObj[key] = zod_1.z.array(itemSchema);
                        }
                        else {
                            // Empty array, allow any array
                            schemaObj[key] = zod_1.z.array(zod_1.z.any());
                        }
                    }
                    else {
                        // It's a nested object without a type property, recursively create schema
                        schemaObj[key] = this.createZodSchemaFromJSON(value);
                    }
                }
                else if (Array.isArray(value)) {
                    // Array values
                    if (value.length > 0) {
                        // If the array has items, recursively create a schema for the first item
                        const itemSchema = this.createZodSchemaFromJSON(value[0]);
                        schemaObj[key] = zod_1.z.array(itemSchema);
                    }
                    else {
                        // Empty array, allow any array
                        schemaObj[key] = zod_1.z.array(zod_1.z.any());
                    }
                }
                else {
                    // For primitive values (which shouldn't be in the schema directly)
                    // Use the corresponding Zod type
                    if (typeof value === 'string') {
                        schemaObj[key] = zod_1.z.string();
                    }
                    else if (typeof value === 'number') {
                        schemaObj[key] = zod_1.z.number();
                    }
                    else if (typeof value === 'boolean') {
                        schemaObj[key] = zod_1.z.boolean();
                    }
                    else {
                        schemaObj[key] = zod_1.z.any();
                    }
                }
            }
            return zod_1.z.object(schemaObj);
        }
        // Fallback to any for unknown types
        return zod_1.z.any();
    }
}
module.exports = { nodeClass: LLM_Agentflow };
//# sourceMappingURL=LLM.js.map