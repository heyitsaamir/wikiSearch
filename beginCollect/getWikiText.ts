import sanitize = require("sanitize-html");
import { getWiki } from "../gateways/azureDevopsGateway";
const { marked } = require("marked");
import { htmlToText } from "html-to-text";

const convertToParagraphs = (html: string) => {
  let content = html;
  // console.log(content);
  try {
    content = htmlToText(content, {
      formatters: {
        // Create a formatter.
        fooBlockFormatter: function (elem, walk, builder, formatOptions) {
          builder.openBlock({
            leadingLineBreaks: formatOptions.leadingLineBreaks || 1,
          });
          builder.addInline("---------");
          builder.addLineBreak();
          builder.addInline("!HEADER!=");
          walk(elem.children, builder);
          builder.closeBlock({
            trailingLineBreaks: formatOptions.trailingLineBreaks || 1,
          });
        },
      },
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
        {
          selector: "p",
          options: { leadingLineBreaks: 0, trailingLineBreaks: 0 },
        },
        ...[1, 2, 3].map((index) => ({
          selector: `h${index}`,
          options: { leadingLineBreaks: 0, trailingLineBreaks: 0 },
          format: "fooBlockFormatter",
        })),
      ],
    });
  } catch (e) {
    // console.log("err");
    console.log(e);
  }
  // content = content.replace(/\\n\\n\\n/, "\n");
  content = content.replace(/\n\n/g, "\n");
  content = content
    .split("\n")
    .map((c) => c.trim())
    .join("\n");
  // console.log(content);
  let paragraphs = content.split("---------\n");
  // console.log(paragraphs.length);
  paragraphs = paragraphs
    .map((p) => {
      const linesInParagraph = p.split("\n");
      if (
        linesInParagraph.length === 2 &&
        linesInParagraph[0].trim().indexOf("!HEADER!=") !== -1
      ) {
        // console.log("REMOVING" + linesInParagraph[0]);
        return null;
      }
      // console.log("--");
      // console.log(p.replace("!HEADER!=", "").trim());
      return p.replace("!HEADER!=", "").trim();
    })
    .filter((p) => p != null);
  // console.log(paragraphs);
  return paragraphs;
};

const processWikiTextForEmbeddings = (text: string, type: "md" | "html") => {
  let proceessedText = text;
  switch (type) {
    case "md":
      proceessedText = marked(proceessedText);
      break;
    case "html":
      break;
    default:
      break;
  }
  const paragraphs = convertToParagraphs(proceessedText);
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

  return processWikiTextForEmbeddings(sanitized, "html");
};

export const getProcessedRawTextForEmbeddings = async (rawText: string) => {
  const sentences = processWikiTextForEmbeddings(rawText, "html");
  return sentences;
};
