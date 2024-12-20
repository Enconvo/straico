import { AssistantMessage, BaseChatMessage, BaseChatMessageChunk, ChatMessageContentText, LLMProvider, Stream } from "@enconvo/api";
import axios from 'axios'


export class StraicoAgentProvider extends LLMProvider {

    constructor(options: LLMProvider.LLMOptions) {
        super(options)

    }

    protected async _call(content: { messages: BaseChatMessage[]; }): Promise<BaseChatMessage> {
        const response = await this.request(content.messages)
        if (response.error) {
            return new AssistantMessage(response.error.message)
        }

        return new AssistantMessage(response.answer)
    }

    protected async _stream(content: { messages: BaseChatMessage[]; }): Promise<Stream<BaseChatMessageChunk>> {
        const response = await this._call(content)

        async function* iterator(): AsyncIterator<BaseChatMessageChunk, any, undefined> {
            yield response
        }

        const controller = new AbortController();
        return new Stream(iterator, controller);

    }


    async request(messages: BaseChatMessage[]) {
        const newMessages = await this.convertMessagesToStraicoMessages(messages)

        const lastMessage = newMessages.pop();
        const userInput = lastMessage?.text.text()

        const history = newMessages.map((message) => {
            return `${message.text.role}: ${message.text.text()}`
        }).join("\n")


        const prompt = `history messages:\n${history}\n\nuser input:\n${userInput}`

        var data = JSON.stringify({
            "prompt": prompt,
        });

        console.log("data", data)

        var config = {
            method: 'post',
            maxBodyLength: Infinity,
            url: `https://api.straico.com/v0/agent/${this.options.agentName.value}/prompt`,
            headers: {
                'Authorization': `Bearer ${this.options.api_key}`,
                'Content-Type': 'application/json'
            },
            data: data
        };


        try {
            const response = await axios(config)
            if (response.data.success === false) {
                return {
                    error: {
                        message: response.data.message,
                    }
                }
            }

            const modelResponse = response.data.response
            console.log("modelResponse", JSON.stringify(modelResponse, null, 2))
            return modelResponse
        } catch (error) {
            console.log(error)
        }
    }


    private async convertMessageToStraicoMessage(message: BaseChatMessage): Promise<{ text: BaseChatMessage; files: string[]; }> {
        let role = message.role

        if (typeof message.content === "string") {
            return {
                text: new BaseChatMessage(role, [new ChatMessageContentText(message.content)]),
                files: []
            }
        } else {

            const content = message.content.filter((item) => {
                return item.type === "text"
            }).map((item) => {
                return item.text
            })


            return {
                text: new BaseChatMessage(role, [new ChatMessageContentText(content.join("\n"))]),
                files: []
            }
        }
    }


    private async convertMessagesToStraicoMessages(messages: BaseChatMessage[]): Promise<{ text: BaseChatMessage; files: string[]; }[]> {

        let newMessages = messages.map((message) => this.convertMessageToStraicoMessage(message))
        return await Promise.all(newMessages)
    }


}