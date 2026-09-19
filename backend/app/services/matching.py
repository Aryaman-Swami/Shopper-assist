import os

from app.db import get_conn


def _trigram_matches(cur, text: str, limit: int = 5):
    cur.execute(
        """
        SELECT sku, name, category, similarity(name, %s) AS score
        FROM products
        ORDER BY score DESC
        LIMIT %s
        """,
        (text, limit),
    )
    return cur.fetchall()


def _embedding_matches(cur, text: str, limit: int = 5):
    from app.services.embeddings import cosine_similarity_matrix, embed_text

    cur.execute("SELECT sku, name, category, embedding FROM products WHERE embedding IS NOT NULL")
    rows = cur.fetchall()
    if not rows:
        return []

    query_vec = embed_text(text)
    sims = cosine_similarity_matrix(query_vec, [r["embedding"] for r in rows])

    scored = [
        {"sku": r["sku"], "name": r["name"], "category": r["category"], "score": float(s)}
        for r, s in zip(rows, sims)
    ]
    scored.sort(key=lambda x: x["score"], reverse=True)
    return scored[:limit]


def match_item(text: str, confidence_threshold: float = 0.3) -> dict:
    """Resolve a raw shopping-list item string to the best-matching SKU.

    Uses semantic embedding similarity when a Gemini API key is configured
    (catalog must be pre-embedded via data/embed_catalog.py), and always
    falls back to Postgres trigram lexical similarity otherwise.
    """
    conn = get_conn()
    cur = conn.cursor()

    candidates = []
    if os.environ.get("GEMINI_API_KEY"):
        try:
            candidates = _embedding_matches(cur, text)
        except Exception:
            candidates = []

    trigram = _trigram_matches(cur, text)

    # merge: prefer embedding ranking, but fold in any strong lexical hit
    seen = {c["sku"] for c in candidates}
    for t in trigram:
        if t["sku"] not in seen:
            candidates.append(dict(t))

    cur.close()
    conn.close()

    if not candidates:
        return {"query": text, "match": None, "confidence": 0.0, "alternates": []}

    candidates.sort(key=lambda x: x["score"], reverse=True)
    best = candidates[0]
    return {
        "query": text,
        "match": {"sku": best["sku"], "name": best["name"], "category": best["category"]},
        "confidence": round(best["score"], 4),
        "matched": best["score"] >= confidence_threshold,
        "alternates": [
            {"sku": c["sku"], "name": c["name"], "score": round(c["score"], 4)}
            for c in candidates[1:4]
        ],
    }
