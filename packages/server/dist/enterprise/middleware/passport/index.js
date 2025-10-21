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
exports.verifyToken = exports.generateJwtRefreshToken = exports.generateJwtAuthToken = exports.setTokenOrCookies = exports.initializeJwtCookieMiddleware = void 0;
const axios_1 = require("axios");
const express_session_1 = __importDefault(require("express-session"));
const http_status_codes_1 = require("http-status-codes");
const jsonwebtoken_1 = __importStar(require("jsonwebtoken"));
const passport_1 = __importDefault(require("passport"));
const internalFlowiseError_1 = require("../../../errors/internalFlowiseError");
const Interface_1 = require("../../../Interface");
const getRunningExpressApp_1 = require("../../../utils/getRunningExpressApp");
const organization_user_entity_1 = require("../../database/entities/organization-user.entity");
const role_entity_1 = require("../../database/entities/role.entity");
const workspace_user_entity_1 = require("../../database/entities/workspace-user.entity");
const Interface_Enterprise_1 = require("../../Interface.Enterprise");
const account_service_1 = require("../../services/account.service");
const organization_user_service_1 = require("../../services/organization-user.service");
const organization_service_1 = require("../../services/organization.service");
const role_service_1 = require("../../services/role.service");
const workspace_user_service_1 = require("../../services/workspace-user.service");
const tempTokenUtils_1 = require("../../utils/tempTokenUtils");
const AuthStrategy_1 = require("./AuthStrategy");
const SessionPersistance_1 = require("./SessionPersistance");
const uuid_1 = require("uuid");
const localStrategy = require('passport-local').Strategy;
const jwtAudience = process.env.JWT_AUDIENCE || 'AUDIENCE';
const jwtIssuer = process.env.JWT_ISSUER || 'ISSUER';
const expireAuthTokensOnRestart = process.env.EXPIRE_AUTH_TOKENS_ON_RESTART === 'true';
const jwtAuthTokenSecret = process.env.JWT_AUTH_TOKEN_SECRET || 'auth_token';
const jwtRefreshSecret = process.env.JWT_REFRESH_TOKEN_SECRET || process.env.JWT_AUTH_TOKEN_SECRET || 'refresh_token';
// Allow explicit override of cookie security settings
// This is useful when running behind a reverse proxy/load balancer that terminates SSL
const secureCookie = process.env.SECURE_COOKIES === 'false'
    ? false
    : process.env.SECURE_COOKIES === 'true'
        ? true
        : process.env.APP_URL?.startsWith('https')
            ? true
            : false;
