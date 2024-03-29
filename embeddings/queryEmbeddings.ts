import { getEmbeddings } from "../gateways/azureOpenAiGateway";
import { addEmbeddingsToDb, queryEmbedding } from "../gateways/dbGateway";
import { chunk, head, chain } from "lodash";
import assert = require("assert");

export async function queryForEmbedding(query: string) {
  const embeddings = await getEmbeddings([query]);
  const embedding = embeddings.at(0);
  assert(embedding != null);

  const queryResult = await queryEmbedding(embedding.embedding);
  const result = chain(queryResult)
    .groupBy((result) => result.text_url)
    .map((result) => head(result))
    .orderBy((result) => result.similarity, "desc")
    .value();
  console.log(result);
  return result.map((result) => {
    return {
      textUrl: result.text_url,
      textDetails: result.text_details,
    };
  });
}
