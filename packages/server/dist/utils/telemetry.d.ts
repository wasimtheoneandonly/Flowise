import { PostHog } from 'posthog-node';
export declare enum TelemetryEventType {
    'USER_CREATED' = "user_created",
    'ORGANIZATION_CREATED' = "organization_created"
}
export declare class Telemetry {
    postHog?: PostHog;
    constructor();
    sendTelemetry(event: string, properties?: Record<string, any>, orgId?: string): Promise<void>;
    flush(): Promise<void>;
}
