import { AzureFunction, Context, HttpRequest } from "@azure/functions"
import { OpenAIClient, AzureKeyCredential } from '@azure/openai';

const httpTrigger: AzureFunction = async function (context: Context, req: HttpRequest): Promise<void> {
    const client = new OpenAIClient(
        "https://wiki-search-embeddings.openai.azure.com/", 
        new AzureKeyCredential(process.env["AZURE_OPEN_AI_API_KEY"])
      );
      
    context.log('HTTP trigger function processed a request.');
    const name = (req.query.name || (req.body && req.body.name));
    const responseMessage = name
        ? "Hello, " + name + ". This HTTP triggered function executed successfully."
        : "This HTTP triggered function executed successfully. Pass a name in the query string or in the request body for a personalized response.";

    const { choices } = await client.getCompletions(
        "text-davinci-002", // assumes a matching model deployment or model name
        ["Hello, world!"]);

    for (const choice of choices) {
        console.log(choice.text);
    }

    context.res = {
        // status: 200, /* Defaults to 200 */
        body: responseMessage + JSON.stringify(choices)
    };

};

export default httpTrigger;