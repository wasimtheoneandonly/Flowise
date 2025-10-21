import express from 'express';
import passport from 'passport';
declare abstract class SSOBase {
    protected app: express.Application;
    protected ssoConfig: any;
    constructor(app: express.Application, ssoConfig?: any);
    setSSOConfig(ssoConfig: any): void;
    getSSOConfig(): any;
    abstract getProviderName(): string;
    abstract initialize(): void;
    abstract refreshToken(ssoRefreshToken: string): Promise<{
        [key: string]: any;
    }>;
    verifyAndLogin(app: express.Application, email: string, done: (err?: Error | null, user?: Express.User, info?: any) => void, profile: passport.Profile, accessToken: string | object, refreshToken: string): Promise<void>;
}
export default SSOBase;
