import sanitize = require("sanitize-html");
import { getWiki } from "./gateways/azureDevopsGateway";
import removeMarkdown from "markdown-to-text";
import { htmlToText } from "html-to-text";

const processWikiTextForEmbeddings = (text: string, type: "md" | "raw") => {
  let proceessedText = text;
  switch (type) {
    case "md":
      proceessedText = removeMarkdown(text);
      break;
    case "raw":
      break;
    default:
      break;
  }
  const paragraphs = proceessedText.split("\n\n");
  return paragraphs
    .map((paragraph) => paragraph.trim().slice(undefined, 256))
    .filter((sentence) => sentence.length > 0);
};

export const getTextForEmbeddings = async (textUrl: string) => {
  const wiki = await getWiki(textUrl);
  const sentences = processWikiTextForEmbeddings(wiki.content, "md");
  return sentences;
};

export const processHtmlForEmbeddings = async (html: string) => {
  const sanitized = sanitize(html, {});
  const text = htmlToText(sanitized, {
    selectors: [
      {
        selector: "img",
        options: {
          linkBrackets: false,
        },
      },
      {
        selector: "a",
        options: {
          linkBrackets: false,
        },
      },
    ],
  });

  return processWikiTextForEmbeddings(text, "raw");
};

export const getProcessedRawTextForEmbeddings = async (rawText: string) => {
  const sentences = processWikiTextForEmbeddings(rawText, "raw");
  return sentences;
};

export const withAdditionalMetadata = (
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
