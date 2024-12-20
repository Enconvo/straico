import { Action, Command, environment, LLMProvider, EnconvoResponse, RequestOptions, BaseChatMessage, UserMessage, ResponseAction } from "@enconvo/api";
import { StraicoRAGProvider } from "./provider/rag_straico_provider.ts";
import { StraicoAgentProvider } from "./provider/agent_straico_provider.ts";

interface Params extends RequestOptions, LLMProvider.LLMOptions {

}

export default async function main(req: Request): Promise<EnconvoResponse> {
    const options: Params = await req.json();

    const { input_text, context, history_messages: historyMessages } = options;

    let inputText = input_text || context;


    if (!inputText) {
        throw new Error("No text to be processed")
    }


    let messages: BaseChatMessage[] = [];
    messages = [
        ...historyMessages,
        new UserMessage(inputText)
    ];

    const llmProvider = new StraicoAgentProvider(options)
    const resultMessage = await llmProvider.stream({ messages, autoHandle: true })
    const result = resultMessage.text()

    const actions: ResponseAction[] = [
        Action.Paste({ content: result }),
        Action.InsertBelow({ content: result }),
        Action.Copy({ content: result })
    ]

    const output: EnconvoResponse = {
        type: "text",
        content: result,
        actions: actions
    }

    Command.setDefaultCommandKey(`${environment.extensionName}|${environment.commandName}`).then()

    return output;
}

