"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.sanitizeNullBytes = sanitizeNullBytes;
exports.sanitizeUser = sanitizeUser;
function sanitizeNullBytes(obj) {
    const stack = [obj];
    while (stack.length) {
        const current = stack.pop();
        if (Array.isArray(current)) {
            for (let i = 0; i < current.length; i++) {
                const val = current[i];
                if (typeof val === 'string') {
                    // eslint-disable-next-line no-control-regex
                    current[i] = val.replace(/\u0000/g, '');
                }
                else if (val && typeof val === 'object') {
                    stack.push(val);
                }
            }
        }
        else if (current && typeof current === 'object') {
            for (const key in current) {
                if (!Object.hasOwnProperty.call(current, key))
                    continue;
                const val = current[key];
                if (typeof val === 'string') {
                    // eslint-disable-next-line no-control-regex
                    current[key] = val.replace(/\u0000/g, '');
                }
                else if (val && typeof val === 'object') {
                    stack.push(val);
                }
            }
        }
    }
    return obj;
}
function sanitizeUser(user) {
    delete user.credential;
    delete user.tempToken;
    delete user.tokenExpiry;
    return user;
}
//# sourceMappingURL=sanitize.util.js.map