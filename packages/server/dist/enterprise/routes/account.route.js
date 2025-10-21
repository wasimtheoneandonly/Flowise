"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const account_controller_1 = require("../controllers/account.controller");
const IdentityManager_1 = require("../../IdentityManager");
const PermissionCheck_1 = require("../rbac/PermissionCheck");
const router = express_1.default.Router();
const accountController = new account_controller_1.AccountController();
router.post('/register', accountController.register);
// feature flag to workspace since only user who has workspaces can invite
router.post('/invite', IdentityManager_1.IdentityManager.checkFeatureByPlan('feat:workspaces'), (0, PermissionCheck_1.checkAnyPermission)('workspace:add-user,users:manage'), accountController.invite);
router.post('/login', accountController.login);
router.post('/logout', accountController.logout);
router.post('/verify', accountController.verify);
router.post('/resend-verification', accountController.resendVerificationEmail);
router.post('/forgot-password', accountController.forgotPassword);
router.post('/reset-password', accountController.resetPassword);
router.post('/billing', accountController.createStripeCustomerPortalSession);
router.get('/basic-auth', accountController.getBasicAuth);
router.post('/basic-auth', accountController.checkBasicAuth);
exports.default = router;
//# sourceMappingURL=account.route.js.map