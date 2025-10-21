import { User } from './user.entity';
export declare enum OrganizationName {
    DEFAULT_ORGANIZATION = "Default Organization"
}
export declare class Organization {
    id: string;
    name: string;
    customerId?: string;
    subscriptionId?: string;
    createdDate?: Date;
    updatedDate?: Date;
    createdBy?: string;
    createdByUser?: User;
    updatedBy?: string;
    updatedByUser?: User;
}
