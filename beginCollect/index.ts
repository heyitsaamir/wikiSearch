import { AzureFunction, Context, HttpRequest } from "@azure/functions";
import {
  getProcessedRawTextForEmbeddings,
  getTextForEmbeddings,
  processHtmlForEmbeddings,
  withAdditionalMetadata,
} from "./getWikiText";
import { getEmbeddings } from "./gateways/azureOpenAiGateway";
import { addEmbeddingsToDb, queryEmbedding } from "./gateways/dbGateway";
import { groupBy, head, sortBy, chain } from "lodash";
import assert = require("assert");

const getTextForWikiUrl = async (wikiUrl: string) => {
  return await getTextForEmbeddings(wikiUrl);
};

const getParam = (
  req: HttpRequest
):
  | {
      type: "raw_text";
      text: string;
      rawTextUrl: string;
      sender: string;
      messageType: "html" | "mrkdwn";
      additionalContext?: string;
    }
  | { type: "wiki_url"; wikiUrl: string }
  | { type: "query"; text: string }
  | { type: "ping" } => {
  const {
    rawText,
    rawTextUrl,
    wikiUrl,
    query,
    sender,
    messageType,
    additionalContext,
  } = req.body ?? {};
  console.log(req.body);
  switch (true) {
    case rawText !== undefined && rawTextUrl !== undefined:
      return {
        type: "raw_text",
        text: rawText,
        rawTextUrl,
        sender,
        messageType,
        additionalContext,
      };
    case wikiUrl !== undefined:
      return { type: "wiki_url", wikiUrl };
    case query !== undefined:
      return { type: "query", text: query };
    case req.query.ping !== undefined:
      return { type: "ping" };
    default:
      throw new Error("Must provide either rawText and rawTextUrl or wikiUrl");
  }
};

const httpTrigger: AzureFunction = async function (
  context: Context,
  req: HttpRequest
): Promise<void> {
  const param = getParam(req);
  let body: string | {} = "";
  switch (param.type) {
    case "wiki_url": {
      const texts = await getTextForWikiUrl(param.wikiUrl);
      await saveEmbedding(texts, param.wikiUrl);
      body = "Done";
      break;
    }
    case "raw_text": {
      let texts =
        param.messageType === "html"
          ? await processHtmlForEmbeddings(param.text)
          : await getProcessedRawTextForEmbeddings(param.text);

      await saveEmbedding(texts, param.rawTextUrl, {
        sender: param.sender,
        additionalContext: param.additionalContext,
      });
      body = "Done";
      break;
    }
    case "query": {
      const queryResult = await queryForEmbedding(param.text);
      body = queryResult;
      break;
    }
    case "ping":
      body = "pong";
      break;
  }

  context.res = {
    // status: 200, /* Defaults to 200 */
    body,
  };
};

export default httpTrigger;

async function saveEmbedding(
  textForEbdeddings: string[],
  url: string,
  metadata?: { sender?: string; additionalContext?: string }
) {
  const texts =
    metadata != null
      ? textForEbdeddings.map((text) =>
          withAdditionalMetadata(text, { sender: metadata.sender })
        )
      : textForEbdeddings;

  if (metadata.additionalContext && texts.length > 0) {
    texts[0] = `${metadata.additionalContext}\n${texts[0]}`;
  }
  const embeddings = await getEmbeddings(texts.slice(undefined, 16));
  const dbConnected = await addEmbeddingsToDb(
    url,
    embeddings.map((embedding) => ({ ...embedding, metadata }))
  );
}

async function queryForEmbedding(query: string) {
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
