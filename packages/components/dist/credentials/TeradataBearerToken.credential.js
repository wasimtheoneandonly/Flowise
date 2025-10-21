"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
class TeradataBearerTokenCredential {
    constructor() {
        this.label = 'Teradata Bearer Token';
        this.name = 'teradataBearerToken';
        this.version = 1.0;
        this.description =
            'Refer to <a target="_blank" href="https://docs.teradata.com/r/Enterprise_IntelliFlex_VMware/Teradata-Vector-Store-User-Guide/Setting-up-Vector-Store/Importing-Modules-Required-for-Vector-Store">official guide</a> on how to get Teradata Bearer Token';
        this.inputs = [
            {
                label: 'Token',
                name: 'token',
                type: 'password'
            }
        ];
    }
}
module.exports = { credClass: TeradataBearerTokenCredential };
//# sourceMappingURL=TeradataBearerToken.credential.js.map