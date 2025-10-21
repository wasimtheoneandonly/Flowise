import { DataSource } from 'typeorm';
import { IComponentNodes } from '../Interface';
export declare const executeCustomNodeFunction: ({ appDataSource, componentNodes, data, workspaceId, orgId }: {
    appDataSource: DataSource;
    componentNodes: IComponentNodes;
    data: any;
    workspaceId?: string;
    orgId?: string;
}) => Promise<any>;
