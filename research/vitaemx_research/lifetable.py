"""Life table construction. Implements METHODOLOGY.md §1."""

from __future__ import annotations

import numpy as np
import pandas as pd

RADIX = 100_000
# Average fraction of the year lived by those who die in the interval.
# 0.5 is the conventional mid-year assumption; infant deaths cluster near
# birth, so a smaller value is used at age 0 (METHODOLOGY.md §1).
A0 = 0.1
AX = 0.5


def central_rate_to_qx(mx: np.ndarray, ax: np.ndarray) -> np.ndarray:
    """Convert central death rates ``m_x`` to probabilities ``q_x``.

    Uses the standard relation q_x = m_x / (1 + (1 - a_x) * m_x), which is
    exact when deaths are spread through the year according to ``a_x``.
    """
    return mx / (1.0 + (1.0 - ax) * mx)


def build_life_table(
    ages: np.ndarray, deaths: np.ndarray, population: np.ndarray
) -> pd.DataFrame:
    """Build a complete single-age life table from deaths and exposure.

    Columns: age, mx, qx, lx, dx, Lx, Tx, ex. The last age is treated as an
    open interval (everyone dies), closed with L_omega = l_omega / m_omega.
    See METHODOLOGY.md §1 and §4 (terminal age closure).
    """
    ages = np.asarray(ages, dtype=int)
    deaths = np.asarray(deaths, dtype=float)
    population = np.asarray(population, dtype=float)
    if not (len(ages) == len(deaths) == len(population)):
        raise ValueError("ages, deaths and population must have the same length")
    if np.any(np.diff(ages) != 1):
        raise ValueError("ages must be consecutive single years")

    n = len(ages)

    # CONAPO rounds counts to integers, so small states show zero population
    # at some ages above ~105. A rate is undefined there, and treating the
    # cohort as extinct is the only reading consistent with "0 people alive",
    # so the table is closed at the last age before the first zero exposure.
    zero_exposure = np.flatnonzero(population <= 0)
    if len(zero_exposure) > 0 and zero_exposure[0] == 0:
        raise ValueError("no exposure at age 0")
    omega = int(zero_exposure[0]) - 1 if len(zero_exposure) > 0 else n - 1

    mx = np.full(n, np.nan)
    mx[: omega + 1] = deaths[: omega + 1] / population[: omega + 1]
    ax = np.full(n, AX)
    ax[0] = A0

    qx = np.ones(n)
    qx[: omega + 1] = np.clip(
        central_rate_to_qx(mx[: omega + 1], ax[: omega + 1]), 0.0, 1.0
    )
    qx[omega] = 1.0  # open-ended terminal age (METHODOLOGY.md §4)

    lx = np.empty(n)
    lx[0] = RADIX
    for i in range(1, n):
        lx[i] = lx[i - 1] * (1.0 - qx[i - 1])

    dx = lx * qx

    Lx = lx - (1.0 - ax) * dx
    Lx[omega] = lx[omega] / mx[omega] if mx[omega] > 0 else lx[omega]
    Lx[omega + 1 :] = 0.0

    Tx = np.cumsum(Lx[::-1])[::-1]
    ex = np.divide(Tx, lx, out=np.zeros_like(Tx), where=lx > 0)

    return pd.DataFrame(
        {
            "age": ages,
            "mx": mx,
            "qx": qx,
            "lx": lx,
            "dx": dx,
            "Lx": Lx,
            "Tx": Tx,
            "ex": ex,
        }
    )


def build_all_life_tables(exposure: pd.DataFrame) -> pd.DataFrame:
    """Apply ``build_life_table`` to every (state_code, sex) group."""
    tables = []
    for (state_code, state_name, sex), group in exposure.groupby(
        ["state_code", "state_name", "sex"], sort=True
    ):
        group = group.sort_values("age")
        table = build_life_table(
            group["age"].to_numpy(),
            group["deaths"].to_numpy(),
            group["population"].to_numpy(),
        )
        table.insert(0, "sex", sex)
        table.insert(0, "state_name", state_name)
        table.insert(0, "state_code", state_code)
        tables.append(table)
    return pd.concat(tables, ignore_index=True)
