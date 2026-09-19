# Shopper Assist

MVP: shopping list → matched SKUs → optimal in-store route, over a demo grid store.

Stack: Node.js/Express backend, React (Vite) frontend, Postgres.

## Run locally

Prereqs: Node.js 24 LTS, Postgres 18 (local service), a Gemini API key for list
extraction/semantic matching.

```
# 1. Backend deps
cd backend && npm install

# 2. DB (one-time): update DATABASE_URL in .env, then
psql -U postgres -h localhost -c "CREATE DATABASE shopper_assist;"
psql -U postgres -h localhost -d shopper_assist -f data/schema.sql
python data/seed.py                # requires Python only for the one-off seed script
python data/embed_catalog.py       # backfills semantic embeddings, needs GEMINI_API_KEY

# 3. Backend
cd backend && node src/server.js

# 4. Frontend (separate terminal)
cd frontend && npm install && npm run dev
```

Open http://localhost:5500. Set your Gemini key in `.env` (`GEMINI_API_KEY=`) to enable
`/extract` and `/plan` (list photo/text parsing) and semantic `/match`. `/match` and `/route`
work without a key via `pg_trgm` lexical matching alone.

## Notes

- No pgvector: local Postgres 18 doesn't have it installed (would need compiling on Windows).
  Semantic matching is brute-force cosine similarity in application code — trivial at 200 SKUs.
- `data/generate_store_data.py`, `data/seed.py`, and `data/embed_catalog.py` remain Python —
  they're one-off data-prep scripts, not part of the running service.
- Gemini model names drift — this repo currently targets `gemini-3.6-flash` (extraction) and
  `gemini-embedding-001` (embeddings); check `GET /v1beta/models` on your key if calls 404.
