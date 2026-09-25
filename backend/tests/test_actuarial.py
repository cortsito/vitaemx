import sys
from pathlib import Path

import pytest
from app import actuarial

# Allow importing the research package so the two implementations can be compared.
sys.path.insert(0, str(Path(__file__).resolve().parents[2] / "research"))

LX = [100.0, 50.0, 0.0]


def test_survivors_from_qx():
    assert actuarial.survivors_from_qx([0.5, 1.0, 1.0], radix=100.0) == [
        100.0,
        50.0,
        0.0,
    ]


def test_term_matches_hand_calculation():
    v = 1 / 1.05
    assert actuarial.term_insurance_nsp(LX, 0, 2, 0.05) == pytest.approx(
        v * 0.5 + v**2 * 0.5
    )


def test_whole_life_at_zero_interest_is_one():
    assert actuarial.whole_life_nsp(LX, 0, 0.0) == pytest.approx(1.0)


def test_annuity_due():
    assert actuarial.annuity_due(LX, 0, None, 0.05) == pytest.approx(1 + 0.5 / 1.05)
    assert actuarial.annuity_due(LX, 0, 1, 0.05) == pytest.approx(1.0)


def test_price_rejects_bad_inputs():
    with pytest.raises(ValueError):
        actuarial.price(LX, 0, "term", None, 0.05)
    with pytest.raises(ValueError):
        actuarial.price(LX, 0, "endowment", 5, 0.05)


def test_agrees_with_research_implementation():
    numpy = pytest.importorskip("numpy")
    from vitaemx_research import premiums

    # A Gompertz-like q_x series over 60 ages.
    qx = [min(1.0, 0.001 * 1.09**k) for k in range(60)]
    qx[-1] = 1.0
    lx = actuarial.survivors_from_qx(qx)
    lx_np = numpy.array(lx)
    for age_index in (0, 10, 35):
        assert actuarial.term_insurance_nsp(lx, age_index, 20, 0.04) == pytest.approx(
            premiums.term_insurance_nsp(lx_np, age_index, 20, 0.04)
        )
        assert actuarial.whole_life_nsp(lx, age_index, 0.04) == pytest.approx(
            premiums.whole_life_nsp(lx_np, age_index, 0.04)
        )
        assert actuarial.annuity_due(lx, age_index, 20, 0.04) == pytest.approx(
            premiums.annuity_due(lx_np, age_index, 20, 0.04)
        )
