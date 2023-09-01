import { OpenAIClient, AzureKeyCredential } from "@azure/openai";
import { TextDetails } from "./dbGateway";

const client = new OpenAIClient(
  "https://wiki-search-embeddings.openai.azure.com/",
  new AzureKeyCredential(process.env["AZURE_OPEN_AI_API_KEY"])
);

export const getEmbeddings = async (
  texts: string[]
): Promise<{ embedding: number[]; textDetails: TextDetails }[]> => {
  const { data } = await client.getEmbeddings("text-embedding-ada-002", texts);
  return data.map((datum) => {
    return {
      embedding: datum.embedding,
      textDetails: {
        type: "full_text",
        text: texts[datum.index],
      },
    };
  });
};
