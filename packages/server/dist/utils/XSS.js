"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.sanitizeMiddleware = sanitizeMiddleware;
exports.getAllowedCorsOrigins = getAllowedCorsOrigins;
exports.getCorsOptions = getCorsOptions;
exports.getAllowedIframeOrigins = getAllowedIframeOrigins;
const sanitize_html_1 = __importDefault(require("sanitize-html"));
function sanitizeMiddleware(req, res, next) {
    // decoding is necessary as the url is encoded by the browser
    const decodedURI = decodeURI(req.url);
    req.url = (0, sanitize_html_1.default)(decodedURI);
    for (let p in req.query) {
        if (Array.isArray(req.query[p])) {
            const sanitizedQ = [];
            for (const q of req.query[p]) {
                sanitizedQ.push((0, sanitize_html_1.default)(q));
            }
            req.query[p] = sanitizedQ;
        }
        else {
            req.query[p] = (0, sanitize_html_1.default)(req.query[p]);
        }
    }
    next();
}
function getAllowedCorsOrigins() {
    // Expects FQDN separated by commas, otherwise nothing or * for all.
    return process.env.CORS_ORIGINS ?? '*';
}
function getCorsOptions() {
    const corsOptions = {
        origin: function (origin, callback) {
            const allowedOrigins = getAllowedCorsOrigins();
            if (!origin || allowedOrigins == '*' || allowedOrigins.indexOf(origin) !== -1) {
                callback(null, true);
            }
            else {
                callback(null, false);
            }
        }
    };
    return corsOptions;
}
function getAllowedIframeOrigins() {
    // Expects FQDN separated by commas, otherwise nothing or * for all.
    // Also CSP allowed values: self or none
    return process.env.IFRAME_ORIGINS ?? '*';
}
//# sourceMappingURL=XSS.js.map