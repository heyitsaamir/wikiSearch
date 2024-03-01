import { getEmbeddings } from "../gateways/azureOpenAiGateway";
import { addEmbeddingsToDb, queryEmbedding } from "../gateways/dbGateway";
import { chunk, head, chain } from "lodash";
import assert = require("assert");

export async function saveEmbedding(
  texts: string[],
  url: string,
  metadata?: { sender?: string; additionalContext?: string }
) {
  for (const textChunk of chunk(texts, 16)) {
    const embeddings = await getEmbeddings(textChunk, metadata);
    const dbConnected = await addEmbeddingsToDb(
      url,
      embeddings.map((embedding) => ({ ...embedding, metadata }))
    );
  }
}
