"""Gompertz-Makeham fitting. Implements METHODOLOGY.md §2.

The force of mortality is modelled as mu(x) = A + B * c**x. The fit is done
by nonlinear least squares on log(mu), which keeps the very different
magnitudes of mu at age 30 (~1e-3) and age 90 (~2e-1) on an equal footing;
fitting on the raw scale would let the oldest ages dominate.
"""

from __future__ import annotations

from dataclasses import dataclass

import numpy as np
import pandas as pd
from scipy.optimize import curve_fit

FIT_AGE_MIN = 30
FIT_AGE_MAX = 90


def gompertz_makeham(age: np.ndarray, A: float, B: float, c: float) -> np.ndarray:
    """mu(x) = A + B * c**x."""
    return A + B * np.power(c, age)


def _log_gompertz_makeham(
    age: np.ndarray, log_A: float, log_B: float, c: float
) -> np.ndarray:
    # Parameterising A and B on the log scale keeps them positive during the search.
    return np.log(np.exp(log_A) + np.exp(log_B) * np.power(c, age))


def qx_to_mu(qx: np.ndarray) -> np.ndarray:
    """mu_x = -ln(1 - q_x), the piecewise-constant-hazard conversion."""
    return -np.log1p(-np.asarray(qx, dtype=float))


def mu_to_qx(mu: np.ndarray) -> np.ndarray:
    """Inverse of ``qx_to_mu``."""
    return -np.expm1(-np.asarray(mu, dtype=float))


@dataclass
class GompertzMakehamFit:
    A: float
    B: float
    c: float
    r2_log_mu: float
    rmse_log_mu: float
    age_min: int
    age_max: int

    def mu(self, age: np.ndarray) -> np.ndarray:
        return gompertz_makeham(np.asarray(age, dtype=float), self.A, self.B, self.c)

    def qx(self, age: np.ndarray) -> np.ndarray:
        return mu_to_qx(self.mu(age))


def fit_gompertz_makeham(
    ages: np.ndarray,
    qx: np.ndarray,
    age_min: int = FIT_AGE_MIN,
    age_max: int = FIT_AGE_MAX,
) -> GompertzMakehamFit:
    """Fit mu(x) = A + B c^x to observed q_x over [age_min, age_max]."""
    ages = np.asarray(ages, dtype=float)
    qx = np.asarray(qx, dtype=float)
    mask = (ages >= age_min) & (ages <= age_max) & (qx > 0) & (qx < 1)
    x = ages[mask]
    y = np.log(qx_to_mu(qx[mask]))

    # Starting values: typical adult mortality (A ~ 1e-3, B ~ 5e-5, c ~ 1.09).
    p0 = (np.log(1e-3), np.log(5e-5), 1.09)
    bounds = ((-20.0, -30.0, 1.0), (0.0, 0.0, 1.3))
    params, _ = curve_fit(
        _log_gompertz_makeham, x, y, p0=p0, bounds=bounds, maxfev=20_000
    )
    log_A, log_B, c = params

    y_hat = _log_gompertz_makeham(x, log_A, log_B, c)
    residuals = y - y_hat
    ss_res = float(np.sum(residuals**2))
    ss_tot = float(np.sum((y - y.mean()) ** 2))
    return GompertzMakehamFit(
        A=float(np.exp(log_A)),
        B=float(np.exp(log_B)),
        c=float(c),
        r2_log_mu=1.0 - ss_res / ss_tot,
        rmse_log_mu=float(np.sqrt(ss_res / len(x))),
        age_min=age_min,
        age_max=age_max,
    )


def fit_all(life_tables: pd.DataFrame) -> tuple[pd.DataFrame, pd.DataFrame]:
    """Fit every (state, sex) table.

    Returns ``(params, fitted)``: one row of parameters per table, and the
    input life tables with two extra columns, ``qx_fitted`` (the smoothed
    q_x inside the fitting window, raw q_x outside it) and ``qx_source``
    ("fitted" or "raw") so the app can label each value honestly
    (METHODOLOGY.md §4, fitting window).
    """
    param_rows = []
    fitted_parts = []
    for (state_code, state_name, sex), group in life_tables.groupby(
        ["state_code", "state_name", "sex"], sort=True
    ):
        group = group.sort_values("age").copy()
        fit = fit_gompertz_makeham(group["age"].to_numpy(), group["qx"].to_numpy())
        in_window = (group["age"] >= fit.age_min) & (group["age"] <= fit.age_max)
        group["qx_fitted"] = np.where(
            in_window, fit.qx(group["age"].to_numpy()), group["qx"]
        )
        group["qx_source"] = np.where(in_window, "fitted", "raw")
        fitted_parts.append(group)
        param_rows.append(
            {
                "state_code": state_code,
                "state_name": state_name,
                "sex": sex,
                "A": fit.A,
                "B": fit.B,
                "c": fit.c,
                "r2_log_mu": fit.r2_log_mu,
                "rmse_log_mu": fit.rmse_log_mu,
                "age_min": fit.age_min,
                "age_max": fit.age_max,
            }
        )
    return pd.DataFrame(param_rows), pd.concat(fitted_parts, ignore_index=True)
