"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ReadFileTool = void 0;
const zod_1 = require("zod");
const path_1 = __importDefault(require("path"));
const tools_1 = require("@langchain/core/tools");
const serializable_1 = require("@langchain/core/load/serializable");
const utils_1 = require("../../../src/utils");
const SecureFileStore_1 = require("../../../src/SecureFileStore");
class BaseFileStore extends serializable_1.Serializable {
}
class ReadFile_Tools {
    constructor() {
        this.label = 'Read File';
        this.name = 'readFile';
        this.version = 2.0;
        this.type = 'ReadFile';
        this.icon = 'readfile.svg';
        this.category = 'Tools';
        this.warning = 'This tool can be used to read files from the disk. It is recommended to use this tool with caution.';
        this.description = 'Read file from disk';
        this.baseClasses = [this.type, 'Tool', ...(0, utils_1.getBaseClasses)(ReadFileTool)];
        this.inputs = [
            {
                label: 'Workspace Path',
                name: 'workspacePath',
                placeholder: `C:\\Users\\User\\MyProject`,
                type: 'string',
                description: 'Base workspace directory for file operations. All file paths will be relative to this directory.',
                optional: true
            },
            {
                label: 'Enforce Workspace Boundaries',
                name: 'enforceWorkspaceBoundaries',
                type: 'boolean',
                description: 'When enabled, restricts file access to the workspace directory for security. Recommended: true',
                default: true,
                optional: true
            },
            {
                label: 'Max File Size (MB)',
                name: 'maxFileSize',
                type: 'number',
                description: 'Maximum file size in megabytes that can be read',
                default: 10,
                optional: true
            },
            {
                label: 'Allowed Extensions',
                name: 'allowedExtensions',
                type: 'string',
                description: 'Comma-separated list of allowed file extensions (e.g., .txt,.json,.md). Leave empty to allow all.',
                placeholder: '.txt,.json,.md,.py,.js',
                optional: true
            }
        ];
    }
    async init(nodeData) {
        const workspacePath = nodeData.inputs?.workspacePath;
        const enforceWorkspaceBoundaries = nodeData.inputs?.enforceWorkspaceBoundaries !== false; // Default to true
        const maxFileSize = nodeData.inputs?.maxFileSize;
        const allowedExtensions = nodeData.inputs?.allowedExtensions;
        // Parse allowed extensions
        const allowedExtensionsList = allowedExtensions ? allowedExtensions.split(',').map((ext) => ext.trim().toLowerCase()) : [];
        let store;
        if (workspacePath) {
            // Create secure file store with workspace boundaries
            const config = {
                workspacePath,
                enforceWorkspaceBoundaries,
                maxFileSize: maxFileSize ? maxFileSize * 1024 * 1024 : undefined, // Convert MB to bytes
                allowedExtensions: allowedExtensionsList.length > 0 ? allowedExtensionsList : undefined
            };
            store = new SecureFileStore_1.SecureFileStore(config);
        }
        else {
            // Fallback to current working directory with security warnings
            if (enforceWorkspaceBoundaries) {
                const fallbackWorkspacePath = path_1.default.join((0, utils_1.getUserHome)(), '.flowise');
                console.warn(`[ReadFile] No workspace path specified, using ${fallbackWorkspacePath} with security restrictions`);
                store = new SecureFileStore_1.SecureFileStore({
                    workspacePath: fallbackWorkspacePath,
                    enforceWorkspaceBoundaries: true,
                    maxFileSize: maxFileSize ? maxFileSize * 1024 * 1024 : undefined,
                    allowedExtensions: allowedExtensionsList.length > 0 ? allowedExtensionsList : undefined
                });
            }
            else {
                console.warn('[ReadFile] SECURITY WARNING: Workspace boundaries disabled - unrestricted file access enabled');
                store = SecureFileStore_1.SecureFileStore.createUnsecure();
            }
        }
        return new ReadFileTool({ store });
    }
}
/**
 * Class for reading files from the disk. Extends the StructuredTool
 * class.
 */
class ReadFileTool extends tools_1.StructuredTool {
    static lc_name() {
        return 'ReadFileTool';
    }
    constructor({ store }) {
        super(...arguments);
        this.schema = zod_1.z.object({
            file_path: zod_1.z.string().describe('name of file')
        });
        this.name = 'read_file';
        this.description = 'Read file from disk';
        this.store = store;
    }
    async _call({ file_path }) {
        return await this.store.readFile(file_path);
    }
}
exports.ReadFileTool = ReadFileTool;
module.exports = { nodeClass: ReadFile_Tools };
//# sourceMappingURL=ReadFile.js.map