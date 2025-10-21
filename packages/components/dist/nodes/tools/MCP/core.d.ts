import { ListToolsResult } from '@modelcontextprotocol/sdk/types.js';
import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StdioClientTransport, StdioServerParameters } from '@modelcontextprotocol/sdk/client/stdio.js';
import { BaseToolkit, Tool } from '@langchain/core/tools';
import { StreamableHTTPClientTransport } from '@modelcontextprotocol/sdk/client/streamableHttp.js';
import { SSEClientTransport } from '@modelcontextprotocol/sdk/client/sse.js';
export declare class MCPToolkit extends BaseToolkit {
    tools: Tool[];
    _tools: ListToolsResult | null;
    model_config: any;
    transport: StdioClientTransport | SSEClientTransport | StreamableHTTPClientTransport | null;
    client: Client | null;
    serverParams: StdioServerParameters | any;
    transportType: 'stdio' | 'sse';
    constructor(serverParams: StdioServerParameters | any, transportType: 'stdio' | 'sse');
    createClient(): Promise<Client>;
    initialize(): Promise<void>;
    get_tools(): Promise<Tool[]>;
}
export declare function MCPTool({ toolkit, name, description, argsSchema }: {
    toolkit: MCPToolkit;
    name: string;
    description: string;
    argsSchema: any;
}): Promise<Tool>;
export declare const validateArgsForLocalFileAccess: (args: string[]) => void;
export declare const validateCommandInjection: (args: string[]) => void;
export declare const validateEnvironmentVariables: (env: Record<string, any>) => void;
export declare const validateMCPServerConfig: (serverParams: any) => void;
