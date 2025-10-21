"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getWorkspaceSearchOptionsFromReq = exports.getWorkspaceSearchOptions = void 0;
const typeorm_1 = require("typeorm");
const getWorkspaceSearchOptions = (workspaceId) => {
    return workspaceId ? { workspaceId: (0, typeorm_1.Equal)(workspaceId) } : {};
};
exports.getWorkspaceSearchOptions = getWorkspaceSearchOptions;
const getWorkspaceSearchOptionsFromReq = (req) => {
    const workspaceId = req.user?.activeWorkspaceId;
    return workspaceId ? { workspaceId: (0, typeorm_1.Equal)(workspaceId) } : {};
};
exports.getWorkspaceSearchOptionsFromReq = getWorkspaceSearchOptionsFromReq;
//# sourceMappingURL=ControllerServiceUtils.js.map