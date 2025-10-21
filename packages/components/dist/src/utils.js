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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.parseJsonBody = exports.processTemplateVariables = exports.createCodeExecutionSandbox = exports.executeJavaScriptCode = exports.stripHTMLFromToolInput = exports.refreshOAuth2Token = exports.normalizeKeysRecursively = exports.normalizeSpecialChars = exports.handleDocumentLoaderDocuments = exports.handleDocumentLoaderMetadata = exports.parseDocumentLoaderMetadata = exports.handleDocumentLoaderOutput = exports.resolveFlowObjValue = exports.extractOutputFromArray = exports.removeInvalidImageMarkdown = exports.mapMimeTypeToExt = exports.mapMimeTypeToInputField = exports.mapExtToInputField = exports.getVersion = exports.prepareSandboxVars = exports.getVars = exports.convertMultiOptionsToStringArray = exports.convertBaseMessagetoIMessage = exports.flattenObject = exports.convertSchemaToZod = exports.serializeChatHistory = exports.convertChatHistoryToText = exports.mapChatMessageToBaseMessage = exports.getUserHome = exports.getCredentialParam = exports.defaultChain = exports.getCredentialData = exports.getEncryptionKeyPath = exports.getEnvironmentVariable = exports.getAvailableURLs = exports.transformBracesWithColon = exports.getInputVariables = exports.getNodeModulesPackagePath = exports.getBaseClasses = exports.defaultAllowBuiltInDep = exports.availableDependencies = exports.FLOWISE_CHATID = exports.notEmptyRegex = exports.numberOrExpressionRegex = void 0;
exports.serializeQueryParams = serializeQueryParams;
exports.handleErrorMessage = handleErrorMessage;
exports.webCrawl = webCrawl;
exports.getURLsFromXML = getURLsFromXML;
exports.xmlScrape = xmlScrape;
exports.handleEscapeCharacters = handleEscapeCharacters;
const axios_1 = __importDefault(require("axios"));
const cheerio_1 = require("cheerio");
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
const jsdom_1 = require("jsdom");
const zod_1 = require("zod");
const turndown_1 = __importDefault(require("turndown"));
const typeorm_1 = require("typeorm");
const crypto_js_1 = require("crypto-js");
const lodash_1 = require("lodash");
const messages_1 = require("@langchain/core/messages");
const storageUtils_1 = require("./storageUtils");
const client_secrets_manager_1 = require("@aws-sdk/client-secrets-manager");
const commonUtils_1 = require("../nodes/sequentialagents/commonUtils");
const nodevm_1 = require("@flowiseai/nodevm");
const code_interpreter_1 = require("@e2b/code-interpreter");
const httpSecurity_1 = require("./httpSecurity");
const json5_1 = __importDefault(require("json5"));
exports.numberOrExpressionRegex = '^(\\d+\\.?\\d*|{{.*}})$'; //return true if string consists only numbers OR expression {{}}
exports.notEmptyRegex = '(.|\\s)*\\S(.|\\s)*'; //return true if string is not empty or blank
exports.FLOWISE_CHATID = 'flowise_chatId';
let secretsManagerClient = null;
const USE_AWS_SECRETS_MANAGER = process.env.SECRETKEY_STORAGE_TYPE === 'aws';
if (USE_AWS_SECRETS_MANAGER) {
    const region = process.env.SECRETKEY_AWS_REGION || 'us-east-1'; // Default region if not provided
    const accessKeyId = process.env.SECRETKEY_AWS_ACCESS_KEY;
    const secretAccessKey = process.env.SECRETKEY_AWS_SECRET_KEY;
    const secretManagerConfig = {
        region: region
    };
    if (accessKeyId && secretAccessKey) {
        secretManagerConfig.credentials = {
            accessKeyId,
            secretAccessKey
        };
    }
    secretsManagerClient = new client_secrets_manager_1.SecretsManagerClient(secretManagerConfig);
}
/*
 * List of dependencies allowed to be import in @flowiseai/nodevm
 */
exports.availableDependencies = [
    '@aws-sdk/client-bedrock-runtime',
    '@aws-sdk/client-dynamodb',
    '@aws-sdk/client-s3',
    '@elastic/elasticsearch',
    '@dqbd/tiktoken',
    '@getzep/zep-js',
    '@gomomento/sdk',
    '@gomomento/sdk-core',
    '@google-ai/generativelanguage',
    '@google/generative-ai',
    '@huggingface/inference',
    '@langchain/anthropic',
    '@langchain/aws',
    '@langchain/cohere',
    '@langchain/community',
    '@langchain/core',
    '@langchain/google-genai',
    '@langchain/google-vertexai',
    '@langchain/groq',
    '@langchain/langgraph',
    '@langchain/mistralai',
    '@langchain/mongodb',
    '@langchain/ollama',
    '@langchain/openai',
    '@langchain/pinecone',
    '@langchain/qdrant',
    '@langchain/weaviate',
    '@notionhq/client',
    '@opensearch-project/opensearch',
    '@pinecone-database/pinecone',
    '@qdrant/js-client-rest',
    '@supabase/supabase-js',
    '@upstash/redis',
    '@zilliz/milvus2-sdk-node',
    'apify-client',
    'cheerio',
    'chromadb',
    'cohere-ai',
    'd3-dsv',
    'faiss-node',
    'form-data',
    'google-auth-library',
    'graphql',
    'html-to-text',
    'ioredis',
    'langchain',
    'langfuse',
    'langsmith',
    'langwatch',
    'linkifyjs',
    'lunary',
    'mammoth',
    'mongodb',
    'mysql2',
    'node-html-markdown',
    'notion-to-md',
    'openai',
    'pdf-parse',
    'pdfjs-dist',
    'pg',
    'playwright',
    'puppeteer',
    'redis',
    'replicate',
    'srt-parser-2',
    'typeorm',
    'weaviate-ts-client'
];
const defaultAllowExternalDependencies = ['axios', 'moment', 'node-fetch'];
exports.defaultAllowBuiltInDep = [
    'assert',
    'buffer',
    'crypto',
    'events',
    'http',
    'https',
    'net',
    'path',
    'querystring',
    'timers',
    'tls',
    'url',
    'zlib'
];
/**
 * Get base classes of components
 *
 * @export
 * @param {any} targetClass
 * @returns {string[]}
 */
const getBaseClasses = (targetClass) => {
    const baseClasses = [];
    const skipClassNames = ['BaseLangChain', 'Serializable'];
    if (targetClass instanceof Function) {
        let baseClass = targetClass;
        while (baseClass) {
            const newBaseClass = Object.getPrototypeOf(baseClass);
            if (newBaseClass && newBaseClass !== Object && newBaseClass.name) {
                baseClass = newBaseClass;
                if (!skipClassNames.includes(baseClass.name))
                    baseClasses.push(baseClass.name);
            }
            else {
                break;
            }
        }
    }
    return baseClasses;
};
exports.getBaseClasses = getBaseClasses;
/**
 * Serialize axios query params
 *
 * @export
 * @param {any} params
 * @param {boolean} skipIndex // Set to true if you want same params to be: param=1&param=2 instead of: param[0]=1&param[1]=2
 * @returns {string}
 */
