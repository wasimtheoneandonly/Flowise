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
exports.updateFlowState = exports.getPastChatHistoryImageMessages = exports.getUniqueImageMessages = exports.replaceBase64ImagesWithFileReferences = exports.processMessagesWithImages = exports.addImagesToMessages = void 0;
const multiModalUtils_1 = require("../../src/multiModalUtils");
const storageUtils_1 = require("../../src/storageUtils");
const utils_1 = require("../../src/utils");
const addImagesToMessages = async (options, allowImageUploads, imageResolution) => {
    const imageContent = [];
    if (allowImageUploads && options?.uploads && options?.uploads.length > 0) {
        const imageUploads = (0, multiModalUtils_1.getImageUploads)(options.uploads);
        for (const upload of imageUploads) {
            let bf = upload.data;
            if (upload.type == 'stored-file') {
                const contents = await (0, storageUtils_1.getFileFromStorage)(upload.name, options.orgId, options.chatflowid, options.chatId);
                // as the image is stored in the server, read the file and convert it to base64
                bf = 'data:' + upload.mime + ';base64,' + contents.toString('base64');
                imageContent.push({
                    type: 'image_url',
                    image_url: {
                        url: bf,
                        detail: imageResolution ?? 'low'
                    }
                });
            }
            else if (upload.type == 'url' && bf) {
                imageContent.push({
                    type: 'image_url',
                    image_url: {
                        url: bf,
                        detail: imageResolution ?? 'low'
                    }
                });
            }
        }
    }
    return imageContent;
};
exports.addImagesToMessages = addImagesToMessages;
/**
 * Process message array to replace stored file references with base64 image data
 * @param messages Array of messages that may contain image references
 * @param options Common options object containing chatflowid and chatId
 * @returns Object containing updated messages array and transformed original messages
 */
const processMessagesWithImages = async (messages, options) => {
    if (!messages || !options.chatflowid || !options.chatId) {
        return {
            updatedMessages: messages,
            transformedMessages: []
        };
    }
    // Create a deep copy of the messages to avoid mutating the original
    const updatedMessages = JSON.parse(JSON.stringify(messages));
    // Track which messages were transformed
    const transformedMessages = [];
    // Scan through all messages looking for stored-file references
    for (let i = 0; i < updatedMessages.length; i++) {
        const message = updatedMessages[i];
        // Skip non-user messages or messages without content
        if (message.role !== 'user' || !message.content) {
            continue;
        }
        // Handle array content (typically containing file references)
        if (Array.isArray(message.content)) {
            const imageContents = [];
            let hasImageReferences = false;
            // Process each content item
            for (const item of message.content) {
                // Look for stored-file type items
                if (item.type === 'stored-file' && item.name && item.mime.startsWith('image/')) {
                    hasImageReferences = true;
                    try {
                        // Get file contents from storage
                        const contents = await (0, storageUtils_1.getFileFromStorage)(item.name, options.orgId, options.chatflowid, options.chatId);
                        // Create base64 data URL
                        const base64Data = 'data:' + item.mime + ';base64,' + contents.toString('base64');
                        // Add to image content array
                        imageContents.push({
                            type: 'image_url',
                            image_url: {
                                url: base64Data,
                                detail: item.imageResolution ?? 'low'
                            }
                        });
                    }
                    catch (error) {
                        console.error(`Failed to load image ${item.name}:`, error);
                    }
                }
            }
            // Replace the content with the image content array
            if (imageContents.length > 0) {
                // Store the original message before modifying
                if (hasImageReferences) {
                    transformedMessages.push(JSON.parse(JSON.stringify(messages[i])));
                }
                updatedMessages[i].content = imageContents;
            }
        }
    }
    return {
        updatedMessages,
        transformedMessages
    };
};
exports.processMessagesWithImages = processMessagesWithImages;
/**
 * Replace base64 image data in messages with file references
 * @param messages Array of messages that may contain base64 image data
 * @param uniqueImageMessages Array of messages with file references for new images
 * @param pastImageMessages Array of messages with file references for previous images
 * @returns Updated messages array with file references instead of base64 data
 */
