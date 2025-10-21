"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const getRunningExpressApp_1 = require("../../../utils/getRunningExpressApp");
const getAllPermissions = async (req, res, next) => {
    try {
        const appServer = (0, getRunningExpressApp_1.getRunningExpressApp)();
        return res.json(appServer.identityManager.getPermissions());
    }
    catch (error) {
        next(error);
    }
};
const ssoSuccess = async (req, res, next) => {
    try {
        const appServer = (0, getRunningExpressApp_1.getRunningExpressApp)();
        const ssoToken = req.query.token;
        const user = await appServer.cachePool.getSSOTokenCache(ssoToken);
        if (!user)
            return res.status(401).json({ message: 'Invalid or expired SSO token' });
        await appServer.cachePool.deleteSSOTokenCache(ssoToken);
        return res.json(user);
    }
    catch (error) {
        next(error);
    }
};
exports.default = {
    getAllPermissions,
    ssoSuccess
};
//# sourceMappingURL=index.js.map