import express from 'express';
import { DataSource } from 'typeorm';
import { NodesPool } from './NodesPool';
import { CachePool } from './CachePool';
import { AbortControllerPool } from './AbortControllerPool';
import { RateLimiterManager } from './utils/rateLimit';
import { Telemetry } from './utils/telemetry';
import { IdentityManager } from './IdentityManager';
import { SSEStreamer } from './utils/SSEStreamer';
import { LoggedInUser } from './enterprise/Interface.Enterprise';
import { IMetricsProvider } from './Interface.Metrics';
import { QueueManager } from './queue/QueueManager';
import { RedisEventSubscriber } from './queue/RedisEventSubscriber';
import 'global-agent/bootstrap';
import { UsageCacheManager } from './UsageCacheManager';
declare global {
    namespace Express {
        interface User extends LoggedInUser {
        }
        interface Request {
            user?: LoggedInUser;
        }
        namespace Multer {
            interface File {
                bucket: string;
                key: string;
                acl: string;
                contentType: string;
                contentDisposition: null;
                storageClass: string;
                serverSideEncryption: null;
                metadata: any;
                location: string;
                etag: string;
            }
        }
    }
}
export declare class App {
    app: express.Application;
    nodesPool: NodesPool;
    abortControllerPool: AbortControllerPool;
    cachePool: CachePool;
    telemetry: Telemetry;
    rateLimiterManager: RateLimiterManager;
    AppDataSource: DataSource;
    sseStreamer: SSEStreamer;
    identityManager: IdentityManager;
    metricsProvider: IMetricsProvider;
    queueManager: QueueManager;
    redisSubscriber: RedisEventSubscriber;
    usageCacheManager: UsageCacheManager;
    constructor();
    initDatabase(): Promise<void>;
    config(): Promise<void>;
    stopApp(): Promise<void>;
}
export declare function start(): Promise<void>;
export declare function getInstance(): App | undefined;
