"""Net premium formulas served by the API. Implements METHODOLOGY.md §3.

Pure Python on purpose: the serverless function should not need numpy just
to sum a few hundred discounted terms. ``research/vitaemx_research/premiums.py``
holds the numpy version used in the notebooks; ``tests/test_actuarial.py``
checks the two agree.
"""

from __future__ import annotations

from dataclasses import dataclass


def survivors_from_qx(qx: list[float], radix: float = 100_000.0) -> list[float]:
    """Rebuild an ``l_x`` series from ``q_x`` (METHODOLOGY.md §1)."""
    lx = [radix]
    for q in qx[:-1]:
        lx.append(lx[-1] * (1.0 - q))
    return lx


def deferred_death_probabilities(lx: list[float], age_index: int) -> list[float]:
    """``k| q_x`` for k = 0, 1, ...: die in year k+1 after age x."""
    base = lx[age_index]
    if base <= 0:
        raise ValueError("no survivors at the requested age")
    kpx = [value / base for value in lx[age_index:]]
    probabilities = [kpx[k] - kpx[k + 1] for k in range(len(kpx) - 1)]
    probabilities.append(kpx[-1])  # the last age is closed: everyone dies
    return probabilities


def term_insurance_nsp(
    lx: list[float], age_index: int, term: int, interest: float
) -> float:
    """A^1_{x:n}: benefit 1 at the end of the year of death, if within n years."""
    v = 1.0 / (1.0 + interest)
    kqx = deferred_death_probabilities(lx, age_index)[:term]
    return sum(v ** (k + 1) * q for k, q in enumerate(kqx))


def whole_life_nsp(lx: list[float], age_index: int, interest: float) -> float:
    """A_x: benefit 1 at the end of the year of death, whenever it happens."""
    return term_insurance_nsp(lx, age_index, len(lx) - age_index, interest)


def annuity_due(
    lx: list[float], age_index: int, term: int | None, interest: float
) -> float:
    """ä_x or ä_{x:n}: 1 at the start of each year the insured is alive."""
    v = 1.0 / (1.0 + interest)
    base = lx[age_index]
    kpx = [value / base for value in lx[age_index:]]
    if term is not None:
        kpx = kpx[:term]
    return sum(v**k * p for k, p in enumerate(kpx))


@dataclass
class PremiumResult:
    net_single_premium: float
    annuity_due: float
    annual_premium: float


def price(
    lx: list[float], age_index: int, product: str, term: int | None, interest: float
) -> PremiumResult:
    """Price a unit benefit. ``product`` is "term" or "whole_life"."""
    if product == "term":
        if term is None or term < 1:
            raise ValueError("term products need a term of at least 1 year")
        nsp = term_insurance_nsp(lx, age_index, term, interest)
        annuity = annuity_due(lx, age_index, term, interest)
    elif product == "whole_life":
        nsp = whole_life_nsp(lx, age_index, interest)
        annuity = annuity_due(lx, age_index, None, interest)
    else:
        raise ValueError(f"unknown product {product!r}")
    return PremiumResult(
        net_single_premium=nsp, annuity_due=annuity, annual_premium=nsp / annuity
    )
