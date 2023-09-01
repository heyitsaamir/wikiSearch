import { AzureFunction, Context, HttpRequest } from "@azure/functions";
import {
  getProcessedRawTextForEmbeddings,
  getTextForEmbeddings,
} from "./getWikiText";
import { getEmbeddings } from "./getEmbeddings";
import { addEmbeddingsToDb } from "./db";

const getTextForWikiUrl = async (wikiUrl: string) => {
  return await getTextForEmbeddings(wikiUrl);
};

const getParam = (
  req: HttpRequest
):
  | { type: "raw_text"; text: string; rawTextUrl: string }
  | { type: "wiki_url"; wikiUrl: string } => {
  const { rawText, rawTextUrl, wikiUrl } = req.body;
  switch (true) {
    case rawText !== undefined && rawTextUrl !== undefined:
      return { type: "raw_text", text: rawText, rawTextUrl };
    case wikiUrl !== undefined:
      return { type: "wiki_url", wikiUrl };
    default:
      throw new Error("Must provide either rawText and rawTextUrl or wikiUrl");
  }
};

const httpTrigger: AzureFunction = async function (
  context: Context,
  req: HttpRequest
): Promise<void> {
  const param = getParam(req);
  switch (param.type) {
    case "wiki_url": {
      const texts = await getTextForWikiUrl(param.wikiUrl);
      await saveEmbedding(texts, param.wikiUrl);
      break;
    }
    case "raw_text": {
      const texts = await getProcessedRawTextForEmbeddings(param.text);
      await saveEmbedding(texts, param.rawTextUrl);
      break;
    }
  }

  context.res = {
    // status: 200, /* Defaults to 200 */
    body: "Done",
  };
};

export default httpTrigger;

async function saveEmbedding(textForEbdeddings: string[], url: string) {
  const embeddings = await getEmbeddings(
    textForEbdeddings.slice(undefined, 16)
  );
  const dbConnected = await addEmbeddingsToDb(url, embeddings);
}
