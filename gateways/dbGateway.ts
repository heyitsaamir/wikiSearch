import postgres = require("postgres");
import fs = require("fs");
import { v4 as uuidv4 } from "uuid";

/**
 * create or replace function match_documents (
  query_embedding vector(1536),
  match_threshold float,
  match_count int
)
returns table (
  id uuid,
  text_url text,
  text_details jsonb,
  similarity float
)
language sql stable
as $$
  select
    embeddings.id,
    embeddings.text_url,
    embeddings.text_details,
    1 - (embeddings.vector <=> query_embedding) as similarity
  from embeddings
  where 1 - (embeddings.vector <=> query_embedding) > match_threshold
  order by similarity desc
  limit match_count;
$$;
 */

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
  user: process.env.AZURE_PG_USER,
  password: process.env.AZURE_PG_PASSWORD,
  database: "postgres",
  ssl:
    process.env.SSL_CERT_PATH != null
      ? {
          rejectUnauthorized: true,
          ca: fs.readFileSync(process.env.SSL_CERT_PATH.toString()),
        }
      : true,
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
  embeddings: {
    embedding: number[];
    textDetails: TextDetails;
    metadata?: { sender?: string; additionalContext?: string };
  }[]
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

type QueryResult = Pick<Embedding, "text_details" | "text_url" | "id"> & {
  similarity: number;
};

export const queryEmbedding = async (embedding: number[]) => {
  const embeddingStr = JSON.stringify(embedding);
  const results = await sql<QueryResult[]>`
    select text_url, text_details, similarity from match_documents(${embeddingStr}, 0.8, 10);
  `;
  return results;
};
