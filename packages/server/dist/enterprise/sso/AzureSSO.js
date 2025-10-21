"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
// AzureSSO.ts
const SSOBase_1 = __importDefault(require("./SSOBase"));
const passport_1 = __importDefault(require("passport"));
const passport_openidconnect_1 = require("passport-openidconnect");
const audit_1 = __importDefault(require("../services/audit"));
const Interface_Enterprise_1 = require("../Interface.Enterprise");
const passport_2 = require("../middleware/passport");
const axios_1 = __importDefault(require("axios"));
class AzureSSO extends SSOBase_1.default {
    getProviderName() {
        return 'Microsoft SSO';
    }
    static getCallbackURL() {
        const APP_URL = process.env.APP_URL || 'http://127.0.0.1:' + process.env.PORT;
        return APP_URL + AzureSSO.CALLBACK_URI;
    }
    initialize() {
        this.setSSOConfig(this.ssoConfig);
        this.app.get(AzureSSO.LOGIN_URI, (req, res, next) => {
            if (!this.getSSOConfig()) {
                return res.status(400).json({ error: 'Azure SSO is not configured.' });
            }
            passport_1.default.authenticate('azure-ad', async () => {
                if (next)
                    next();
            })(req, res, next);
        });
        this.app.get(AzureSSO.CALLBACK_URI, (req, res, next) => {
            if (!this.getSSOConfig()) {
                return res.status(400).json({ error: 'Azure SSO is not configured.' });
            }
            passport_1.default.authenticate('azure-ad', async (err, user) => {
                try {
                    if (err || !user) {
                        if (err?.name == 'SSO_LOGIN_FAILED') {
                            const error = { message: err.message };
                            const signinUrl = `/signin?error=${encodeURIComponent(JSON.stringify(error))}`;
                            return res.redirect(signinUrl);
                        }
                        return next ? next(err) : res.status(401).json(err);
                    }
                    req.session.regenerate((regenerateErr) => {
                        if (regenerateErr) {
                            return next ? next(regenerateErr) : res.status(500).json({ message: 'Session regeneration failed' });
                        }
                        req.login(user, { session: true }, async (error) => {
                            if (error)
                                return next ? next(error) : res.status(401).json(error);
                            return (0, passport_2.setTokenOrCookies)(res, user, true, req, true, true);
                        });
                    });
                }
                catch (error) {
                    return next ? next(error) : res.status(401).json(error);
                }
            })(req, res, next);
        });
    }
    setSSOConfig(ssoConfig) {
        super.setSSOConfig(ssoConfig);
        if (this.ssoConfig) {
            const { tenantID, clientID, clientSecret } = this.ssoConfig;
            passport_1.default.use('azure-ad', new passport_openidconnect_1.Strategy({
                issuer: `https://login.microsoftonline.com/${tenantID}/v2.0`,
                authorizationURL: `https://login.microsoftonline.com/${tenantID}/oauth2/v2.0/authorize`,
                tokenURL: `https://login.microsoftonline.com/${tenantID}/oauth2/v2.0/token`,
                userInfoURL: `https://graph.microsoft.com/oidc/userinfo`,
                clientID: clientID || 'your_client_id',
                clientSecret: clientSecret || 'your_client_secret',
                callbackURL: AzureSSO.getCallbackURL(),
                scope: 'openid profile email offline_access',
                passReqToCallback: true
            }, async (req, issuer, profile, context, idToken, accessToken, refreshToken, done) => {
                const email = profile.username;
                if (!email) {
                    await audit_1.default.recordLoginActivity('<empty>', Interface_Enterprise_1.LoginActivityCode.UNKNOWN_USER, Interface_Enterprise_1.ErrorMessage.UNKNOWN_USER, this.getProviderName());
                    return done({ name: 'SSO_LOGIN_FAILED', message: Interface_Enterprise_1.ErrorMessage.UNKNOWN_USER }, undefined);
                }
                return this.verifyAndLogin(this.app, email, done, profile, accessToken, refreshToken);
            }));
        }
        else {
            passport_1.default.unuse('azure-ad');
        }
    }
    static async testSetup(ssoConfig) {
        const { tenantID, clientID, clientSecret } = ssoConfig;
        try {
            const tokenResponse = await axios_1.default.post(`https://login.microsoftonline.com/${tenantID}/oauth2/v2.0/token`, new URLSearchParams({
                client_id: clientID,
                client_secret: clientSecret,
                grant_type: 'client_credentials',
                scope: 'https://graph.microsoft.com/.default'
            }).toString(), {
                headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
            });
            return { message: tokenResponse.statusText };
        }
        catch (error) {
            const errorMessage = 'Microsoft Configuration test failed. Please check your credentials and Tenant ID.';
            return { error: errorMessage };
        }
    }
    async refreshToken(ssoRefreshToken) {
        const { tenantID, clientID, clientSecret } = this.ssoConfig;
        try {
            const response = await axios_1.default.post(`https://login.microsoftonline.com/${tenantID}/oauth2/v2.0/token`, new URLSearchParams({
                client_id: clientID || '',
                client_secret: clientSecret || '',
                grant_type: 'refresh_token',
                refresh_token: ssoRefreshToken,
                scope: 'openid profile email'
            }).toString(), {
                headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
            });
            return { ...response.data };
        }
        catch (error) {
            const errorMessage = 'Failed to get refreshToken from Azure.';
            return { error: errorMessage };
        }
    }
}
AzureSSO.LOGIN_URI = '/api/v1/azure/login';
AzureSSO.CALLBACK_URI = '/api/v1/azure/callback';
AzureSSO.LOGOUT_URI = '/api/v1/azure/logout';
exports.default = AzureSSO;
//# sourceMappingURL=AzureSSO.js.map