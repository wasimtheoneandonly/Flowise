"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.createGoogleDocsTools = exports.desc = void 0;
const zod_1 = require("zod");
const node_fetch_1 = __importDefault(require("node-fetch"));
const core_1 = require("../OpenAPIToolkit/core");
const agents_1 = require("../../../src/agents");
exports.desc = `Use this when you want to access Google Docs API for managing documents`;
// Define schemas for different Google Docs operations
// Document Schemas
const CreateDocumentSchema = zod_1.z.object({
    title: zod_1.z.string().describe('Document title'),
    text: zod_1.z.string().optional().describe('Text content to insert after creating document'),
    index: zod_1.z.number().optional().default(1).describe('Index where to insert text or media (1-based, default: 1 for beginning)'),
    imageUrl: zod_1.z.string().optional().describe('URL of the image to insert after creating document'),
    rows: zod_1.z.number().optional().describe('Number of rows in the table to create'),
    columns: zod_1.z.number().optional().describe('Number of columns in the table to create')
});
const GetDocumentSchema = zod_1.z.object({
    documentId: zod_1.z.string().describe('Document ID to retrieve')
});
const UpdateDocumentSchema = zod_1.z.object({
    documentId: zod_1.z.string().describe('Document ID to update'),
    text: zod_1.z.string().optional().describe('Text content to insert'),
    index: zod_1.z.number().optional().default(1).describe('Index where to insert text or media (1-based, default: 1 for beginning)'),
    replaceText: zod_1.z.string().optional().describe('Text to replace'),
    newText: zod_1.z.string().optional().describe('New text to replace with'),
    matchCase: zod_1.z.boolean().optional().default(false).describe('Whether the search should be case-sensitive'),
    imageUrl: zod_1.z.string().optional().describe('URL of the image to insert'),
    rows: zod_1.z.number().optional().describe('Number of rows in the table to create'),
    columns: zod_1.z.number().optional().describe('Number of columns in the table to create')
});
const InsertTextSchema = zod_1.z.object({
    documentId: zod_1.z.string().describe('Document ID'),
    text: zod_1.z.string().describe('Text to insert'),
    index: zod_1.z.number().optional().default(1).describe('Index where to insert text (1-based, default: 1 for beginning)')
});
const ReplaceTextSchema = zod_1.z.object({
    documentId: zod_1.z.string().describe('Document ID'),
    replaceText: zod_1.z.string().describe('Text to replace'),
    newText: zod_1.z.string().describe('New text to replace with'),
    matchCase: zod_1.z.boolean().optional().default(false).describe('Whether the search should be case-sensitive')
});
const AppendTextSchema = zod_1.z.object({
    documentId: zod_1.z.string().describe('Document ID'),
    text: zod_1.z.string().describe('Text to append to the document')
});
const GetTextContentSchema = zod_1.z.object({
    documentId: zod_1.z.string().describe('Document ID to get text content from')
});
const InsertImageSchema = zod_1.z.object({
    documentId: zod_1.z.string().describe('Document ID'),
    imageUrl: zod_1.z.string().describe('URL of the image to insert'),
    index: zod_1.z.number().optional().default(1).describe('Index where to insert image (1-based)')
});
const CreateTableSchema = zod_1.z.object({
    documentId: zod_1.z.string().describe('Document ID'),
    rows: zod_1.z.number().describe('Number of rows in the table'),
    columns: zod_1.z.number().describe('Number of columns in the table'),
    index: zod_1.z.number().optional().default(1).describe('Index where to insert table (1-based)')
});
class BaseGoogleDocsTool extends core_1.DynamicStructuredTool {
    constructor(args) {
        super(args);
        this.accessToken = '';
        this.accessToken = args.accessToken ?? '';
    }
    async makeGoogleDocsRequest({ endpoint, method = 'GET', body, params }) {
        const url = `https://docs.googleapis.com/v1/${endpoint}`;
        const headers = {
            Authorization: `Bearer ${this.accessToken}`,
            'Content-Type': 'application/json',
            Accept: 'application/json',
            ...this.headers
        };
        const response = await (0, node_fetch_1.default)(url, {
            method,
            headers,
            body: body ? JSON.stringify(body) : undefined
        });
        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`Google Docs API Error ${response.status}: ${response.statusText} - ${errorText}`);
        }
        const data = await response.text();
        return data + agents_1.TOOL_ARGS_PREFIX + JSON.stringify(params);
    }
    async makeDriveRequest({ endpoint, method = 'GET', body, params }) {
        const url = `https://www.googleapis.com/drive/v3/${endpoint}`;
        const headers = {
            Authorization: `Bearer ${this.accessToken}`,
            'Content-Type': 'application/json',
            Accept: 'application/json',
            ...this.headers
        };
        const response = await (0, node_fetch_1.default)(url, {
            method,
            headers,
            body: body ? JSON.stringify(body) : undefined
        });
        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`Google Drive API Error ${response.status}: ${response.statusText} - ${errorText}`);
        }
        const data = await response.text();
        return data + agents_1.TOOL_ARGS_PREFIX + JSON.stringify(params);
    }
}
// Document Tools
class CreateDocumentTool extends BaseGoogleDocsTool {
    constructor(args) {
        const toolInput = {
            name: 'create_document',
            description: 'Create a new Google Docs document',
            schema: CreateDocumentSchema,
            baseUrl: '',
            method: 'POST',
            headers: {}
        };
        super({
            ...toolInput,
            accessToken: args.accessToken
        });
        this.defaultParams = args.defaultParams || {};
    }
    async _call(arg) {
        const params = { ...arg, ...this.defaultParams };
        try {
            const documentData = {
                title: params.title
            };
            const endpoint = 'documents';
            const createResponse = await this.makeGoogleDocsRequest({
                endpoint,
                method: 'POST',
                body: documentData,
                params
            });
            // Get the document ID from the response
            const documentResponse = JSON.parse(createResponse.split(agents_1.TOOL_ARGS_PREFIX)[0]);
            const documentId = documentResponse.documentId;
            // Now add content if provided
            const requests = [];
            if (params.text) {
                requests.push({
                    insertText: {
                        location: {
                            index: params.index || 1
                        },
                        text: params.text
                    }
                });
            }
            if (params.imageUrl) {
                requests.push({
                    insertInlineImage: {
                        location: {
                            index: params.index || 1
                        },
                        uri: params.imageUrl
                    }
                });
            }
            if (params.rows && params.columns) {
                requests.push({
                    insertTable: {
                        location: {
                            index: params.index || 1
                        },
                        rows: params.rows,
                        columns: params.columns
                    }
                });
            }
            // If we have content to add, make a batch update
            if (requests.length > 0) {
                const updateEndpoint = `documents/${encodeURIComponent(documentId)}:batchUpdate`;
                await this.makeGoogleDocsRequest({
                    endpoint: updateEndpoint,
                    method: 'POST',
                    body: { requests },
                    params: {}
                });
            }
            return createResponse;
        }
        catch (error) {
            return (0, agents_1.formatToolError)(`Error creating document: ${error}`, params);
        }
    }
}
class GetDocumentTool extends BaseGoogleDocsTool {
    constructor(args) {
        const toolInput = {
            name: 'get_document',
            description: 'Get a Google Docs document by ID',
            schema: GetDocumentSchema,
            baseUrl: '',
            method: 'GET',
            headers: {}
        };
        super({
            ...toolInput,
            accessToken: args.accessToken
        });
        this.defaultParams = args.defaultParams || {};
    }
    async _call(arg) {
        const params = { ...arg, ...this.defaultParams };
        try {
            const endpoint = `documents/${encodeURIComponent(params.documentId)}`;
            const response = await this.makeGoogleDocsRequest({ endpoint, params });
            return response;
        }
        catch (error) {
            return (0, agents_1.formatToolError)(`Error getting document: ${error}`, params);
        }
    }
}
class UpdateDocumentTool extends BaseGoogleDocsTool {
    constructor(args) {
        const toolInput = {
            name: 'update_document',
            description: 'Update a Google Docs document with batch requests',
            schema: UpdateDocumentSchema,
            baseUrl: '',
            method: 'POST',
            headers: {}
        };
        super({
            ...toolInput,
            accessToken: args.accessToken
        });
        this.defaultParams = args.defaultParams || {};
    }
    async _call(arg) {
        const params = { ...arg, ...this.defaultParams };
        try {
            const requests = [];
            // Insert text
            if (params.text) {
                requests.push({
                    insertText: {
                        location: {
                            index: params.index || 1
                        },
                        text: params.text
                    }
                });
            }
            // Replace text
            if (params.replaceText && params.newText) {
                requests.push({
                    replaceAllText: {
                        containsText: {
                            text: params.replaceText,
                            matchCase: params.matchCase || false
                        },
                        replaceText: params.newText
                    }
                });
            }
            // Insert image
            if (params.imageUrl) {
                requests.push({
                    insertInlineImage: {
                        location: {
                            index: params.index || 1
                        },
                        uri: params.imageUrl
                    }
                });
            }
            // Create table
            if (params.rows && params.columns) {
                requests.push({
                    insertTable: {
                        location: {
                            index: params.index || 1
                        },
                        rows: params.rows,
                        columns: params.columns
                    }
                });
            }
            if (requests.length > 0) {
                const endpoint = `documents/${encodeURIComponent(params.documentId)}:batchUpdate`;
                const response = await this.makeGoogleDocsRequest({
                    endpoint,
                    method: 'POST',
                    body: { requests },
                    params
                });
                return response;
            }
            else {
                return `No updates specified` + agents_1.TOOL_ARGS_PREFIX + JSON.stringify(params);
            }
        }
        catch (error) {
            return (0, agents_1.formatToolError)(`Error updating document: ${error}`, params);
        }
    }
}
class InsertTextTool extends BaseGoogleDocsTool {
    constructor(args) {
        const toolInput = {
            name: 'insert_text',
            description: 'Insert text into a Google Docs document',
            schema: InsertTextSchema,
            baseUrl: '',
            method: 'POST',
            headers: {}
        };
        super({
            ...toolInput,
            accessToken: args.accessToken
        });
        this.defaultParams = args.defaultParams || {};
    }
    async _call(arg) {
        const params = { ...arg, ...this.defaultParams };
        try {
            const requests = [
                {
                    insertText: {
                        location: {
                            index: params.index
                        },
                        text: params.text
                    }
                }
            ];
            const endpoint = `documents/${encodeURIComponent(params.documentId)}:batchUpdate`;
            const response = await this.makeGoogleDocsRequest({
                endpoint,
                method: 'POST',
                body: { requests },
                params
            });
            return response;
        }
        catch (error) {
            return (0, agents_1.formatToolError)(`Error inserting text: ${error}`, params);
        }
    }
}
class ReplaceTextTool extends BaseGoogleDocsTool {
    constructor(args) {
        const toolInput = {
            name: 'replace_text',
            description: 'Replace text in a Google Docs document',
            schema: ReplaceTextSchema,
            baseUrl: '',
            method: 'POST',
            headers: {}
        };
        super({
            ...toolInput,
            accessToken: args.accessToken
        });
        this.defaultParams = args.defaultParams || {};
    }
    async _call(arg) {
        const params = { ...arg, ...this.defaultParams };
        try {
            const requests = [
                {
                    replaceAllText: {
                        containsText: {
                            text: params.replaceText,
                            matchCase: params.matchCase
                        },
                        replaceText: params.newText
                    }
                }
            ];
            const endpoint = `documents/${encodeURIComponent(params.documentId)}:batchUpdate`;
            const response = await this.makeGoogleDocsRequest({
                endpoint,
                method: 'POST',
                body: { requests },
                params
            });
            return response;
        }
        catch (error) {
            return (0, agents_1.formatToolError)(`Error replacing text: ${error}`, params);
        }
    }
}
class AppendTextTool extends BaseGoogleDocsTool {
    constructor(args) {
        const toolInput = {
            name: 'append_text',
            description: 'Append text to the end of a Google Docs document',
            schema: AppendTextSchema,
            baseUrl: '',
            method: 'POST',
            headers: {}
        };
        super({
            ...toolInput,
            accessToken: args.accessToken
        });
        this.defaultParams = args.defaultParams || {};
    }
    async _call(arg) {
        const params = { ...arg, ...this.defaultParams };
        try {
            // First get the document to find the end index
            const getEndpoint = `documents/${encodeURIComponent(params.documentId)}`;
            const docResponse = await this.makeGoogleDocsRequest({ endpoint: getEndpoint, params: {} });
            const docData = JSON.parse(docResponse.split(agents_1.TOOL_ARGS_PREFIX)[0]);
            // Get the end index of the document body
            const endIndex = docData.body.content[docData.body.content.length - 1].endIndex - 1;
            const requests = [
                {
                    insertText: {
                        location: {
                            index: endIndex
                        },
                        text: params.text
                    }
                }
            ];
            const endpoint = `documents/${encodeURIComponent(params.documentId)}:batchUpdate`;
            const response = await this.makeGoogleDocsRequest({
                endpoint,
                method: 'POST',
                body: { requests },
                params
            });
            return response;
        }
        catch (error) {
            return (0, agents_1.formatToolError)(`Error appending text: ${error}`, params);
        }
    }
}
class GetTextContentTool extends BaseGoogleDocsTool {
    constructor(args) {
        const toolInput = {
            name: 'get_text_content',
            description: 'Get the text content from a Google Docs document',
            schema: GetTextContentSchema,
            baseUrl: '',
            method: 'GET',
            headers: {}
        };
        super({
            ...toolInput,
            accessToken: args.accessToken
        });
        this.defaultParams = args.defaultParams || {};
    }
    async _call(arg) {
        const params = { ...arg, ...this.defaultParams };
        try {
            const endpoint = `documents/${encodeURIComponent(params.documentId)}`;
            const response = await this.makeGoogleDocsRequest({ endpoint, params });
            // Extract and return just the text content
            const docData = JSON.parse(response.split(agents_1.TOOL_ARGS_PREFIX)[0]);
            let textContent = '';
            const extractText = (element) => {
                if (element.paragraph) {
                    element.paragraph.elements?.forEach((elem) => {
                        if (elem.textRun) {
                            textContent += elem.textRun.content;
                        }
                    });
                }
            };
            docData.body.content?.forEach(extractText);
            return JSON.stringify({ textContent }) + agents_1.TOOL_ARGS_PREFIX + JSON.stringify(params);
        }
        catch (error) {
            return (0, agents_1.formatToolError)(`Error getting text content: ${error}`, params);
        }
    }
}
class InsertImageTool extends BaseGoogleDocsTool {
    constructor(args) {
        const toolInput = {
            name: 'insert_image',
            description: 'Insert an image into a Google Docs document',
            schema: InsertImageSchema,
            baseUrl: '',
            method: 'POST',
            headers: {}
        };
        super({
            ...toolInput,
            accessToken: args.accessToken
        });
        this.defaultParams = args.defaultParams || {};
    }
    async _call(arg) {
        const params = { ...arg, ...this.defaultParams };
        try {
            const requests = [
                {
                    insertInlineImage: {
                        location: {
                            index: params.index
                        },
                        uri: params.imageUrl
                    }
                }
            ];
            const endpoint = `documents/${encodeURIComponent(params.documentId)}:batchUpdate`;
            const response = await this.makeGoogleDocsRequest({
                endpoint,
                method: 'POST',
                body: { requests },
                params
            });
            return response;
        }
        catch (error) {
            return (0, agents_1.formatToolError)(`Error inserting image: ${error}`, params);
        }
    }
}
class CreateTableTool extends BaseGoogleDocsTool {
    constructor(args) {
        const toolInput = {
            name: 'create_table',
            description: 'Create a table in a Google Docs document',
            schema: CreateTableSchema,
            baseUrl: '',
            method: 'POST',
            headers: {}
        };
        super({
            ...toolInput,
            accessToken: args.accessToken
        });
        this.defaultParams = args.defaultParams || {};
    }
    async _call(arg) {
        const params = { ...arg, ...this.defaultParams };
        try {
            const requests = [
                {
                    insertTable: {
                        location: {
                            index: params.index
                        },
                        rows: params.rows,
                        columns: params.columns
                    }
                }
            ];
            const endpoint = `documents/${encodeURIComponent(params.documentId)}:batchUpdate`;
            const response = await this.makeGoogleDocsRequest({
                endpoint,
                method: 'POST',
                body: { requests },
                params
            });
            return response;
        }
        catch (error) {
            return (0, agents_1.formatToolError)(`Error creating table: ${error}`, params);
        }
    }
}
const createGoogleDocsTools = (args) => {
    const actions = args?.actions || [];
    const tools = [];
    if (actions.includes('createDocument') || actions.length === 0) {
        tools.push(new CreateDocumentTool(args));
    }
    if (actions.includes('getDocument') || actions.length === 0) {
        tools.push(new GetDocumentTool(args));
    }
    if (actions.includes('updateDocument') || actions.length === 0) {
        tools.push(new UpdateDocumentTool(args));
    }
    if (actions.includes('insertText') || actions.length === 0) {
        tools.push(new InsertTextTool(args));
    }
    if (actions.includes('replaceText') || actions.length === 0) {
        tools.push(new ReplaceTextTool(args));
    }
    if (actions.includes('appendText') || actions.length === 0) {
        tools.push(new AppendTextTool(args));
    }
    if (actions.includes('getTextContent') || actions.length === 0) {
        tools.push(new GetTextContentTool(args));
    }
    if (actions.includes('insertImage') || actions.length === 0) {
        tools.push(new InsertImageTool(args));
    }
    if (actions.includes('createTable') || actions.length === 0) {
        tools.push(new CreateTableTool(args));
    }
    return tools;
};
exports.createGoogleDocsTools = createGoogleDocsTools;
//# sourceMappingURL=core.js.map