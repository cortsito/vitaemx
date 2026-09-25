# data/raw/

Cached CONAPO open-data files. **Not committed** (~90 MB); download with `python research/fetch_raw_data.py`, which verifies these checksums:

| File | SHA-256 | Source |
|---|---|---|
| `00_Pob_Mitad_1950_2070.csv` | `89db6adc…cac6` | CONAPO pry23, Internet Archive capture 2025-05-15 |
| `01_Defunciones_1950_2070.csv` | `9d5c24f0…f075` | CONAPO pry23, Internet Archive capture 2025-05-15 |
| `05_Indicadores_demograficos_proyecciones.csv` | `e0407d16…caed` | datos.gob.mx, fetched 2026-09-25 |

Full checksums are in `research/fetch_raw_data.py` and `data/processed/version.json`. Provenance and license: [`docs/data-sources.md`](../../docs/data-sources.md).

Note: the Internet Archive captures cover the 32 states for 1970–2070 but not the `CVE_GEO = 0` national rows; the national aggregate is computed as the sum of the states in `research/vitaemx_research/conapo.py`.
