/**
 * Validates if a string is a valid UUID v4
 * @param {string} uuid The string to validate
 * @returns {boolean} True if valid UUID, false otherwise
 */
export declare const isValidUUID: (uuid: string) => boolean;
/**
 * Validates if a string is a valid URL
 * @param {string} url The string to validate
 * @returns {boolean} True if valid URL, false otherwise
 */
export declare const isValidURL: (url: string) => boolean;
/**
 * Validates if a string contains path traversal attempts
 * @param {string} path The string to validate
 * @returns {boolean} True if path traversal detected, false otherwise
 */
export declare const isPathTraversal: (path: string) => boolean;
/**
 * Enhanced path validation for workspace-scoped file operations
 * @param {string} filePath The file path to validate
 * @returns {boolean} True if path traversal detected, false otherwise
 */
export declare const isUnsafeFilePath: (filePath: string) => boolean;
/**
 * Validates if a file path is within the allowed workspace boundaries
 * @param {string} filePath The file path to validate
 * @param {string} workspacePath The workspace base path
 * @returns {boolean} True if path is within workspace, false otherwise
 */
export declare const isWithinWorkspace: (filePath: string, workspacePath: string) => boolean;
