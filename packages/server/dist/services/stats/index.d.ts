import { ChatMessageRatingType, ChatType } from '../../Interface';
declare const _default: {
    getChatflowStats: (chatflowid: string, chatTypes: ChatType[] | undefined, startDate?: string, endDate?: string, messageId?: string, feedback?: boolean, feedbackTypes?: ChatMessageRatingType[], activeWorkspaceId?: string) => Promise<any>;
};
export default _default;
