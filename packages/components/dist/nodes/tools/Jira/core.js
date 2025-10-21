"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.createJiraTools = exports.desc = void 0;
const zod_1 = require("zod");
const node_fetch_1 = __importDefault(require("node-fetch"));
const core_1 = require("../OpenAPIToolkit/core");
const agents_1 = require("../../../src/agents");
exports.desc = `Use this when you want to access Jira API for managing issues, comments, and users`;
// Define schemas for different Jira operations
// Issue Schemas
const ListIssuesSchema = zod_1.z.object({
    projectKey: zod_1.z.string().optional().describe('Project key to filter issues'),
    jql: zod_1.z.string().optional().describe('JQL query for filtering issues'),
    maxResults: zod_1.z.number().optional().default(50).describe('Maximum number of results to return'),
    startAt: zod_1.z.number().optional().default(0).describe('Index of the first result to return')
});
const CreateIssueSchema = zod_1.z.object({
    projectKey: zod_1.z.string().describe('Project key where the issue will be created'),
    issueType: zod_1.z.string().describe('Type of issue (Bug, Task, Story, etc.)'),
    summary: zod_1.z.string().describe('Issue summary/title'),
    description: zod_1.z.string().optional().describe('Issue description'),
    priority: zod_1.z.string().optional().describe('Issue priority (Highest, High, Medium, Low, Lowest)'),
    assigneeAccountId: zod_1.z.string().optional().describe('Account ID of the assignee'),
    labels: zod_1.z.array(zod_1.z.string()).optional().describe('Labels to add to the issue')
});
const GetIssueSchema = zod_1.z.object({
    issueKey: zod_1.z.string().describe('Issue key (e.g., PROJ-123)')
});
const UpdateIssueSchema = zod_1.z.object({
    issueKey: zod_1.z.string().describe('Issue key (e.g., PROJ-123)'),
    summary: zod_1.z.string().optional().describe('Updated issue summary/title'),
    description: zod_1.z.string().optional().describe('Updated issue description'),
    priority: zod_1.z.string().optional().describe('Updated issue priority'),
    assigneeAccountId: zod_1.z.string().optional().describe('Account ID of the new assignee')
});
const AssignIssueSchema = zod_1.z.object({
    issueKey: zod_1.z.string().describe('Issue key (e.g., PROJ-123)'),
    assigneeAccountId: zod_1.z.string().describe('Account ID of the user to assign')
});
const TransitionIssueSchema = zod_1.z.object({
    issueKey: zod_1.z.string().describe('Issue key (e.g., PROJ-123)'),
    transitionId: zod_1.z.string().describe('ID of the transition to execute')
});
// Comment Schemas
const ListCommentsSchema = zod_1.z.object({
    issueKey: zod_1.z.string().describe('Issue key to get comments for'),
    maxResults: zod_1.z.number().optional().default(50).describe('Maximum number of results to return'),
    startAt: zod_1.z.number().optional().default(0).describe('Index of the first result to return')
});
const CreateCommentSchema = zod_1.z.object({
    issueKey: zod_1.z.string().describe('Issue key to add comment to'),
    text: zod_1.z.string().describe('Comment text content'),
    visibility: zod_1.z
        .object({
        type: zod_1.z.string().optional(),
        value: zod_1.z.string().optional()
    })
        .optional()
        .describe('Comment visibility settings')
});
const GetCommentSchema = zod_1.z.object({
    issueKey: zod_1.z.string().describe('Issue key'),
    commentId: zod_1.z.string().describe('Comment ID')
});
const UpdateCommentSchema = zod_1.z.object({
    issueKey: zod_1.z.string().describe('Issue key'),
    commentId: zod_1.z.string().describe('Comment ID'),
    text: zod_1.z.string().describe('Updated comment text')
});
const DeleteCommentSchema = zod_1.z.object({
    issueKey: zod_1.z.string().describe('Issue key'),
    commentId: zod_1.z.string().describe('Comment ID to delete')
});
// User Schemas
const SearchUsersSchema = zod_1.z.object({
    query: zod_1.z.string().describe('Query string for user search'),
    maxResults: zod_1.z.number().optional().default(50).describe('Maximum number of results to return'),
    startAt: zod_1.z.number().optional().default(0).describe('Index of the first result to return')
});
const GetUserSchema = zod_1.z.object({
    accountId: zod_1.z.string().describe('Account ID of the user')
});
const CreateUserSchema = zod_1.z.object({
    emailAddress: zod_1.z.string().describe('Email address of the user'),
    displayName: zod_1.z.string().describe('Display name of the user'),
    username: zod_1.z.string().optional().describe('Username (deprecated in newer versions)')
});
const UpdateUserSchema = zod_1.z.object({
    accountId: zod_1.z.string().describe('Account ID of the user'),
    emailAddress: zod_1.z.string().optional().describe('Updated email address'),
    displayName: zod_1.z.string().optional().describe('Updated display name')
});
const DeleteUserSchema = zod_1.z.object({
    accountId: zod_1.z.string().describe('Account ID of the user to delete')
});
class BaseJiraTool extends core_1.DynamicStructuredTool {
    constructor(args) {
        super(args);
        this.username = '';
        this.accessToken = '';
        this.jiraHost = '';
        this.username = args.username ?? '';
        this.accessToken = args.accessToken ?? '';
        this.jiraHost = args.jiraHost ?? '';
    }
    async makeJiraRequest({ endpoint, method = 'GET', body, params }) {
        const url = `${this.jiraHost}/rest/api/3/${endpoint}`;
        const auth = Buffer.from(`${this.username}:${this.accessToken}`).toString('base64');
        const headers = {
            Authorization: `Basic ${auth}`,
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
            throw new Error(`Jira API Error ${response.status}: ${response.statusText} - ${errorText}`);
        }
        const data = await response.text();
        return data + agents_1.TOOL_ARGS_PREFIX + JSON.stringify(params);
    }
}
// Issue Tools
class ListIssuesTool extends BaseJiraTool {
    constructor(args) {
        const toolInput = {
            name: 'list_issues',
            description: 'List issues from Jira using JQL query',
            schema: ListIssuesSchema,
            baseUrl: '',
            method: 'GET',
            headers: {}
        };
        super({
            ...toolInput,
            username: args.username,
            accessToken: args.accessToken,
            jiraHost: args.jiraHost,
            maxOutputLength: args.maxOutputLength
        });
        this.defaultParams = args.defaultParams || {};
    }
    async _call(arg) {
        const params = { ...arg, ...this.defaultParams };
        const queryParams = new URLSearchParams();
        let jql = params.jql || '';
        if (params.projectKey && !jql.includes('project')) {
            jql = jql ? `project = ${params.projectKey} AND (${jql})` : `project = ${params.projectKey}`;
        }
        if (jql)
            queryParams.append('jql', jql);
        if (params.maxResults)
            queryParams.append('maxResults', params.maxResults.toString());
        if (params.startAt)
            queryParams.append('startAt', params.startAt.toString());
        const endpoint = `search?${queryParams.toString()}`;
        try {
            const response = await this.makeJiraRequest({ endpoint, params });
            return response;
        }
        catch (error) {
            return (0, agents_1.formatToolError)(`Error listing issues: ${error}`, params);
        }
    }
}
class CreateIssueTool extends BaseJiraTool {
    constructor(args) {
        const toolInput = {
            name: 'create_issue',
            description: 'Create a new issue in Jira',
            schema: CreateIssueSchema,
            baseUrl: '',
            method: 'POST',
            headers: {}
        };
        super({
            ...toolInput,
            username: args.username,
            accessToken: args.accessToken,
            jiraHost: args.jiraHost,
            maxOutputLength: args.maxOutputLength
        });
        this.defaultParams = args.defaultParams || {};
    }
    async _call(arg) {
        const params = { ...arg, ...this.defaultParams };
        try {
            const issueData = {
                fields: {
                    project: {
                        key: params.projectKey
                    },
                    issuetype: {
                        name: params.issueType
                    },
                    summary: params.summary
                }
            };
            if (params.description) {
                issueData.fields.description = {
                    type: 'doc',
                    version: 1,
                    content: [
                        {
                            type: 'paragraph',
                            content: [
                                {
                                    type: 'text',
                                    text: params.description
                                }
                            ]
                        }
                    ]
                };
            }
            if (params.priority) {
                issueData.fields.priority = {
                    name: params.priority
                };
            }
            if (params.assigneeAccountId) {
                issueData.fields.assignee = {
                    accountId: params.assigneeAccountId
                };
            }
            if (params.labels) {
                issueData.fields.labels = params.labels;
            }
            const response = await this.makeJiraRequest({ endpoint: 'issue', method: 'POST', body: issueData, params });
            return response;
        }
        catch (error) {
            return (0, agents_1.formatToolError)(`Error creating issue: ${error}`, params);
        }
    }
}
class GetIssueTool extends BaseJiraTool {
    constructor(args) {
        const toolInput = {
            name: 'get_issue',
            description: 'Get a specific issue from Jira',
            schema: GetIssueSchema,
            baseUrl: '',
            method: 'GET',
            headers: {}
        };
        super({
            ...toolInput,
            username: args.username,
            accessToken: args.accessToken,
            jiraHost: args.jiraHost,
            maxOutputLength: args.maxOutputLength
        });
        this.defaultParams = args.defaultParams || {};
    }
    async _call(arg) {
        const params = { ...arg, ...this.defaultParams };
        try {
            const endpoint = `issue/${params.issueKey}`;
            const response = await this.makeJiraRequest({ endpoint, params });
            return response;
        }
        catch (error) {
            return (0, agents_1.formatToolError)(`Error getting issue: ${error}`, params);
        }
    }
}
class UpdateIssueTool extends BaseJiraTool {
    constructor(args) {
        const toolInput = {
            name: 'update_issue',
            description: 'Update an existing issue in Jira',
            schema: UpdateIssueSchema,
            baseUrl: '',
            method: 'PUT',
            headers: {}
        };
        super({
            ...toolInput,
            username: args.username,
            accessToken: args.accessToken,
            jiraHost: args.jiraHost,
            maxOutputLength: args.maxOutputLength
        });
        this.defaultParams = args.defaultParams || {};
    }
    async _call(arg) {
        const params = { ...arg, ...this.defaultParams };
        try {
            const updateData = {
                fields: {}
            };
            if (params.summary)
                updateData.fields.summary = params.summary;
            if (params.description) {
                updateData.fields.description = {
                    type: 'doc',
                    version: 1,
                    content: [
                        {
                            type: 'paragraph',
                            content: [
                                {
                                    type: 'text',
                                    text: params.description
                                }
                            ]
                        }
                    ]
                };
            }
            if (params.priority) {
                updateData.fields.priority = {
                    name: params.priority
                };
            }
            if (params.assigneeAccountId) {
                updateData.fields.assignee = {
                    accountId: params.assigneeAccountId
                };
            }
            const endpoint = `issue/${params.issueKey}`;
            const response = await this.makeJiraRequest({ endpoint, method: 'PUT', body: updateData, params });
            return response || 'Issue updated successfully';
        }
        catch (error) {
            return (0, agents_1.formatToolError)(`Error updating issue: ${error}`, params);
        }
    }
}
class DeleteIssueTool extends BaseJiraTool {
    constructor(args) {
        const toolInput = {
            name: 'delete_issue',
            description: 'Delete an issue from Jira',
            schema: GetIssueSchema,
            baseUrl: '',
            method: 'DELETE',
            headers: {}
        };
        super({
            ...toolInput,
            username: args.username,
            accessToken: args.accessToken,
            jiraHost: args.jiraHost,
            maxOutputLength: args.maxOutputLength
        });
        this.defaultParams = args.defaultParams || {};
    }
    async _call(arg) {
        const params = { ...arg, ...this.defaultParams };
        try {
            const endpoint = `issue/${params.issueKey}`;
            const response = await this.makeJiraRequest({ endpoint, method: 'DELETE', params });
            return response || 'Issue deleted successfully';
        }
        catch (error) {
            return (0, agents_1.formatToolError)(`Error deleting issue: ${error}`, params);
        }
    }
}
class AssignIssueTool extends BaseJiraTool {
    constructor(args) {
        const toolInput = {
            name: 'assign_issue',
            description: 'Assign an issue to a user in Jira',
            schema: AssignIssueSchema,
            baseUrl: '',
            method: 'PUT',
            headers: {}
        };
        super({
            ...toolInput,
            username: args.username,
            accessToken: args.accessToken,
            jiraHost: args.jiraHost,
            maxOutputLength: args.maxOutputLength
        });
        this.defaultParams = args.defaultParams || {};
    }
    async _call(arg) {
        const params = { ...arg, ...this.defaultParams };
        try {
            const assignData = {
                accountId: params.assigneeAccountId
            };
            const endpoint = `issue/${params.issueKey}/assignee`;
            const response = await this.makeJiraRequest({ endpoint, method: 'PUT', body: assignData, params });
            return response || 'Issue assigned successfully';
        }
        catch (error) {
            return (0, agents_1.formatToolError)(`Error assigning issue: ${error}`, params);
        }
    }
}
class TransitionIssueTool extends BaseJiraTool {
    constructor(args) {
        const toolInput = {
            name: 'transition_issue',
            description: 'Transition an issue to a different status in Jira',
            schema: TransitionIssueSchema,
            baseUrl: '',
            method: 'POST',
            headers: {}
        };
        super({
            ...toolInput,
            username: args.username,
            accessToken: args.accessToken,
            jiraHost: args.jiraHost,
            maxOutputLength: args.maxOutputLength
        });
        this.defaultParams = args.defaultParams || {};
    }
    async _call(arg) {
        const params = { ...arg, ...this.defaultParams };
        try {
            const transitionData = {
                transition: {
                    id: params.transitionId
                }
            };
            const endpoint = `issue/${params.issueKey}/transitions`;
            const response = await this.makeJiraRequest({ endpoint, method: 'POST', body: transitionData, params });
            return response || 'Issue transitioned successfully';
        }
        catch (error) {
            return (0, agents_1.formatToolError)(`Error transitioning issue: ${error}`, params);
        }
    }
}
// Comment Tools
class ListCommentsTool extends BaseJiraTool {
    constructor(args) {
        const toolInput = {
            name: 'list_comments',
            description: 'List comments for a Jira issue',
            schema: ListCommentsSchema,
            baseUrl: '',
            method: 'GET',
            headers: {}
        };
        super({
            ...toolInput,
            username: args.username,
            accessToken: args.accessToken,
            jiraHost: args.jiraHost,
            maxOutputLength: args.maxOutputLength
        });
        this.defaultParams = args.defaultParams || {};
    }
    async _call(arg) {
        const params = { ...arg, ...this.defaultParams };
        const queryParams = new URLSearchParams();
        if (params.maxResults)
            queryParams.append('maxResults', params.maxResults.toString());
        if (params.startAt)
            queryParams.append('startAt', params.startAt.toString());
        const endpoint = `issue/${params.issueKey}/comment?${queryParams.toString()}`;
        try {
            const response = await this.makeJiraRequest({ endpoint, params });
            return response;
        }
        catch (error) {
            return (0, agents_1.formatToolError)(`Error listing comments: ${error}`, params);
        }
    }
}
class CreateCommentTool extends BaseJiraTool {
    constructor(args) {
        const toolInput = {
            name: 'create_comment',
            description: 'Create a comment on a Jira issue',
            schema: CreateCommentSchema,
            baseUrl: '',
            method: 'POST',
            headers: {}
        };
        super({
            ...toolInput,
            username: args.username,
            accessToken: args.accessToken,
            jiraHost: args.jiraHost,
            maxOutputLength: args.maxOutputLength
        });
        this.defaultParams = args.defaultParams || {};
    }
    async _call(arg) {
        const params = { ...arg, ...this.defaultParams };
        try {
            const commentData = {
                body: {
                    type: 'doc',
                    version: 1,
                    content: [
                        {
                            type: 'paragraph',
                            content: [
                                {
                                    type: 'text',
                                    text: params.text
                                }
                            ]
                        }
                    ]
                }
            };
            if (params.visibility) {
                commentData.visibility = params.visibility;
            }
            const endpoint = `issue/${params.issueKey}/comment`;
            const response = await this.makeJiraRequest({ endpoint, method: 'POST', body: commentData, params });
            return response;
        }
        catch (error) {
            return (0, agents_1.formatToolError)(`Error creating comment: ${error}`, params);
        }
    }
}
class GetCommentTool extends BaseJiraTool {
    constructor(args) {
        const toolInput = {
            name: 'get_comment',
            description: 'Get a specific comment from a Jira issue',
            schema: GetCommentSchema,
            baseUrl: '',
            method: 'GET',
            headers: {}
        };
        super({
            ...toolInput,
            username: args.username,
            accessToken: args.accessToken,
            jiraHost: args.jiraHost,
            maxOutputLength: args.maxOutputLength
        });
        this.defaultParams = args.defaultParams || {};
    }
    async _call(arg) {
        const params = { ...arg, ...this.defaultParams };
        try {
            const endpoint = `issue/${params.issueKey}/comment/${params.commentId}`;
            const response = await this.makeJiraRequest({ endpoint, params });
            return response;
        }
        catch (error) {
            return (0, agents_1.formatToolError)(`Error getting comment: ${error}`, params);
        }
    }
}
class UpdateCommentTool extends BaseJiraTool {
    constructor(args) {
        const toolInput = {
            name: 'update_comment',
            description: 'Update a comment on a Jira issue',
            schema: UpdateCommentSchema,
            baseUrl: '',
            method: 'PUT',
            headers: {}
        };
        super({
            ...toolInput,
            username: args.username,
            accessToken: args.accessToken,
            jiraHost: args.jiraHost,
            maxOutputLength: args.maxOutputLength
        });
        this.defaultParams = args.defaultParams || {};
    }
    async _call(arg) {
        const params = { ...arg, ...this.defaultParams };
        try {
            const commentData = {
                body: {
                    type: 'doc',
                    version: 1,
                    content: [
                        {
                            type: 'paragraph',
                            content: [
                                {
                                    type: 'text',
                                    text: params.text
                                }
                            ]
                        }
                    ]
                }
            };
            const endpoint = `issue/${params.issueKey}/comment/${params.commentId}`;
            const response = await this.makeJiraRequest({ endpoint, method: 'PUT', body: commentData, params });
            return response || 'Comment updated successfully';
        }
        catch (error) {
            return (0, agents_1.formatToolError)(`Error updating comment: ${error}`, params);
        }
    }
}
class DeleteCommentTool extends BaseJiraTool {
    constructor(args) {
        const toolInput = {
            name: 'delete_comment',
            description: 'Delete a comment from a Jira issue',
            schema: DeleteCommentSchema,
            baseUrl: '',
            method: 'DELETE',
            headers: {}
        };
        super({
            ...toolInput,
            username: args.username,
            accessToken: args.accessToken,
            jiraHost: args.jiraHost,
            maxOutputLength: args.maxOutputLength
        });
        this.defaultParams = args.defaultParams || {};
    }
    async _call(arg) {
        const params = { ...arg, ...this.defaultParams };
        try {
            const endpoint = `issue/${params.issueKey}/comment/${params.commentId}`;
            const response = await this.makeJiraRequest({ endpoint, method: 'DELETE', params });
            return response || 'Comment deleted successfully';
        }
        catch (error) {
            return (0, agents_1.formatToolError)(`Error deleting comment: ${error}`, params);
        }
    }
}
// User Tools
class SearchUsersTool extends BaseJiraTool {
    constructor(args) {
        const toolInput = {
            name: 'search_users',
            description: 'Search for users in Jira',
            schema: SearchUsersSchema,
            baseUrl: '',
            method: 'GET',
            headers: {}
        };
        super({
            ...toolInput,
            username: args.username,
            accessToken: args.accessToken,
            jiraHost: args.jiraHost,
            maxOutputLength: args.maxOutputLength
        });
        this.defaultParams = args.defaultParams || {};
    }
    async _call(arg) {
        const params = { ...arg, ...this.defaultParams };
        const queryParams = new URLSearchParams();
        if (params.query)
            queryParams.append('query', params.query);
        if (params.maxResults)
            queryParams.append('maxResults', params.maxResults.toString());
        if (params.startAt)
            queryParams.append('startAt', params.startAt.toString());
        const endpoint = `user/search?${queryParams.toString()}`;
        try {
            const response = await this.makeJiraRequest({ endpoint, params });
            return response;
        }
        catch (error) {
            return (0, agents_1.formatToolError)(`Error searching users: ${error}`, params);
        }
    }
}
class GetUserTool extends BaseJiraTool {
    constructor(args) {
        const toolInput = {
            name: 'get_user',
            description: 'Get a specific user from Jira',
            schema: GetUserSchema,
            baseUrl: '',
            method: 'GET',
            headers: {}
        };
        super({
            ...toolInput,
            username: args.username,
            accessToken: args.accessToken,
            jiraHost: args.jiraHost,
            maxOutputLength: args.maxOutputLength
        });
        this.defaultParams = args.defaultParams || {};
    }
    async _call(arg) {
        const params = { ...arg, ...this.defaultParams };
        const queryParams = new URLSearchParams();
        queryParams.append('accountId', params.accountId);
        const endpoint = `user?${queryParams.toString()}`;
        try {
            const response = await this.makeJiraRequest({ endpoint, params });
            return response;
        }
        catch (error) {
            return (0, agents_1.formatToolError)(`Error getting user: ${error}`, params);
        }
    }
}
class CreateUserTool extends BaseJiraTool {
    constructor(args) {
        const toolInput = {
            name: 'create_user',
            description: 'Create a new user in Jira',
            schema: CreateUserSchema,
            baseUrl: '',
            method: 'POST',
            headers: {}
        };
        super({
            ...toolInput,
            username: args.username,
            accessToken: args.accessToken,
            jiraHost: args.jiraHost,
            maxOutputLength: args.maxOutputLength
        });
        this.defaultParams = args.defaultParams || {};
    }
    async _call(arg) {
        const params = { ...arg, ...this.defaultParams };
        try {
            const userData = {
                emailAddress: params.emailAddress,
                displayName: params.displayName
            };
            if (params.username) {
                userData.username = params.username;
            }
            const endpoint = 'user';
            const response = await this.makeJiraRequest({ endpoint, method: 'POST', body: userData, params });
            return response;
        }
        catch (error) {
            return (0, agents_1.formatToolError)(`Error creating user: ${error}`, params);
        }
    }
}
class UpdateUserTool extends BaseJiraTool {
    constructor(args) {
        const toolInput = {
            name: 'update_user',
            description: 'Update an existing user in Jira',
            schema: UpdateUserSchema,
            baseUrl: '',
            method: 'PUT',
            headers: {}
        };
        super({
            ...toolInput,
            username: args.username,
            accessToken: args.accessToken,
            jiraHost: args.jiraHost,
            maxOutputLength: args.maxOutputLength
        });
        this.defaultParams = args.defaultParams || {};
    }
    async _call(arg) {
        const params = { ...arg, ...this.defaultParams };
        try {
            const userData = {};
            if (params.emailAddress)
                userData.emailAddress = params.emailAddress;
            if (params.displayName)
                userData.displayName = params.displayName;
            const queryParams = new URLSearchParams();
            queryParams.append('accountId', params.accountId);
            const endpoint = `user?${queryParams.toString()}`;
            const response = await this.makeJiraRequest({ endpoint, method: 'PUT', body: userData, params });
            return response || 'User updated successfully';
        }
        catch (error) {
            return (0, agents_1.formatToolError)(`Error updating user: ${error}`, params);
        }
    }
}
class DeleteUserTool extends BaseJiraTool {
    constructor(args) {
        const toolInput = {
            name: 'delete_user',
            description: 'Delete a user from Jira',
            schema: DeleteUserSchema,
            baseUrl: '',
            method: 'DELETE',
            headers: {}
        };
        super({
            ...toolInput,
            username: args.username,
            accessToken: args.accessToken,
            jiraHost: args.jiraHost,
            maxOutputLength: args.maxOutputLength
        });
        this.defaultParams = args.defaultParams || {};
    }
    async _call(arg) {
        const params = { ...arg, ...this.defaultParams };
        try {
            const queryParams = new URLSearchParams();
            queryParams.append('accountId', params.accountId);
            const endpoint = `user?${queryParams.toString()}`;
            const response = await this.makeJiraRequest({ endpoint, method: 'DELETE', params });
            return response || 'User deleted successfully';
        }
        catch (error) {
            return (0, agents_1.formatToolError)(`Error deleting user: ${error}`, params);
        }
    }
}
const createJiraTools = (args) => {
    const tools = [];
    const actions = args?.actions || [];
    const username = args?.username || '';
    const accessToken = args?.accessToken || '';
    const jiraHost = args?.jiraHost || '';
    const maxOutputLength = args?.maxOutputLength || Infinity;
    const defaultParams = args?.defaultParams || {};
    // Issue tools
    if (actions.includes('listIssues')) {
        tools.push(new ListIssuesTool({
            username,
            accessToken,
            jiraHost,
            maxOutputLength,
            defaultParams
        }));
    }
    if (actions.includes('createIssue')) {
        tools.push(new CreateIssueTool({
            username,
            accessToken,
            jiraHost,
            maxOutputLength,
            defaultParams
        }));
    }
    if (actions.includes('getIssue')) {
        tools.push(new GetIssueTool({
            username,
            accessToken,
            jiraHost,
            maxOutputLength,
            defaultParams
        }));
    }
    if (actions.includes('updateIssue')) {
        tools.push(new UpdateIssueTool({
            username,
            accessToken,
            jiraHost,
            maxOutputLength,
            defaultParams
        }));
    }
    if (actions.includes('deleteIssue')) {
        tools.push(new DeleteIssueTool({
            username,
            accessToken,
            jiraHost,
            maxOutputLength,
            defaultParams
        }));
    }
    if (actions.includes('assignIssue')) {
        tools.push(new AssignIssueTool({
            username,
            accessToken,
            jiraHost,
            maxOutputLength,
            defaultParams
        }));
    }
    if (actions.includes('transitionIssue')) {
        tools.push(new TransitionIssueTool({
            username,
            accessToken,
            jiraHost,
            maxOutputLength,
            defaultParams
        }));
    }
    // Comment tools
    if (actions.includes('listComments')) {
        tools.push(new ListCommentsTool({
            username,
            accessToken,
            jiraHost,
            maxOutputLength,
            defaultParams
        }));
    }
    if (actions.includes('createComment')) {
        tools.push(new CreateCommentTool({
            username,
            accessToken,
            jiraHost,
            maxOutputLength,
            defaultParams
        }));
    }
    if (actions.includes('getComment')) {
        tools.push(new GetCommentTool({
            username,
            accessToken,
            jiraHost,
            maxOutputLength,
            defaultParams
        }));
    }
    if (actions.includes('updateComment')) {
        tools.push(new UpdateCommentTool({
            username,
            accessToken,
            jiraHost,
            maxOutputLength,
            defaultParams
        }));
    }
    if (actions.includes('deleteComment')) {
        tools.push(new DeleteCommentTool({
            username,
            accessToken,
            jiraHost,
            maxOutputLength,
            defaultParams
        }));
    }
    // User tools
    if (actions.includes('searchUsers')) {
        tools.push(new SearchUsersTool({
            username,
            accessToken,
            jiraHost,
            maxOutputLength,
            defaultParams
        }));
    }
    if (actions.includes('getUser')) {
        tools.push(new GetUserTool({
            username,
            accessToken,
            jiraHost,
            maxOutputLength,
            defaultParams
        }));
    }
    if (actions.includes('createUser')) {
        tools.push(new CreateUserTool({
            username,
            accessToken,
            jiraHost,
            maxOutputLength,
            defaultParams
        }));
    }
    if (actions.includes('updateUser')) {
        tools.push(new UpdateUserTool({
            username,
            accessToken,
            jiraHost,
            maxOutputLength,
            defaultParams
        }));
    }
    if (actions.includes('deleteUser')) {
        tools.push(new DeleteUserTool({
            username,
            accessToken,
            jiraHost,
            maxOutputLength,
            defaultParams
        }));
    }
    return tools;
};
exports.createJiraTools = createJiraTools;
//# sourceMappingURL=core.js.map