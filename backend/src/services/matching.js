import { pool } from "../db.js";
import { cosineSimilarities, embedText } from "./embeddings.js";

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

async function embeddingMatches(text, limit = 5) {
  const { rows } = await pool.query(
    "SELECT sku, name, category, embedding FROM products WHERE embedding IS NOT NULL"
  );
  if (rows.length === 0) return [];

  const queryVec = await embedText(text);
  const sims = cosineSimilarities(
    queryVec,
    rows.map((r) => r.embedding)
  );

  const scored = rows.map((r, i) => ({
    sku: r.sku,
    name: r.name,
    category: r.category,
    score: sims[i],
  }));
  scored.sort((a, b) => b.score - a.score);
  return scored.slice(0, limit);
}

export async function matchItem(text, confidenceThreshold = 0.3) {
  let candidates = [];
  if (process.env.GEMINI_API_KEY) {
    try {
      candidates = await embeddingMatches(text);
    } catch {
      candidates = [];
    }
  }

  const trigram = await trigramMatches(text);
  const seen = new Set(candidates.map((c) => c.sku));
  for (const t of trigram) {
    if (!seen.has(t.sku)) candidates.push({ ...t, score: Number(t.score) });
  }

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
