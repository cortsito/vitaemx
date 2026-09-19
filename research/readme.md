# research/

Jupyter notebooks that are the single source of truth for VitaeMX's science: they pull raw data (from `data/raw/`), clean it, fit the models described in [`../METHODOLOGY.md`](../METHODOLOGY.md), validate the results, and write versioned output to `data/processed/` for the backend to serve.

Suggested notebook order for Phase 1:

1. `01_build_life_tables.ipynb` — load CONAPO data, construct `qx`/`lx`/`dx`/`Lx`/`Tx`/`ex` per state.
2. `02_fit_gompertz_makeham.ipynb` — fit the mortality law, report goodness of fit.
3. `03_validate_against_inegi.ipynb` — cross-check against raw INEGI death registrations.
4. `04_premium_calculations.ipynb` — derive and sanity-check the premium formulas before they're ported into the backend.

Each notebook should end by writing its output to `data/processed/` with a clear filename and a short data dictionary in `data/processed/README.md`, not just leave results sitting in notebook cells.