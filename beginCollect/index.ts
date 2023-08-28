import { AzureFunction, Context, HttpRequest } from "@azure/functions"
import { OpenAIClient, AzureKeyCredential } from '@azure/openai';
import { getTextForEmbeddings } from "./getWikiText";
import { getEmbeddings } from "./getEmbeddings";



const httpTrigger: AzureFunction = async function (context: Context, req: HttpRequest): Promise<void> {
    const textForEbdeddings = getTextForEmbeddings();
    const embeddings = await getEmbeddings(textForEbdeddings);
    
    for (const embedding of embeddings) {
        console.log(JSON.stringify(embedding));
    }

    
    context.log('HTTP trigger function processed a request.');
    const name = (req.query.name || (req.body && req.body.name));
    const responseMessage = name
        ? "Hello, " + name + ". This HTTP triggered function executed successfully."
        : "This HTTP triggered function executed successfully. Pass a name in the query string or in the request body for a personalized response.";

    context.res = {
        // status: 200, /* Defaults to 200 */
        body: responseMessage
    };

};

export default httpTrigger;