interface IValidationResult {
    id: string;
    label: string;
    name: string;
    issues: string[];
}
declare const _default: {
    checkFlowValidation: (flowId: string, workspaceId?: string) => Promise<IValidationResult[]>;
};
export default _default;
