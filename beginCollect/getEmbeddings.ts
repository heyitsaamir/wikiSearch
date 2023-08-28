import { OpenAIClient, AzureKeyCredential } from "@azure/openai";

const client = new OpenAIClient(
    "https://wiki-search-embeddings.openai.azure.com/", 
    new AzureKeyCredential(process.env["AZURE_OPEN_AI_API_KEY"])
  );
  

export const getEmbeddings = async (texts: string[]) => {
    const {data} = await client.getEmbeddings('text-embedding-ada-002', texts, )
    return data
}