function serializeQueryParams(params, skipIndex) {
    const parts = [];
    const encode = (val) => {
        return encodeURIComponent(val)
            .replace(/%3A/gi, ':')
            .replace(/%24/g, '$')
            .replace(/%2C/gi, ',')
            .replace(/%20/g, '+')
            .replace(/%5B/gi, '[')
            .replace(/%5D/gi, ']');
    };
    const convertPart = (key, val) => {
        if (val instanceof Date)
            val = val.toISOString();
        else if (val instanceof Object)
            val = JSON.stringify(val);
        parts.push(encode(key) + '=' + encode(val));
    };
    Object.entries(params).forEach(([key, val]) => {
        if (val === null || typeof val === 'undefined')
            return;
        if (Array.isArray(val))
            val.forEach((v, i) => convertPart(`${key}${skipIndex ? '' : `[${i}]`}`, v));
        else
            convertPart(key, val);
    });
    return parts.join('&');
}
/**
 * Handle error from try catch
 *
 * @export
 * @param {any} error
 * @returns {string}
 */
function handleErrorMessage(error) {
    let errorMessage = '';
    if (error.message) {
        errorMessage += error.message + '. ';
    }
    if (error.response && error.response.data) {
        if (error.response.data.error) {
            if (typeof error.response.data.error === 'object')
                errorMessage += JSON.stringify(error.response.data.error) + '. ';
            else if (typeof error.response.data.error === 'string')
                errorMessage += error.response.data.error + '. ';
        }
        else if (error.response.data.msg)
            errorMessage += error.response.data.msg + '. ';
        else if (error.response.data.Message)
            errorMessage += error.response.data.Message + '. ';
        else if (typeof error.response.data === 'string')
            errorMessage += error.response.data + '. ';
    }
    if (!errorMessage)
        errorMessage = 'Unexpected Error.';
    return errorMessage;
}
/**
 * Returns the path of node modules package
 * @param {string} packageName
 * @returns {string}
 */
const getNodeModulesPackagePath = (packageName) => {
    const checkPaths = [
        path.join(__dirname, '..', 'node_modules', packageName),
        path.join(__dirname, '..', '..', 'node_modules', packageName),
        path.join(__dirname, '..', '..', '..', 'node_modules', packageName),
        path.join(__dirname, '..', '..', '..', '..', 'node_modules', packageName),
        path.join(__dirname, '..', '..', '..', '..', '..', 'node_modules', packageName)
    ];
    for (const checkPath of checkPaths) {
        if (fs.existsSync(checkPath)) {
            return checkPath;
        }
    }
    return '';
};
exports.getNodeModulesPackagePath = getNodeModulesPackagePath;
/**
 * Get input variables
 * @param {string} paramValue
 * @returns {boolean}
 */
const getInputVariables = (paramValue) => {
    if (typeof paramValue !== 'string')
        return [];
    const returnVal = paramValue;
    const variableStack = [];
    const inputVariables = [];
    let startIdx = 0;
    const endIdx = returnVal.length;
    while (startIdx < endIdx) {
        const substr = returnVal.substring(startIdx, startIdx + 1);
        // Check for escaped curly brackets
        if (substr === '\\' && (returnVal[startIdx + 1] === '{' || returnVal[startIdx + 1] === '}')) {
            startIdx += 2; // Skip the escaped bracket
            continue;
        }
        // Store the opening double curly bracket
        if (substr === '{') {
            variableStack.push({ substr, startIdx: startIdx + 1 });
        }
        // Found the complete variable
        if (substr === '}' && variableStack.length > 0 && variableStack[variableStack.length - 1].substr === '{') {
            const variableStartIdx = variableStack[variableStack.length - 1].startIdx;
            const variableEndIdx = startIdx;
            const variableFullPath = returnVal.substring(variableStartIdx, variableEndIdx);
            if (!variableFullPath.includes(':'))
                inputVariables.push(variableFullPath);
            variableStack.pop();
        }
        startIdx += 1;
    }
    return inputVariables;
};
exports.getInputVariables = getInputVariables;
/**
 * Transform single curly braces into double curly braces if the content includes a colon.
 * @param input - The original string that may contain { ... } segments.
 * @returns The transformed string, where { ... } containing a colon has been replaced with {{ ... }}.
 */
const transformBracesWithColon = (input) => {
    // This regex uses negative lookbehind (?<!{) and negative lookahead (?!})
    // to ensure we only match single curly braces, not double ones.
    // It will match a single { that's not preceded by another {,
    // followed by any content without braces, then a single } that's not followed by another }.
    const regex = /(?<!\{)\{([^{}]*?)\}(?!\})/g;
    return input.replace(regex, (match, groupContent) => {
        // groupContent is the text inside the braces `{ ... }`.
        if (groupContent.includes(':')) {
            // If there's a colon in the content, we turn { ... } into {{ ... }}
            // The match is the full string like: "{ answer: hello }"
            // groupContent is the inner part like: " answer: hello "
            return `{{${groupContent}}}`;
        }
        else {
            // Otherwise, leave it as is
            return match;
        }
    });
};
exports.transformBracesWithColon = transformBracesWithColon;
/**
 * Crawl all available urls given a domain url and limit
 * @param {string} url
 * @param {number} limit
 * @returns {string[]}
 */
const getAvailableURLs = async (url, limit) => {
    try {
        const availableUrls = [];
        console.info(`Crawling: ${url}`);
        availableUrls.push(url);
        const response = await axios_1.default.get(url);
        const $ = (0, cheerio_1.load)(response.data);
        const relativeLinks = $("a[href^='/']");
        console.info(`Available Relative Links: ${relativeLinks.length}`);
        if (relativeLinks.length === 0)
            return availableUrls;
        limit = Math.min(limit + 1, relativeLinks.length); // limit + 1 is because index start from 0 and index 0 is occupy by url
        console.info(`True Limit: ${limit}`);
        // availableUrls.length cannot exceed limit
        for (let i = 0; availableUrls.length < limit; i++) {
            if (i === limit)
                break; // some links are repetitive so it won't added into the array which cause the length to be lesser
            console.info(`index: ${i}`);
            const element = relativeLinks[i];
            const relativeUrl = $(element).attr('href');
            if (!relativeUrl)
                continue;
            const absoluteUrl = new URL(relativeUrl, url).toString();
            if (!availableUrls.includes(absoluteUrl)) {
                availableUrls.push(absoluteUrl);
                console.info(`Found unique relative link: ${absoluteUrl}`);
            }
        }
        return availableUrls;
    }
    catch (err) {
        throw new Error(`getAvailableURLs: ${err?.message}`);
    }
};
exports.getAvailableURLs = getAvailableURLs;
/**
 * Search for href through htmlBody string
 * @param {string} htmlBody
 * @param {string} baseURL
 * @returns {string[]}
 */
function getURLsFromHTML(htmlBody, baseURL) {
    const dom = new jsdom_1.JSDOM(htmlBody);
    const linkElements = dom.window.document.querySelectorAll('a');
    const urls = [];
    for (const linkElement of linkElements) {
        try {
            const urlObj = new URL(linkElement.href, baseURL);
            urls.push(urlObj.href);
        }
        catch (err) {
            if (process.env.DEBUG === 'true')
                console.error(`error with scraped URL: ${err.message}`);
            continue;
        }
    }
    return urls;
}
/**
 * Normalize URL to prevent crawling the same page
 * @param {string} urlString
 * @returns {string}
 */
function normalizeURL(urlString) {
    const urlObj = new URL(urlString);
    const port = urlObj.port ? `:${urlObj.port}` : '';
    const hostPath = urlObj.hostname + port + urlObj.pathname + urlObj.search;
    if (hostPath.length > 0 && hostPath.slice(-1) == '/') {
        // handling trailing slash
        return hostPath.slice(0, -1);
    }
    return hostPath;
}
/**
 * Recursive crawl using normalizeURL and getURLsFromHTML
 * @param {string} baseURL
 * @param {string} currentURL
 * @param {string[]} pages
 * @param {number} limit
 * @returns {Promise<string[]>}
 */
