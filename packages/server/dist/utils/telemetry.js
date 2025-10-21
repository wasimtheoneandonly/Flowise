"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Telemetry = exports.TelemetryEventType = void 0;
const uuid_1 = require("uuid");
const posthog_node_1 = require("posthog-node");
const utils_1 = require("../utils");
var TelemetryEventType;
(function (TelemetryEventType) {
    TelemetryEventType["USER_CREATED"] = "user_created";
    TelemetryEventType["ORGANIZATION_CREATED"] = "organization_created";
})(TelemetryEventType || (exports.TelemetryEventType = TelemetryEventType = {}));
class Telemetry {
    constructor() {
        if (process.env.POSTHOG_PUBLIC_API_KEY) {
            this.postHog = new posthog_node_1.PostHog(process.env.POSTHOG_PUBLIC_API_KEY);
        }
        else {
            this.postHog = undefined;
        }
    }
    async sendTelemetry(event, properties = {}, orgId = '') {
        properties.version = await (0, utils_1.getAppVersion)();
        if (this.postHog) {
            const distinctId = orgId || (0, uuid_1.v4)();
            this.postHog.capture({
                event,
                distinctId,
                properties
            });
        }
    }
    async flush() {
        if (this.postHog) {
            await this.postHog.shutdownAsync();
        }
    }
}
exports.Telemetry = Telemetry;
//# sourceMappingURL=telemetry.js.map