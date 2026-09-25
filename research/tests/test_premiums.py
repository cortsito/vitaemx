import numpy as np
import pytest

from vitaemx_research import premiums

# A tiny table: everyone alive at x, half survive one year, nobody survives two.
LX = np.array([100.0, 50.0, 0.0])


def test_deferred_death_probabilities_sum_to_one():
    kqx = premiums.deferred_death_probabilities(LX, 0)
    assert kqx.sum() == pytest.approx(1.0)
    assert np.allclose(kqx, [0.5, 0.5, 0.0])


def test_term_insurance_matches_hand_calculation():
    i = 0.05
    v = 1 / 1.05
    expected = v * 0.5 + v**2 * 0.5
    assert premiums.term_insurance_nsp(LX, 0, 2, i) == pytest.approx(expected)
    assert premiums.term_insurance_nsp(LX, 0, 1, i) == pytest.approx(v * 0.5)


def test_whole_life_equals_term_to_end_of_table():
    assert premiums.whole_life_nsp(LX, 0, 0.05) == pytest.approx(
        premiums.term_insurance_nsp(LX, 0, 3, 0.05)
    )


def test_annuity_due():
    v = 1 / 1.05
    assert premiums.annuity_due(LX, 0, None, 0.05) == pytest.approx(1 + v * 0.5)
    assert premiums.annuity_due(LX, 0, 1, 0.05) == pytest.approx(1.0)


def test_zero_interest_whole_life_is_certain():
    # With no discounting, a benefit of 1 paid at death is worth exactly 1.
    assert premiums.whole_life_nsp(LX, 0, 0.0) == pytest.approx(1.0)