async function crawl(baseURL, currentURL, pages, limit) {
    const baseURLObj = new URL(baseURL);
    const currentURLObj = new URL(currentURL);
    if (limit !== 0 && pages.length === limit)
        return pages;
    if (baseURLObj.hostname !== currentURLObj.hostname)
        return pages;
    const normalizeCurrentURL = baseURLObj.protocol + '//' + normalizeURL(currentURL);
    if (pages.includes(normalizeCurrentURL)) {
        return pages;
    }
    pages.push(normalizeCurrentURL);
    if (process.env.DEBUG === 'true')
        console.info(`actively crawling ${currentURL}`);
    try {
        const resp = await (0, httpSecurity_1.secureFetch)(currentURL);
        if (resp.status > 399) {
            if (process.env.DEBUG === 'true')
                console.error(`error in fetch with status code: ${resp.status}, on page: ${currentURL}`);
            return pages;
        }
        const contentType = resp.headers.get('content-type');
        if ((contentType && !contentType.includes('text/html')) || !contentType) {
            if (process.env.DEBUG === 'true')
                console.error(`non html response, content type: ${contentType}, on page: ${currentURL}`);
            return pages;
        }
        const htmlBody = await resp.text();
        const nextURLs = getURLsFromHTML(htmlBody, currentURL);
        for (const nextURL of nextURLs) {
            pages = await crawl(baseURL, nextURL, pages, limit);
        }
    }
    catch (err) {
        if (process.env.DEBUG === 'true')
            console.error(`error in fetch url: ${err.message}, on page: ${currentURL}`);
    }
    return pages;
}
/**
 * Prep URL before passing into recursive crawl function
 * @param {string} stringURL
 * @param {number} limit
 * @returns {Promise<string[]>}
 */
async function webCrawl(stringURL, limit) {
    await (0, httpSecurity_1.checkDenyList)(stringURL);
    const URLObj = new URL(stringURL);
    const modifyURL = stringURL.slice(-1) === '/' ? stringURL.slice(0, -1) : stringURL;
    return await crawl(URLObj.protocol + '//' + URLObj.hostname, modifyURL, [], limit);
}
function getURLsFromXML(xmlBody, limit) {
    const dom = new jsdom_1.JSDOM(xmlBody, { contentType: 'text/xml' });
    const linkElements = dom.window.document.querySelectorAll('url');
    const urls = [];
    for (const linkElement of linkElements) {
        const locElement = linkElement.querySelector('loc');
        if (limit !== 0 && urls.length === limit)
            break;
        if (locElement?.textContent) {
            urls.push(locElement.textContent);
        }
    }
    return urls;
}
async function xmlScrape(currentURL, limit) {
    let urls = [];
    if (process.env.DEBUG === 'true')
        console.info(`actively scarping ${currentURL}`);
    try {
        const resp = await (0, httpSecurity_1.secureFetch)(currentURL);
        if (resp.status > 399) {
            if (process.env.DEBUG === 'true')
                console.error(`error in fetch with status code: ${resp.status}, on page: ${currentURL}`);
            return urls;
        }
        const contentType = resp.headers.get('content-type');
        if ((contentType && !contentType.includes('application/xml') && !contentType.includes('text/xml')) || !contentType) {
            if (process.env.DEBUG === 'true')
                console.error(`non xml response, content type: ${contentType}, on page: ${currentURL}`);
            return urls;
        }
        const xmlBody = await resp.text();
        urls = getURLsFromXML(xmlBody, limit);
    }
    catch (err) {
        if (process.env.DEBUG === 'true')
            console.error(`error in fetch url: ${err.message}, on page: ${currentURL}`);
    }
    return urls;
}
/**
 * Get env variables
 * @param {string} name
 * @returns {string | undefined}
 */
const getEnvironmentVariable = (name) => {
    try {
        return typeof process !== 'undefined' ? process.env?.[name] : undefined;
    }
    catch (e) {
        return undefined;
    }
};
exports.getEnvironmentVariable = getEnvironmentVariable;
/**
 * Returns the path of encryption key
 * @returns {string}
 */
const getEncryptionKeyFilePath = () => {
    const checkPaths = [
        path.join(__dirname, '..', '..', 'encryption.key'),
        path.join(__dirname, '..', '..', 'server', 'encryption.key'),
        path.join(__dirname, '..', '..', '..', 'encryption.key'),
        path.join(__dirname, '..', '..', '..', 'server', 'encryption.key'),
        path.join(__dirname, '..', '..', '..', '..', 'encryption.key'),
        path.join(__dirname, '..', '..', '..', '..', 'server', 'encryption.key'),
        path.join(__dirname, '..', '..', '..', '..', '..', 'encryption.key'),
        path.join(__dirname, '..', '..', '..', '..', '..', 'server', 'encryption.key'),
        path.join((0, exports.getUserHome)(), '.flowise', 'encryption.key')
    ];
    for (const checkPath of checkPaths) {
        if (fs.existsSync(checkPath)) {
            return checkPath;
        }
    }
    return '';
};
const getEncryptionKeyPath = () => {
    return process.env.SECRETKEY_PATH ? path.join(process.env.SECRETKEY_PATH, 'encryption.key') : getEncryptionKeyFilePath();
};
exports.getEncryptionKeyPath = getEncryptionKeyPath;
/**
 * Returns the encryption key
 * @returns {Promise<string>}
 */
const getEncryptionKey = async () => {
    if (process.env.FLOWISE_SECRETKEY_OVERWRITE !== undefined && process.env.FLOWISE_SECRETKEY_OVERWRITE !== '') {
        return process.env.FLOWISE_SECRETKEY_OVERWRITE;
    }
    try {
        if (USE_AWS_SECRETS_MANAGER && secretsManagerClient) {
            const secretId = process.env.SECRETKEY_AWS_NAME || 'FlowiseEncryptionKey';
            const command = new client_secrets_manager_1.GetSecretValueCommand({ SecretId: secretId });
            const response = await secretsManagerClient.send(command);
            if (response.SecretString) {
                return response.SecretString;
            }
        }
        return await fs.promises.readFile((0, exports.getEncryptionKeyPath)(), 'utf8');
    }
    catch (error) {
        throw new Error(error);
    }
};
/**
 * Decrypt credential data
 * @param {string} encryptedData
 * @param {string} componentCredentialName
 * @param {IComponentCredentials} componentCredentials
 * @returns {Promise<ICommonObject>}
 */
const decryptCredentialData = async (encryptedData) => {
    let decryptedDataStr;
    if (USE_AWS_SECRETS_MANAGER && secretsManagerClient) {
        try {
            if (encryptedData.startsWith('FlowiseCredential_')) {
                const command = new client_secrets_manager_1.GetSecretValueCommand({ SecretId: encryptedData });
                const response = await secretsManagerClient.send(command);
                if (response.SecretString) {
                    const secretObj = JSON.parse(response.SecretString);
                    decryptedDataStr = JSON.stringify(secretObj);
                }
                else {
                    throw new Error('Failed to retrieve secret value.');
                }
            }
            else {
                const encryptKey = await getEncryptionKey();
                const decryptedData = crypto_js_1.AES.decrypt(encryptedData, encryptKey);
                decryptedDataStr = decryptedData.toString(crypto_js_1.enc.Utf8);
            }
        }
        catch (error) {
            console.error(error);
            throw new Error('Failed to decrypt credential data.');
        }
    }
    else {
        // Fallback to existing code
        const encryptKey = await getEncryptionKey();
        const decryptedData = crypto_js_1.AES.decrypt(encryptedData, encryptKey);
        decryptedDataStr = decryptedData.toString(crypto_js_1.enc.Utf8);
    }
    if (!decryptedDataStr)
        return {};
    try {
        return JSON.parse(decryptedDataStr);
    }
    catch (e) {
        console.error(e);
        throw new Error('Credentials could not be decrypted.');
    }
};
/**
 * Get credential data
 * @param {string} selectedCredentialId
 * @param {ICommonObject} options
 * @returns {Promise<ICommonObject>}
 */
