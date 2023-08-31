import { AzureFunction, Context, HttpRequest } from "@azure/functions"
import { getTextForEmbeddings } from "./getWikiText";
import { getEmbeddings } from "./getEmbeddings";
import { addEmbeddingsToDb } from "./db";

const httpTrigger: AzureFunction = async function (context: Context, req: HttpRequest): Promise<void> {
    const textForEbdeddings = await getTextForEmbeddings(req.query.name);
    const embeddings = await getEmbeddings(textForEbdeddings);
    
    context.log('HTTP trigger function processed a request.');
    const name = (req.query.name || (req.body && req.body.name));
    const responseMessage = name
        ? "Hello, " + name + ". This HTTP triggered function executed successfully."
        : "This HTTP triggered function executed successfully. Pass a name in the query string or in the request body for a personalized response.";

    const dbConnected = await addEmbeddingsToDb(req.query.name, embeddings[0].embedding);
    console.log(JSON.stringify(dbConnected))

    context.res = {
        // status: 200, /* Defaults to 200 */
        body: responseMessage
    };

};

export default httpTrigger;