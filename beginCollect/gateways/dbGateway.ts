import postgres = require("postgres");
import fs = require("fs");
import { v4 as uuidv4 } from "uuid";

type EmbeddingId = string & { __brand: "embeddingId" };

export type TextDetails =
  | {
      text: string;
      type: "full_text";
    }
  | {
      text: string;
      type: "title";
    }
  | {
      text: string;
      type: "raw_text";
    };

interface Embedding {
  id: EmbeddingId;
  text_url: string;
  text_details: TextDetails;
  vector: number[];
}

const sql = postgres({
  host: "wiki-search.postgres.database.azure.com",
  user: "aamir",
  password: process.env.AZURE_PG_PASSWORD,
  database: "postgres",
  ssl: {
    rejectUnauthorized: true,
    ca: fs.readFileSync(
      `/Users/aamirjawaid/Downloads/DigiCertGlobalRootCA.crt.pem`.toString()
    ),
  },
  port: 5432,
}); // will use psql environment variables

/**
 * Adds the embeddings to a postgres db. The schema is:
 * id: uuid
 * text_url: text
 * text_details: nullable(jsonb)
 * embeddings: number[]
 * @param textUrl
 * @param embeddings
 */
export const addEmbeddingsToDb = async (
  textUrl: string,
  embeddings: { embedding: number[]; textDetails: TextDetails }[]
) => {
  const values = embeddings.map((embedding) => {
    return {
      id: uuidv4(),
      text_url: textUrl,
      text_details: { ...embedding.textDetails },
      vector: JSON.stringify(embedding.embedding),
    };
  });
  const foo = sql(values, "id", "text_url", "text_details", "vector");
  try {
    await sql`
       DELETE FROM embeddings WHERE text_url = ${textUrl};
    `;

    const insertedEmbeddings = await sql<Embedding[]>`
      INSERT INTO embeddings
      ${foo}
    RETURNING *;
  `;

    return insertedEmbeddings;
  } catch (e) {
    console.log(e);
    throw e;
  }
};

export const queryEmbedding = async (embedding: number[]) => {
  const embeddingStr = JSON.stringify(embedding);
  const results = await sql<Embedding[]>`
    SELECT * FROM embeddings ORDER BY vector <=> ${embeddingStr} LIMIT 5;
  `;
  return results;
};