const getCredentialData = async (selectedCredentialId, options) => {
    const appDataSource = options.appDataSource;
    const databaseEntities = options.databaseEntities;
    try {
        if (!selectedCredentialId) {
            return {};
        }
        const credential = await appDataSource.getRepository(databaseEntities['Credential']).findOneBy({
            id: selectedCredentialId
        });
        if (!credential)
            return {};
        // Decrypt credentialData
        const decryptedCredentialData = await decryptCredentialData(credential.encryptedData);
        return decryptedCredentialData;
    }
    catch (e) {
        throw new Error(e);
    }
};
exports.getCredentialData = getCredentialData;
/**
 * Get first non falsy value
 *
 * @param {...any} values
 *
 * @returns {any|undefined}
 */
const defaultChain = (...values) => {
    return values.filter(Boolean)[0];
};
exports.defaultChain = defaultChain;
const getCredentialParam = (paramName, credentialData, nodeData, defaultValue) => {
    return nodeData.inputs[paramName] ?? credentialData[paramName] ?? defaultValue ?? undefined;
};
exports.getCredentialParam = getCredentialParam;
// reference https://www.freeformatter.com/json-escape.html
const jsonEscapeCharacters = [
    { escape: '"', value: 'FLOWISE_DOUBLE_QUOTE' },
    { escape: '\n', value: 'FLOWISE_NEWLINE' },
    { escape: '\b', value: 'FLOWISE_BACKSPACE' },
    { escape: '\f', value: 'FLOWISE_FORM_FEED' },
    { escape: '\r', value: 'FLOWISE_CARRIAGE_RETURN' },
    { escape: '\t', value: 'FLOWISE_TAB' },
    { escape: '\\', value: 'FLOWISE_BACKSLASH' }
];
function handleEscapesJSONParse(input, reverse) {
    for (const element of jsonEscapeCharacters) {
        input = reverse ? input.replaceAll(element.value, element.escape) : input.replaceAll(element.escape, element.value);
    }
    return input;
}
function iterateEscapesJSONParse(input, reverse) {
    for (const element in input) {
        const type = typeof input[element];
        if (type === 'string')
            input[element] = handleEscapesJSONParse(input[element], reverse);
        else if (type === 'object')
            input[element] = iterateEscapesJSONParse(input[element], reverse);
    }
    return input;
}
function handleEscapeCharacters(input, reverse) {
    const type = typeof input;
    if (type === 'string')
        return handleEscapesJSONParse(input, reverse);
    else if (type === 'object')
        return iterateEscapesJSONParse(input, reverse);
    return input;
}
/**
 * Get user home dir
 * @returns {string}
 */
const getUserHome = () => {
    let variableName = 'HOME';
    if (process.platform === 'win32') {
        variableName = 'USERPROFILE';
    }
    if (process.env[variableName] === undefined) {
        // If for some reason the variable does not exist, fall back to current folder
        return process.cwd();
    }
    return process.env[variableName];
};
exports.getUserHome = getUserHome;
/**
 * Map ChatMessage to BaseMessage
 * @param {IChatMessage[]} chatmessages
 * @returns {BaseMessage[]}
 */
const mapChatMessageToBaseMessage = async (chatmessages = [], orgId) => {
    const chatHistory = [];
    for (const message of chatmessages) {
        if (message.role === 'apiMessage' || message.type === 'apiMessage') {
            chatHistory.push(new messages_1.AIMessage(message.content || ''));
        }
        else if (message.role === 'userMessage' || message.type === 'userMessage') {
            // check for image/files uploads
            if (message.fileUploads) {
                // example: [{"type":"stored-file","name":"0_DiXc4ZklSTo3M8J4.jpg","mime":"image/jpeg"}]
                try {
                    let messageWithFileUploads = '';
                    const uploads = JSON.parse(message.fileUploads);
                    const imageContents = [];
                    for (const upload of uploads) {
                        if (upload.type === 'stored-file' && upload.mime.startsWith('image/')) {
                            const fileData = await (0, storageUtils_1.getFileFromStorage)(upload.name, orgId, message.chatflowid, message.chatId);
                            // as the image is stored in the server, read the file and convert it to base64
                            const bf = 'data:' + upload.mime + ';base64,' + fileData.toString('base64');
                            imageContents.push({
                                type: 'image_url',
                                image_url: {
                                    url: bf
                                }
                            });
                        }
                        else if (upload.type === 'url' && upload.mime.startsWith('image') && upload.data) {
                            imageContents.push({
                                type: 'image_url',
                                image_url: {
                                    url: upload.data
                                }
                            });
                        }
                        else if (upload.type === 'stored-file:full') {
                            const fileLoaderNodeModule = await Promise.resolve().then(() => __importStar(require('../nodes/documentloaders/File/File')));
                            // @ts-ignore
                            const fileLoaderNodeInstance = new fileLoaderNodeModule.nodeClass();
                            const options = {
                                retrieveAttachmentChatId: true,
                                chatflowid: message.chatflowid,
                                chatId: message.chatId,
                                orgId
                            };
                            let fileInputFieldFromMimeType = 'txtFile';
                            fileInputFieldFromMimeType = (0, exports.mapMimeTypeToInputField)(upload.mime);
                            const nodeData = {
                                inputs: {
                                    [fileInputFieldFromMimeType]: `FILE-STORAGE::${JSON.stringify([upload.name])}`
                                }
                            };
                            const documents = await fileLoaderNodeInstance.init(nodeData, '', options);
                            messageWithFileUploads += `<doc name='${upload.name}'>${handleEscapeCharacters(documents, true)}</doc>\n\n`;
                        }
                    }
                    const messageContent = messageWithFileUploads ? `${messageWithFileUploads}\n\n${message.content}` : message.content;
                    chatHistory.push(new messages_1.HumanMessage({
                        content: [
                            {
                                type: 'text',
                                text: messageContent
                            },
                            ...imageContents
                        ]
                    }));
                }
                catch (e) {
                    // failed to parse fileUploads, continue with text only
                    chatHistory.push(new messages_1.HumanMessage(message.content || ''));
                }
            }
            else {
                chatHistory.push(new messages_1.HumanMessage(message.content || ''));
            }
        }
    }
    return chatHistory;
};
exports.mapChatMessageToBaseMessage = mapChatMessageToBaseMessage;
/**
 * Convert incoming chat history to string
 * @param {IMessage[]} chatHistory
 * @returns {string}
 */
const convertChatHistoryToText = (chatHistory = []) => {
    return chatHistory
        .map((chatMessage) => {
        if (!chatMessage)
            return '';
        const messageContent = 'message' in chatMessage ? chatMessage.message : chatMessage.content;
        if (!messageContent || messageContent.trim() === '')
            return '';
        const messageType = 'type' in chatMessage ? chatMessage.type : chatMessage.role;
        if (messageType === 'apiMessage' || messageType === 'assistant') {
            return `Assistant: ${messageContent}`;
        }
        else if (messageType === 'userMessage' || messageType === 'user') {
            return `Human: ${messageContent}`;
        }
        else {
            return `${messageContent}`;
        }
    })
        .filter((message) => message !== '') // Remove empty messages
        .join('\n');
};
exports.convertChatHistoryToText = convertChatHistoryToText;
/**
 * Serialize array chat history to string
 * @param {string | Array<string>} chatHistory
 * @returns {string}
 */
