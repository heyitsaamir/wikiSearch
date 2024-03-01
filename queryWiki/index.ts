import { AzureFunction, Context, HttpRequest } from "@azure/functions";
import { queryForEmbedding } from "../embeddings/queryEmbeddings";

const httpTrigger: AzureFunction = async function (
  context: Context,
  req: HttpRequest
): Promise<void> {
  const { query } = req.body;
  if (query == null) {
    context.res = {
      status: 400,
      body: "No query parameters",
    };
    return;
  } else {
    const queryResult = await queryForEmbedding(query);
    context.res = {
      body: queryResult,
    };
  }
};

export default httpTrigger;
