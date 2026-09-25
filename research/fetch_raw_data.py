"""Download the CONAPO open-data snapshot used by the notebooks into ``data/raw/``.

The raw files are ~90 MB and are not committed; run this once before the
notebooks. Checksums are pinned so a re-fetch that silently changed is caught.
See ``data/raw/README.md`` for provenance.

Usage:  python research/fetch_raw_data.py
"""

from __future__ import annotations

import hashlib
import sys
import urllib.request
from pathlib import Path

RAW_DIR = Path(__file__).resolve().parents[1] / "data" / "raw"

# CONAPO's own host (repodatos.atdt.gob.mx) sits behind a bot filter that
# rejects non-browser clients, so the pinned Internet Archive capture of the
# same file is tried first; the original is the fallback.
FILES = {
    "00_Pob_Mitad_1950_2070.csv": (
        "89db6adc7930965fb5b5c01ad3a98765ed90afa6a151c2cfb913acc2b9e0cac6",
        [
            "https://web.archive.org/web/20250515123859id_/https://repodatos.atdt.gob.mx/CONAPO/proyecciones/00_Pob_Mitad_1950_2070.csv",
            "https://repodatos.atdt.gob.mx/CONAPO/proyecciones/00_Pob_Mitad_1950_2070.csv",
        ],
    ),
    "01_Defunciones_1950_2070.csv": (
        "9d5c24f09e3739044d301f8886d59bf6336f1908434c37ee29962642d1bfa075",
        [
            "https://web.archive.org/web/20250515122508id_/https://repodatos.atdt.gob.mx/CONAPO/proyecciones/01_Defunciones_1950_2070.csv",
            "https://repodatos.atdt.gob.mx/CONAPO/proyecciones/01_Defunciones_1950_2070.csv",
        ],
    ),
    "05_Indicadores_demograficos_proyecciones.csv": (
        "e0407d1640f38232023cf97656a0cb7be46049b1cb2344198c7e4aaec7cae6cd",
        [
            "https://www.datos.gob.mx/dataset/f2b9b220-3ef7-4e3a-bde6-87e1dac78c6a/resource/b4fe49a8-c86a-4c32-8450-8f3c4cc83125/download/05_indicadores_demograficos_proyecciones.csv",
        ],
    ),
}


def sha256(path: Path) -> str:
    digest = hashlib.sha256()
    with open(path, "rb") as handle:
        for chunk in iter(lambda: handle.read(1 << 20), b""):
            digest.update(chunk)
    return digest.hexdigest()


def download(url: str, target: Path) -> None:
    request = urllib.request.Request(
        url, headers={"User-Agent": "Mozilla/5.0 (VitaeMX fetch script)"}
    )
    with urllib.request.urlopen(request, timeout=600) as response, open(
        target, "wb"
    ) as out:
        while chunk := response.read(1 << 20):
            out.write(chunk)


def main() -> int:
    RAW_DIR.mkdir(parents=True, exist_ok=True)
    failures = 0
    for name, (expected, urls) in FILES.items():
        target = RAW_DIR / name
        if target.exists() and sha256(target) == expected:
            print(f"ok       {name} (already present, checksum matches)")
            continue
        for url in urls:
            try:
                print(f"fetching {name} from {url}")
                download(url, target)
            except Exception as error:  # noqa: BLE001 - report and try the next mirror
                print(f"  failed: {error}")
                continue
            if sha256(target) == expected:
                print(f"ok       {name}")
                break
            print("  checksum mismatch, trying next source")
        else:
            failures += 1
            print(f"FAILED   {name}: no source produced the expected checksum")
    return 1 if failures else 0


if __name__ == "__main__":
    sys.exit(main())
