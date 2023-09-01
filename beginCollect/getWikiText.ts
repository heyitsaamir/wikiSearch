import { getWiki } from "./gateways/azureDevopsGateway";
import removeMarkdown from "markdown-to-text";

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

export const getProcessedRawTextForEmbeddings = async (rawText: string) => {
  const sentences = processWikiTextForEmbeddings(rawText, "raw");
  return sentences;
};
