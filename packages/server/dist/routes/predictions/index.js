"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const predictions_1 = __importDefault(require("../../controllers/predictions"));
const utils_1 = require("../../utils");
const router = express_1.default.Router();
// CREATE
router.post(['/', '/:id'], (0, utils_1.getMulterStorage)().array('files'), predictions_1.default.getRateLimiterMiddleware, predictions_1.default.createPrediction);
exports.default = router;
//# sourceMappingURL=index.js.map