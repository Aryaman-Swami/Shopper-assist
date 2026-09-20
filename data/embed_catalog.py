"""One-time pass: embeds every catalog product name and stores it in products.embedding.

Run after seed.py, once GEMINI_API_KEY is set in .env.

Self-contained (previously imported a Node-only `app` package that doesn't
exist in this repo — this script never actually ran). Uses psycopg2 + the
`pgvector` Python package directly, matching data/seed.py's style.
"""
import os
import time
from pathlib import Path

import psycopg2
from dotenv import load_dotenv
from google import genai
from google.genai.errors import ClientError
from pgvector.psycopg2 import register_vector

load_dotenv(Path(__file__).resolve().parents[1] / ".env")

DATABASE_URL = os.environ["DATABASE_URL"]
GEMINI_API_KEY = os.environ["GEMINI_API_KEY"]

EMBEDDING_MODEL = "gemini-embedding-001"
# Must match the vector(768) column in schema.sql and backend/src/services/embeddings.js.
EMBEDDING_DIMENSIONS = 768

BATCH_SIZE = 10
PAUSE_BETWEEN_BATCHES = 8  # seconds, stays under the free-tier 100 req/min cap

client = genai.Client(api_key=GEMINI_API_KEY)


def embed_texts(texts):
    result = client.models.embed_content(
        model=EMBEDDING_MODEL,
        contents=texts,
        config={"output_dimensionality": EMBEDDING_DIMENSIONS},
    )
    return [e.values for e in result.embeddings]


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
    conn = psycopg2.connect(DATABASE_URL)
    register_vector(conn)
    cur = conn.cursor()

    cur.execute("SELECT sku, name FROM products WHERE embedding IS NULL ORDER BY sku")
    products = cur.fetchall()
    total_remaining = len(products)

    for i in range(0, len(products), BATCH_SIZE):
        batch = products[i : i + BATCH_SIZE]
        vectors = embed_with_retry([name for _sku, name in batch])
        for (sku, _name), vec in zip(batch, vectors):
            cur.execute("UPDATE products SET embedding = %s WHERE sku = %s", (vec, sku))
        conn.commit()
        print(f"Embedded {min(i + BATCH_SIZE, total_remaining)}/{total_remaining}")
        if i + BATCH_SIZE < len(products):
            time.sleep(PAUSE_BETWEEN_BATCHES)

    cur.close()
    conn.close()


if __name__ == "__main__":
    main()
