"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getHash = getHash;
exports.compareHash = compareHash;
exports.encrypt = encrypt;
exports.decrypt = decrypt;
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const crypto_js_1 = require("crypto-js");
const utils_1 = require("../../utils");
function getHash(value) {
    const salt = bcryptjs_1.default.genSaltSync(parseInt(process.env.PASSWORD_SALT_HASH_ROUNDS || '5'));
    return bcryptjs_1.default.hashSync(value, salt);
}
function compareHash(value1, value2) {
    return bcryptjs_1.default.compareSync(value1, value2);
}
async function encrypt(value) {
    const encryptionKey = await (0, utils_1.getEncryptionKey)();
    return crypto_js_1.AES.encrypt(value, encryptionKey).toString();
}
async function decrypt(value) {
    const encryptionKey = await (0, utils_1.getEncryptionKey)();
    return crypto_js_1.AES.decrypt(value, encryptionKey).toString(crypto_js_1.enc.Utf8);
}
//# sourceMappingURL=encryption.util.js.map