const replaceBase64ImagesWithFileReferences = (messages, uniqueImageMessages = [], pastImageMessages = []) => {
    // Create a deep copy to avoid mutating the original
    const updatedMessages = JSON.parse(JSON.stringify(messages));
    // Track positions in replacement arrays
    let pastMessageIndex = 0;
    let pastContentIndex = 0;
    let uniqueMessageIndex = 0;
    let uniqueContentIndex = 0;
    for (let i = 0; i < updatedMessages.length; i++) {
        const message = updatedMessages[i];
        if (message.content && Array.isArray(message.content)) {
            for (let j = 0; j < message.content.length; j++) {
                const item = message.content[j];
                if (item.type === 'image_url') {
                    // Try past images first
                    let replacement = null;
                    if (pastMessageIndex < pastImageMessages.length) {
                        const pastMessage = pastImageMessages[pastMessageIndex];
                        if (pastMessage && Array.isArray(pastMessage.content)) {
                            if (pastContentIndex < pastMessage.content.length) {
                                replacement = pastMessage.content[pastContentIndex];
                                pastContentIndex++;
                                // Move to next message if we've used all content in current one
                                if (pastContentIndex >= pastMessage.content.length) {
                                    pastMessageIndex++;
                                    pastContentIndex = 0;
                                }
                            }
                            else {
                                // Current message has no more content, move to next
                                pastMessageIndex++;
                                pastContentIndex = 0;
                                // Try again with the next message
                                if (pastMessageIndex < pastImageMessages.length) {
                                    const nextPastMessage = pastImageMessages[pastMessageIndex];
                                    if (nextPastMessage && Array.isArray(nextPastMessage.content) && nextPastMessage.content.length > 0) {
                                        replacement = nextPastMessage.content[0];
                                        pastContentIndex = 1;
                                    }
                                }
                            }
                        }
                    }
                    // Try unique images if no past image replacement found
                    if (!replacement && uniqueMessageIndex < uniqueImageMessages.length) {
                        const uniqueMessage = uniqueImageMessages[uniqueMessageIndex];
                        if (uniqueMessage && Array.isArray(uniqueMessage.content)) {
                            if (uniqueContentIndex < uniqueMessage.content.length) {
                                replacement = uniqueMessage.content[uniqueContentIndex];
                                uniqueContentIndex++;
                                // Move to next message if we've used all content in current one
                                if (uniqueContentIndex >= uniqueMessage.content.length) {
                                    uniqueMessageIndex++;
                                    uniqueContentIndex = 0;
                                }
                            }
                            else {
                                // Current message has no more content, move to next
                                uniqueMessageIndex++;
                                uniqueContentIndex = 0;
                                // Try again with the next message
                                if (uniqueMessageIndex < uniqueImageMessages.length) {
                                    const nextUniqueMessage = uniqueImageMessages[uniqueMessageIndex];
                                    if (nextUniqueMessage &&
                                        Array.isArray(nextUniqueMessage.content) &&
                                        nextUniqueMessage.content.length > 0) {
                                        replacement = nextUniqueMessage.content[0];
                                        uniqueContentIndex = 1;
                                    }
                                }
                            }
                        }
                    }
                    // Apply replacement if found
                    if (replacement) {
                        message.content[j] = {
                            ...replacement
                        };
                    }
                }
            }
        }
    }
    return updatedMessages;
};
exports.replaceBase64ImagesWithFileReferences = replaceBase64ImagesWithFileReferences;
/**
 * Get unique image messages from uploads
 * @param options Common options object containing uploads
 * @param messages Array of messages to check for existing images
 * @param modelConfig Model configuration object containing allowImageUploads and imageResolution
 * @returns Object containing imageMessageWithFileRef and imageMessageWithBase64
 */
