import { Serializable } from '@langchain/core/load/serializable';
/**
 * Security configuration for file operations
 */
export interface FileSecurityConfig {
    /** Base workspace path - all file operations are restricted to this directory */
    workspacePath: string;
    /** Whether to enforce workspace boundaries (default: true) */
    enforceWorkspaceBoundaries?: boolean;
    /** Maximum file size in bytes (default: 10MB) */
    maxFileSize?: number;
    /** Allowed file extensions (if empty, all extensions allowed) */
    allowedExtensions?: string[];
    /** Blocked file extensions */
    blockedExtensions?: string[];
}
/**
 * Secure file store that enforces workspace boundaries and validates file operations
 */
export declare class SecureFileStore extends Serializable {
    lc_namespace: string[];
    private config;
    private nodeFileStore;
    constructor(config: FileSecurityConfig);
    /**
     * Validates a file path against security policies
     */
    private validateFilePath;
    /**
     * Validates file size
     */
    private validateFileSize;
    /**
     * Reads a file with security validation
     */
    readFile(filePath: string): Promise<string>;
    /**
     * Writes a file with security validation
     */
    writeFile(filePath: string, contents: string): Promise<void>;
    /**
     * Gets the workspace configuration
     */
    getConfig(): Readonly<Required<FileSecurityConfig>>;
    /**
     * Creates a secure file store with workspace enforcement disabled (for backward compatibility)
     * WARNING: This should only be used when absolutely necessary and with proper user consent
     */
    static createUnsecure(basePath?: string): SecureFileStore;
}
