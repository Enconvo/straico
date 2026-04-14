import { ListCache, RequestOptions } from "@enconvo/api"


/**
 * Fetches models from the API and transforms them into ModelOutput format
 */
async function fetchModels(options: RequestOptions): Promise<ListCache.ListItem[]> {
    const { url, api_key } = options
    // console.log("fetchModels", url, api_key, type)
    try {
        const resp = await fetch(url, {
            headers: {
                'Authorization': `Bearer ${api_key}`
            }
        })

        if (!resp.ok) {
            throw new Error(`API request failed with status ${resp.status}`)
        }

        const data = await resp.json()
        const result = data.data.map((item: any) => {

            const title = item.name
            const value = item._id
            return {
                title: title,
                value: value,
            }
        })

        // console.log("Total models fetched:", result)
        return result

    } catch (error) {
        console.error('Error fetching models:', error)
        return []
    }
}

/**
 * Main handler function for the API endpoint
 * @param req - Request object containing options
 * @returns Promise<string> - JSON string of model data
 */
export default async function main(req: Request) {
    const options = await req.json()

    options.url = 'https://api.straico.com/v0/rag/user'
    options.api_key = options.credentials.apiKey

    const modelCache = new ListCache(fetchModels)

    const models = await modelCache.getList(options)
    return Response.json(models)
}
