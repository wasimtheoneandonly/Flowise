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
exports.isDeniedIP = isDeniedIP;
exports.checkDenyList = checkDenyList;
exports.secureAxiosRequest = secureAxiosRequest;
exports.secureFetch = secureFetch;
const ipaddr = __importStar(require("ipaddr.js"));
const promises_1 = __importDefault(require("dns/promises"));
const axios_1 = __importDefault(require("axios"));
const node_fetch_1 = __importDefault(require("node-fetch"));
/**
 * Checks if an IP address is in the deny list
 * @param ip - IP address to check
 * @param denyList - Array of denied IP addresses/CIDR ranges
 * @throws Error if IP is in deny list
 */
function isDeniedIP(ip, denyList) {
    const parsedIp = ipaddr.parse(ip);
    for (const entry of denyList) {
        if (entry.includes('/')) {
            try {
                const [range, _] = entry.split('/');
                const parsedRange = ipaddr.parse(range);
                if (parsedIp.kind() === parsedRange.kind()) {
                    if (parsedIp.match(ipaddr.parseCIDR(entry))) {
                        throw new Error('Access to this host is denied by policy.');
                    }
                }
            }
            catch (error) {
                throw new Error(`isDeniedIP: ${error}`);
            }
        }
        else if (ip === entry) {
            throw new Error('Access to this host is denied by policy.');
        }
    }
}
/**
 * Checks if a URL is allowed based on HTTP_DENY_LIST environment variable
 * @param url - URL to check
 * @throws Error if URL hostname resolves to a denied IP
 */
async function checkDenyList(url) {
    const httpDenyListString = process.env.HTTP_DENY_LIST;
    if (!httpDenyListString)
        return;
    const httpDenyList = httpDenyListString.split(',').map((ip) => ip.trim());
    const urlObj = new URL(url);
    const hostname = urlObj.hostname;
    if (ipaddr.isValid(hostname)) {
        isDeniedIP(hostname, httpDenyList);
    }
    else {
        const addresses = await promises_1.default.lookup(hostname, { all: true });
        for (const address of addresses) {
            isDeniedIP(address.address, httpDenyList);
        }
    }
}
/**
 * Makes a secure HTTP request that validates all URLs in redirect chains against the deny list
 * @param config - Axios request configuration
 * @param maxRedirects - Maximum number of redirects to follow (default: 5)
 * @returns Promise<AxiosResponse>
 * @throws Error if any URL in the redirect chain is denied
 */
async function secureAxiosRequest(config, maxRedirects = 5) {
    let currentUrl = config.url;
    let redirectCount = 0;
    let currentConfig = { ...config, maxRedirects: 0 }; // Disable automatic redirects
    // Validate the initial URL
    if (currentUrl) {
        await checkDenyList(currentUrl);
    }
    while (redirectCount <= maxRedirects) {
        try {
            // Update the URL in config for subsequent requests
            currentConfig.url = currentUrl;
            const response = await (0, axios_1.default)(currentConfig);
            // If it's a successful response (not a redirect), return it
            if (response.status < 300 || response.status >= 400) {
                return response;
            }
            // Handle redirect
            const location = response.headers.location;
            if (!location) {
                // No location header, but it's a redirect status - return the response
                return response;
            }
            redirectCount++;
            if (redirectCount > maxRedirects) {
                throw new Error('Too many redirects');
            }
            // Resolve the redirect URL (handle relative URLs)
            const redirectUrl = new URL(location, currentUrl).toString();
            // Validate the redirect URL against the deny list
            await checkDenyList(redirectUrl);
            // Update current URL for next iteration
            currentUrl = redirectUrl;
            // For redirects, we only need to preserve certain headers and change method if needed
            if (response.status === 301 || response.status === 302 || response.status === 303) {
                // For 303, or when redirecting POST requests, change to GET
                if (response.status === 303 ||
                    (currentConfig.method && ['POST', 'PUT', 'PATCH'].includes(currentConfig.method.toUpperCase()))) {
                    currentConfig.method = 'GET';
                    delete currentConfig.data;
                }
            }
        }
        catch (error) {
            // If it's not a redirect-related error from axios, propagate it
            if (error.response && error.response.status >= 300 && error.response.status < 400) {
                // This is a redirect response that axios couldn't handle automatically
                // Continue with our manual redirect handling
                const response = error.response;
                const location = response.headers.location;
                if (!location) {
                    return response;
                }
                redirectCount++;
                if (redirectCount > maxRedirects) {
                    throw new Error('Too many redirects');
                }
                const redirectUrl = new URL(location, currentUrl).toString();
                await checkDenyList(redirectUrl);
                currentUrl = redirectUrl;
                // Handle method changes for redirects
                if (response.status === 301 || response.status === 302 || response.status === 303) {
                    if (response.status === 303 ||
                        (currentConfig.method && ['POST', 'PUT', 'PATCH'].includes(currentConfig.method.toUpperCase()))) {
                        currentConfig.method = 'GET';
                        delete currentConfig.data;
                    }
                }
                continue;
            }
            // For other errors, re-throw
            throw error;
        }
    }
    throw new Error('Too many redirects');
}
/**
 * Makes a secure fetch request that validates all URLs in redirect chains against the deny list
 * @param url - URL to fetch
 * @param init - Fetch request options
 * @param maxRedirects - Maximum number of redirects to follow (default: 5)
 * @returns Promise<Response>
 * @throws Error if any URL in the redirect chain is denied
 */
async function secureFetch(url, init, maxRedirects = 5) {
    let currentUrl = url;
    let redirectCount = 0;
    let currentInit = { ...init, redirect: 'manual' }; // Disable automatic redirects
    // Validate the initial URL
    await checkDenyList(currentUrl);
    while (redirectCount <= maxRedirects) {
        const response = await (0, node_fetch_1.default)(currentUrl, currentInit);
        // If it's a successful response (not a redirect), return it
        if (response.status < 300 || response.status >= 400) {
            return response;
        }
        // Handle redirect
        const location = response.headers.get('location');
        if (!location) {
            // No location header, but it's a redirect status - return the response
            return response;
        }
        redirectCount++;
        if (redirectCount > maxRedirects) {
            throw new Error('Too many redirects');
        }
        // Resolve the redirect URL (handle relative URLs)
        const redirectUrl = new URL(location, currentUrl).toString();
        // Validate the redirect URL against the deny list
        await checkDenyList(redirectUrl);
        // Update current URL for next iteration
        currentUrl = redirectUrl;
        // Handle method changes for redirects according to HTTP specs
        if (response.status === 301 || response.status === 302 || response.status === 303) {
            // For 303, or when redirecting POST/PUT/PATCH requests, change to GET
            if (response.status === 303 || (currentInit.method && ['POST', 'PUT', 'PATCH'].includes(currentInit.method.toUpperCase()))) {
                currentInit = {
                    ...currentInit,
                    method: 'GET',
                    body: undefined
                };
            }
        }
    }
    throw new Error('Too many redirects');
}
//# sourceMappingURL=httpSecurity.js.map