const getUniqueImageMessages = async (options, messages, modelConfig) => {
    if (!options.uploads)
        return undefined;
    // Get images from uploads
    const images = await (0, exports.addImagesToMessages)(options, modelConfig?.allowImageUploads, modelConfig?.imageResolution);
    // Filter out images that are already in previous messages
    const uniqueImages = images.filter((image) => {
        // Check if this image is already in any existing message
        return !messages.some((msg) => {
            // For multimodal content (arrays with image objects)
            if (Array.isArray(msg.content)) {
                return msg.content.some((item) => 
                // Compare by image URL/content for image objects
                item.type === 'image_url' && image.type === 'image_url' && JSON.stringify(item) === JSON.stringify(image));
            }
            // For direct comparison of simple content
            return JSON.stringify(msg.content) === JSON.stringify(image);
        });
    });
    if (uniqueImages.length === 0) {
        return undefined;
    }
    // Create messages with the original file references for storage/display
    const imageMessageWithFileRef = {
        role: 'user',
        content: options.uploads.map((upload) => ({
            type: upload.type,
            name: upload.name,
            mime: upload.mime,
            imageResolution: modelConfig?.imageResolution
        }))
    };
    // Create messages with base64 data for the LLM
    const imageMessageWithBase64 = {
        role: 'user',
        content: uniqueImages
    };
    return {
        imageMessageWithFileRef,
        imageMessageWithBase64
    };
};
exports.getUniqueImageMessages = getUniqueImageMessages;
/**
 * Get past chat history image messages
 * @param pastChatHistory Array of past chat history messages
 * @param options Common options object
 * @returns Object containing updatedPastMessages and transformedPastMessages
 */
