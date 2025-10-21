import { Platform } from '../../Interface';
declare const sendWorkspaceAdd: (email: string, workspaceName: string, dashboardLink: string) => Promise<void>;
declare const sendWorkspaceInvite: (email: string, workspaceName: string, registerLink: string, platform?: Platform, inviteType?: "new" | "update") => Promise<void>;
declare const sendPasswordResetEmail: (email: string, resetLink: string) => Promise<void>;
declare const sendVerificationEmailForCloud: (email: string, verificationLink: string) => Promise<void>;
export { sendWorkspaceAdd, sendWorkspaceInvite, sendPasswordResetEmail, sendVerificationEmailForCloud };
