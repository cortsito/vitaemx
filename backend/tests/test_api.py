import pytest
from app.main import app
from fastapi.testclient import TestClient

client = TestClient(app)


def test_states_lists_national_plus_32():
    states = client.get("/api/states").json()
    assert len(states) == 33
    assert states[0] == {"code": 0, "name": "República Mexicana"}


def test_life_table_shape():
    body = client.get("/api/life-table/9?sex=female").json()
    assert body["state"]["name"] == "Ciudad de México"
    assert body["rows"][0]["age"] == 0
    assert body["rows"][0]["lx"] == 100000
    assert 70 < body["rows"][0]["ex"] < 85
    assert body["rows"][-1]["qx"] == 1.0


def test_unknown_state_is_404():
    assert client.get("/api/life-table/99").status_code == 404


def test_bad_sex_is_422():
    assert client.get("/api/life-table/0?sex=other").status_code == 422


def test_mortality_curve_marks_fitting_window():
    body = client.get("/api/mortality-curve/0").json()
    assert body["parameters"]["r2_log_mu"] > 0.98
    sources = {p["age"]: p["qx_source"] for p in body["points"]}
    assert (
        sources[29] == "raw"
        and sources[30] == "fitted"
        and sources[90] == "fitted"
        and sources[91] == "raw"
    )


def test_premium_term():
    body = client.post(
        "/api/premium",
        json={
            "state_code": 0,
            "sex": "total",
            "age": 35,
            "product": "term",
            "term": 20,
            "interest_rate": 0.05,
            "sum_assured": 1000,
        },
    ).json()
    # Same case as research/04_premium_calculations.ipynb.
    assert body["net_single_premium_per_unit"] == pytest.approx(0.047458, abs=1e-5)
    assert body["annual_premium_per_1000"] == pytest.approx(3.73, abs=0.01)
    assert body["annual_premium"] == pytest.approx(3.73, abs=0.01)
    assert body["limitations"]


def test_premium_whole_life_ignores_term():
    a = client.post(
        "/api/premium", json={"age": 40, "product": "whole_life", "term": 5}
    ).json()
    b = client.post(
        "/api/premium", json={"age": 40, "product": "whole_life", "term": 50}
    ).json()
    assert a["net_single_premium_per_unit"] == b["net_single_premium_per_unit"]


def test_premium_rises_with_age():
    p35 = client.post("/api/premium", json={"age": 35}).json()[
        "annual_premium_per_unit"
    ]
    p55 = client.post("/api/premium", json={"age": 55}).json()[
        "annual_premium_per_unit"
    ]
    assert p55 > p35


def test_premium_validation():
    assert client.post("/api/premium", json={"age": 150}).status_code == 422
    assert (
        client.post("/api/premium", json={"age": 30, "interest_rate": 0.9}).status_code
        == 422
    )


def test_methodology_version():
    body = client.get("/api/methodology-version").json()
    assert body["reference_year"] == 2023
    assert len(body["raw_files"]) == 3


def test_validation_endpoint():
    rows = client.get("/api/validation").json()
    assert len(rows) == 99
    assert max(abs(r["difference_years"]) for r in rows) < 1.0