const getPastChatHistoryImageMessages = async (pastChatHistory, options) => {
    const chatHistory = [];
    const transformedPastMessages = [];
    for (let i = 0; i < pastChatHistory.length; i++) {
        const message = pastChatHistory[i];
        const messageRole = message.role || 'user';
        if (message.additional_kwargs && message.additional_kwargs.fileUploads) {
            // example: [{"type":"stored-file","name":"0_DiXc4ZklSTo3M8J4.jpg","mime":"image/jpeg"}]
            const fileUploads = message.additional_kwargs.fileUploads;
            const artifacts = message.additional_kwargs.artifacts;
            const fileAnnotations = message.additional_kwargs.fileAnnotations;
            const usedTools = message.additional_kwargs.usedTools;
            try {
                let messageWithFileUploads = '';
                const uploads = typeof fileUploads === 'string' ? JSON.parse(fileUploads) : fileUploads;
                const imageContents = [];
                for (const upload of uploads) {
                    if (upload.type === 'stored-file' && upload.mime.startsWith('image/')) {
                        const fileData = await (0, storageUtils_1.getFileFromStorage)(upload.name, options.orgId, options.chatflowid, options.chatId);
                        // as the image is stored in the server, read the file and convert it to base64
                        const bf = 'data:' + upload.mime + ';base64,' + fileData.toString('base64');
                        imageContents.push({
                            type: 'image_url',
                            image_url: {
                                url: bf
                            }
                        });
                    }
                    else if (upload.type === 'url' && upload.mime.startsWith('image') && upload.data) {
                        imageContents.push({
                            type: 'image_url',
                            image_url: {
                                url: upload.data
                            }
                        });
                    }
                    else if (upload.type === 'stored-file:full') {
                        const fileLoaderNodeModule = await Promise.resolve().then(() => __importStar(require('../../nodes/documentloaders/File/File')));
                        // @ts-ignore
                        const fileLoaderNodeInstance = new fileLoaderNodeModule.nodeClass();
                        const nodeOptions = {
                            retrieveAttachmentChatId: true,
                            chatflowid: options.chatflowid,
                            chatId: options.chatId,
                            orgId: options.orgId
                        };
                        let fileInputFieldFromMimeType = 'txtFile';
                        fileInputFieldFromMimeType = (0, utils_1.mapMimeTypeToInputField)(upload.mime);
                        const nodeData = {
                            inputs: {
                                [fileInputFieldFromMimeType]: `FILE-STORAGE::${JSON.stringify([upload.name])}`
                            }
                        };
                        const documents = await fileLoaderNodeInstance.init(nodeData, '', nodeOptions);
                        messageWithFileUploads += `<doc name='${upload.name}'>${(0, utils_1.handleEscapeCharacters)(documents, true)}</doc>\n\n`;
                    }
                }
                const messageContent = messageWithFileUploads ? `${messageWithFileUploads}\n\n${message.content}` : message.content;
                const hasArtifacts = artifacts && Array.isArray(artifacts) && artifacts.length > 0;
                const hasFileAnnotations = fileAnnotations && Array.isArray(fileAnnotations) && fileAnnotations.length > 0;
                const hasUsedTools = usedTools && Array.isArray(usedTools) && usedTools.length > 0;
                if (imageContents.length > 0) {
                    const imageMessage = {
                        role: messageRole,
                        content: imageContents
                    };
                    if (hasArtifacts || hasFileAnnotations || hasUsedTools) {
                        imageMessage.additional_kwargs = {};
                        if (hasArtifacts)
                            imageMessage.additional_kwargs.artifacts = artifacts;
                        if (hasFileAnnotations)
                            imageMessage.additional_kwargs.fileAnnotations = fileAnnotations;
                        if (hasUsedTools)
                            imageMessage.additional_kwargs.usedTools = usedTools;
                    }
                    chatHistory.push(imageMessage);
                    transformedPastMessages.push({
                        role: messageRole,
                        content: [...JSON.parse(pastChatHistory[i].additional_kwargs.fileUploads)]
                    });
                }
                const contentMessage = {
                    role: messageRole,
                    content: messageContent
                };
                if (hasArtifacts || hasFileAnnotations || hasUsedTools) {
                    contentMessage.additional_kwargs = {};
                    if (hasArtifacts)
                        contentMessage.additional_kwargs.artifacts = artifacts;
                    if (hasFileAnnotations)
                        contentMessage.additional_kwargs.fileAnnotations = fileAnnotations;
                    if (hasUsedTools)
                        contentMessage.additional_kwargs.usedTools = usedTools;
                }
                chatHistory.push(contentMessage);
            }
            catch (e) {
                // failed to parse fileUploads, continue with text only
                const hasArtifacts = artifacts && Array.isArray(artifacts) && artifacts.length > 0;
                const hasFileAnnotations = fileAnnotations && Array.isArray(fileAnnotations) && fileAnnotations.length > 0;
                const hasUsedTools = usedTools && Array.isArray(usedTools) && usedTools.length > 0;
                const errorMessage = {
                    role: messageRole,
                    content: message.content
                };
                if (hasArtifacts || hasFileAnnotations || hasUsedTools) {
                    errorMessage.additional_kwargs = {};
                    if (hasArtifacts)
                        errorMessage.additional_kwargs.artifacts = artifacts;
                    if (hasFileAnnotations)
                        errorMessage.additional_kwargs.fileAnnotations = fileAnnotations;
                    if (hasUsedTools)
                        errorMessage.additional_kwargs.usedTools = usedTools;
                }
                chatHistory.push(errorMessage);
            }
        }
        else if (message.additional_kwargs) {
            const hasArtifacts = message.additional_kwargs.artifacts &&
                Array.isArray(message.additional_kwargs.artifacts) &&
                message.additional_kwargs.artifacts.length > 0;
            const hasFileAnnotations = message.additional_kwargs.fileAnnotations &&
                Array.isArray(message.additional_kwargs.fileAnnotations) &&
                message.additional_kwargs.fileAnnotations.length > 0;
            const hasUsedTools = message.additional_kwargs.usedTools &&
                Array.isArray(message.additional_kwargs.usedTools) &&
                message.additional_kwargs.usedTools.length > 0;
            if (hasArtifacts || hasFileAnnotations || hasUsedTools) {
                const messageAdditionalKwargs = {};
                if (hasArtifacts)
                    messageAdditionalKwargs.artifacts = message.additional_kwargs.artifacts;
                if (hasFileAnnotations)
                    messageAdditionalKwargs.fileAnnotations = message.additional_kwargs.fileAnnotations;
                if (hasUsedTools)
                    messageAdditionalKwargs.usedTools = message.additional_kwargs.usedTools;
                chatHistory.push({
                    role: messageRole,
                    content: message.content,
                    additional_kwargs: messageAdditionalKwargs
                });
            }
            else {
                chatHistory.push({
                    role: messageRole,
                    content: message.content
                });
            }
        }
        else {
            chatHistory.push({
                role: messageRole,
                content: message.content
            });
        }
    }
    return {
        updatedPastMessages: chatHistory,
        transformedPastMessages
    };
};
exports.getPastChatHistoryImageMessages = getPastChatHistoryImageMessages;
/**
 * Updates the flow state with new values
 */
const updateFlowState = (state, updateState) => {
    let newFlowState = {};
    for (const state of updateState) {
        newFlowState[state.key] = state.value;
    }
    return {
        ...state,
        ...newFlowState
    };
};
exports.updateFlowState = updateFlowState;
//# sourceMappingURL=utils.js.map