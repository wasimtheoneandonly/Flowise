import { ICommonObject } from 'flowise-components';
import { DataSource } from 'typeorm';
import { Platform } from '../Interface';
/**
 * Returns the api key path
 * @returns {string}
 */
export declare const getAPIKeyPath: () => string;
/**
 * Generate the api key
 * @returns {string}
 */
export declare const generateAPIKey: () => string;
/**
 * Generate the secret key
 * @param {string} apiKey
 * @returns {string}
 */
export declare const generateSecretHash: (apiKey: string) => string;
/**
 * Verify valid keys
 * @param {string} storedKey
 * @param {string} suppliedKey
 * @returns {boolean}
 */
export declare const compareKeys: (storedKey: string, suppliedKey: string) => boolean;
/**
 * Get API keys
 * @returns {Promise<ICommonObject[]>}
 */
export declare const getAPIKeys: () => Promise<ICommonObject[]>;
/**
 * Get API Key details
 * @param {string} apiKey
 * @returns {Promise<ICommonObject[]>}
 */
export declare const getApiKey: (apiKey: string) => Promise<ICommonObject | undefined>;
export declare const migrateApiKeysFromJsonToDb: (appDataSource: DataSource, platformType: Platform) => Promise<void>;