const serializeChatHistory = (chatHistory) => {
    if (Array.isArray(chatHistory)) {
        return chatHistory.join('\n');
    }
    return chatHistory;
};
exports.serializeChatHistory = serializeChatHistory;
/**
 * Convert schema to zod schema
 * @param {string | object} schema
 * @returns {ICommonObject}
 */
const convertSchemaToZod = (schema) => {
    try {
        const parsedSchema = typeof schema === 'string' ? JSON.parse(schema) : schema;
        const zodObj = {};
        for (const sch of parsedSchema) {
            if (sch.type === 'string') {
                if (sch.required) {
                    zodObj[sch.property] = zod_1.z.string({ required_error: `${sch.property} required` }).describe(sch.description);
                }
                else {
                    zodObj[sch.property] = zod_1.z.string().describe(sch.description).optional();
                }
            }
            else if (sch.type === 'number') {
                if (sch.required) {
                    zodObj[sch.property] = zod_1.z.number({ required_error: `${sch.property} required` }).describe(sch.description);
                }
                else {
                    zodObj[sch.property] = zod_1.z.number().describe(sch.description).optional();
                }
            }
            else if (sch.type === 'boolean') {
                if (sch.required) {
                    zodObj[sch.property] = zod_1.z.boolean({ required_error: `${sch.property} required` }).describe(sch.description);
                }
                else {
                    zodObj[sch.property] = zod_1.z.boolean().describe(sch.description).optional();
                }
            }
            else if (sch.type === 'date') {
                if (sch.required) {
                    zodObj[sch.property] = zod_1.z.date({ required_error: `${sch.property} required` }).describe(sch.description);
                }
                else {
                    zodObj[sch.property] = zod_1.z.date().describe(sch.description).optional();
                }
            }
        }
        return zodObj;
    }
    catch (e) {
        throw new Error(e);
    }
};
exports.convertSchemaToZod = convertSchemaToZod;
/**
 * Flatten nested object
 * @param {ICommonObject} obj
 * @param {string} parentKey
 * @returns {ICommonObject}
 */
const flattenObject = (obj, parentKey) => {
    let result = {};
    if (!obj)
        return result;
    Object.keys(obj).forEach((key) => {
        const value = obj[key];
        const _key = parentKey ? parentKey + '.' + key : key;
        if (typeof value === 'object') {
            result = { ...result, ...(0, exports.flattenObject)(value, _key) };
        }
        else {
            result[_key] = value;
        }
    });
    return result;
};
exports.flattenObject = flattenObject;
/**
 * Convert BaseMessage to IMessage
 * @param {BaseMessage[]} messages
 * @returns {IMessage[]}
 */
const convertBaseMessagetoIMessage = (messages) => {
    const formatmessages = [];
    for (const m of messages) {
        if (m._getType() === 'human') {
            formatmessages.push({
                message: m.content,
                type: 'userMessage'
            });
        }
        else if (m._getType() === 'ai') {
            formatmessages.push({
                message: m.content,
                type: 'apiMessage'
            });
        }
        else if (m._getType() === 'system') {
            formatmessages.push({
                message: m.content,
                type: 'apiMessage'
            });
        }
    }
    return formatmessages;
};
exports.convertBaseMessagetoIMessage = convertBaseMessagetoIMessage;
/**
 * Convert MultiOptions String to String Array
 * @param {string} inputString
 * @returns {string[]}
 */
const convertMultiOptionsToStringArray = (inputString) => {
    let ArrayString = [];
    try {
        ArrayString = JSON.parse(inputString);
    }
    catch (e) {
        ArrayString = [];
    }
    return ArrayString;
};
exports.convertMultiOptionsToStringArray = convertMultiOptionsToStringArray;
/**
 * Get variables
 * @param {DataSource} appDataSource
 * @param {IDatabaseEntity} databaseEntities
 * @param {INodeData} nodeData
 */
const getVars = async (appDataSource, databaseEntities, nodeData, options) => {
    if (!options.workspaceId) {
        return [];
    }
    const variables = (await appDataSource
        .getRepository(databaseEntities['Variable'])
        .findBy({ workspaceId: (0, typeorm_1.Equal)(options.workspaceId) })) ?? [];
    // override variables defined in overrideConfig
    // nodeData.inputs.vars is an Object, check each property and override the variable
    if (nodeData?.inputs?.vars) {
        for (const propertyName of Object.getOwnPropertyNames(nodeData.inputs.vars)) {
            const foundVar = variables.find((v) => v.name === propertyName);
            if (foundVar) {
                // even if the variable was defined as runtime, we override it with static value
                foundVar.type = 'static';
                foundVar.value = nodeData.inputs.vars[propertyName];
            }
            else {
                // add it the variables, if not found locally in the db
                variables.push({ name: propertyName, type: 'static', value: nodeData.inputs.vars[propertyName] });
            }
        }
    }
    return variables;
};
exports.getVars = getVars;
/**
 * Prepare sandbox variables
 * @param {IVariable[]} variables
 */
const prepareSandboxVars = (variables) => {
    let vars = {};
    if (variables) {
        for (const item of variables) {
            let value = item.value;
            // read from .env file
            if (item.type === 'runtime') {
                value = process.env[item.name] ?? '';
            }
            Object.defineProperty(vars, item.name, {
                enumerable: true,
                configurable: true,
                writable: true,
                value: value
            });
        }
    }
    return vars;
};
exports.prepareSandboxVars = prepareSandboxVars;
let version;
const getVersion = async () => {
    if (version != null)
        return { version };
    const checkPaths = [
        path.join(__dirname, '..', 'package.json'),
        path.join(__dirname, '..', '..', 'package.json'),
        path.join(__dirname, '..', '..', '..', 'package.json'),
        path.join(__dirname, '..', '..', '..', '..', 'package.json'),
        path.join(__dirname, '..', '..', '..', '..', '..', 'package.json')
    ];
    for (const checkPath of checkPaths) {
        try {
            const content = await fs.promises.readFile(checkPath, 'utf8');
            const parsedContent = JSON.parse(content);
            version = parsedContent.version;
            return { version };
        }
        catch {
            continue;
        }
    }
    throw new Error('None of the package.json paths could be parsed');
};
exports.getVersion = getVersion;
/**
 * Map Ext to InputField
 * @param {string} ext
 * @returns {string}
 */
const mapExtToInputField = (ext) => {
    switch (ext) {
        case '.txt':
            return 'txtFile';
        case '.pdf':
            return 'pdfFile';
        case '.json':
            return 'jsonFile';
        case '.csv':
        case '.xls':
        case '.xlsx':
            return 'csvFile';
        case '.jsonl':
            return 'jsonlinesFile';
        case '.docx':
        case '.doc':
            return 'docxFile';
        case '.yaml':
            return 'yamlFile';
        default:
            return 'txtFile';
    }
};
exports.mapExtToInputField = mapExtToInputField;
/**
 * Map MimeType to InputField
 * @param {string} mimeType
 * @returns {string}
 */
const mapMimeTypeToInputField = (mimeType) => {
    switch (mimeType) {
        case 'text/plain':
            return 'txtFile';
        case 'application/pdf':
            return 'pdfFile';
        case 'application/json':
            return 'jsonFile';
        case 'text/csv':
            return 'csvFile';
        case 'application/json-lines':
        case 'application/jsonl':
        case 'text/jsonl':
            return 'jsonlinesFile';
        case 'application/vnd.openxmlformats-officedocument.wordprocessingml.document':
        case 'application/msword': {
            return 'docxFile';
        }
        case 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet':
        case 'application/vnd.ms-excel': {
            return 'excelFile';
        }
        case 'application/vnd.openxmlformats-officedocument.presentationml.presentation':
        case 'application/vnd.ms-powerpoint': {
            return 'powerpointFile';
        }
        case 'application/vnd.yaml':
        case 'application/x-yaml':
        case 'text/vnd.yaml':
        case 'text/x-yaml':
        case 'text/yaml':
            return 'yamlFile';
        default:
            return 'txtFile';
    }
};
exports.mapMimeTypeToInputField = mapMimeTypeToInputField;
/**
 * Map MimeType to Extension
 * @param {string} mimeType
 * @returns {string}
 */
