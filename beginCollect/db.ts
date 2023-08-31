import postgres = require("postgres")
import fs = require('fs')

type EmbeddingId = string & { __brand: 'embeddingId' };

interface Embedding {
    id: EmbeddingId
    text_url: string;
    text_details: string;
    embeddings: number[];
}

const sql = postgres({ 
    host: 'wiki-search.postgres.database.azure.com',
    user: 'aamir',
    password: process.env.AZURE_PG_PASSWORD,
    database: 'postgres',
    ssl: {
        rejectUnauthorized: true,
        ca: fs.readFileSync(
            `/Users/aamirjawaid/Downloads/DigiCertGlobalRootCA.crt.pem`.toString()
        ),
    },
    port: 5432,
 }) // will use psql environment variables

/**
 * Adds the embeddings to a postgres db. The schema is:
 * id: uuid
 * text_url: text
 * text_details: nullable(jsonb)
 * embeddings: number[]
 * @param textUrl 
 * @param embeddings 
 */
export const addEmbeddingsToDb = async (textUrl: string, embeddings: number[]) => {
    console.log('Running db call');
    const insertedEmbeddings = await sql<Embedding[]>`
    insert into embeddings
      (text_url, embeddings)
    values
      (${ textUrl }, ${ JSON.stringify(embeddings) })
    returning *
  `
  return insertedEmbeddings
}