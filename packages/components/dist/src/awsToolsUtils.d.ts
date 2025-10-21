import { ICommonObject, INodeData } from './Interface';
export declare const AWS_REGIONS: {
    label: string;
    name: string;
}[];
export declare const DEFAULT_AWS_REGION = "us-east-1";
export interface AWSCredentials {
    accessKeyId: string;
    secretAccessKey: string;
    sessionToken?: string;
}
/**
 * Get AWS credentials from node data
 * @param {INodeData} nodeData - Node data containing credential information
 * @param {ICommonObject} options - Options containing appDataSource and databaseEntities
 * @returns {Promise<AWSCredentials>} - AWS credentials object
 */
export declare function getAWSCredentials(nodeData: INodeData, options: ICommonObject): Promise<AWSCredentials>;
