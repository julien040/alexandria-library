import OpenAI from "openai";

const resource = process.env.AZURE_DEPLOYMENT_ID;
const apiVersion = process.env.AZURE_AI_VERSION;
const apiKey = process.env.AZURE_AI_API_KEY;
const model = process.env.AZURE_DEPLOYMENT_ID ?? "";

if (!resource || !apiVersion || !apiKey || !model) {
    throw new Error("Missing Azure AI environment variables");
}

const openai = new OpenAI({
    apiKey,
    baseURL: `https://${resource}.openai.azure.com/openai/deployments/${model}`,
    defaultQuery: { "api-version": apiVersion },
    defaultHeaders: { "api-key": apiKey },
});

async function getEmbeddings(text: string): Promise<number[]> {
    const { data } = await openai.embeddings.create({
        input: text,
        model,
    });
    return data[0].embedding;
}

export default getEmbeddings;
