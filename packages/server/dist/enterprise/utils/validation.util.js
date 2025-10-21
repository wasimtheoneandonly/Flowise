"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.isInvalidUUID = isInvalidUUID;
exports.isInvalidEmail = isInvalidEmail;
exports.isInvalidName = isInvalidName;
exports.isInvalidDateTime = isInvalidDateTime;
exports.isInvalidPassword = isInvalidPassword;
function isInvalidUUID(id) {
    const regexUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    return !id || typeof id !== 'string' || !regexUUID.test(id);
}
function isInvalidEmail(email) {
    const regexEmail = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    return !email || typeof email !== 'string' || email.length > 255 || !regexEmail.test(email);
}
function isInvalidName(name) {
    return !name || typeof name !== 'string' || name.length > 100;
}
function isInvalidDateTime(dateTime) {
    const regexDateTime = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d+)?(Z|[+-]\d{2}:\d{2})?$/;
    return !dateTime || typeof dateTime !== 'string' || !regexDateTime.test(dateTime);
}
function isInvalidPassword(password) {
    // Minimum Length: At least 8 characters
    // Maximum Length: No more than 128 characters
    // Lowercase Letter: Must contain at least one lowercase letter (a-z)
    // Uppercase Letter: Must contain at least one uppercase letter (A-Z)
    // Digit: Must contain at least one number (0-9)
    // Special Character: Must contain at least one special character (anything that's not a letter or number)
    if (!password || typeof password !== 'string' || password.length > 128) {
        return true;
    }
    const regexPassword = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^a-zA-Z0-9]).{8,}$/;
    return !regexPassword.test(password);
}
//# sourceMappingURL=validation.util.js.map