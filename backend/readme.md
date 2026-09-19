# backend/

FastAPI application, deployed as Vercel serverless functions. Reads pre-validated data from `data/processed/` — it does not fit models or run heavy computation at request time; that happens offline in `research/`. See [`../ARCHITECTURE.md`](../ARCHITECTURE.md) for the full design and API contract, and [`../CLAUDE.md`](../CLAUDE.md) for code conventions.

Scaffolding (app structure, `requirements.txt`, first endpoints) is tracked as Phase 1 work in [`../ROADMAP.md`](../ROADMAP.md).