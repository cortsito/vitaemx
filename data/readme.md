# data/

`raw/` — CONAPO open-data files, downloaded by `research/fetch_raw_data.py` with pinned checksums; not committed (~90 MB). See [`raw/README.md`](raw/README.md) and [`docs/data-sources.md`](../docs/data-sources.md).

`processed/` — versioned, ready-to-serve outputs produced by the notebooks in `research/` (about 1.5 MB, committed). This is what `backend/` reads. Data dictionary: [`processed/README.md`](processed/README.md).
