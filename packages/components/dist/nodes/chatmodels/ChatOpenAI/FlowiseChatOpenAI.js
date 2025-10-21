"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ChatOpenAI = void 0;
const openai_1 = require("@langchain/openai");
class ChatOpenAI extends openai_1.ChatOpenAI {
    constructor(id, fields) {
        super(fields);
        this.builtInTools = [];
        this.id = id;
        this.configuredModel = fields?.modelName ?? '';
        this.configuredMaxToken = fields?.maxTokens;
    }
    revertToOriginalModel() {
        this.model = this.configuredModel;
        this.maxTokens = this.configuredMaxToken;
    }
    setMultiModalOption(multiModalOption) {
        this.multiModalOption = multiModalOption;
    }
    setVisionModel() {
        // pass
    }
    addBuiltInTools(builtInTool) {
        this.builtInTools.push(builtInTool);
    }
}
exports.ChatOpenAI = ChatOpenAI;
//# sourceMappingURL=FlowiseChatOpenAI.js.map