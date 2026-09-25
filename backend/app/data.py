"""Load ``data/processed/`` once at cold start and keep it in memory.

The whole Phase 1 dataset is ~1.5 MB of CSV, so plain dicts are enough; no
SQLite needed yet (ARCHITECTURE.md, "backend").
"""

from __future__ import annotations

import csv
import json
import math
from dataclasses import dataclass, field
from functools import lru_cache
from pathlib import Path

PROCESSED_DIR = Path(__file__).resolve().parents[2] / "data" / "processed"

SEXES = ("total", "male", "female")


@dataclass
class LifeTableRow:
    age: int
    mx: float | None
    qx: float
    lx: float
    dx: float
    Lx: float
    Tx: float
    ex: float
    qx_fitted: float
    qx_source: str


@dataclass
class GompertzMakehamParams:
    A: float
    B: float
    c: float
    r2_log_mu: float
    rmse_log_mu: float
    age_min: int
    age_max: int


@dataclass
class Store:
    states: dict[int, str]
    tables: dict[tuple[int, str], list[LifeTableRow]]
    params: dict[tuple[int, str], GompertzMakehamParams]
    version: dict
    validation: dict[tuple[int, str], dict] = field(default_factory=dict)


def _float(value: str) -> float | None:
    if value == "" or value.lower() == "nan":
        return None
    number = float(value)
    return None if math.isnan(number) else number


def _read_csv(name: str) -> list[dict[str, str]]:
    with open(PROCESSED_DIR / name, newline="", encoding="utf-8") as handle:
        return list(csv.DictReader(handle))


@lru_cache(maxsize=1)
def load() -> Store:
    """Read every processed file. Cached, so it runs once per process."""
    fitted = {
        (int(r["state_code"]), r["sex"], int(r["age"])): (
            float(r["qx_fitted"]),
            r["qx_source"],
        )
        for r in _read_csv("fitted_qx.csv")
    }

    states: dict[int, str] = {}
    tables: dict[tuple[int, str], list[LifeTableRow]] = {}
    for r in _read_csv("life_tables.csv"):
        code, sex, age = int(r["state_code"]), r["sex"], int(r["age"])
        states[code] = r["state_name"]
        qx_fitted, qx_source = fitted[(code, sex, age)]
        tables.setdefault((code, sex), []).append(
            LifeTableRow(
                age=age,
                mx=_float(r["mx"]),
                qx=float(r["qx"]),
                lx=float(r["lx"]),
                dx=float(r["dx"]),
                Lx=float(r["Lx"]),
                Tx=float(r["Tx"]),
                ex=float(r["ex"]),
                qx_fitted=qx_fitted,
                qx_source=qx_source,
            )
        )
    for rows in tables.values():
        rows.sort(key=lambda row: row.age)

    params = {
        (int(r["state_code"]), r["sex"]): GompertzMakehamParams(
            A=float(r["A"]),
            B=float(r["B"]),
            c=float(r["c"]),
            r2_log_mu=float(r["r2_log_mu"]),
            rmse_log_mu=float(r["rmse_log_mu"]),
            age_min=int(r["age_min"]),
            age_max=int(r["age_max"]),
        )
        for r in _read_csv("gompertz_makeham_params.csv")
    }

    validation = {
        (int(r["state_code"]), r["sex"]): {
            "e0_vitaemx": float(r["e0_vitaemx"]),
            "e0_conapo": float(r["e0_conapo"]),
            "difference_years": float(r["difference_years"]),
        }
        for r in _read_csv("validation_e0.csv")
    }

    with open(PROCESSED_DIR / "version.json", encoding="utf-8") as handle:
        version = json.load(handle)

    return Store(
        states=states,
        tables=tables,
        params=params,
        version=version,
        validation=validation,
    )
