"""One-time pass: embeds every catalog product name and stores it in products.embedding.

Run after seed.py, once GEMINI_API_KEY is set in .env.
"""
import sys
import time
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[1] / "backend"))

from dotenv import load_dotenv

load_dotenv(Path(__file__).resolve().parents[1] / ".env")

from google.genai.errors import ClientError

from app.db import get_conn
from app.services.embeddings import embed_texts

BATCH_SIZE = 10
PAUSE_BETWEEN_BATCHES = 8  # seconds, stays under the free-tier 100 req/min cap


def embed_with_retry(texts, max_retries=5):
    for attempt in range(max_retries):
        try:
            return embed_texts(texts)
        except ClientError as e:
            if e.code == 429 and attempt < max_retries - 1:
                wait = 35
                print(f"Rate limited, waiting {wait}s...")
                time.sleep(wait)
            else:
                raise


def main():
    conn = get_conn()
    cur = conn.cursor()
    cur.execute("SELECT sku, name FROM products WHERE embedding IS NULL ORDER BY sku")
    products = cur.fetchall()
    total_remaining = len(products)

    for i in range(0, len(products), BATCH_SIZE):
        batch = products[i:i + BATCH_SIZE]
        vectors = embed_with_retry([p["name"] for p in batch])
        for p, vec in zip(batch, vectors):
            cur.execute("UPDATE products SET embedding = %s WHERE sku = %s", (vec, p["sku"]))
        conn.commit()
        print(f"Embedded {min(i + BATCH_SIZE, total_remaining)}/{total_remaining}")
        if i + BATCH_SIZE < len(products):
            time.sleep(PAUSE_BETWEEN_BATCHES)

    cur.close()
    conn.close()


if __name__ == "__main__":
    main()
