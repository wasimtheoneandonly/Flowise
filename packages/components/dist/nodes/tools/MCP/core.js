"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.validateMCPServerConfig = exports.validateEnvironmentVariables = exports.validateCommandInjection = exports.validateArgsForLocalFileAccess = exports.MCPToolkit = void 0;
exports.MCPTool = MCPTool;
const types_js_1 = require("@modelcontextprotocol/sdk/types.js");
const index_js_1 = require("@modelcontextprotocol/sdk/client/index.js");
const stdio_js_1 = require("@modelcontextprotocol/sdk/client/stdio.js");
const tools_1 = require("@langchain/core/tools");
const zod_1 = require("zod");
const streamableHttp_js_1 = require("@modelcontextprotocol/sdk/client/streamableHttp.js");
const sse_js_1 = require("@modelcontextprotocol/sdk/client/sse.js");
class MCPToolkit extends tools_1.BaseToolkit {
    constructor(serverParams, transportType) {
        super();
        this.tools = [];
        this._tools = null;
        this.transport = null;
        this.client = null;
        this.serverParams = serverParams;
        this.transportType = transportType;
    }
    // Method to create a new client with transport
    async createClient() {
        const client = new index_js_1.Client({
            name: 'flowise-client',
            version: '1.0.0'
        }, {
            capabilities: {}
        });
        let transport;
        if (this.transportType === 'stdio') {
            // Compatible with overridden PATH configuration
            const params = {
                ...this.serverParams,
                env: {
                    ...(this.serverParams.env || {}),
                    PATH: process.env.PATH
                }
            };
            transport = new stdio_js_1.StdioClientTransport(params);
            await client.connect(transport);
        }
        else {
            if (this.serverParams.url === undefined) {
                throw new Error('URL is required for SSE transport');
            }
            const baseUrl = new URL(this.serverParams.url);
            try {
                if (this.serverParams.headers) {
                    transport = new streamableHttp_js_1.StreamableHTTPClientTransport(baseUrl, {
                        requestInit: {
                            headers: this.serverParams.headers
                        }
                    });
                }
                else {
                    transport = new streamableHttp_js_1.StreamableHTTPClientTransport(baseUrl);
                }
                await client.connect(transport);
            }
            catch (error) {
                if (this.serverParams.headers) {
                    transport = new sse_js_1.SSEClientTransport(baseUrl, {
                        requestInit: {
                            headers: this.serverParams.headers
                        },
                        eventSourceInit: {
                            fetch: (url, init) => fetch(url, { ...init, headers: this.serverParams.headers })
                        }
                    });
                }
                else {
                    transport = new sse_js_1.SSEClientTransport(baseUrl);
                }
                await client.connect(transport);
            }
        }
        return client;
    }
    async initialize() {
        if (this._tools === null) {
            this.client = await this.createClient();
            this._tools = await this.client.request({ method: 'tools/list' }, types_js_1.ListToolsResultSchema);
            this.tools = await this.get_tools();
            // Close the initial client after initialization
            await this.client.close();
        }
    }
    async get_tools() {
        if (this._tools === null || this.client === null) {
            throw new Error('Must initialize the toolkit first');
        }
        const toolsPromises = this._tools.tools.map(async (tool) => {
            if (this.client === null) {
                throw new Error('Client is not initialized');
            }
            return await MCPTool({
                toolkit: this,
                name: tool.name,
                description: tool.description || '',
                argsSchema: createSchemaModel(tool.inputSchema)
            });
        });
        const res = await Promise.allSettled(toolsPromises);
        const errors = res.filter((r) => r.status === 'rejected');
        if (errors.length !== 0) {
            console.error('MCP Tools falied to be resolved', errors);
        }
        const successes = res.filter((r) => r.status === 'fulfilled').map((r) => r.value);
        return successes;
    }
}
exports.MCPToolkit = MCPToolkit;
async function MCPTool({ toolkit, name, description, argsSchema }) {
    return (0, tools_1.tool)(async (input) => {
        // Create a new client for this request
        const client = await toolkit.createClient();
        try {
            const req = { method: 'tools/call', params: { name: name, arguments: input } };
            const res = await client.request(req, types_js_1.CallToolResultSchema);
            const content = res.content;
            const contentString = JSON.stringify(content);
            return contentString;
        }
        finally {
            // Always close the client after the request completes
            await client.close();
        }
    }, {
        name: name,
        description: description,
        schema: argsSchema
    });
}
function createSchemaModel(inputSchema) {
    if (inputSchema.type !== 'object' || !inputSchema.properties) {
        throw new Error('Invalid schema type or missing properties');
    }
    const schemaProperties = Object.entries(inputSchema.properties).reduce((acc, [key, _]) => {
        acc[key] = zod_1.z.any();
        return acc;
    }, {});
    return zod_1.z.object(schemaProperties);
}
const validateArgsForLocalFileAccess = (args) => {
    const dangerousPatterns = [
        // Absolute paths
        /^\/[^/]/, // Unix absolute paths starting with /
        /^[a-zA-Z]:\\/, // Windows absolute paths like C:\
        // Relative paths that could escape current directory
        /\.\.\//, // Parent directory traversal with ../
        /\.\.\\/, // Parent directory traversal with ..\
        /^\.\./, // Starting with ..
        // Local file access patterns
        /^\.\//, // Current directory with ./
        /^~\//, // Home directory with ~/
        /^file:\/\//, // File protocol
        // Common file extensions that shouldn't be accessed
        /\.(exe|bat|cmd|sh|ps1|vbs|scr|com|pif|dll|sys)$/i,
        // File flags and options that could access local files
        /^--?(?:file|input|output|config|load|save|import|export|read|write)=/i,
        /^--?(?:file|input|output|config|load|save|import|export|read|write)$/i
    ];
    for (const arg of args) {
        if (typeof arg !== 'string')
            continue;
        // Check for dangerous patterns
        for (const pattern of dangerousPatterns) {
            if (pattern.test(arg)) {
                throw new Error(`Argument contains potential local file access: "${arg}"`);
            }
        }
        // Check for null bytes
        if (arg.includes('\0')) {
            throw new Error(`Argument contains null byte: "${arg}"`);
        }
        // Check for very long paths that might be used for buffer overflow attacks
        if (arg.length > 1000) {
            throw new Error(`Argument is suspiciously long (${arg.length} characters): "${arg.substring(0, 100)}..."`);
        }
    }
};
exports.validateArgsForLocalFileAccess = validateArgsForLocalFileAccess;
const validateCommandInjection = (args) => {
    const dangerousPatterns = [
        // Shell metacharacters
        /[;&|`$(){}[\]<>]/,
        // Command chaining
        /&&|\|\||;;/,
        // Redirections
        />>|<<|>/,
        // Backticks and command substitution
        /`|\$\(/,
        // Process substitution
        /<\(|>\(/
    ];
    for (const arg of args) {
        if (typeof arg !== 'string')
            continue;
        for (const pattern of dangerousPatterns) {
            if (pattern.test(arg)) {
                throw new Error(`Argument contains potentially dangerous characters: "${arg}"`);
            }
        }
    }
};
exports.validateCommandInjection = validateCommandInjection;
const validateEnvironmentVariables = (env) => {
    const dangerousEnvVars = ['PATH', 'LD_LIBRARY_PATH', 'DYLD_LIBRARY_PATH'];
    for (const [key, value] of Object.entries(env)) {
        if (dangerousEnvVars.includes(key)) {
            throw new Error(`Environment variable '${key}' modification is not allowed`);
        }
        if (typeof value === 'string' && value.includes('\0')) {
            throw new Error(`Environment variable '${key}' contains null byte`);
        }
    }
};
exports.validateEnvironmentVariables = validateEnvironmentVariables;
const validateMCPServerConfig = (serverParams) => {
    // Validate the entire server configuration
    if (!serverParams || typeof serverParams !== 'object') {
        throw new Error('Invalid server configuration');
    }
    // Command allowlist - only allow specific safe commands
    const allowedCommands = ['node', 'npx', 'python', 'python3', 'docker'];
    if (serverParams.command && !allowedCommands.includes(serverParams.command)) {
        throw new Error(`Command '${serverParams.command}' is not allowed. Allowed commands: ${allowedCommands.join(', ')}`);
    }
    // Validate arguments if present
    if (serverParams.args && Array.isArray(serverParams.args)) {
        (0, exports.validateArgsForLocalFileAccess)(serverParams.args);
        (0, exports.validateCommandInjection)(serverParams.args);
    }
    // Validate environment variables
    if (serverParams.env) {
        (0, exports.validateEnvironmentVariables)(serverParams.env);
    }
};
exports.validateMCPServerConfig = validateMCPServerConfig;
//# sourceMappingURL=core.js.map