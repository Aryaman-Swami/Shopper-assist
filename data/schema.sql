-- Shopper Assist demo schema
CREATE EXTENSION IF NOT EXISTS pg_trgm;
CREATE EXTENSION IF NOT EXISTS vector;

DROP TABLE IF EXISTS inventory;
DROP TABLE IF EXISTS products;
DROP TABLE IF EXISTS store_edges;
DROP TABLE IF EXISTS store_nodes;

CREATE TABLE store_nodes (
    id TEXT PRIMARY KEY,
    type TEXT NOT NULL,
    x DOUBLE PRECISION NOT NULL,
    y DOUBLE PRECISION NOT NULL,
    aisle_id INTEGER
);

CREATE TABLE store_edges (
    node_a TEXT NOT NULL REFERENCES store_nodes(id),
    node_b TEXT NOT NULL REFERENCES store_nodes(id),
    distance DOUBLE PRECISION NOT NULL,
    PRIMARY KEY (node_a, node_b)
);

CREATE TABLE products (
    sku TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    category TEXT NOT NULL,
    aisle_id INTEGER NOT NULL,
    shelf_id TEXT NOT NULL REFERENCES store_nodes(id),
    -- gemini-embedding-001 truncated to 768 dims (Matryoshka representation
    -- learning: the first 768 values are still a valid, high-quality
    -- embedding on their own). 768 keeps us under pgvector's HNSW index
    -- dimension ceiling and keeps the index small for a demo catalog.
    embedding vector(768)
);

CREATE INDEX products_name_trgm_idx ON products USING gin (name gin_trgm_ops);

-- HNSW: an approximate-nearest-neighbor graph index over the embedding
-- column, built for cosine distance (vector_cosine_ops) since that's the
-- operator matching.js queries with (<=>).
CREATE INDEX products_embedding_hnsw_idx ON products USING hnsw (embedding vector_cosine_ops);

CREATE TABLE inventory (
    sku TEXT PRIMARY KEY REFERENCES products(sku),
    store_id TEXT NOT NULL DEFAULT 'demo-store-1',
    stock_qty INTEGER NOT NULL DEFAULT 0,
    last_updated TIMESTAMPTZ NOT NULL DEFAULT now()
);
