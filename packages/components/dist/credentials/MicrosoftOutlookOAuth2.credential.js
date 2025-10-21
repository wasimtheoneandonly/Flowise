"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const scopes = [
    'openid',
    'offline_access',
    'Contacts.Read',
    'Contacts.ReadWrite',
    'Calendars.Read',
    'Calendars.Read.Shared',
    'Calendars.ReadWrite',
    'Mail.Read',
    'Mail.ReadWrite',
    'Mail.ReadWrite.Shared',
    'Mail.Send',
    'Mail.Send.Shared',
    'MailboxSettings.Read'
];
class MsoftOutlookOAuth2 {
    constructor() {
        this.label = 'Microsoft Outlook OAuth2';
        this.name = 'microsoftOutlookOAuth2';
        this.version = 1.0;
        this.description =
            'You can find the setup instructions <a target="_blank" href="https://docs.flowiseai.com/integrations/langchain/tools/microsoft-outlook">here</a>';
        this.inputs = [
            {
                label: 'Authorization URL',
                name: 'authorizationUrl',
                type: 'string',
                default: 'https://login.microsoftonline.com/<tenantId>/oauth2/v2.0/authorize'
            },
            {
                label: 'Access Token URL',
                name: 'accessTokenUrl',
                type: 'string',
                default: 'https://login.microsoftonline.com/<tenantId>/oauth2/v2.0/token'
            },
            {
                label: 'Client ID',
                name: 'clientId',
                type: 'string'
            },
            {
                label: 'Client Secret',
                name: 'clientSecret',
                type: 'password'
            },
            {
                label: 'Scope',
                name: 'scope',
                type: 'string',
                hidden: true,
                default: scopes.join(' ')
            }
        ];
    }
}
module.exports = { credClass: MsoftOutlookOAuth2 };
//# sourceMappingURL=MicrosoftOutlookOAuth2.credential.js.map