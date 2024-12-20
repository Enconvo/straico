import { StringTemplate, Action, Command, environment, LLMProvider, EnconvoResponse, RequestOptions, BaseChatMessage, SystemMessage, UserMessage, ResponseAction } from "@enconvo/api";
import { StraicoProvider } from "./llm_provider/chat_straico.ts";

interface Params extends RequestOptions, LLMProvider.LLMOptions {

}

export default async function main(req: Request): Promise<EnconvoResponse> {
    const options: Params = await req.json();
    console.log("chat_straico", options)

    const { input_text, context, history_messages: historyMessages } = options;

    let inputText = input_text || context;

    let { prompt: system_prompt, user_prompt_1 } = options;

    const userPromptTemplate = new StringTemplate(user_prompt_1)
    inputText = await userPromptTemplate.autoFormat(options)

    if (system_prompt && system_prompt.length > 0) {
        const systemPromptTemplate = new StringTemplate(system_prompt)
        system_prompt = await systemPromptTemplate.autoFormat(options)
    }

    if (!inputText) {
        throw new Error("No text to be processed")
    }


    let messages: BaseChatMessage[] = [];
    messages = [
        new SystemMessage(system_prompt),
        ...historyMessages,
        new UserMessage(inputText)
    ];

    const llmProvider = new StraicoProvider(options)
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

