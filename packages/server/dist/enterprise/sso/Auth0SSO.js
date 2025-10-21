"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
// Auth0SSO.ts
const SSOBase_1 = __importDefault(require("./SSOBase"));
const passport_1 = __importDefault(require("passport"));
const passport_auth0_1 = require("passport-auth0");
const audit_1 = __importDefault(require("../services/audit"));
const Interface_Enterprise_1 = require("../Interface.Enterprise");
const passport_2 = require("../middleware/passport");
const axios_1 = __importDefault(require("axios"));
const PROVIDER_NAME_AUTH0_SSO = 'Auth0 SSO';
class Auth0SSO extends SSOBase_1.default {
    getProviderName() {
        return PROVIDER_NAME_AUTH0_SSO;
    }
    static getCallbackURL() {
        const APP_URL = process.env.APP_URL || 'http://127.0.0.1:' + process.env.PORT;
        return APP_URL + Auth0SSO.CALLBACK_URI;
    }
    setSSOConfig(ssoConfig) {
        super.setSSOConfig(ssoConfig);
        if (ssoConfig) {
            const { domain, clientID, clientSecret } = this.ssoConfig;
            passport_1.default.use('auth0', new passport_auth0_1.Strategy({
                domain: domain || 'your_auth0_domain',
                clientID: clientID || 'your_auth0_client_id',
                clientSecret: clientSecret || 'your_auth0_client_secret',
                callbackURL: Auth0SSO.getCallbackURL() || 'http://localhost:3000/auth/auth0/callback',
                passReqToCallback: true
            }, async (req, accessToken, refreshToken, extraParams, profile, done) => {
                const email = profile.emails?.[0]?.value;
                if (!email) {
                    await audit_1.default.recordLoginActivity('<empty>', Interface_Enterprise_1.LoginActivityCode.UNKNOWN_USER, Interface_Enterprise_1.ErrorMessage.UNKNOWN_USER, PROVIDER_NAME_AUTH0_SSO);
                    return done({ name: 'SSO_LOGIN_FAILED', message: Interface_Enterprise_1.ErrorMessage.UNKNOWN_USER }, undefined);
                }
                return await this.verifyAndLogin(this.app, email, done, profile, accessToken, refreshToken);
            }));
        }
        else {
            passport_1.default.unuse('auth0');
        }
    }
    initialize() {
        this.setSSOConfig(this.ssoConfig);
        this.app.get(Auth0SSO.LOGIN_URI, (req, res, next) => {
            if (!this.getSSOConfig()) {
                return res.status(400).json({ error: 'Auth0 SSO is not configured.' });
            }
            passport_1.default.authenticate('auth0', {
                scope: 'openid profile email' // Request scopes for profile and email information
            })(req, res, next);
        });
        this.app.get(Auth0SSO.CALLBACK_URI, (req, res, next) => {
            if (!this.getSSOConfig()) {
                return res.status(400).json({ error: 'Auth0 SSO is not configured.' });
            }
            passport_1.default.authenticate('auth0', async (err, user) => {
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
    static async testSetup(ssoConfig) {
        const { domain, clientID, clientSecret } = ssoConfig;
        try {
            const tokenResponse = await axios_1.default.post(`https://${domain}/oauth/token`, {
                client_id: clientID,
                client_secret: clientSecret,
                audience: `https://${domain}/api/v2/`,
                grant_type: 'client_credentials'
            }, {
                headers: { 'Content-Type': 'application/json' }
            });
            return { message: tokenResponse.status };
        }
        catch (error) {
            const errorMessage = 'Auth0 Configuration test failed. Please check your credentials and domain.';
            return { error: errorMessage };
        }
    }
    async refreshToken(ssoRefreshToken) {
        const { domain, clientID, clientSecret } = this.ssoConfig;
        try {
            const response = await axios_1.default.post(`https://${domain}/oauth/token`, {
                client_id: clientID,
                client_secret: clientSecret,
                grant_type: 'refresh_token',
                refresh_token: ssoRefreshToken
            }, {
                headers: { 'Content-Type': 'application/json' }
            });
            return { ...response.data };
        }
        catch (error) {
            const errorMessage = 'Failed to get refreshToken from Auth0.';
            return { error: errorMessage };
        }
    }
}
Auth0SSO.LOGIN_URI = '/api/v1/auth0/login';
Auth0SSO.CALLBACK_URI = '/api/v1/auth0/callback';
Auth0SSO.LOGOUT_URI = '/api/v1/auth0/logout';
exports.default = Auth0SSO;
//# sourceMappingURL=Auth0SSO.js.map