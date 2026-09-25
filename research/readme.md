# research/

The science, kept reproducible and separate from the app. Reusable code lives in `vitaemx_research/` (unit-tested in `tests/`); the notebooks are thin and call it.

```bash
pip install -r requirements.txt
python fetch_raw_data.py     # downloads CONAPO files into data/raw/ (not committed)
pytest
jupyter nbconvert --to notebook --execute --inplace 0*.ipynb
```

Notebooks, in order:

1. `01_build_life_tables.ipynb` — deaths ÷ population → `qx` → full life table per state and sex. Writes `life_tables.csv`.
2. `02_fit_gompertz_makeham.ipynb` — fits `μ(x) = A + B·c^x` on ages 30–90, reports R². Writes `gompertz_makeham_params.csv`, `fitted_qx.csv`, `version.json`.
3. `03_validate_life_expectancy.ipynb` — rebuilt `e0` vs CONAPO's published `e0`. Writes `validation_e0.csv`. (The INEGI cross-check originally planned here is deferred; see [ADR 0004](../docs/0004_qx-from-conapo-deaths-and-population.md).)
4. `04_premium_calculations.ipynb` — derives and sanity-checks the premium formulas the backend serves.

Modules: `conapo.py` (loading/reshaping), `lifetable.py` (§1 of the methodology), `gompertz.py` (§2), `premiums.py` (§3), `versioning.py` (provenance). Column meanings: [`data/processed/README.md`](../data/processed/README.md).