const mapMimeTypeToExt = (mimeType) => {
    switch (mimeType) {
        case 'text/plain':
            return 'txt';
        case 'text/html':
            return 'html';
        case 'text/css':
            return 'css';
        case 'text/javascript':
        case 'application/javascript':
            return 'js';
        case 'text/xml':
        case 'application/xml':
            return 'xml';
        case 'text/markdown':
        case 'text/x-markdown':
            return 'md';
        case 'application/pdf':
            return 'pdf';
        case 'application/json':
            return 'json';
        case 'text/csv':
            return 'csv';
        case 'application/json-lines':
        case 'application/jsonl':
        case 'text/jsonl':
            return 'jsonl';
        case 'application/msword':
            return 'doc';
        case 'application/vnd.openxmlformats-officedocument.wordprocessingml.document':
            return 'docx';
        case 'application/vnd.ms-excel':
            return 'xls';
        case 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet':
            return 'xlsx';
        case 'application/vnd.ms-powerpoint':
            return 'ppt';
        case 'application/vnd.openxmlformats-officedocument.presentationml.presentation':
            return 'pptx';
        default:
            return '';
    }
};
exports.mapMimeTypeToExt = mapMimeTypeToExt;
// remove invalid markdown image pattern: ![<some-string>](<some-string>)
const removeInvalidImageMarkdown = (output) => {
    return typeof output === 'string' ? output.replace(/!\[.*?\]\((?!https?:\/\/).*?\)/g, '') : output;
};
exports.removeInvalidImageMarkdown = removeInvalidImageMarkdown;
/**
 * Extract output from array
 * @param {any} output
 * @returns {string}
 */
const extractOutputFromArray = (output) => {
    if (Array.isArray(output)) {
        return output.map((o) => o.text).join('\n');
    }
    else if (typeof output === 'object') {
        if (output.text)
            return output.text;
        else
            return JSON.stringify(output);
    }
    return output;
};
exports.extractOutputFromArray = extractOutputFromArray;
/**
 * Loop through the object and replace the key with the value
 * @param {any} obj
 * @param {any} sourceObj
 * @returns {any}
 */
const resolveFlowObjValue = (obj, sourceObj) => {
    if (typeof obj === 'object' && obj !== null) {
        const resolved = Array.isArray(obj) ? [] : {};
        for (const key in obj) {
            const value = obj[key];
            resolved[key] = (0, exports.resolveFlowObjValue)(value, sourceObj);
        }
        return resolved;
    }
    else if (typeof obj === 'string' && obj.startsWith('$flow')) {
        return (0, commonUtils_1.customGet)(sourceObj, obj);
    }
    else {
        return obj;
    }
};
exports.resolveFlowObjValue = resolveFlowObjValue;
const handleDocumentLoaderOutput = (docs, output) => {
    if (output === 'document') {
        return docs;
    }
    else {
        let finaltext = '';
        for (const doc of docs) {
            finaltext += `${doc.pageContent}\n`;
        }
        return handleEscapeCharacters(finaltext, false);
    }
};
exports.handleDocumentLoaderOutput = handleDocumentLoaderOutput;
const parseDocumentLoaderMetadata = (metadata) => {
    if (!metadata)
        return {};
    if (typeof metadata !== 'object') {
        return JSON.parse(metadata);
    }
    return metadata;
};
exports.parseDocumentLoaderMetadata = parseDocumentLoaderMetadata;
const handleDocumentLoaderMetadata = (docs, _omitMetadataKeys, metadata = {}, sourceIdKey) => {
    let omitMetadataKeys = [];
    if (_omitMetadataKeys) {
        omitMetadataKeys = _omitMetadataKeys.split(',').map((key) => key.trim());
    }
    metadata = (0, exports.parseDocumentLoaderMetadata)(metadata);
    return docs.map((doc) => ({
        ...doc,
        metadata: _omitMetadataKeys === '*'
            ? metadata
            : (0, lodash_1.omit)({
                ...metadata,
                ...doc.metadata,
                ...(sourceIdKey ? { [sourceIdKey]: doc.metadata[sourceIdKey] || sourceIdKey } : undefined)
            }, omitMetadataKeys)
    }));
};
exports.handleDocumentLoaderMetadata = handleDocumentLoaderMetadata;
const handleDocumentLoaderDocuments = async (loader, textSplitter) => {
    let docs = [];
    if (textSplitter) {
        let splittedDocs = await loader.load();
        splittedDocs = await textSplitter.splitDocuments(splittedDocs);
        docs = splittedDocs;
    }
    else {
        docs = await loader.load();
    }
    return docs;
};
exports.handleDocumentLoaderDocuments = handleDocumentLoaderDocuments;
/**
 * Normalize special characters in key to be used in vector store
 * @param str - Key to normalize
 * @returns Normalized key
 */
const normalizeSpecialChars = (str) => {
    return str.replace(/[^a-zA-Z0-9_]/g, '_');
};
exports.normalizeSpecialChars = normalizeSpecialChars;
/**
 * recursively normalize object keys
 * @param data - Object to normalize
 * @returns Normalized object
 */
const normalizeKeysRecursively = (data) => {
    if (Array.isArray(data)) {
        return data.map(exports.normalizeKeysRecursively);
    }
    if (data !== null && typeof data === 'object') {
        return Object.entries(data).reduce((acc, [key, value]) => {
            const newKey = (0, exports.normalizeSpecialChars)(key);
            acc[newKey] = (0, exports.normalizeKeysRecursively)(value);
            return acc;
        }, {});
    }
    return data;
};
exports.normalizeKeysRecursively = normalizeKeysRecursively;
/**
 * Check if OAuth2 token is expired and refresh if needed
 * @param {string} credentialId
 * @param {ICommonObject} credentialData
 * @param {ICommonObject} options
 * @param {number} bufferTimeMs - Buffer time in milliseconds before expiry (default: 5 minutes)
 * @returns {Promise<ICommonObject>}
 */
