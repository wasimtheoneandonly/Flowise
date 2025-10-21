"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.isWithinWorkspace = exports.isUnsafeFilePath = exports.isPathTraversal = exports.isValidURL = exports.isValidUUID = void 0;
/**
 * Validates if a string is a valid UUID v4
 * @param {string} uuid The string to validate
 * @returns {boolean} True if valid UUID, false otherwise
 */
const isValidUUID = (uuid) => {
    // UUID v4 regex pattern
    const uuidV4Pattern = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    return uuidV4Pattern.test(uuid);
};
exports.isValidUUID = isValidUUID;
/**
 * Validates if a string is a valid URL
 * @param {string} url The string to validate
 * @returns {boolean} True if valid URL, false otherwise
 */
const isValidURL = (url) => {
    try {
        new URL(url);
        return true;
    }
    catch {
        return false;
    }
};
exports.isValidURL = isValidURL;
/**
 * Validates if a string contains path traversal attempts
 * @param {string} path The string to validate
 * @returns {boolean} True if path traversal detected, false otherwise
 */
const isPathTraversal = (path) => {
    // Check for common path traversal patterns
    const dangerousPatterns = [
        '..', // Directory traversal
        '/', // Root directory
        '\\', // Windows root directory
        '%2e', // URL encoded .
        '%2f', // URL encoded /
        '%5c' // URL encoded \
    ];
    return dangerousPatterns.some((pattern) => path.toLowerCase().includes(pattern));
};
exports.isPathTraversal = isPathTraversal;
/**
 * Enhanced path validation for workspace-scoped file operations
 * @param {string} filePath The file path to validate
 * @returns {boolean} True if path traversal detected, false otherwise
 */
const isUnsafeFilePath = (filePath) => {
    if (!filePath || typeof filePath !== 'string') {
        return true;
    }
    // Check for path traversal patterns
    const dangerousPatterns = [
        /\.\./, // Directory traversal (..)
        /%2e%2e/i, // URL encoded ..
        /%2f/i, // URL encoded /
        /%5c/i, // URL encoded \
        /\0/, // Null bytes
        // eslint-disable-next-line no-control-regex
        /[\x00-\x1f]/, // Control characters
        /^\/[^/]/, // Absolute Unix paths (starting with /)
        /^[a-zA-Z]:\\/, // Absolute Windows paths (C:\)
        /^\\\\[^\\]/, // UNC paths (\\server\)
        /^\\\\\?\\/ // Extended-length paths (\\?\)
    ];
    return dangerousPatterns.some((pattern) => pattern.test(filePath));
};
exports.isUnsafeFilePath = isUnsafeFilePath;
/**
 * Validates if a file path is within the allowed workspace boundaries
 * @param {string} filePath The file path to validate
 * @param {string} workspacePath The workspace base path
 * @returns {boolean} True if path is within workspace, false otherwise
 */
const isWithinWorkspace = (filePath, workspacePath) => {
    if (!filePath || !workspacePath) {
        return false;
    }
    try {
        const path = require('path');
        // Resolve both paths to absolute paths
        const resolvedFilePath = path.resolve(workspacePath, filePath);
        const resolvedWorkspacePath = path.resolve(workspacePath);
        // Normalize paths to handle different separators
        const normalizedFilePath = path.normalize(resolvedFilePath);
        const normalizedWorkspacePath = path.normalize(resolvedWorkspacePath);
        // Check if the file path starts with the workspace path
        const relativePath = path.relative(normalizedWorkspacePath, normalizedFilePath);
        // If relative path starts with '..' or is absolute, it's outside workspace
        return !relativePath.startsWith('..') && !path.isAbsolute(relativePath);
    }
    catch (error) {
        // If any error occurs during path resolution, deny access
        return false;
    }
};
exports.isWithinWorkspace = isWithinWorkspace;
//# sourceMappingURL=validator.js.map