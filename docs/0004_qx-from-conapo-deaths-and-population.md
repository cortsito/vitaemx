# ADR 0004: Derive `qx` from CONAPO's projected deaths and mid-year population

**Status:** Accepted
**Date:** 2026-09

## Context

[ADR 0003](0003_conapo-as-primary-source.md) chose CONAPO's life tables as the primary source, and `METHODOLOGY.md` originally assumed CONAPO publishes `qx` directly. When the data was actually fetched, CONAPO's open-data release for the 2023 projection round (*pry23*) turned out to contain no `qx` or `lx` columns. What it publishes by single age, sex, state and year is:

- `01_Defunciones_1950_2070.csv` — deaths projected by CONAPO's own model,
- `00_Pob_Mitad_1950_2070.csv` — mid-year population from the same model,
- `05_Indicadores_demograficos_proyecciones.csv` — summary indicators, including life expectancy at birth (`EV`, `EVH`, `EVM`) per state and year.

## Decision

Build `qx` from CONAPO's projected deaths and mid-year population: `mx = D / P`, then `qx = mx / (1 + (1 − ax)·mx)` with `ax = 0.5` and `a0 = 0.1`. Validate the reconstruction against CONAPO's own published life expectancy at birth (notebook `03`), and treat any state/sex differing by more than one year as a bug.

## Rationale

The projected deaths and populations are the *output* of CONAPO's mortality model, so dividing them recovers the mortality schedule CONAPO used, up to the separation-factor (`ax`) assumption. This keeps the substance of ADR 0003 — the app's tables are CONAPO's mortality, not an independent estimate from raw INEGI registrations — while being honest about the one step we add. The validation notebook shows the rebuilt `e0` lands within 0.1 years of CONAPO's published figure nationally per sex and within 0.85 years for every state, with a systematic positive bias that is exactly what a slightly high `a0` would produce.

## Alternatives considered

- **Scrape `qx` from CONAPO's PDF/Excel tables.** Not available for pry23 as open data; would also be fragile.
- **Build from raw INEGI death registrations.** Rejected in ADR 0003 for the same reasons that still apply.
- **Use WHO national life tables.** No state breakdown.

## Consequences

- `METHODOLOGY.md` §1 now describes the `mx → qx` step and the `ax` assumptions.
- The INEGI cross-check planned for notebook `03` is replaced by a check against CONAPO's published `e0`; the INEGI comparison stays on the roadmap.
- The raw files are ~90 MB and are not committed; `research/fetch_raw_data.py` downloads them with pinned checksums. CONAPO's host rejects non-browser clients, so the script tries a pinned Internet Archive capture of the same files first.
