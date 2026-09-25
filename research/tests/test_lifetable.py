import numpy as np
import pytest

from vitaemx_research import lifetable


def _constant_hazard_inputs(n_ages: int = 5, m: float = 0.1):
    ages = np.arange(n_ages)
    population = np.full(n_ages, 1000.0)
    deaths = population * m
    return ages, deaths, population


def test_qx_from_mx_mid_year_assumption():
    mx = np.array([0.1])
    ax = np.array([0.5])
    assert lifetable.central_rate_to_qx(mx, ax) == pytest.approx(0.1 / 1.05)


def test_life_table_columns_and_radix():
    table = lifetable.build_life_table(*_constant_hazard_inputs())
    assert list(table.columns) == ["age", "mx", "qx", "lx", "dx", "Lx", "Tx", "ex"]
    assert table["lx"].iloc[0] == lifetable.RADIX
    assert table["qx"].iloc[-1] == 1.0  # terminal age is closed


def test_survivors_decrease_and_deaths_add_up():
    table = lifetable.build_life_table(*_constant_hazard_inputs())
    assert np.all(np.diff(table["lx"]) <= 0)
    assert table["dx"].sum() == pytest.approx(lifetable.RADIX)


def test_life_expectancy_is_tx_over_lx():
    table = lifetable.build_life_table(*_constant_hazard_inputs())
    assert np.allclose(table["ex"], table["Tx"] / table["lx"])


def test_zero_exposure_tail_closes_table_early():
    ages = np.arange(6)
    population = np.array([100.0, 100.0, 50.0, 10.0, 0.0, 0.0])
    deaths = np.array([1.0, 2.0, 5.0, 5.0, 0.0, 0.0])
    table = lifetable.build_life_table(ages, deaths, population)
    assert table["qx"].iloc[3] == 1.0
    assert table["mx"].isna().iloc[4]
    assert table["lx"].iloc[4] == 0.0
    assert table["Lx"].iloc[4] == 0.0
    assert not table[["qx", "lx", "Lx", "Tx", "ex"]].isna().any().any()


def test_rejects_non_consecutive_ages():
    with pytest.raises(ValueError):
        lifetable.build_life_table(
            np.array([0, 2]), np.array([1.0, 1.0]), np.array([10.0, 10.0])
        )
