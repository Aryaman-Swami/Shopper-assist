import { getClient } from "./geminiClient.js";

export const EMBEDDING_MODEL = "gemini-embedding-001";

// Truncated from the model's native 3072 dims (Matryoshka representation
// learning — the leading 768 values are a valid embedding on their own).
// Must match the `vector(768)` column in data/schema.sql.
export const EMBEDDING_DIMENSIONS = 768;

// In-memory cache: normalized text -> embedding vector. Shopping-list items
// repeat heavily across requests ("milk", "eggs", "bread", ...), so this
// avoids re-embedding the same string via a live Gemini call every time.
// Simple LRU by insertion order; cleared on process restart (fine for an
// MVP — worst case is a cache-cold API call, not incorrect behavior).
const CACHE_MAX_ENTRIES = 2000;
const embeddingCache = new Map();

const normalize = (text) => text.trim().toLowerCase();

function cacheGet(text) {
  const key = normalize(text);
  if (!embeddingCache.has(key)) return undefined;
  const value = embeddingCache.get(key);
  embeddingCache.delete(key);
  embeddingCache.set(key, value); // move to most-recently-used position
  return value;
}

function cacheSet(text, vector) {
  const key = normalize(text);
  embeddingCache.delete(key);
  embeddingCache.set(key, vector);
  if (embeddingCache.size > CACHE_MAX_ENTRIES) {
    embeddingCache.delete(embeddingCache.keys().next().value); // evict oldest
  }
}

// Batches ALL uncached texts into a single Gemini call (one round trip for
// an entire shopping list, instead of one call per item), reusing cached
// vectors for repeats and de-duplicating repeats within the same call.
export async function embedTexts(texts) {
  const results = new Array(texts.length);
  const toFetch = new Map(); // normalized key -> { text, indices: [] }

  texts.forEach((text, i) => {
    const cached = cacheGet(text);
    if (cached) {
      results[i] = cached;
      return;
    }
    const key = normalize(text);
    if (!toFetch.has(key)) toFetch.set(key, { text, indices: [] });
    toFetch.get(key).indices.push(i);
  });

  if (toFetch.size > 0) {
    const entries = [...toFetch.values()];
    const client = getClient();
    const result = await client.models.embedContent({
      model: EMBEDDING_MODEL,
      contents: entries.map((e) => e.text),
      config: { outputDimensionality: EMBEDDING_DIMENSIONS },
    });
    result.embeddings.forEach((e, j) => {
      const { text, indices } = entries[j];
      cacheSet(text, e.values);
      for (const idx of indices) results[idx] = e.values;
    });
  }

  return results;
}

export async function embedText(text) {
  const [vector] = await embedTexts([text]);
  return vector;
}

// pgvector's text input format for a vector literal is "[v1,v2,...]".
// Passed as a plain string param and cast with ::vector in the SQL.
export function toVectorLiteral(values) {
  return `[${values.join(",")}]`;
}
