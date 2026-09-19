# Shopper Assist — Project Plan

MVP with a demo store layout, to be deployed publicly.

## Feasibility

Feasible — it's a combination of three established patterns: **vision-LLM extraction → vector-search item matching (RAG-style) → graph pathfinding (TSP variant)**.

## Pipeline

```
Shopping list (photo/text)
   → Gemini API (vision + structured output) → [{item, qty}]
   → embed each item → vector DB search against product catalog → candidate SKUs
   → inventory/shelf lookup → filter by stock, pick best match, get (aisle, x, y)
   → store graph + shortest-path solver → optimal visiting order + route
   → UI: ordered steps / map overlay
```

## Components & tech choices

| Stage | Purpose | Recommended tech |
|---|---|---|
| Extraction | OCR/parse handwritten or typed list into structured JSON | Gemini 2.x Flash with JSON/function-calling response schema `{items:[{name, qty, unit}]}` — cheap, fast, handles handwriting well |
| Embeddings | Turn item text + catalog names into vectors | Gemini `text-embedding-004` (or Vertex AI) — keep same provider as extraction to simplify infra |
| Vector DB | Semantic match "coke" → "Coca-Cola 500ml" | Prototype: **pgvector** in Postgres (one DB for catalog + inventory + vectors, zero extra infra). Scale-up: Qdrant/Pinecone with HNSW index |
| Matching | Resolve fuzzy/ambiguous names | Hybrid: vector cosine similarity + `pg_trgm` lexical fallback for exact brand hits; optionally rerank top-k with a quick Gemini call for disambiguation |
| Inventory/shelf | Stock + location per SKU | Simple relational table: `sku, stock_qty, aisle_id, shelf_id, x, y` |
| Store layout | Model walkable space | Weighted graph: nodes = aisle junctions/shelf points, edges = corridor distances |
| Pairwise distances | Distance between any two points in store | **Dijkstra** (or BFS if unweighted grid) — precompute all-pairs distances for entrance, each item, checkout |
| Route ordering | "Shortest path visiting all items" = open-path TSP | See below |
| Backend orchestration | Glue it together | FastAPI (Python pairs well with OR-Tools + embedding libs) |

## Routing algorithm

"Shortest path visiting all items" = open-path TSP (fixed start = entrance, fixed end = checkout, no return trip needed).

- **≤ ~15 items**: **Held-Karp DP** — exact optimal solution, O(n²·2ⁿ), trivial at this size.
- **More items / added constraints** (one-way aisles, cart width, time windows): use **Google OR-Tools' routing solver** — handles fixed start/end and constraints cleanly.
- **Cheap heuristic baseline (build this first)**: sort items by aisle number along the store's natural serpentine traversal order. Not provably optimal but instant to compute and easy to explain. Good v0 before investing in a real TSP solver.
- Better-than-heuristic without full DP: nearest-neighbor construction + 2-opt local search improvement.

## Data model sketch

- `products(sku, name, category, embedding vector, aisle_id, shelf_id, x, y)`
- `inventory(sku, store_id, stock_qty, last_updated)`
- `store_graph_nodes(id, x, y, type)`
- `store_graph_edges(node_a, node_b, distance)`

## Deployment targets

- DB: **Supabase** or **Neon** (Postgres + pgvector built in, free tier)
- Backend: **Render** or **Railway** (free/cheap, easy FastAPI deploy)
- Frontend: **Vercel**
- Gemini API key from Google AI Studio

## Phases

### Phase 0 — Environment & repo setup
- Init git repo, create monorepo structure (`/backend`, `/frontend`, `/data`)
- Get Gemini API key (Google AI Studio) — set up billing/quota awareness for the demo
- Pick hosting up front so local setup matches prod (see Deployment targets above)
- `.env` for secrets (Gemini key, DB URL), `.env.example` committed
- Basic CI later (skip for MVP, just deploy manually first)

### Phase 1 — Demo store design (the data you're inventing)
- Sketch a small demo store layout: ~6-10 aisles, one entrance, one checkout
- Turn it into a graph JSON: nodes (junctions + shelf points with x/y), edges (corridor distance)
- Build a small product catalog (150-300 SKUs is plenty): name, category, aisle_id, shelf_id, x, y, stock_qty
- Write a seed script to load both into Postgres

### Phase 2 — Database & core backend
- Schema: `products`, `inventory`, `store_nodes`, `store_edges`
- Enable `pgvector` + `pg_trgm` extensions
- FastAPI skeleton with health check, DB connection, deployed once (even empty) to confirm the deploy pipeline works end-to-end early — cheapest time to catch infra issues

### Phase 3 — Embeddings & vector matching
- Script to embed all catalog product names → store in `products.embedding`
- `/match` endpoint: given a raw item string, embed it, ANN search top-k, fall back to trigram match, return best SKU + confidence score
- Test against messy inputs ("milk", "cocacola", "eggs dozen")

### Phase 4 — Gemini extraction
- `/extract` endpoint: accepts image or text, calls Gemini with a JSON response schema, returns `[{item, qty}]`
- Test with a photo of a handwritten list and a typed list

### Phase 5 — Inventory filtering
- Given matched SKUs, join against `inventory`, filter out-of-stock, attach shelf coordinates
- Decide simple fallback behavior for unmatched/out-of-stock items (flag to user, don't block the route)

### Phase 6 — Routing engine
- Dijkstra/BFS over `store_nodes`/`store_edges` for all-pairs distances (entrance, item nodes, checkout)
- v0: aisle-order heuristic for route ordering (fast to ship)
- v1 (if time permits): swap in Held-Karp DP for exact optimal ordering
- `/route` endpoint: input = matched item nodes → output = ordered stop list + total distance

### Phase 7 — Orchestration endpoint
- Single `/plan` endpoint that chains extract → match → filter → route, returns final ordered shopping route in one call (this is what the frontend hits)

### Phase 8 — Frontend
- Simple flow: upload/paste list → show extracted items (editable, in case Gemini misreads something) → show ordered route (list of stops, or an SVG/canvas overlay of the demo store graph with a path drawn on it)
- No need for real maps — a simple 2D SVG floor plan is enough for a demo

### Phase 9 — Deploy & polish
- Push backend to Render/Railway, frontend to Vercel, point at hosted Postgres
- Seed prod DB with the same demo data
- Add basic error states (no match found, empty list, API failures)
- Record a demo run end-to-end to confirm it works from a cold deploy

**MVP cut line:** Phases 0-8 get a working, deployed demo. The Held-Karp upgrade and route visualization polish in Phase 9 are stretch goals if time runs short.
