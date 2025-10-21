import { LoginActivity } from '../../database/entities/EnterpriseEntities';
import { LoginActivityCode } from '../../Interface.Enterprise';
declare const _default: {
    recordLoginActivity: (username: string, activityCode: LoginActivityCode, message: string, ssoProvider?: string) => Promise<LoginActivity | undefined>;
    deleteLoginActivity: (body: any) => Promise<string>;
    fetchLoginActivity: (body: any) => Promise<{
        data: LoginActivity[];
        count: number;
        currentPage: number;
        pageSize: number;
    }>;
};
export default _default;
