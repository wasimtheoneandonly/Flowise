import { BaseQueue } from './BaseQueue';
import { IComponentNodes } from '../Interface';
import { Telemetry } from '../utils/telemetry';
import { CachePool } from '../CachePool';
import { DataSource } from 'typeorm';
import { AbortControllerPool } from '../AbortControllerPool';
import { QueueEventsProducer, RedisOptions } from 'bullmq';
import { Express } from 'express';
import { UsageCacheManager } from '../UsageCacheManager';
import { ExpressAdapter } from '@bull-board/express';
type QUEUE_TYPE = 'prediction' | 'upsert';
export declare class QueueManager {
    private static instance;
    private queues;
    private connection;
    private bullBoardRouter?;
    private predictionQueueEventsProducer?;
    private constructor();
    static getInstance(): QueueManager;
    registerQueue(name: string, queue: BaseQueue): void;
    getConnection(): RedisOptions;
    getQueue(name: QUEUE_TYPE): BaseQueue;
    getPredictionQueueEventsProducer(): QueueEventsProducer;
    getBullBoardRouter(): Express;
    getAllJobCounts(): Promise<{
        [queueName: string]: {
            [status: string]: number;
        };
    }>;
    setupAllQueues({ componentNodes, telemetry, cachePool, appDataSource, abortControllerPool, usageCacheManager, serverAdapter }: {
        componentNodes: IComponentNodes;
        telemetry: Telemetry;
        cachePool: CachePool;
        appDataSource: DataSource;
        abortControllerPool: AbortControllerPool;
        usageCacheManager: UsageCacheManager;
        serverAdapter?: ExpressAdapter;
    }): void;
}
export {};
