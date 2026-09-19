# Shopper Assist

MVP: shopping list → matched SKUs → optimal in-store route, over a demo grid store.

## Run locally

Prereqs already verified on this machine: Python 3.10, Postgres 18 (local service), Node not required for the frontend.

```
# 1. Backend deps
pip install -r backend/requirements.txt

# 2. DB (one-time): update DATABASE_URL in .env, then
psql -U postgres -h localhost -c "CREATE DATABASE shopper_assist;"
psql -U postgres -h localhost -d shopper_assist -f data/schema.sql
python data/seed.py

# 3. Backend
cd backend && python -m uvicorn app.main:app --port 8000

# 4. Frontend (separate terminal)
cd frontend && python -m http.server 5500
```

Open http://localhost:5500. Set your Gemini key in `.env` (`GEMINI_API_KEY=`) to enable
`/extract` and `/plan` (list photo/text parsing). `/match` and `/route` work without a key
(pg_trgm lexical matching).

## Notes

- No pgvector: local Postgres 18 doesn't have it installed (would need compiling on Windows).
  Semantic matching is done in Python via brute-force cosine similarity — trivial at 200 SKUs.
- Once GEMINI_API_KEY is set, run a one-time embedding pass (not yet scripted) to populate
  `products.embedding` before semantic /match kicks in; trigram fallback works either way.
