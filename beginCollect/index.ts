import { AzureFunction, Context, HttpRequest } from "@azure/functions";
import {
  getProcessedRawTextForEmbeddings,
  getTextForEmbeddings,
  processHtmlForEmbeddings,
} from "./getWikiText";
import { getEmbeddings } from "../gateways/azureOpenAiGateway";
import { addEmbeddingsToDb, queryEmbedding } from "../gateways/dbGateway";
import { chunk, head, chain } from "lodash";
import { saveEmbedding } from "../embeddings/saveEmbeddings";

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
  | { type: "wiki_url"; wikiUrl: string; wikiDevUrl: string }
  | { type: "ping" } => {
  const {
    rawText,
    rawTextUrl,
    wikiUrl,
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
    case wikiUrl !== undefined: {
      let wikiDevUrl: string;
      if (wikiUrl.indexOf("dev.azure.com") !== -1) {
        wikiDevUrl = wikiUrl;
      } else {
        const wikiDetails =
          /domoreexp\.visualstudio\.com\/([^\/]*)\/.*wikis\/([^\/]*)\/([^\/]*)/.exec(
            wikiUrl
          );
        if (!wikiDetails) {
          throw new Error("Wiki url is not valid");
        }
        const [_, wikiSpace, wikiName, pageId] = wikiDetails;
        wikiDevUrl = `https://dev.azure.com/domoreexp/${wikiSpace}/_apis/wiki/wikis/${wikiName}/pages/${pageId}?api-version=7.1-preview.1`;
      }
      return { type: "wiki_url", wikiUrl, wikiDevUrl };
    }
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
      const texts = await getTextForWikiUrl(param.wikiDevUrl);
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
