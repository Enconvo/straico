import { FilePicker, Action, Form, TextField, showToast, Command, LoadingIndicator, TextArea, ResponseAction, showHUD } from "@enconvo/api";
import { useState } from "react";
import axios from 'axios';
import fs from 'fs';
import FormData from "form-data";
import { createReadStream } from 'node:fs';

type Values = {
    title: string;
    description: string;
    files: { path: string }[];
};


export default function App() {
    const [state, setState] = useState("create")
    const [loadingText, setLoadingText] = useState("loading")




    const actions: ResponseAction[] = [
        Action.SubmitForm({
            onSubmit: async (data: Values) => {
                if (!data.title) {
                    showToast({
                        title: 'Please enter title'
                    })
                    return;
                }
                // if (!data.files || data.files.length === 0) {
                //     await showHUD(
                //         'Please upload files'
                //     )
                //     return;
                // }

                try {
                    setState("loading")

                    const response = await createRAG(data)
                    console.log("response", response)

                    showHUD(
                        `Straico RAG created successfully!`
                    )

                    setState("created")
                } catch (e) {
                    console.log("e:", e)
                    setState("create")
                    showHUD(
                        //@ts-ignore
                        `create Straico RAG failed,${e.message}`
                    )
                }

            }
        })
    ]

    const createRAG = async (data: Values) => {
        console.log("doc start--", data)
        var formdata = new FormData();
        formdata.append('name', data.title);
        formdata.append('description', data.description || 'description');

        const filePath = '/Users/ysnows/Desktop/WHY.pdf'
        const file = createReadStream(filePath)
        formdata.append('files', file);

        const options = Command.getOptions()
        console.log("options:", JSON.stringify(options, null, 2))

        var config = {
            method: 'post',
            maxBodyLength: Infinity,
            url: 'https://api.straico.com/v0/rag',
            headers: {
                'Authorization': `Bearer ${options.api_key}`,
                'Content-Type': 'multipart/form-data',
                ...formdata.getHeaders()

            },
            data: formdata
        };

        try {
            const response = await axios(config)
            return {
                data: response.data
            }

        } catch (error) {
            console.log(error)
            return {
                error: error
            }
        }
    }



    return (
        <>
            {state === "create" &&
                <Form actions={actions}>
                    <TextField
                        focus={true}
                        id="title"
                        title="Tile"
                        description="Represents the name of the RAG base"
                        placeHolder="Enter Straico RAG  title"
                    />

                    <TextArea
                        id="description"
                        title="Description"
                        description="Represents the description of the RAG"
                        placeHolder="Enter description"
                    />

                    <FilePicker
                        id="files"
                        description="Represents the files to be attached (up to 4 files). Accepted file extensions are: pdf, docx, csv, txt, xlsx, py."
                        title="Files"
                    />

                </Form>
            }

            {state === "loading" &&
                <Form actions={[]}>
                    <LoadingIndicator text={loadingText} />
                </Form>
            }

            {state === "created" &&
                <Form actions={[]}>
                    <div>Straico RAG has been created. Use the SmartBar to interact with your RAG.</div>
                </Form>
            }

        </>
    );
}





