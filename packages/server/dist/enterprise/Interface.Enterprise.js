"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.RegisterUserSchema = exports.OrgSetupSchema = exports.ErrorMessage = exports.LoginActivityCode = exports.IUser = exports.UserStatus = void 0;
const zod_1 = require("zod");
var UserStatus;
(function (UserStatus) {
    UserStatus["INVITED"] = "invited";
    UserStatus["DISABLED"] = "disabled";
    UserStatus["ACTIVE"] = "active";
})(UserStatus || (exports.UserStatus = UserStatus = {}));
class IUser {
}
exports.IUser = IUser;
var LoginActivityCode;
(function (LoginActivityCode) {
    LoginActivityCode[LoginActivityCode["LOGIN_SUCCESS"] = 0] = "LOGIN_SUCCESS";
    LoginActivityCode[LoginActivityCode["LOGOUT_SUCCESS"] = 1] = "LOGOUT_SUCCESS";
    LoginActivityCode[LoginActivityCode["UNKNOWN_USER"] = -1] = "UNKNOWN_USER";
    LoginActivityCode[LoginActivityCode["INCORRECT_CREDENTIAL"] = -2] = "INCORRECT_CREDENTIAL";
    LoginActivityCode[LoginActivityCode["USER_DISABLED"] = -3] = "USER_DISABLED";
    LoginActivityCode[LoginActivityCode["NO_ASSIGNED_WORKSPACE"] = -4] = "NO_ASSIGNED_WORKSPACE";
    LoginActivityCode[LoginActivityCode["INVALID_LOGIN_MODE"] = -5] = "INVALID_LOGIN_MODE";
    LoginActivityCode[LoginActivityCode["REGISTRATION_PENDING"] = -6] = "REGISTRATION_PENDING";
    LoginActivityCode[LoginActivityCode["UNKNOWN_ERROR"] = -99] = "UNKNOWN_ERROR";
})(LoginActivityCode || (exports.LoginActivityCode = LoginActivityCode = {}));
var ErrorMessage;
(function (ErrorMessage) {
    ErrorMessage["INVALID_MISSING_TOKEN"] = "Invalid or Missing token";
    ErrorMessage["TOKEN_EXPIRED"] = "Token Expired";
    ErrorMessage["REFRESH_TOKEN_EXPIRED"] = "Refresh Token Expired";
    ErrorMessage["FORBIDDEN"] = "Forbidden";
    ErrorMessage["UNKNOWN_USER"] = "Unknown Username or Password";
    ErrorMessage["INCORRECT_PASSWORD"] = "Incorrect Password";
    ErrorMessage["INACTIVE_USER"] = "Inactive User";
    ErrorMessage["INVITED_USER"] = "User Invited, but has not registered";
    ErrorMessage["INVALID_WORKSPACE"] = "No Workspace Assigned";
    ErrorMessage["UNKNOWN_ERROR"] = "Unknown Error";
})(ErrorMessage || (exports.ErrorMessage = ErrorMessage = {}));
// IMPORTANT: update the schema on the client side as well
// packages/ui/src/views/organization/index.jsx
exports.OrgSetupSchema = zod_1.z
    .object({
    orgName: zod_1.z.string().min(1, 'Organization name is required'),
    username: zod_1.z.string().min(1, 'Name is required'),
    email: zod_1.z.string().min(1, 'Email is required').email('Invalid email address'),
    password: zod_1.z
        .string()
        .min(8, 'Password must be at least 8 characters')
        .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
        .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
        .regex(/\d/, 'Password must contain at least one digit')
        .regex(/[^a-zA-Z0-9]/, 'Password must contain at least one special character'),
    confirmPassword: zod_1.z.string().min(1, 'Confirm Password is required')
})
    .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords don't match",
    path: ['confirmPassword']
});
// IMPORTANT: when updating this schema, update the schema on the server as well
// packages/ui/src/views/auth/register.jsx
exports.RegisterUserSchema = zod_1.z
    .object({
    username: zod_1.z.string().min(1, 'Name is required'),
    email: zod_1.z.string().min(1, 'Email is required').email('Invalid email address'),
    password: zod_1.z
        .string()
        .min(8, 'Password must be at least 8 characters')
        .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
        .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
        .regex(/\d/, 'Password must contain at least one digit')
        .regex(/[^a-zA-Z0-9]/, 'Password must contain at least one special character'),
    confirmPassword: zod_1.z.string().min(1, 'Confirm Password is required'),
    token: zod_1.z.string().min(1, 'Invite Code is required')
})
    .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords don't match",
    path: ['confirmPassword']
});
//# sourceMappingURL=Interface.Enterprise.js.map