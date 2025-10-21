"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const chatflows_1 = __importDefault(require("../../controllers/chatflows"));
const PermissionCheck_1 = require("../../enterprise/rbac/PermissionCheck");
const router = express_1.default.Router();
// CREATE
router.post('/', (0, PermissionCheck_1.checkAnyPermission)('chatflows:create,chatflows:update'), chatflows_1.default.saveChatflow);
// READ
router.get('/', (0, PermissionCheck_1.checkAnyPermission)('chatflows:view,chatflows:update'), chatflows_1.default.getAllChatflows);
router.get(['/', '/:id'], (0, PermissionCheck_1.checkAnyPermission)('chatflows:view,chatflows:update,chatflows:delete'), chatflows_1.default.getChatflowById);
router.get(['/apikey/', '/apikey/:apikey'], chatflows_1.default.getChatflowByApiKey);
// UPDATE
router.put(['/', '/:id'], (0, PermissionCheck_1.checkAnyPermission)('chatflows:create,chatflows:update'), chatflows_1.default.updateChatflow);
// DELETE
router.delete(['/', '/:id'], (0, PermissionCheck_1.checkPermission)('chatflows:delete'), chatflows_1.default.deleteChatflow);
// CHECK FOR CHANGE
router.get('/has-changed/:id/:lastUpdatedDateTime', chatflows_1.default.checkIfChatflowHasChanged);
exports.default = router;
//# sourceMappingURL=index.js.map