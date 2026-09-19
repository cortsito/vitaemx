# data/

`raw/` — cached snapshots of source datasets (CONAPO, INEGI, WHO), each with its fetch date recorded, since none of these sources provide a stable versioned API. See [`../DATA_SOURCES.md`](../DATA_SOURCES.md) for what each source is and its license.

`processed/` — versioned, ready-to-serve outputs produced by the notebooks in `research/`: life tables, fitted model parameters, validation metrics. This is what `backend/` actually reads. Add a short data dictionary here once the first processed files exist, describing each column and which notebook produced it.