const refreshOAuth2Token = async (credentialId, credentialData, options, bufferTimeMs = 5 * 60 * 1000) => {
    // Check if token is expired and refresh if needed
    if (credentialData.expires_at) {
        const expiryTime = new Date(credentialData.expires_at);
        const currentTime = new Date();
        if (currentTime.getTime() > expiryTime.getTime() - bufferTimeMs) {
            if (!credentialData.refresh_token) {
                throw new Error('Access token is expired and no refresh token is available. Please re-authorize the credential.');
            }
            try {
                // Import fetch dynamically to avoid issues
                const fetch = (await Promise.resolve().then(() => __importStar(require('node-fetch')))).default;
                // Call the refresh API endpoint
                const refreshResponse = await fetch(`${options.baseURL || 'http://localhost:3000'}/api/v1/oauth2-credential/refresh/${credentialId}`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    }
                });
                if (!refreshResponse.ok) {
                    const errorData = await refreshResponse.text();
                    throw new Error(`Failed to refresh token: ${refreshResponse.status} ${refreshResponse.statusText} - ${errorData}`);
                }
                await refreshResponse.json();
                // Get the updated credential data
                const updatedCredentialData = await (0, exports.getCredentialData)(credentialId, options);
                return updatedCredentialData;
            }
            catch (error) {
                console.error('Failed to refresh access token:', error);
                throw new Error(`Failed to refresh access token: ${error instanceof Error ? error.message : 'Unknown error'}. Please re-authorize the credential.`);
            }
        }
    }
    // Token is not expired, return original data
    return credentialData;
};
exports.refreshOAuth2Token = refreshOAuth2Token;
const stripHTMLFromToolInput = (input) => {
    const turndownService = new turndown_1.default();
    let cleanedInput = turndownService.turndown(input);
    // After conversion, replace any escaped underscores and square brackets with regular unescaped ones
    cleanedInput = cleanedInput.replace(/\\([_[\]])/g, '$1');
    return cleanedInput;
};
exports.stripHTMLFromToolInput = stripHTMLFromToolInput;
// Helper function to convert require statements to ESM imports
const convertRequireToImport = (requireLine) => {
    // Remove leading/trailing whitespace and get the indentation
    const indent = requireLine.match(/^(\s*)/)?.[1] || '';
    const trimmed = requireLine.trim();
    // Match patterns like: const/let/var name = require('module')
    const defaultRequireMatch = trimmed.match(/^(const|let|var)\s+(\w+)\s*=\s*require\s*\(\s*['"`]([^'"`]+)['"`]\s*\)/);
    if (defaultRequireMatch) {
        const [, , varName, moduleName] = defaultRequireMatch;
        return `${indent}import ${varName} from '${moduleName}';`;
    }
    // Match patterns like: const { name1, name2 } = require('module')
    const destructureMatch = trimmed.match(/^(const|let|var)\s+\{\s*([^}]+)\s*\}\s*=\s*require\s*\(\s*['"`]([^'"`]+)['"`]\s*\)/);
    if (destructureMatch) {
        const [, , destructuredVars, moduleName] = destructureMatch;
        return `${indent}import { ${destructuredVars.trim()} } from '${moduleName}';`;
    }
    // Match patterns like: const name = require('module').property
    const propertyMatch = trimmed.match(/^(const|let|var)\s+(\w+)\s*=\s*require\s*\(\s*['"`]([^'"`]+)['"`]\s*\)\.(\w+)/);
    if (propertyMatch) {
        const [, , varName, moduleName, property] = propertyMatch;
        return `${indent}import { ${property} as ${varName} } from '${moduleName}';`;
    }
    // If no pattern matches, return null to skip conversion
    return null;
};
/**
 * Parse output if it's a stringified JSON or array
 * @param {any} output - The output to parse
 * @returns {any} - The parsed output or original output if not parseable
 */
const parseOutput = (output) => {
    // If output is not a string, return as-is
    if (typeof output !== 'string') {
        return output;
    }
    // Trim whitespace
    const trimmedOutput = output.trim();
    // Check if it's an empty string
    if (!trimmedOutput) {
        return output;
    }
    // Check if it looks like JSON (starts with { or [)
    if ((trimmedOutput.startsWith('{') && trimmedOutput.endsWith('}')) || (trimmedOutput.startsWith('[') && trimmedOutput.endsWith(']'))) {
        try {
            const parsedOutput = (0, exports.parseJsonBody)(trimmedOutput);
            return parsedOutput;
        }
        catch (e) {
            return output;
        }
    }
    // Return the original string if it doesn't look like JSON
    return output;
};
/**
 * Execute JavaScript code using either Sandbox or NodeVM
 * @param {string} code - The JavaScript code to execute
 * @param {ICommonObject} sandbox - The sandbox object with variables
 * @param {ICommonObject} options - Execution options
 * @returns {Promise<any>} - The execution result
 */
const executeJavaScriptCode = async (code, sandbox, options = {}) => {
    const { timeout = 300000, useSandbox = true, streamOutput, libraries = [], nodeVMOptions = {} } = options;
    const shouldUseSandbox = useSandbox && process.env.E2B_APIKEY;
    let timeoutMs = timeout;
    if (process.env.SANDBOX_TIMEOUT) {
        timeoutMs = parseInt(process.env.SANDBOX_TIMEOUT, 10);
    }
    if (shouldUseSandbox) {
        try {
            const variableDeclarations = [];
            if (sandbox['$vars']) {
                variableDeclarations.push(`const $vars = ${JSON.stringify(sandbox['$vars'])};`);
            }
            if (sandbox['$flow']) {
                variableDeclarations.push(`const $flow = ${JSON.stringify(sandbox['$flow'])};`);
            }
            // Add other sandbox variables
            for (const [key, value] of Object.entries(sandbox)) {
                if (key !== '$vars' &&
                    key !== '$flow' &&
                    key !== 'util' &&
                    key !== 'Symbol' &&
                    key !== 'child_process' &&
                    key !== 'fs' &&
                    key !== 'process') {
                    variableDeclarations.push(`const ${key} = ${JSON.stringify(value)};`);
                }
            }
            // Handle import statements properly - they must be at the top
            const lines = code.split('\n');
            const importLines = [];
            const otherLines = [];
            for (const line of lines) {
                const trimmedLine = line.trim();
                // Skip node-fetch imports since Node.js has built-in fetch
                if (trimmedLine.includes('node-fetch') || trimmedLine.includes("'fetch'") || trimmedLine.includes('"fetch"')) {
                    continue; // Skip this line entirely
                }
                // Check for existing ES6 imports and exports
                if (trimmedLine.startsWith('import ') || trimmedLine.startsWith('export ')) {
                    importLines.push(line);
                }
                // Check for CommonJS require statements and convert them to ESM imports
                else if (/^(const|let|var)\s+.*=\s*require\s*\(/.test(trimmedLine)) {
                    const convertedImport = convertRequireToImport(trimmedLine);
                    if (convertedImport) {
                        importLines.push(convertedImport);
                    }
                }
                else {
                    otherLines.push(line);
                }
            }
            const sbx = await code_interpreter_1.Sandbox.create({ apiKey: process.env.E2B_APIKEY, timeoutMs });
            // Install libraries
            for (const library of libraries) {
                await sbx.commands.run(`npm install ${library}`);
            }
            // Separate imports from the rest of the code for proper ES6 module structure
            const codeWithImports = [
                ...importLines,
                `module.exports = async function() {`,
                ...variableDeclarations,
                ...otherLines,
                `}()`
            ].join('\n');
            const execution = await sbx.runCode(codeWithImports, { language: 'js' });
            let output = '';
            if (execution.text)
                output = execution.text;
            if (!execution.text && execution.logs.stdout.length)
                output = execution.logs.stdout.join('\n');
            if (execution.error) {
                throw new Error(`${execution.error.name}: ${execution.error.value}`);
            }
            if (execution.logs.stderr.length) {
                throw new Error(execution.logs.stderr.join('\n'));
            }
            // Stream output if streaming function provided
            if (streamOutput && output) {
                streamOutput(output);
            }
            // Clean up sandbox
            sbx.kill();
            return parseOutput(output);
        }
        catch (e) {
            throw new Error(`Sandbox Execution Error: ${e}`);
        }
    }
    else {
        const builtinDeps = process.env.TOOL_FUNCTION_BUILTIN_DEP
            ? exports.defaultAllowBuiltInDep.concat(process.env.TOOL_FUNCTION_BUILTIN_DEP.split(','))
            : exports.defaultAllowBuiltInDep;
        const externalDeps = process.env.TOOL_FUNCTION_EXTERNAL_DEP ? process.env.TOOL_FUNCTION_EXTERNAL_DEP.split(',') : [];
        let deps = process.env.ALLOW_BUILTIN_DEP === 'true' ? exports.availableDependencies.concat(externalDeps) : externalDeps;
        deps.push(...defaultAllowExternalDependencies);
        deps = [...new Set(deps)];
        // Create secure wrappers for HTTP libraries
        const secureWrappers = {};
        // Axios
        const secureAxiosWrapper = async (config) => {
            return await (0, httpSecurity_1.secureAxiosRequest)(config);
        };
        secureAxiosWrapper.get = async (url, config = {}) => secureAxiosWrapper({ ...config, method: 'GET', url });
        secureAxiosWrapper.post = async (url, data, config = {}) => secureAxiosWrapper({ ...config, method: 'POST', url, data });
        secureAxiosWrapper.put = async (url, data, config = {}) => secureAxiosWrapper({ ...config, method: 'PUT', url, data });
        secureAxiosWrapper.delete = async (url, config = {}) => secureAxiosWrapper({ ...config, method: 'DELETE', url });
        secureAxiosWrapper.patch = async (url, data, config = {}) => secureAxiosWrapper({ ...config, method: 'PATCH', url, data });
        secureWrappers['axios'] = secureAxiosWrapper;
        // Node Fetch
        const secureNodeFetch = async (url, options = {}) => {
            return await (0, httpSecurity_1.secureFetch)(url, options);
        };
        secureWrappers['node-fetch'] = secureNodeFetch;
        const defaultNodeVMOptions = {
            console: 'inherit',
            sandbox,
            require: {
                external: {
                    modules: deps,
                    transitive: false // Prevent transitive dependencies
                },
                builtin: builtinDeps,
                mock: secureWrappers // Replace HTTP libraries with secure wrappers
            },
            eval: false,
            wasm: false,
            timeout: timeoutMs
        };
        // Merge with custom nodeVMOptions if provided
        const finalNodeVMOptions = { ...defaultNodeVMOptions, ...nodeVMOptions };
        const vm = new nodevm_1.NodeVM(finalNodeVMOptions);
        try {
            const response = await vm.run(`module.exports = async function() {${code}}()`, __dirname);
            let finalOutput = response;
            // Stream output if streaming function provided
            if (streamOutput && finalOutput) {
                let streamOutputString = finalOutput;
                if (typeof response === 'object') {
                    streamOutputString = JSON.stringify(finalOutput, null, 2);
                }
                streamOutput(streamOutputString);
            }
            return parseOutput(finalOutput);
        }
        catch (e) {
            throw new Error(`NodeVM Execution Error: ${e}`);
        }
    }
};
exports.executeJavaScriptCode = executeJavaScriptCode;
/**
 * Create a standard sandbox object for code execution
 * @param {string} input - The input string
 * @param {ICommonObject} variables - Variables from getVars
 * @param {ICommonObject} flow - Flow object with chatflowId, sessionId, etc.
 * @param {ICommonObject} additionalSandbox - Additional sandbox variables
 * @returns {ICommonObject} - The sandbox object
 */
const createCodeExecutionSandbox = (input, variables, flow, additionalSandbox = {}) => {
    const sandbox = {
        $input: input,
        util: undefined,
        Symbol: undefined,
        child_process: undefined,
        fs: undefined,
        process: undefined,
        ...additionalSandbox
    };
    sandbox['$vars'] = (0, exports.prepareSandboxVars)(variables);
    sandbox['$flow'] = flow;
    return sandbox;
};
exports.createCodeExecutionSandbox = createCodeExecutionSandbox;
/**
 * Process template variables in state object, replacing {{ output }} and {{ output.property }} patterns
 * @param {ICommonObject} state - The state object to process
 * @param {any} finalOutput - The output value to substitute
 * @returns {ICommonObject} - The processed state object
 */
const processTemplateVariables = (state, finalOutput) => {
    if (!state || Object.keys(state).length === 0) {
        return state;
    }
    const newState = { ...state };
    for (const key in newState) {
        const stateValue = newState[key].toString();
        if (stateValue.includes('{{ output') || stateValue.includes('{{output')) {
            // Handle simple output replacement (with or without spaces)
            if (stateValue === '{{ output }}' || stateValue === '{{output}}') {
                newState[key] = finalOutput;
                continue;
            }
            // Handle JSON path expressions like {{ output.updated }} or {{output.updated}}
            // eslint-disable-next-line
            const match = stateValue.match(/\{\{\s*output\.([\w\.]+)\s*\}\}/);
            if (match) {
                try {
                    // Parse the response if it's JSON
                    const jsonResponse = typeof finalOutput === 'string' ? JSON.parse(finalOutput) : finalOutput;
                    // Get the value using lodash get
                    const path = match[1];
                    const value = (0, lodash_1.get)(jsonResponse, path);
                    newState[key] = value ?? stateValue; // Fall back to original if path not found
                }
                catch (e) {
                    // If JSON parsing fails, keep original template
                    newState[key] = stateValue;
                }
            }
            else {
                // Handle simple {{ output }} replacement for backward compatibility
                newState[key] = newState[key].replaceAll('{{ output }}', finalOutput);
            }
        }
    }
    return newState;
};
exports.processTemplateVariables = processTemplateVariables;
/**
 * Parse JSON body with comprehensive error handling and cleanup
 * @param {string} body - The JSON string to parse
 * @returns {any} - The parsed JSON object
 * @throws {Error} - Detailed error message with suggestions for common JSON issues
 */
const parseJsonBody = (body) => {
    try {
        // First try to parse as-is with JSON5 (which handles more cases than standard JSON)
        return json5_1.default.parse(body);
    }
    catch (error) {
        try {
            // If that fails, try to clean up common issues
            let cleanedBody = body;
            // 1. Remove unnecessary backslash escapes for square brackets and braces
            // eslint-disable-next-line
            cleanedBody = cleanedBody.replace(/\\(?=[\[\]{}])/g, '');
            // 2. Fix single quotes to double quotes (but preserve quotes inside strings)
            cleanedBody = cleanedBody.replace(/'/g, '"');
            // 3. Remove trailing commas before closing brackets/braces
            cleanedBody = cleanedBody.replace(/,(\s*[}\]])/g, '$1');
            // 4. Remove comments (// and /* */)
            cleanedBody = cleanedBody
                .replace(/\/\/.*$/gm, '') // Remove single-line comments
                .replace(/\/\*[\s\S]*?\*\//g, ''); // Remove multi-line comments
            return json5_1.default.parse(cleanedBody);
        }
        catch (secondError) {
            try {
                // 3rd attempt: try with standard JSON.parse on original body
                return JSON.parse(body);
            }
            catch (thirdError) {
                try {
                    // 4th attempt: try with standard JSON.parse on cleaned body
                    const finalCleanedBody = body
                        // eslint-disable-next-line
                        .replace(/\\(?=[\[\]{}])/g, '') // Basic escape cleanup
                        .replace(/,(\s*[}\]])/g, '$1') // Remove trailing commas
                        .trim();
                    return JSON.parse(finalCleanedBody);
                }
                catch (fourthError) {
                    // Provide comprehensive error message with suggestions
                    const suggestions = [
                        '• Ensure all strings are enclosed in double quotes',
                        '• Remove trailing commas',
                        '• Remove comments (// or /* */)',
                        '• Escape special characters properly (\\n for newlines, \\" for quotes)',
                        '• Use double quotes instead of single quotes',
                        '• Remove unnecessary backslashes before brackets [ ] { }'
                    ];
                    throw new Error(`Invalid JSON format in body. Original error: ${error.message}. ` +
                        `After cleanup attempts: ${secondError.message}. 3rd attempt: ${thirdError.message}. Final attempt: ${fourthError.message}.\n\n` +
                        `Common fixes:\n${suggestions.join('\n')}\n\n` +
                        `Received body: ${body.substring(0, 200)}${body.length > 200 ? '...' : ''}`);
                }
            }
        }
    }
};
exports.parseJsonBody = parseJsonBody;
//# sourceMappingURL=utils.js.map