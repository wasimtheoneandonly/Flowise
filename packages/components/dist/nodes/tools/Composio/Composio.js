"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const tools_1 = require("@langchain/core/tools");
const utils_1 = require("../../../src/utils");
const composio_core_1 = require("composio-core");
class ComposioTool extends tools_1.Tool {
    constructor(toolset, appName, actions) {
        super();
        this.name = 'composio';
        this.description = 'Tool for interacting with Composio applications and performing actions';
        this.toolset = toolset;
        this.appName = appName;
        this.actions = actions;
    }
    async _call(input) {
        try {
            return `Executed action on ${this.appName} with input: ${input}`;
        }
        catch (error) {
            return 'Failed to execute action';
        }
    }
}
class Composio_Tools {
    constructor() {
        //@ts-ignore
        this.loadMethods = {
            listApps: async (nodeData, options) => {
                try {
                    const credentialData = await (0, utils_1.getCredentialData)(nodeData.credential ?? '', options ?? {});
                    const composioApiKey = (0, utils_1.getCredentialParam)('composioApi', credentialData, nodeData);
                    if (!composioApiKey) {
                        return [
                            {
                                label: 'API Key Required',
                                name: 'placeholder',
                                description: 'Enter Composio API key in the credential field'
                            }
                        ];
                    }
                    const toolset = new composio_core_1.LangchainToolSet({ apiKey: composioApiKey });
                    const apps = await toolset.client.apps.list();
                    apps.sort((a, b) => a.name.localeCompare(b.name));
                    return apps.map(({ name, ...rest }) => ({
                        label: name.toUpperCase(),
                        name: name,
                        description: rest.description || name
                    }));
                }
                catch (error) {
                    console.error('Error loading apps:', error);
                    return [
                        {
                            label: 'Error Loading Apps',
                            name: 'error',
                            description: 'Failed to load apps. Please check your API key and try again'
                        }
                    ];
                }
            },
            listActions: async (nodeData, options) => {
                try {
                    const credentialData = await (0, utils_1.getCredentialData)(nodeData.credential ?? '', options ?? {});
                    const composioApiKey = (0, utils_1.getCredentialParam)('composioApi', credentialData, nodeData);
                    const appName = nodeData.inputs?.appName;
                    if (!composioApiKey) {
                        return [
                            {
                                label: 'API Key Required',
                                name: 'placeholder',
                                description: 'Enter Composio API key in the credential field'
                            }
                        ];
                    }
                    if (!appName) {
                        return [
                            {
                                label: 'Select an App first',
                                name: 'placeholder',
                                description: 'Select an app from the dropdown to view available actions'
                            }
                        ];
                    }
                    const toolset = new composio_core_1.LangchainToolSet({ apiKey: composioApiKey });
                    const actions = await toolset.getTools({ apps: [appName] });
                    actions.sort((a, b) => a.name.localeCompare(b.name));
                    return actions.map(({ name, ...rest }) => ({
                        label: name.toUpperCase(),
                        name: name,
                        description: rest.description || name
                    }));
                }
                catch (error) {
                    console.error('Error loading actions:', error);
                    return [
                        {
                            label: 'Error Loading Actions',
                            name: 'error',
                            description: 'Failed to load actions. Please check your API key and try again'
                        }
                    ];
                }
            },
            authStatus: async (nodeData, options) => {
                const credentialData = await (0, utils_1.getCredentialData)(nodeData.credential ?? '', options ?? {});
                const composioApiKey = (0, utils_1.getCredentialParam)('composioApi', credentialData, nodeData);
                const appName = nodeData.inputs?.appName;
                if (!composioApiKey) {
                    return [
                        {
                            label: 'API Key Required',
                            name: 'placeholder',
                            description: 'Enter Composio API key in the credential field'
                        }
                    ];
                }
                if (!appName) {
                    return [
                        {
                            label: 'Select an App first',
                            name: 'placeholder',
                            description: 'Select an app from the dropdown to view available actions'
                        }
                    ];
                }
                const toolset = new composio_core_1.LangchainToolSet({ apiKey: composioApiKey });
                const authStatus = await toolset.client.getEntity('default').getConnection({ app: appName.toLowerCase() });
                return [
                    {
                        label: authStatus ? 'Connected' : 'Not Connected',
                        name: authStatus ? 'Connected' : 'Not Connected',
                        description: authStatus ? 'Selected app has an active connection' : 'Please connect the app on app.composio.dev'
                    }
                ];
            }
        };
        this.label = 'Composio';
        this.name = 'composio';
        this.version = 2.0;
        this.type = 'Composio';
        this.icon = 'composio.svg';
        this.category = 'Tools';
        this.description = 'Toolset with over 250+ Apps for building AI-powered applications';
        this.baseClasses = [this.type, ...(0, utils_1.getBaseClasses)(ComposioTool)];
        this.credential = {
            label: 'Connect Credential',
            name: 'credential',
            type: 'credential',
            credentialNames: ['composioApi']
        };
        this.inputs = [
            {
                label: 'App Name',
                name: 'appName',
                type: 'asyncOptions',
                loadMethod: 'listApps',
                description: 'Select the app to connect with',
                refresh: true
            },
            {
                label: 'Auth Status',
                name: 'authStatus',
                type: 'asyncOptions',
                loadMethod: 'authStatus',
                placeholder: 'Connection status will appear here',
                refresh: true
            },
            {
                label: 'Actions to Use',
                name: 'actions',
                type: 'asyncMultiOptions',
                loadMethod: 'listActions',
                description: 'Select the actions you want to use',
                refresh: true
            }
        ];
    }
    async init(nodeData, _, options) {
        if (!nodeData.inputs)
            nodeData.inputs = {};
        const credentialData = await (0, utils_1.getCredentialData)(nodeData.credential ?? '', options);
        const composioApiKey = (0, utils_1.getCredentialParam)('composioApi', credentialData, nodeData);
        if (!composioApiKey) {
            nodeData.inputs = {
                appName: undefined,
                authStatus: '',
                actions: []
            };
            throw new Error('API Key Required');
        }
        const _actions = nodeData.inputs?.actions;
        let actions = [];
        if (_actions) {
            try {
                actions = typeof _actions === 'string' ? JSON.parse(_actions) : _actions;
            }
            catch (error) {
                console.error('Error parsing actions:', error);
            }
        }
        const toolset = new composio_core_1.LangchainToolSet({ apiKey: composioApiKey });
        const tools = await toolset.getTools({ actions });
        return tools;
    }
}
module.exports = { nodeClass: Composio_Tools };
//# sourceMappingURL=Composio.js.map