"""Record which raw snapshot and which run produced ``data/processed/``."""

from __future__ import annotations

import hashlib
import json
from datetime import date
from pathlib import Path

PROCESSED_DIR = Path(__file__).resolve().parents[2] / "data" / "processed"
VERSION_FILE = PROCESSED_DIR / "version.json"


def sha256(path: Path) -> str:
    digest = hashlib.sha256()
    with open(path, "rb") as handle:
        for chunk in iter(lambda: handle.read(1 << 20), b""):
            digest.update(chunk)
    return digest.hexdigest()


def write_version(reference_year: int, raw_files: list[Path], notes: dict) -> dict:
    """Write ``version.json`` describing the current processed outputs."""
    payload = {
        "methodology_version": "1.0.0",
        "data_source": "CONAPO, Proyecciones de la Población de México y las Entidades Federativas 2020-2070 (pry23)",
        "reference_year": reference_year,
        "processed_on": date.today().isoformat(),
        "raw_files": [{"file": p.name, "sha256": sha256(p)} for p in raw_files],
        **notes,
    }
    PROCESSED_DIR.mkdir(parents=True, exist_ok=True)
    VERSION_FILE.write_text(
        json.dumps(payload, indent=2, ensure_ascii=False) + "\n", encoding="utf-8"
    )
    return payload
