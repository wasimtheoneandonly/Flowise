import { User } from '../enterprise/database/entities/user.entity';
export declare function sanitizeNullBytes(obj: any): any;
export declare function sanitizeUser(user: Partial<User>): Partial<User>;
