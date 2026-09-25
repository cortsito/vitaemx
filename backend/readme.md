# backend/

FastAPI application. Reads `data/processed/` once per process (`app/data.py`), prices premiums at request time in pure Python (`app/actuarial.py`), and exposes the routes in `app/main.py`. No model fitting here; that happens in `research/`.

```bash
python -m venv .venv && source .venv/bin/activate
pip install -r requirements-dev.txt
uvicorn app.main:app --reload      # http://127.0.0.1:8000/docs
pytest
black . && isort .
```

Deployed on Vercel through `api/index.py` at the repo root (see `vercel.json`). API contract: [`docs/architecture.md`](../docs/architecture.md).
