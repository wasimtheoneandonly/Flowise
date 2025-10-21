import { QueryRunner } from 'typeorm';
import { LoginMethod } from '../database/entities/login-method.entity';
export declare const enum LoginMethodErrorMessage {
    INVALID_LOGIN_METHOD_ID = "Invalid Login Method Id",
    INVALID_LOGIN_METHOD_NAME = "Invalid Login Method Name",
    INVALID_LOGIN_METHOD_STATUS = "Invalid Login Method Status",
    INVALID_LOGIN_METHOD_CONFIG = "Invalid Login Method Config",
    LOGIN_METHOD_NOT_FOUND = "Login Method Not Found"
}
export declare class LoginMethodService {
    private dataSource;
    private userService;
    private organizationService;
    constructor();
    validateLoginMethodId(id: string | undefined): void;
    readLoginMethodById(id: string | undefined, queryRunner: QueryRunner): Promise<LoginMethod | null>;
    validateLoginMethodName(name: string | undefined): void;
    validateLoginMethodStatus(status: string | undefined): void;
    readLoginMethodByOrganizationId(organizationId: string | undefined, queryRunner: QueryRunner): Promise<LoginMethod[]>;
    encryptLoginMethodConfig(config: string | undefined): Promise<string>;
    decryptLoginMethodConfig(config: string | undefined): Promise<string>;
    private saveLoginMethod;
    createLoginMethod(data: Partial<LoginMethod>): Promise<Partial<LoginMethod>>;
    createOrUpdateConfig(body: any): Promise<{
        status: string;
        organizationId: string;
    }>;
    updateLoginMethod(newLoginMethod: Partial<LoginMethod>): Promise<Partial<LoginMethod>>;
}
