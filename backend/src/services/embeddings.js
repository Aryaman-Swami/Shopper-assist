import { getClient } from "./geminiClient.js";

export const EMBEDDING_MODEL = "gemini-embedding-001";

export async function embedText(text) {
  const client = getClient();
  const result = await client.models.embedContent({ model: EMBEDDING_MODEL, contents: text });
  return result.embeddings[0].values;
}

export async function embedTexts(texts) {
  const client = getClient();
  const result = await client.models.embedContent({ model: EMBEDDING_MODEL, contents: texts });
  return result.embeddings.map((e) => e.values);
}

export function cosineSimilarities(query, candidates) {
  const qNorm = Math.sqrt(query.reduce((s, v) => s + v * v, 0)) || 1e-9;
  return candidates.map((c) => {
    const dot = c.reduce((s, v, i) => s + v * query[i], 0);
    const cNorm = Math.sqrt(c.reduce((s, v) => s + v * v, 0)) || 1e-9;
    return dot / (qNorm * cNorm);
  });
}
