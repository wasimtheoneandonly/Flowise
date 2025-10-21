"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AccountController = void 0;
const http_status_codes_1 = require("http-status-codes");
const account_service_1 = require("../services/account.service");
const getRunningExpressApp_1 = require("../../utils/getRunningExpressApp");
class AccountController {
    async register(req, res, next) {
        try {
            const accountService = new account_service_1.AccountService();
            const data = await accountService.register(req.body);
            return res.status(http_status_codes_1.StatusCodes.CREATED).json(data);
        }
        catch (error) {
            next(error);
        }
    }
    async invite(req, res, next) {
        try {
            const accountService = new account_service_1.AccountService();
            const data = await accountService.invite(req.body, req.user);
            return res.status(http_status_codes_1.StatusCodes.CREATED).json(data);
        }
        catch (error) {
            next(error);
        }
    }
    async login(req, res, next) {
        try {
            const accountService = new account_service_1.AccountService();
            const data = await accountService.login(req.body);
            return res.status(http_status_codes_1.StatusCodes.CREATED).json(data);
        }
        catch (error) {
            next(error);
        }
    }
    async verify(req, res, next) {
        try {
            const accountService = new account_service_1.AccountService();
            const data = await accountService.verify(req.body);
            return res.status(http_status_codes_1.StatusCodes.CREATED).json(data);
        }
        catch (error) {
            next(error);
        }
    }
    async resendVerificationEmail(req, res, next) {
        try {
            const accountService = new account_service_1.AccountService();
            const data = await accountService.resendVerificationEmail(req.body);
            return res.status(http_status_codes_1.StatusCodes.CREATED).json(data);
        }
        catch (error) {
            next(error);
        }
    }
    async forgotPassword(req, res, next) {
        try {
            const accountService = new account_service_1.AccountService();
            const data = await accountService.forgotPassword(req.body);
            return res.status(http_status_codes_1.StatusCodes.CREATED).json(data);
        }
        catch (error) {
            next(error);
        }
    }
    async resetPassword(req, res, next) {
        try {
            const accountService = new account_service_1.AccountService();
            const data = await accountService.resetPassword(req.body);
            return res.status(http_status_codes_1.StatusCodes.CREATED).json(data);
        }
        catch (error) {
            next(error);
        }
    }
    async createStripeCustomerPortalSession(req, res, next) {
        try {
            const { url: portalSessionUrl } = await (0, getRunningExpressApp_1.getRunningExpressApp)().identityManager.createStripeCustomerPortalSession(req);
            return res.status(http_status_codes_1.StatusCodes.OK).json({ url: portalSessionUrl });
        }
        catch (error) {
            next(error);
        }
    }
    async logout(req, res, next) {
        try {
            if (req.user) {
                const accountService = new account_service_1.AccountService();
                await accountService.logout(req.user);
                if (req.isAuthenticated()) {
                    req.logout((err) => {
                        if (err) {
                            return res.status(500).json({ message: 'Logout failed' });
                        }
                        req.session.destroy((err) => {
                            if (err) {
                                return res.status(500).json({ message: 'Failed to destroy session' });
                            }
                        });
                    });
                }
                else {
                    // For JWT-based users (owner, org_admin)
                    res.clearCookie('connect.sid'); // Clear the session cookie
                    res.clearCookie('token'); // Clear the JWT cookie
                    res.clearCookie('refreshToken'); // Clear the JWT cookie
                    return res.redirect('/login'); // Redirect to the login page
                }
            }
            return res.status(200).json({ message: 'logged_out', redirectTo: `/login` });
        }
        catch (error) {
            next(error);
        }
    }
    async getBasicAuth(req, res) {
        if (process.env.FLOWISE_USERNAME && process.env.FLOWISE_PASSWORD) {
            return res.status(http_status_codes_1.StatusCodes.OK).json({
                isUsernamePasswordSet: true
            });
        }
        else {
            return res.status(http_status_codes_1.StatusCodes.OK).json({
                isUsernamePasswordSet: false
            });
        }
    }
    async checkBasicAuth(req, res) {
        const { username, password } = req.body;
        if (username === process.env.FLOWISE_USERNAME && password === process.env.FLOWISE_PASSWORD) {
            return res.json({ message: 'Authentication successful' });
        }
        else {
            return res.json({ message: 'Authentication failed' });
        }
    }
}
exports.AccountController = AccountController;
//# sourceMappingURL=account.controller.js.map