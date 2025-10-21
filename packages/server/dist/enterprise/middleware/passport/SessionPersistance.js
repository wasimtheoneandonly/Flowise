"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.initializeDBClientAndStore = exports.initializeRedisClientAndStore = void 0;
const ioredis_1 = __importDefault(require("ioredis"));
const connect_redis_1 = require("connect-redis");
const DataSource_1 = require("../../../DataSource");
const path_1 = __importDefault(require("path"));
const utils_1 = require("../../../utils");
let redisClient = null;
let redisStore = null;
const initializeRedisClientAndStore = () => {
    if (!redisClient) {
        if (process.env.REDIS_URL) {
            redisClient = new ioredis_1.default(process.env.REDIS_URL);
        }
        else {
            redisClient = new ioredis_1.default({
                host: process.env.REDIS_HOST || 'localhost',
                port: parseInt(process.env.REDIS_PORT || '6379'),
                username: process.env.REDIS_USERNAME || undefined,
                password: process.env.REDIS_PASSWORD || undefined,
                tls: process.env.REDIS_TLS === 'true'
                    ? {
                        cert: process.env.REDIS_CERT ? Buffer.from(process.env.REDIS_CERT, 'base64') : undefined,
                        key: process.env.REDIS_KEY ? Buffer.from(process.env.REDIS_KEY, 'base64') : undefined,
                        ca: process.env.REDIS_CA ? Buffer.from(process.env.REDIS_CA, 'base64') : undefined
                    }
                    : undefined
            });
        }
    }
    if (!redisStore) {
        redisStore = new connect_redis_1.RedisStore({ client: redisClient });
    }
    return redisStore;
};
exports.initializeRedisClientAndStore = initializeRedisClientAndStore;
const initializeDBClientAndStore = () => {
    const databaseType = process.env.DATABASE_TYPE || 'sqlite';
    switch (databaseType) {
        case 'mysql': {
            const expressSession = require('express-session');
            const MySQLStore = require('express-mysql-session')(expressSession);
            const options = {
                host: process.env.DATABASE_HOST,
                port: parseInt(process.env.DATABASE_PORT || '3306'),
                user: process.env.DATABASE_USER,
                password: process.env.DATABASE_PASSWORD,
                database: process.env.DATABASE_NAME,
                createDatabaseTable: true,
                schema: {
                    tableName: 'login_sessions'
                }
            };
            return new MySQLStore(options);
        }
        case 'mariadb':
            /* TODO: Implement MariaDB session store */
            break;
        case 'postgres': {
            // default is postgres
            const pg = require('pg');
            const expressSession = require('express-session');
            const pgSession = require('connect-pg-simple')(expressSession);
            const pgPool = new pg.Pool({
                host: process.env.DATABASE_HOST,
                port: parseInt(process.env.DATABASE_PORT || '5432'),
                user: process.env.DATABASE_USER,
                password: process.env.DATABASE_PASSWORD,
                database: process.env.DATABASE_NAME,
                ssl: (0, DataSource_1.getDatabaseSSLFromEnv)()
            });
            return new pgSession({
                pool: pgPool, // Connection pool
                tableName: 'login_sessions',
                schemaName: 'public',
                createTableIfMissing: true
            });
        }
        case 'default':
        case 'sqlite': {
            const expressSession = require('express-session');
            const sqlSession = require('connect-sqlite3')(expressSession);
            let flowisePath = path_1.default.join((0, utils_1.getUserHome)(), '.flowise');
            const homePath = process.env.DATABASE_PATH ?? flowisePath;
            return new sqlSession({
                db: 'database.sqlite',
                table: 'login_sessions',
                dir: homePath
            });
        }
    }
};
exports.initializeDBClientAndStore = initializeDBClientAndStore;
//# sourceMappingURL=SessionPersistance.js.map