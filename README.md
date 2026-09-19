# VitaeMX

**An open-source actuarial mortality engine for Mexico, built on official demographic data.**

VitaeMX constructs life tables from Mexico's official population and mortality statistics, fits classical actuarial mortality laws to them, and uses the result to price simplified life insurance products. It is built and documented the way a real actuarial project would be: explicit assumptions, versioned methodology, and validation against real data — not a black box.

This repository is developed in the open as a portfolio project. Every design decision is recorded (see [`docs/adr/`](docs/adr/)), the data lineage is documented (see [`DATA_SOURCES.md`](DATA_SOURCES.md)), and the math is written out in full (see [`METHODOLOGY.md`](METHODOLOGY.md)).

> **Status:** Phase 1 (Foundations) in progress. See [`ROADMAP.md`](ROADMAP.md) for the full plan.

---

## What it does

- Builds life tables (`qx`, `lx`, `dx`, `Lx`, `Tx`, `ex`) for Mexico and its 32 states from CONAPO's official demographic projections.
- Fits a Gompertz-Makeham mortality law to the observed data and reports goodness of fit.
- Calculates simplified net premiums for term and whole life insurance from the fitted mortality curve.
- Ships as a small web application: pick a state, an age, and a product, and see the underlying life table and the resulting premium — with the methodology one click away, not hidden.

Future phases add mortality projection (Lee-Carter), a Monte Carlo reserve simulator for a fictional insurer, and an interactive life-expectancy map of Mexico. See the [roadmap](ROADMAP.md).

## Live demo

_Link goes here once Phase 1 is deployed._

## Tech stack

| Layer | Choice | Why |
|---|---|---|
| Data & modeling | Python (pandas, numpy, scipy, statsmodels) | Standard scientific stack, transparent, notebook-friendly |
| API | FastAPI, deployed as serverless functions | Typed, self-documenting (OpenAPI), no server to keep warm |
| Frontend | React + TypeScript, static build | Interactive without needing a rendering server |
| Hosting | Vercel (frontend + serverless API in one project) | $0 cost, no cold-start "sleeping server" problem, single deploy pipeline |
| Data storage | Versioned CSV/Parquet in-repo + a small SQLite file for the API | No database service to pay for or maintain |

Full reasoning for these choices is in [`docs/adr/`](docs/adr/). The bigger picture is in [`ARCHITECTURE.md`](ARCHITECTURE.md).

## Project structure

```
vitaemx/
├── backend/          # FastAPI application, deployed as serverless functions
├── frontend/         # React + TypeScript application
├── research/         # Jupyter notebooks: data cleaning, model fitting, validation
├── data/             # Raw and processed datasets, with documented lineage
├── docs/
│   └── adr/           # Architecture Decision Records
├── ARCHITECTURE.md
├── METHODOLOGY.md
├── ROADMAP.md
├── DATA_SOURCES.md
└── CLAUDE.md          # Working conventions for AI-assisted development sessions
```

## Running locally

```bash
# Backend
cd backend
python -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt
uvicorn app.main:app --reload

# Frontend
cd frontend
npm install
npm run dev
```

Detailed setup instructions land here once the backend and frontend scaffolding exist (tracked in the [roadmap](ROADMAP.md), Phase 1).

## Methodology, in one paragraph

Life tables are built directly from CONAPO's official mortality projections rather than derived from raw death counts, because CONAPO already reconciles births, deaths, and migration into internally consistent `qx` values per state and age. A Gompertz-Makeham curve (`μ(x) = A + B·c^x`) is then fit to the adult-age portion of each table by nonlinear least squares, which smooths sampling noise and gives a compact, interpretable model of how mortality rises with age. Premiums are computed from the fitted curve using standard discounted-expected-value actuarial formulas, at a stated, adjustable interest rate. Every assumption — smoothing method, age range fit, discount rate, what is deliberately *not* modeled (selection effects, socioeconomic variation, etc.) — is documented in [`METHODOLOGY.md`](METHODOLOGY.md) rather than left implicit.

## License

MIT — see [`LICENSE`](LICENSE).

## Author

built by corshex. https://corshex.com