const jwtOptions = {
    secretOrKey: jwtAuthTokenSecret,
    audience: jwtAudience,
    issuer: jwtIssuer
};
const _initializePassportMiddleware = async (app) => {
    // Configure session middleware
    let options = {
        secret: process.env.EXPRESS_SESSION_SECRET || 'flowise',
        resave: false,
        saveUninitialized: false,
        cookie: {
            secure: secureCookie,
            httpOnly: true,
            sameSite: 'lax' // Add sameSite attribute
        }
    };
    // if the auth tokens are not to be expired on restart, then configure the session store
    if (!expireAuthTokensOnRestart) {
        // configure session store based on the mode
        if (process.env.MODE === 'queue') {
            const redisStore = (0, SessionPersistance_1.initializeRedisClientAndStore)();
            options.store = redisStore;
        }
        else {
            // for the database store, choose store basis the DB configuration from .env
            const dbSessionStore = (0, SessionPersistance_1.initializeDBClientAndStore)();
            if (dbSessionStore) {
                options.store = dbSessionStore;
            }
        }
    }
    app.use((0, express_session_1.default)(options));
    app.use(passport_1.default.initialize());
    app.use(passport_1.default.session());
    passport_1.default.serializeUser((user, done) => {
        done(null, user);
    });
    passport_1.default.deserializeUser((user, done) => {
        done(null, user);
    });
};
const initializeJwtCookieMiddleware = async (app, identityManager) => {
    await _initializePassportMiddleware(app);
    const strategy = (0, AuthStrategy_1.getAuthStrategy)(jwtOptions);
    passport_1.default.use(strategy);
    passport_1.default.use('login', new localStrategy({
        usernameField: 'email',
        passwordField: 'password',
        session: true
    }, async (email, password, done) => {
        let queryRunner;
        try {
            queryRunner = (0, getRunningExpressApp_1.getRunningExpressApp)().AppDataSource.createQueryRunner();
            await queryRunner.connect();
            const accountService = new account_service_1.AccountService();
            const body = {
                user: {
                    email: email,
                    credential: password
                }
            };
            const response = await accountService.login(body);
            const workspaceUser = Array.isArray(response.workspaceDetails) && response.workspaceDetails.length > 0
                ? response.workspaceDetails[0]
                : response.workspaceDetails;
            const workspaceUserService = new workspace_user_service_1.WorkspaceUserService();
            workspaceUser.status = workspace_user_entity_1.WorkspaceUserStatus.ACTIVE;
            workspaceUser.lastLogin = new Date().toISOString();
            workspaceUser.updatedBy = workspaceUser.userId;
            const organizationUserService = new organization_user_service_1.OrganizationUserService();
            const { organizationUser } = await organizationUserService.readOrganizationUserByWorkspaceIdUserId(workspaceUser.workspaceId, workspaceUser.userId, queryRunner);
            if (!organizationUser)
                throw new internalFlowiseError_1.InternalFlowiseError(http_status_codes_1.StatusCodes.NOT_FOUND, "Organization User Not Found" /* OrganizationUserErrorMessage.ORGANIZATION_USER_NOT_FOUND */);
            organizationUser.status = organization_user_entity_1.OrganizationUserStatus.ACTIVE;
            await workspaceUserService.updateWorkspaceUser(workspaceUser, queryRunner);
            await organizationUserService.updateOrganizationUser(organizationUser);
            const workspaceUsers = await workspaceUserService.readWorkspaceUserByUserId(organizationUser.userId, queryRunner);
            const assignedWorkspaces = workspaceUsers.map((workspaceUser) => {
                return {
                    id: workspaceUser.workspace.id,
                    name: workspaceUser.workspace.name,
                    role: workspaceUser.role?.name,
                    organizationId: workspaceUser.workspace.organizationId
                };
            });
            let roleService = new role_service_1.RoleService();
            const ownerRole = await roleService.readGeneralRoleByName(role_entity_1.GeneralRole.OWNER, queryRunner);
            const role = await roleService.readRoleById(workspaceUser.roleId, queryRunner);
            if (!role)
                throw new internalFlowiseError_1.InternalFlowiseError(http_status_codes_1.StatusCodes.NOT_FOUND, "Role Not Found" /* RoleErrorMessage.ROLE_NOT_FOUND */);
            const orgService = new organization_service_1.OrganizationService();
            const organization = await orgService.readOrganizationById(organizationUser.organizationId, queryRunner);
            if (!organization) {
                return done('Organization not found');
            }
            const subscriptionId = organization.subscriptionId;
            const customerId = organization.customerId;
            const features = await identityManager.getFeaturesByPlan(subscriptionId);
            const productId = await identityManager.getProductIdFromSubscription(subscriptionId);
            const loggedInUser = {
                id: workspaceUser.userId,
                email: response.user.email,
                name: response.user?.name,
                roleId: workspaceUser.roleId,
                activeOrganizationId: organization.id,
                activeOrganizationSubscriptionId: subscriptionId,
                activeOrganizationCustomerId: customerId,
                activeOrganizationProductId: productId,
                isOrganizationAdmin: workspaceUser.roleId === ownerRole.id,
                activeWorkspaceId: workspaceUser.workspaceId,
                activeWorkspace: workspaceUser.workspace.name,
                assignedWorkspaces,
                isApiKeyValidated: true,
                permissions: [...JSON.parse(role.permissions)],
                features
            };
            return done(null, loggedInUser, { message: 'Logged in Successfully' });
        }
        catch (error) {
            return done(error);
        }
        finally {
            if (queryRunner)
                await queryRunner.release();
        }
    }));
    app.post('/api/v1/auth/resolve', async (req, res) => {
        // check for the organization, if empty redirect to the organization setup page for OpenSource and Enterprise Versions
        // for Cloud (Horizontal) version, redirect to the signin page
        const expressApp = (0, getRunningExpressApp_1.getRunningExpressApp)();
        const platform = expressApp.identityManager.getPlatformType();
        if (platform === Interface_1.Platform.CLOUD) {
            return res.status(axios_1.HttpStatusCode.Ok).json({ redirectUrl: '/signin' });
        }
        const orgService = new organization_service_1.OrganizationService();
        const queryRunner = expressApp.AppDataSource.createQueryRunner();
        await queryRunner.connect();
        const registeredOrganizationCount = await orgService.countOrganizations(queryRunner);
        await queryRunner.release();
        if (registeredOrganizationCount === 0) {
            switch (platform) {
                case Interface_1.Platform.ENTERPRISE:
                    if (!identityManager.isLicenseValid()) {
                        return res.status(axios_1.HttpStatusCode.Ok).json({ redirectUrl: '/license-expired' });
                    }
                    return res.status(axios_1.HttpStatusCode.Ok).json({ redirectUrl: '/organization-setup' });
                default:
                    return res.status(axios_1.HttpStatusCode.Ok).json({ redirectUrl: '/organization-setup' });
            }
        }
        switch (platform) {
            case Interface_1.Platform.ENTERPRISE:
                if (!identityManager.isLicenseValid()) {
                    return res.status(axios_1.HttpStatusCode.Ok).json({ redirectUrl: '/license-expired' });
                }
                return res.status(axios_1.HttpStatusCode.Ok).json({ redirectUrl: '/signin' });
            default:
                return res.status(axios_1.HttpStatusCode.Ok).json({ redirectUrl: '/signin' });
        }
    });
    app.post('/api/v1/auth/refreshToken', async (req, res) => {
        const refreshToken = req.cookies.refreshToken;
        if (!refreshToken)
            return res.sendStatus(401);
        jsonwebtoken_1.default.verify(refreshToken, jwtRefreshSecret, async (err, payload) => {
            if (err || !payload)
                return res.status(401).json({ message: Interface_Enterprise_1.ErrorMessage.REFRESH_TOKEN_EXPIRED });
            // @ts-ignore
            const loggedInUser = req.user;
            let isSSO = false;
            let newTokenResponse = {};
            if (loggedInUser && loggedInUser.ssoRefreshToken) {
                try {
                    newTokenResponse = await identityManager.getRefreshToken(loggedInUser.ssoProvider, loggedInUser.ssoRefreshToken);
                    if (newTokenResponse.error) {
                        return res.status(401).json({ message: Interface_Enterprise_1.ErrorMessage.REFRESH_TOKEN_EXPIRED });
                    }
                    isSSO = true;
                }
                catch (error) {
                    return res.status(401).json({ message: Interface_Enterprise_1.ErrorMessage.REFRESH_TOKEN_EXPIRED });
                }
            }
            const meta = (0, tempTokenUtils_1.decryptToken)(payload.meta);
            if (!meta) {
                return res.status(401).json({ message: Interface_Enterprise_1.ErrorMessage.REFRESH_TOKEN_EXPIRED });
            }
            if (isSSO) {
                loggedInUser.ssoToken = newTokenResponse.access_token;
                if (newTokenResponse.refresh_token) {
                    loggedInUser.ssoRefreshToken = newTokenResponse.refresh_token;
                }
                return (0, exports.setTokenOrCookies)(res, loggedInUser, false, req, false, true);
            }
            else {
                return (0, exports.setTokenOrCookies)(res, loggedInUser, false, req);
            }
        });
    });
    app.post('/api/v1/auth/login', (req, res, next) => {
        passport_1.default.authenticate('login', async (err, user) => {
            try {
                if (err || !user) {
                    return next ? next(err) : res.status(401).json(err);
                }
                if (identityManager.isEnterprise() && !identityManager.isLicenseValid()) {
                    return res.status(401).json({ redirectUrl: '/license-expired' });
                }
                req.session.regenerate((regenerateErr) => {
                    if (regenerateErr) {
                        return next ? next(regenerateErr) : res.status(500).json({ message: 'Session regeneration failed' });
                    }
                    req.login(user, { session: true }, async (error) => {
                        if (error) {
                            return next ? next(error) : res.status(401).json(error);
                        }
                        return (0, exports.setTokenOrCookies)(res, user, true, req);
                    });
                });
            }
            catch (error) {
                return next ? next(error) : res.status(401).json(error);
            }
        })(req, res, next);
    });
};
exports.initializeJwtCookieMiddleware = initializeJwtCookieMiddleware;
const setTokenOrCookies = (res, user, regenerateRefreshToken, req, redirect, isSSO) => {
    const token = (0, exports.generateJwtAuthToken)(user);
    let refreshToken = '';
    if (regenerateRefreshToken) {
        refreshToken = (0, exports.generateJwtRefreshToken)(user);
    }
    else {
        refreshToken = req?.cookies?.refreshToken;
    }
    const returnUser = (0, tempTokenUtils_1.generateSafeCopy)(user);
    returnUser.isSSO = !isSSO ? false : isSSO;
    if (redirect) {
        // 1. Generate a random token
        const ssoToken = (0, uuid_1.v4)();
        // 2. Store returnUser in your session store, keyed by ssoToken, with a short expiry
        storeSSOUserPayload(ssoToken, returnUser);
        // 3. Redirect with token only
        const dashboardUrl = `/sso-success?token=${ssoToken}`;
        // Return the token as a cookie in our response.
        let resWithCookies = res
            .cookie('token', token, {
            httpOnly: true,
            secure: secureCookie,
            sameSite: 'lax'
        })
            .cookie('refreshToken', refreshToken, {
            httpOnly: true,
            secure: secureCookie,
            sameSite: 'lax'
        });
        resWithCookies.redirect(dashboardUrl);
    }
    else {
        // Return the token as a cookie in our response.
        res.cookie('token', token, {
            httpOnly: true,
            secure: secureCookie,
            sameSite: 'lax'
        })
            .cookie('refreshToken', refreshToken, {
            httpOnly: true,
            secure: secureCookie,
            sameSite: 'lax'
        })
            .type('json')
            .send({ ...returnUser });
    }
};
exports.setTokenOrCookies = setTokenOrCookies;
const generateJwtAuthToken = (user) => {
    let expiryInMinutes = -1;
    if (user?.ssoToken) {
        const jwtHeader = jsonwebtoken_1.default.decode(user.ssoToken, { complete: true });
        if (jwtHeader) {
            const utcSeconds = jwtHeader.payload.exp;
            let d = new Date(0); // The 0 there is the key, which sets the date to the epoch
            d.setUTCSeconds(utcSeconds);
            // get the minutes difference from current time
            expiryInMinutes = Math.abs(d.getTime() - new Date().getTime()) / 60000;
        }
    }
    if (expiryInMinutes === -1) {
        expiryInMinutes = process.env.JWT_TOKEN_EXPIRY_IN_MINUTES ? parseInt(process.env.JWT_TOKEN_EXPIRY_IN_MINUTES) : 60;
    }
    return _generateJwtToken(user, expiryInMinutes, jwtAuthTokenSecret);
};
exports.generateJwtAuthToken = generateJwtAuthToken;
const generateJwtRefreshToken = (user) => {
    let expiryInMinutes = -1;
    if (user.ssoRefreshToken) {
        const jwtHeader = jsonwebtoken_1.default.decode(user.ssoRefreshToken, { complete: false });
        if (jwtHeader && typeof jwtHeader !== 'string') {
            const utcSeconds = jwtHeader.exp;
            if (utcSeconds) {
                let d = new Date(0); // The 0 there is the key, which sets the date to the epoch
                d.setUTCSeconds(utcSeconds);
                // get the minutes difference from current time
                expiryInMinutes = Math.abs(d.getTime() - new Date().getTime()) / 60000;
            }
        }
    }
    if (expiryInMinutes === -1) {
        expiryInMinutes = process.env.JWT_REFRESH_TOKEN_EXPIRY_IN_MINUTES
            ? parseInt(process.env.JWT_REFRESH_TOKEN_EXPIRY_IN_MINUTES)
            : 129600; // 90 days
    }
    return _generateJwtToken(user, expiryInMinutes, jwtRefreshSecret);
};
exports.generateJwtRefreshToken = generateJwtRefreshToken;
const _generateJwtToken = (user, expiryInMinutes, secret) => {
    const encryptedUserInfo = (0, tempTokenUtils_1.encryptToken)(user?.id + ':' + user?.activeWorkspaceId);
    return (0, jsonwebtoken_1.sign)({ id: user?.id, username: user?.name, meta: encryptedUserInfo }, secret, {
        expiresIn: expiryInMinutes + 'm', // Expiry in minutes
        notBefore: '0', // Cannot use before now, can be configured to be deferred.
        algorithm: 'HS256', // HMAC using SHA-256 hash algorithm
        audience: jwtAudience, // The audience of the token
        issuer: jwtIssuer // The issuer of the token
    });
};
const verifyToken = (req, res, next) => {
    passport_1.default.authenticate('jwt', { session: true }, (err, user, info) => {
        if (err) {
            return next(err);
        }
        // @ts-ignore
        if (info && info.name === 'TokenExpiredError') {
            if (req.cookies && req.cookies.refreshToken) {
                return res.status(401).json({ message: Interface_Enterprise_1.ErrorMessage.TOKEN_EXPIRED, retry: true });
            }
            return res.status(401).json({ message: Interface_Enterprise_1.ErrorMessage.INVALID_MISSING_TOKEN });
        }
        if (!user) {
            return res.status(401).json({ message: Interface_Enterprise_1.ErrorMessage.INVALID_MISSING_TOKEN });
        }
        const identityManager = (0, getRunningExpressApp_1.getRunningExpressApp)().identityManager;
        if (identityManager.isEnterprise() && !identityManager.isLicenseValid()) {
            return res.status(401).json({ redirectUrl: '/license-expired' });
        }
        req.user = user;
        next();
    })(req, res, next);
};
exports.verifyToken = verifyToken;
const storeSSOUserPayload = (ssoToken, returnUser) => {
    const app = (0, getRunningExpressApp_1.getRunningExpressApp)();
    app.cachePool.addSSOTokenCache(ssoToken, returnUser);
};
//# sourceMappingURL=index.js.map