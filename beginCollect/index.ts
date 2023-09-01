import { AzureFunction, Context, HttpRequest } from "@azure/functions";
import {
  getProcessedRawTextForEmbeddings,
  getTextForEmbeddings,
} from "./getWikiText";
import { getEmbeddings } from "./gateways/azureOpenAiGateway";
import { addEmbeddingsToDb, queryEmbedding } from "./gateways/dbGateway";
import assert = require("assert");

const getTextForWikiUrl = async (wikiUrl: string) => {
  return await getTextForEmbeddings(wikiUrl);
};

const getParam = (
  req: HttpRequest
):
  | { type: "raw_text"; text: string; rawTextUrl: string }
  | { type: "wiki_url"; wikiUrl: string }
  | { type: "query"; text: string } => {
  const { rawText, rawTextUrl, wikiUrl, query } = req.body;
  switch (true) {
    case rawText !== undefined && rawTextUrl !== undefined:
      return { type: "raw_text", text: rawText, rawTextUrl };
    case wikiUrl !== undefined:
      return { type: "wiki_url", wikiUrl };
    case query !== undefined:
      return { type: "query", text: query };
    default:
      throw new Error("Must provide either rawText and rawTextUrl or wikiUrl");
  }
};

const httpTrigger: AzureFunction = async function (
  context: Context,
  req: HttpRequest
): Promise<void> {
  const param = getParam(req);
  let body = "";
  switch (param.type) {
    case "wiki_url": {
      const texts = await getTextForWikiUrl(param.wikiUrl);
      await saveEmbedding(texts, param.wikiUrl);
      body = "Done";
      break;
    }
    case "raw_text": {
      const texts = await getProcessedRawTextForEmbeddings(param.text);
      await saveEmbedding(texts, param.rawTextUrl);
      body = "Done";
      break;
    }
    case "query": {
      const queryResult = await queryForEmbedding(param.text);
      body = queryResult.text;
      break;
    }
  }

  context.res = {
    // status: 200, /* Defaults to 200 */
    body,
  };
};

export default httpTrigger;

async function saveEmbedding(textForEbdeddings: string[], url: string) {
  const embeddings = await getEmbeddings(
    textForEbdeddings.slice(undefined, 16)
  );
  const dbConnected = await addEmbeddingsToDb(url, embeddings);
}

async function queryForEmbedding(query: string) {
  const embeddings = await getEmbeddings([query]);
  const embedding = embeddings.at(0);
  assert(embedding != null);

  const queryResult = await queryEmbedding(embedding.embedding);
  return queryResult.at(0).text_details;
}
