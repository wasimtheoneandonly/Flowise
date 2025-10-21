"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.LoginMethodController = void 0;
const http_status_codes_1 = require("http-status-codes");
const internalFlowiseError_1 = require("../../errors/internalFlowiseError");
const Interface_1 = require("../../Interface");
const getRunningExpressApp_1 = require("../../utils/getRunningExpressApp");
const login_method_entity_1 = require("../database/entities/login-method.entity");
const login_method_service_1 = require("../services/login-method.service");
const organization_service_1 = require("../services/organization.service");
const Auth0SSO_1 = __importDefault(require("../sso/Auth0SSO"));
const AzureSSO_1 = __importDefault(require("../sso/AzureSSO"));
const GithubSSO_1 = __importDefault(require("../sso/GithubSSO"));
const GoogleSSO_1 = __importDefault(require("../sso/GoogleSSO"));
const encryption_util_1 = require("../utils/encryption.util");
class LoginMethodController {
    async create(req, res, next) {
        try {
            const loginMethodService = new login_method_service_1.LoginMethodService();
            const loginMethod = await loginMethodService.createLoginMethod(req.body);
            return res.status(http_status_codes_1.StatusCodes.CREATED).json(loginMethod);
        }
        catch (error) {
            next(error);
        }
    }
    async defaultMethods(req, res, next) {
        let queryRunner;
        try {
            queryRunner = (0, getRunningExpressApp_1.getRunningExpressApp)().AppDataSource.createQueryRunner();
            await queryRunner.connect();
            let organizationId;
            if ((0, getRunningExpressApp_1.getRunningExpressApp)().identityManager.getPlatformType() === Interface_1.Platform.CLOUD) {
                organizationId = undefined;
            }
            else if ((0, getRunningExpressApp_1.getRunningExpressApp)().identityManager.getPlatformType() === Interface_1.Platform.ENTERPRISE) {
                const organizationService = new organization_service_1.OrganizationService();
                const organizations = await organizationService.readOrganization(queryRunner);
                if (organizations.length > 0) {
                    organizationId = organizations[0].id;
                }
                else {
                    return res.status(http_status_codes_1.StatusCodes.OK).json({});
                }
            }
            else {
                return res.status(http_status_codes_1.StatusCodes.OK).json({});
            }
            const loginMethodService = new login_method_service_1.LoginMethodService();
            const providers = [];
            let loginMethod = await loginMethodService.readLoginMethodByOrganizationId(organizationId, queryRunner);
            if (loginMethod) {
                for (let method of loginMethod) {
                    if (method.status === login_method_entity_1.LoginMethodStatus.ENABLE)
                        providers.push(method.name);
                }
            }
            return res.status(http_status_codes_1.StatusCodes.OK).json({ providers: providers });
        }
        catch (error) {
            next(error);
        }
        finally {
            if (queryRunner)
                await queryRunner.release();
        }
    }
    async read(req, res, next) {
        let queryRunner;
        try {
            queryRunner = (0, getRunningExpressApp_1.getRunningExpressApp)().AppDataSource.createQueryRunner();
            await queryRunner.connect();
            const query = req.query;
            const loginMethodService = new login_method_service_1.LoginMethodService();
            const loginMethodConfig = {
                providers: [],
                callbacks: [
                    { providerName: 'azure', callbackURL: AzureSSO_1.default.getCallbackURL() },
                    { providerName: 'google', callbackURL: GoogleSSO_1.default.getCallbackURL() },
                    { providerName: 'auth0', callbackURL: Auth0SSO_1.default.getCallbackURL() },
                    { providerName: 'github', callbackURL: GithubSSO_1.default.getCallbackURL() }
                ]
            };
            let loginMethod;
            if (query.id) {
                loginMethod = await loginMethodService.readLoginMethodById(query.id, queryRunner);
                if (!loginMethod)
                    throw new internalFlowiseError_1.InternalFlowiseError(http_status_codes_1.StatusCodes.NOT_FOUND, "Login Method Not Found" /* LoginMethodErrorMessage.LOGIN_METHOD_NOT_FOUND */);
                loginMethod.config = JSON.parse(await (0, encryption_util_1.decrypt)(loginMethod.config));
            }
            else if (query.organizationId) {
                loginMethod = await loginMethodService.readLoginMethodByOrganizationId(query.organizationId, queryRunner);
                for (let method of loginMethod) {
                    method.config = JSON.parse(await (0, encryption_util_1.decrypt)(method.config));
                }
                loginMethodConfig.providers = loginMethod;
            }
            else {
                throw new internalFlowiseError_1.InternalFlowiseError(http_status_codes_1.StatusCodes.BAD_REQUEST, "Unhandled Edge Case" /* GeneralErrorMessage.UNHANDLED_EDGE_CASE */);
            }
            return res.status(http_status_codes_1.StatusCodes.OK).json(loginMethodConfig);
        }
        catch (error) {
            next(error);
        }
        finally {
            if (queryRunner)
                await queryRunner.release();
        }
    }
    async update(req, res, next) {
        try {
            const loginMethodService = new login_method_service_1.LoginMethodService();
            const loginMethod = await loginMethodService.createOrUpdateConfig(req.body);
            if (loginMethod?.status === 'OK' && loginMethod?.organizationId) {
                const appServer = (0, getRunningExpressApp_1.getRunningExpressApp)();
                let providers = req.body.providers;
                providers.map((provider) => {
                    const identityManager = appServer.identityManager;
                    if (provider.config.clientID) {
                        provider.config.configEnabled = provider.status === login_method_entity_1.LoginMethodStatus.ENABLE;
                        identityManager.initializeSsoProvider(appServer.app, provider.providerName, provider.config);
                    }
                });
            }
            return res.status(http_status_codes_1.StatusCodes.OK).json(loginMethod);
        }
        catch (error) {
            next(error);
        }
    }
    async testConfig(req, res, next) {
        try {
            const providers = req.body.providers;
            if (req.body.providerName === 'azure') {
                const response = await AzureSSO_1.default.testSetup(providers[0].config);
                return res.json(response);
            }
            else if (req.body.providerName === 'google') {
                const response = await GoogleSSO_1.default.testSetup(providers[0].config);
                return res.json(response);
            }
            else if (req.body.providerName === 'auth0') {
                const response = await Auth0SSO_1.default.testSetup(providers[0].config);
                return res.json(response);
            }
            else if (req.body.providerName === 'github') {
                const response = await GithubSSO_1.default.testSetup(providers[0].config);
                return res.json(response);
            }
            else {
                return res.json({ error: 'Provider not supported' });
            }
        }
        catch (error) {
            next(error);
        }
    }
}
exports.LoginMethodController = LoginMethodController;
//# sourceMappingURL=login-method.controller.js.map