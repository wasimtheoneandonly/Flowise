"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const core_1 = require("../core");
const utils_1 = require("../../../../src/utils");
const object_hash_1 = __importDefault(require("object-hash"));
const mcpServerConfig = `{
    "command": "npx",
    "args": ["-y", "@modelcontextprotocol/server-filesystem", "/path/to/allowed/files"]
}`;
const howToUseCode = `
You can use variables in the MCP Server Config with double curly braces \`{{ }}\` and prefix \`$vars.<variableName>\`. 

For example, you have a variable called "var1":
\`\`\`json
{
    "command": "docker",
    "args": [
        "run",
        "-i",
        "--rm",
        "-e", "API_TOKEN"
    ],
    "env": {
        "API_TOKEN": "{{$vars.var1}}"
    }
}
\`\`\`

For example, when using SSE, you can use the variable "var1" in the headers:
\`\`\`json
{
    "url": "https://api.example.com/endpoint/sse",
    "headers": {
        "Authorization": "Bearer {{$vars.var1}}"
    }
}
\`\`\`
`;
class Custom_MCP {
    constructor() {
        //@ts-ignore
        this.loadMethods = {
            listActions: async (nodeData, options) => {
                try {
                    const toolset = await this.getTools(nodeData, options);
                    toolset.sort((a, b) => a.name.localeCompare(b.name));
                    return toolset.map(({ name, ...rest }) => ({
                        label: name.toUpperCase(),
                        name: name,
                        description: rest.description || name
                    }));
                }
                catch (error) {
                    return [
                        {
                            label: 'No Available Actions',
                            name: 'error',
                            description: 'No available actions, please check your API key and refresh'
                        }
                    ];
                }
            }
        };
        this.label = 'Custom MCP';
        this.name = 'customMCP';
        this.version = 1.1;
        this.type = 'Custom MCP Tool';
        this.icon = 'customMCP.png';
        this.category = 'Tools (MCP)';
        this.description = 'Custom MCP Config';
        this.documentation = 'https://github.com/modelcontextprotocol/servers/tree/main/src/brave-search';
        this.inputs = [
            {
                label: 'MCP Server Config',
                name: 'mcpServerConfig',
                type: 'code',
                hideCodeExecute: true,
                hint: {
                    label: 'How to use',
                    value: howToUseCode
                },
                placeholder: mcpServerConfig,
                warning: process.env.CUSTOM_MCP_PROTOCOL === 'sse'
                    ? 'Only Remote MCP with url is supported. Read more <a href="https://docs.flowiseai.com/tutorials/tools-and-mcp#streamable-http-recommended" target="_blank">here</a>'
                    : undefined
            },
            {
                label: 'Available Actions',
                name: 'mcpActions',
                type: 'asyncMultiOptions',
                loadMethod: 'listActions',
                refresh: true
            }
        ];
        this.baseClasses = ['Tool'];
    }
    async init(nodeData, _, options) {
        const tools = await this.getTools(nodeData, options);
        const _mcpActions = nodeData.inputs?.mcpActions;
        let mcpActions = [];
        if (_mcpActions) {
            try {
                mcpActions = typeof _mcpActions === 'string' ? JSON.parse(_mcpActions) : _mcpActions;
            }
            catch (error) {
                console.error('Error parsing mcp actions:', error);
            }
        }
        return tools.filter((tool) => mcpActions.includes(tool.name));
    }
    async getTools(nodeData, options) {
        const mcpServerConfig = nodeData.inputs?.mcpServerConfig;
        if (!mcpServerConfig) {
            throw new Error('MCP Server Config is required');
        }
        let sandbox = {};
        if (mcpServerConfig.includes('$vars')) {
            const appDataSource = options.appDataSource;
            const databaseEntities = options.databaseEntities;
            const variables = await (0, utils_1.getVars)(appDataSource, databaseEntities, nodeData, options);
            sandbox['$vars'] = (0, utils_1.prepareSandboxVars)(variables);
        }
        const workspaceId = options?.searchOptions?.workspaceId?._value || options?.workspaceId;
        let canonicalConfig;
        try {
            canonicalConfig = JSON.parse(mcpServerConfig);
        }
        catch (e) {
            canonicalConfig = mcpServerConfig;
        }
        const cacheKey = (0, object_hash_1.default)({ workspaceId, canonicalConfig, sandbox });
        if (options.cachePool) {
            const cachedResult = await options.cachePool.getMCPCache(cacheKey);
            if (cachedResult) {
                return cachedResult.tools;
            }
        }
        try {
            let serverParams;
            if (typeof mcpServerConfig === 'object') {
                serverParams = substituteVariablesInObject(mcpServerConfig, sandbox);
            }
            else if (typeof mcpServerConfig === 'string') {
                const substitutedString = substituteVariablesInString(mcpServerConfig, sandbox);
                const serverParamsString = convertToValidJSONString(substitutedString);
                serverParams = JSON.parse(serverParamsString);
            }
            if (process.env.CUSTOM_MCP_SECURITY_CHECK !== 'false') {
                try {
                    (0, core_1.validateMCPServerConfig)(serverParams);
                }
                catch (error) {
                    throw new Error(`Security validation failed: ${error.message}`);
                }
            }
            // Compatible with stdio and SSE
            let toolkit;
            if (process.env.CUSTOM_MCP_PROTOCOL === 'sse') {
                toolkit = new core_1.MCPToolkit(serverParams, 'sse');
            }
            else if (serverParams?.command === undefined) {
                toolkit = new core_1.MCPToolkit(serverParams, 'sse');
            }
            else {
                toolkit = new core_1.MCPToolkit(serverParams, 'stdio');
            }
            await toolkit.initialize();
            const tools = toolkit.tools ?? [];
            if (options.cachePool) {
                await options.cachePool.addMCPCache(cacheKey, { toolkit, tools });
            }
            return tools;
        }
        catch (error) {
            throw new Error(`Invalid MCP Server Config: ${error}`);
        }
    }
}
function substituteVariablesInObject(obj, sandbox) {
    if (typeof obj === 'string') {
        // Replace variables in string values
        return substituteVariablesInString(obj, sandbox);
    }
    else if (Array.isArray(obj)) {
        // Recursively process arrays
        return obj.map((item) => substituteVariablesInObject(item, sandbox));
    }
    else if (obj !== null && typeof obj === 'object') {
        // Recursively process object properties
        const result = {};
        for (const [key, value] of Object.entries(obj)) {
            result[key] = substituteVariablesInObject(value, sandbox);
        }
        return result;
    }
    // Return primitive values as-is
    return obj;
}
function substituteVariablesInString(str, sandbox) {
    // Use regex to find {{$variableName.property}} patterns and replace with sandbox values
    return str.replace(/\{\{\$([a-zA-Z_][a-zA-Z0-9_]*(?:\.[a-zA-Z_][a-zA-Z0-9_]*)*)\}\}/g, (match, variablePath) => {
        try {
            // Split the path into parts (e.g., "vars.testvar1" -> ["vars", "testvar1"])
            const pathParts = variablePath.split('.');
            // Start with the sandbox object
            let current = sandbox;
            // Navigate through the path
            for (const part of pathParts) {
                // For the first part, check if it exists with $ prefix
                if (current === sandbox) {
                    const sandboxKey = `$${part}`;
                    if (Object.keys(current).includes(sandboxKey)) {
                        current = current[sandboxKey];
                    }
                    else {
                        // If the key doesn't exist, return the original match
                        return match;
                    }
                }
                else {
                    // For subsequent parts, access directly
                    if (current && typeof current === 'object' && part in current) {
                        current = current[part];
                    }
                    else {
                        // If the property doesn't exist, return the original match
                        return match;
                    }
                }
            }
            // Return the resolved value, converting to string if necessary
            return typeof current === 'string' ? current : JSON.stringify(current);
        }
        catch (error) {
            // If any error occurs during resolution, return the original match
            console.warn(`Error resolving variable ${match}:`, error);
            return match;
        }
    });
}
function convertToValidJSONString(inputString) {
    try {
        const jsObject = (0, utils_1.parseJsonBody)(inputString);
        return JSON.stringify(jsObject, null, 2);
    }
    catch (error) {
        console.error('Error converting to JSON:', error);
        return '';
    }
}
module.exports = { nodeClass: Custom_MCP };
//# sourceMappingURL=CustomMCP.js.map