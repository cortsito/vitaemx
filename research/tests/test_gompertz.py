import numpy as np
import pytest

from vitaemx_research import gompertz


def test_mu_qx_round_trip():
    qx = np.array([0.001, 0.05, 0.5])
    assert np.allclose(gompertz.mu_to_qx(gompertz.qx_to_mu(qx)), qx)


def test_recovers_known_parameters():
    ages = np.arange(0, 110)
    true = gompertz.GompertzMakehamFit(
        A=1e-3, B=4e-5, c=1.10, r2_log_mu=1, rmse_log_mu=0, age_min=30, age_max=90
    )
    qx = true.qx(ages)
    fit = gompertz.fit_gompertz_makeham(ages, qx)
    assert fit.A == pytest.approx(true.A, rel=1e-3)
    assert fit.B == pytest.approx(true.B, rel=1e-3)
    assert fit.c == pytest.approx(true.c, rel=1e-4)
    assert fit.r2_log_mu == pytest.approx(1.0)


def test_only_fitting_window_is_marked_fitted():
    import pandas as pd

    ages = np.arange(0, 110)
    qx = gompertz.GompertzMakehamFit(1e-3, 4e-5, 1.10, 1, 0, 30, 90).qx(ages)
    table = pd.DataFrame(
        {"state_code": 0, "state_name": "x", "sex": "total", "age": ages, "qx": qx}
    )
    params, fitted = gompertz.fit_all(table)
    assert len(params) == 1
    assert set(fitted.loc[fitted.age.between(30, 90), "qx_source"]) == {"fitted"}
    assert set(fitted.loc[~fitted.age.between(30, 90), "qx_source"]) == {"raw"}
    assert np.allclose(
        fitted.loc[~fitted.age.between(30, 90), "qx_fitted"],
        qx[~np.isin(ages, np.arange(30, 91))],
    )
