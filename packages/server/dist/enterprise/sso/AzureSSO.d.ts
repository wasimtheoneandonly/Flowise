import SSOBase from './SSOBase';
declare class AzureSSO extends SSOBase {
    static LOGIN_URI: string;
    static CALLBACK_URI: string;
    static LOGOUT_URI: string;
    getProviderName(): string;
    static getCallbackURL(): string;
    initialize(): void;
    setSSOConfig(ssoConfig: any): void;
    static testSetup(ssoConfig: any): Promise<{
        message: string;
        error?: undefined;
    } | {
        error: string;
        message?: undefined;
    }>;
    refreshToken(ssoRefreshToken: string): Promise<any>;
}
export default AzureSSO;
