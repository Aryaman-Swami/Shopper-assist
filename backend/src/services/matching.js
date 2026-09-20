import { pool } from "../db.js";
import { embedTexts, toVectorLiteral } from "./embeddings.js";

async function trigramMatches(text, limit = 5) {
  const { rows } = await pool.query(
    `SELECT sku, name, category, similarity(name, $1) AS score
     FROM products
     ORDER BY score DESC
     LIMIT $2`,
    [text, limit]
  );
  return rows;
}

// `<=>` is pgvector's cosine *distance* operator (0 = identical, 2 =
// opposite), computed against the HNSW index built in schema.sql instead
// of pulling every row into the app to score in JS. Takes an already-
// computed vector (from a batched embedTexts() call) rather than text, so
// this never triggers its own Gemini call.
async function embeddingMatchesForVector(vector, limit = 5) {
  const vectorParam = toVectorLiteral(vector);
  const { rows } = await pool.query(
    `SELECT sku, name, category, 1 - (embedding <=> $1::vector) AS score
     FROM products
     WHERE embedding IS NOT NULL
     ORDER BY embedding <=> $1::vector
     LIMIT $2`,
    [vectorParam, limit]
  );
  return rows.map((r) => ({ ...r, score: Number(r.score) }));
}

function resolveMatch(text, candidates, confidenceThreshold) {
  if (candidates.length === 0) {
    return { query: text, match: null, confidence: 0, matched: false, alternates: [] };
  }
  candidates.sort((a, b) => b.score - a.score);
  const best = candidates[0];
  return {
    query: text,
    match: { sku: best.sku, name: best.name, category: best.category },
    confidence: Math.round(best.score * 10000) / 10000,
    matched: best.score >= confidenceThreshold,
    alternates: candidates.slice(1, 4).map((c) => ({
      sku: c.sku,
      name: c.name,
      score: Math.round(c.score * 10000) / 10000,
    })),
  };
}

// Default threshold picked empirically, not the naive "0 = unrelated" guess:
// gemini-embedding-001 cosine scores for genuinely unrelated text (e.g.
// "curtains" vs this catalog, which has no matching product) sit around
// 0.58-0.62 as a noise floor, not near 0 — real matches in this catalog
// scored 0.70-0.99. 0.3 let literally everything through, including
// items with no real catalog match, silently mis-matched to an unrelated
// in-stock or out-of-stock product. 0.65 sits in the empirical gap between
// the two.
const DEFAULT_CONFIDENCE_THRESHOLD = 0.65;

// Matches a whole shopping list in one pass: all items are embedded in a
// single batched (+ cached) Gemini call up front, instead of one call per
// item, then each item's pgvector + trigram search runs against its own
// pre-computed vector.
export async function matchItems(texts, confidenceThreshold = DEFAULT_CONFIDENCE_THRESHOLD) {
  let vectors = null;
  if (process.env.GEMINI_API_KEY) {
    try {
      vectors = await embedTexts(texts);
    } catch {
      vectors = null;
    }
  }

  return Promise.all(
    texts.map(async (text, i) => {
      let candidates = [];
      if (vectors) {
        try {
          candidates = await embeddingMatchesForVector(vectors[i]);
        } catch {
          candidates = [];
        }
      }

      const trigram = await trigramMatches(text);
      const seen = new Set(candidates.map((c) => c.sku));
      for (const t of trigram) {
        if (!seen.has(t.sku)) candidates.push({ ...t, score: Number(t.score) });
      }

      return resolveMatch(text, candidates, confidenceThreshold);
    })
  );
}

export async function matchItem(text, confidenceThreshold = DEFAULT_CONFIDENCE_THRESHOLD) {
  const [result] = await matchItems([text], confidenceThreshold);
  return result;
}
