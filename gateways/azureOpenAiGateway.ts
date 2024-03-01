import { OpenAIClient, AzureKeyCredential } from "@azure/openai";
import { TextDetails } from "./dbGateway";

export interface Metadata {
  sender?: string;
  additionalContext?: string;
}

const client = new OpenAIClient(
  "https://wiki-search-embeddings.openai.azure.com/",
  new AzureKeyCredential(process.env["AZURE_OPEN_AI_API_KEY"])
);

const withAdditionalMetadata = (
  text: string,
  { sender }: { sender?: string }
) => {
  const metadataString = [["SENDER", sender]]
    .filter(([_, value]) => value != undefined)
    .map(([key, value]) => `${key}:${value}`)
    .join("\n");
  if (metadataString.length == 0) return text;
  return `${metadataString}\n${text}`;
};

export const getEmbeddings = async (
  textsInput: string[],
  metadata?: Metadata
): Promise<{ embedding: number[]; textDetails: TextDetails }[]> => {
  const texts =
    metadata != null
      ? textsInput.map((text) =>
          withAdditionalMetadata(text, { sender: metadata.sender })
        )
      : textsInput;

  if (metadata?.additionalContext && texts.length > 0) {
    texts[0] = `${metadata.additionalContext}\n${texts[0]}`;
  }
  const { data } = await client.getEmbeddings("text-embedding-ada-002", texts);
  return data.map((datum) => {
    return {
      embedding: datum.embedding,
      textDetails: {
        type: "full_text",
        text: textsInput[datum.index],
      },
    };
  });
};
