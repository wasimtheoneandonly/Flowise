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
exports.SecureFileStore = void 0;
const serializable_1 = require("@langchain/core/load/serializable");
const node_1 = require("langchain/stores/file/node");
const validator_1 = require("./validator");
const path = __importStar(require("path"));
const fs = __importStar(require("fs"));
/**
 * Secure file store that enforces workspace boundaries and validates file operations
 */
class SecureFileStore extends serializable_1.Serializable {
    constructor(config) {
        super();
        this.lc_namespace = ['flowise', 'components', 'stores', 'file'];
        // Set default configuration
        this.config = {
            workspacePath: config.workspacePath,
            enforceWorkspaceBoundaries: config.enforceWorkspaceBoundaries ?? true,
            maxFileSize: config.maxFileSize ?? 10 * 1024 * 1024, // 10MB default
            allowedExtensions: config.allowedExtensions ?? [],
            blockedExtensions: config.blockedExtensions ?? [
                '.exe',
                '.bat',
                '.cmd',
                '.sh',
                '.ps1',
                '.vbs',
                '.scr',
                '.com',
                '.pif',
                '.dll',
                '.sys',
                '.msi',
                '.jar'
            ]
        };
        // Validate workspace path
        if (!this.config.workspacePath || !path.isAbsolute(this.config.workspacePath)) {
            throw new Error('Workspace path must be an absolute path');
        }
        // Ensure workspace directory exists
        if (!fs.existsSync(this.config.workspacePath)) {
            throw new Error(`Workspace directory does not exist: ${this.config.workspacePath}`);
        }
        // Initialize the underlying NodeFileStore with workspace path
        this.nodeFileStore = new node_1.NodeFileStore(this.config.workspacePath);
    }
    /**
     * Validates a file path against security policies
     */
    validateFilePath(filePath) {
        // Check for unsafe path patterns
        if ((0, validator_1.isUnsafeFilePath)(filePath)) {
            throw new Error(`Unsafe file path detected: ${filePath}`);
        }
        // Enforce workspace boundaries if enabled
        if (this.config.enforceWorkspaceBoundaries) {
            if (!(0, validator_1.isWithinWorkspace)(filePath, this.config.workspacePath)) {
                throw new Error(`File path outside workspace boundaries: ${filePath}`);
            }
        }
        // Check file extension
        const ext = path.extname(filePath).toLowerCase();
        // Check blocked extensions
        if (this.config.blockedExtensions.includes(ext)) {
            throw new Error(`File extension not allowed: ${ext}`);
        }
        // Check allowed extensions (if specified)
        if (this.config.allowedExtensions.length > 0 && !this.config.allowedExtensions.includes(ext)) {
            throw new Error(`File extension not in allowed list: ${ext}`);
        }
    }
    /**
     * Validates file size
     */
    validateFileSize(content) {
        const sizeInBytes = Buffer.byteLength(content, 'utf8');
        if (sizeInBytes > this.config.maxFileSize) {
            throw new Error(`File size exceeds maximum allowed size: ${sizeInBytes} > ${this.config.maxFileSize}`);
        }
    }
    /**
     * Reads a file with security validation
     */
    async readFile(filePath) {
        this.validateFilePath(filePath);
        try {
            return await this.nodeFileStore.readFile(filePath);
        }
        catch (error) {
            // Provide generic error message to avoid information leakage
            throw new Error(`Failed to read file: ${path.basename(filePath)}`);
        }
    }
    /**
     * Writes a file with security validation
     */
    async writeFile(filePath, contents) {
        this.validateFilePath(filePath);
        this.validateFileSize(contents);
        try {
            // Ensure the directory exists
            const dir = path.dirname(path.resolve(this.config.workspacePath, filePath));
            if (!fs.existsSync(dir)) {
                fs.mkdirSync(dir, { recursive: true });
            }
            await this.nodeFileStore.writeFile(filePath, contents);
        }
        catch (error) {
            // Provide generic error message to avoid information leakage
            throw new Error(`Failed to write file: ${path.basename(filePath)}`);
        }
    }
    /**
     * Gets the workspace configuration
     */
    getConfig() {
        return { ...this.config };
    }
    /**
     * Creates a secure file store with workspace enforcement disabled (for backward compatibility)
     * WARNING: This should only be used when absolutely necessary and with proper user consent
     */
    static createUnsecure(basePath) {
        const workspacePath = basePath || process.cwd();
        return new SecureFileStore({
            workspacePath,
            enforceWorkspaceBoundaries: false,
            maxFileSize: 50 * 1024 * 1024, // 50MB for unsecure mode
            blockedExtensions: [] // No extension restrictions in unsecure mode
        });
    }
}
exports.SecureFileStore = SecureFileStore;
//# sourceMappingURL=SecureFileStore.js.map