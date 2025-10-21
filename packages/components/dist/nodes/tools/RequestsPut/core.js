"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.RequestsPutTool = exports.desc = void 0;
const zod_1 = require("zod");
const core_1 = require("../OpenAPIToolkit/core");
const httpSecurity_1 = require("../../../src/httpSecurity");
const utils_1 = require("../../../src/utils");
exports.desc = `Use this when you want to execute a PUT request to update or replace a resource.`;
// Base schema for PUT request
const createRequestsPutSchema = (bodySchema) => {
    // If bodySchema is provided, parse it and add dynamic body params
    if (bodySchema) {
        try {
            const parsedSchema = (0, utils_1.parseJsonBody)(bodySchema);
            const bodyParamsObject = {};
            Object.entries(parsedSchema).forEach(([key, config]) => {
                let zodType = zod_1.z.string();
                // Handle different types
                if (config.type === 'number') {
                    zodType = zod_1.z.number();
                }
                else if (config.type === 'boolean') {
                    zodType = zod_1.z.boolean();
                }
                else if (config.type === 'object') {
                    zodType = zod_1.z.record(zod_1.z.any());
                }
                else if (config.type === 'array') {
                    zodType = zod_1.z.array(zod_1.z.any());
                }
                // Add description
                if (config.description) {
                    zodType = zodType.describe(config.description);
                }
                // Make optional if not required
                if (!config.required) {
                    zodType = zodType.optional();
                }
                bodyParamsObject[key] = zodType;
            });
            if (Object.keys(bodyParamsObject).length > 0) {
                return zod_1.z.object({
                    body: zod_1.z.object(bodyParamsObject).describe('Request body parameters')
                });
            }
        }
        catch (error) {
            console.warn('Failed to parse bodySchema:', error);
        }
    }
    // Fallback to generic body
    return zod_1.z.object({
        body: zod_1.z.record(zod_1.z.any()).optional().describe('Optional body data to include in the request')
    });
};
class RequestsPutTool extends core_1.DynamicStructuredTool {
    constructor(args) {
        const schema = createRequestsPutSchema(args?.bodySchema);
        const toolInput = {
            name: args?.name || 'requests_put',
            description: args?.description || exports.desc,
            schema: schema,
            baseUrl: '',
            method: 'PUT',
            headers: args?.headers || {}
        };
        super(toolInput);
        this.url = '';
        this.maxOutputLength = Infinity;
        this.headers = {};
        this.body = {};
        this.url = args?.url ?? this.url;
        this.headers = args?.headers ?? this.headers;
        this.body = args?.body ?? this.body;
        this.maxOutputLength = args?.maxOutputLength ?? this.maxOutputLength;
        this.bodySchema = args?.bodySchema;
    }
    /** @ignore */
    async _call(arg) {
        const params = { ...arg };
        try {
            const inputUrl = this.url;
            if (!inputUrl) {
                throw new Error('URL is required for PUT request');
            }
            let inputBody = {
                ...this.body
            };
            if (this.bodySchema && params.body && Object.keys(params.body).length > 0) {
                inputBody = {
                    ...inputBody,
                    ...params.body
                };
            }
            const requestHeaders = {
                'Content-Type': 'application/json',
                ...(params.headers || {}),
                ...this.headers
            };
            const res = await (0, httpSecurity_1.secureFetch)(inputUrl, {
                method: 'PUT',
                headers: requestHeaders,
                body: JSON.stringify(inputBody)
            });
            if (!res.ok) {
                throw new Error(`HTTP Error ${res.status}: ${res.statusText}`);
            }
            const text = await res.text();
            return text.slice(0, this.maxOutputLength);
        }
        catch (error) {
            throw new Error(`Failed to make PUT request: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }
}
exports.RequestsPutTool = RequestsPutTool;
//# sourceMappingURL=core.js.map