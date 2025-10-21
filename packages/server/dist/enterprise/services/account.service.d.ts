import { OrganizationUser } from '../database/entities/organization-user.entity';
import { Organization } from '../database/entities/organization.entity';
import { Role } from '../database/entities/role.entity';
import { User } from '../database/entities/user.entity';
import { WorkspaceUser } from '../database/entities/workspace-user.entity';
import { Workspace } from '../database/entities/workspace.entity';
import { LoggedInUser } from '../Interface.Enterprise';
type AccountDTO = {
    user: Partial<User>;
    organization: Partial<Organization>;
    organizationUser: Partial<OrganizationUser>;
    workspace: Partial<Workspace>;
    workspaceUser: Partial<WorkspaceUser>;
    role: Partial<Role>;
};
export declare class AccountService {
    private dataSource;
    private userService;
    private organizationservice;
    private workspaceService;
    private roleService;
    private organizationUserService;
    private workspaceUserService;
    private identityManager;
    constructor();
    private initializeAccountDTO;
    resendVerificationEmail({ email }: {
        email: string;
    }): Promise<void>;
    private ensureOneOrganizationOnly;
    private createRegisterAccount;
    private saveRegisterAccount;
    register(data: AccountDTO): Promise<AccountDTO>;
    private saveInviteAccount;
    invite(data: AccountDTO, user?: Express.User): Promise<AccountDTO>;
    login(data: AccountDTO): Promise<{
        user: User;
        workspaceDetails: {
            isOrgOwner: boolean;
            workspaceId: string;
            workspace: Workspace;
            userId: string;
            user: User;
            roleId: string;
            role?: Role;
            status?: string;
            lastLogin?: string;
            createdDate?: Date;
            updatedDate?: Date;
            createdBy?: string;
            createdByUser?: User;
            updatedBy?: string;
            updatedByUser?: User;
        };
    }>;
    verify(data: AccountDTO): Promise<AccountDTO>;
    forgotPassword(data: AccountDTO): Promise<Partial<User>>;
    resetPassword(data: AccountDTO): Promise<Partial<User>>;
    logout(user: LoggedInUser): Promise<void>;
}
export {};
