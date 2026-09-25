"""Net premium formulas. Implements METHODOLOGY.md §3.

This module is deliberately a copy of ``backend/app/actuarial.py`` in
spirit: the notebook ``04_premium_calculations.ipynb`` uses it to derive and
sanity-check the formulas, and the backend test-suite asserts both give the
same answers, so the served numbers are the reviewed ones.
"""

from __future__ import annotations

import numpy as np


def survival_probabilities(lx: np.ndarray, age_index: int) -> np.ndarray:
    """``k p_x`` for k = 0, 1, ... from a survivor series starting at ``age_index``."""
    lx = np.asarray(lx, dtype=float)
    return lx[age_index:] / lx[age_index]


def deferred_death_probabilities(lx: np.ndarray, age_index: int) -> np.ndarray:
    """``k| q_x``: probability of dying in year k+1 after age x, for k = 0, 1, ..."""
    kpx = survival_probabilities(lx, age_index)
    # Probability of surviving k years then dying in the following year.
    # The last age is closed (q = 1), so the tail is appended explicitly.
    return np.append(kpx[:-1] - kpx[1:], kpx[-1])


def term_insurance_nsp(
    lx: np.ndarray, age_index: int, term: int, interest: float
) -> float:
    """A^1_{x:n}: net single premium, benefit 1 at end of year of death within n years."""
    v = 1.0 / (1.0 + interest)
    kqx = deferred_death_probabilities(lx, age_index)[:term]
    k = np.arange(len(kqx))
    return float(np.sum(v ** (k + 1) * kqx))


def whole_life_nsp(lx: np.ndarray, age_index: int, interest: float) -> float:
    """A_x: net single premium, benefit 1 at end of year of death, whole of life."""
    remaining = len(lx) - age_index
    return term_insurance_nsp(lx, age_index, remaining, interest)


def annuity_due(
    lx: np.ndarray, age_index: int, term: int | None, interest: float
) -> float:
    """ä_x (term=None) or ä_{x:n}: present value of 1 paid at the start of each year survived."""
    v = 1.0 / (1.0 + interest)
    kpx = survival_probabilities(lx, age_index)
    if term is not None:
        kpx = kpx[:term]
    k = np.arange(len(kpx))
    return float(np.sum(v**k * kpx))
