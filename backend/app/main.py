"""VitaeMX API. See ARCHITECTURE.md for the contract and METHODOLOGY.md for the math."""

from __future__ import annotations

import math

from app import actuarial, schemas
from app.data import SEXES, Store, load
from fastapi import FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware

LIMITATIONS = [
    "Net premium only: no expenses, profit loading, lapses or reserves.",
    "Population-average mortality: no underwriting or selection effects.",
    "State-level aggregate: no socioeconomic stratification.",
    "Flat interest rate for the whole contract; no yield curve.",
    "Mortality smoothed with Gompertz-Makeham between ages 30 and 90; raw CONAPO values elsewhere.",
]

app = FastAPI(
    title="VitaeMX API",
    description="Life tables, Gompertz-Makeham fits and simplified net premiums for Mexico, built on CONAPO data.",
    version="1.0.0",
)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["GET", "POST"],
    allow_headers=["*"],
)


def _state(store: Store, code: int) -> schemas.State:
    if code not in store.states:
        raise HTTPException(status_code=404, detail=f"unknown state code {code}")
    return schemas.State(code=code, name=store.states[code])


def _sex(sex: str) -> str:
    if sex not in SEXES:
        raise HTTPException(status_code=422, detail=f"sex must be one of {SEXES}")
    return sex


@app.get("/api/health")
def health() -> dict:
    return {"status": "ok"}


@app.get("/api/states", response_model=list[schemas.State])
def states() -> list[schemas.State]:
    store = load()
    return [
        schemas.State(code=code, name=name)
        for code, name in sorted(store.states.items())
    ]


@app.get("/api/life-table/{state_code}", response_model=schemas.LifeTableOut)
def life_table(state_code: int, sex: str = Query("total")) -> schemas.LifeTableOut:
    store = load()
    state = _state(store, state_code)
    rows = store.tables[(state_code, _sex(sex))]
    return schemas.LifeTableOut(
        state=state,
        sex=sex,
        reference_year=store.version["reference_year"],
        radix=store.version["life_table"]["radix"],
        rows=[schemas.LifeTableRowOut(**row.__dict__) for row in rows],
    )


@app.get("/api/mortality-curve/{state_code}", response_model=schemas.MortalityCurveOut)
def mortality_curve(
    state_code: int, sex: str = Query("total")
) -> schemas.MortalityCurveOut:
    store = load()
    state = _state(store, state_code)
    key = (state_code, _sex(sex))
    p = store.params[key]
    points = []
    for row in store.tables[key]:
        mu_fitted = p.A + p.B * p.c**row.age
        mu_raw = -math.log(1.0 - row.qx) if row.qx < 1.0 else None
        points.append(
            schemas.CurvePoint(
                age=row.age,
                mu_raw=mu_raw,
                mu_fitted=mu_fitted,
                qx_raw=row.qx,
                qx_fitted=row.qx_fitted,
                qx_source=row.qx_source,
            )
        )
    return schemas.MortalityCurveOut(
        state=state,
        sex=sex,
        parameters=schemas.GompertzMakehamOut(**p.__dict__),
        points=points,
    )


@app.post("/api/premium", response_model=schemas.PremiumOut)
def premium(body: schemas.PremiumIn) -> schemas.PremiumOut:
    store = load()
    state = _state(store, body.state_code)
    rows = store.tables[(body.state_code, body.sex)]
    ages = [row.age for row in rows]
    if body.age not in ages:
        raise HTTPException(status_code=422, detail="age outside the life table")
    age_index = ages.index(body.age)

    # Premiums use the smoothed q_x (METHODOLOGY.md §3), rebuilt into l_x.
    lx = actuarial.survivors_from_qx([row.qx_fitted for row in rows])
    try:
        result = actuarial.price(
            lx, age_index, body.product, body.term, body.interest_rate
        )
    except ValueError as error:
        raise HTTPException(status_code=422, detail=str(error)) from error

    return schemas.PremiumOut(
        inputs=body,
        state=state,
        net_single_premium_per_unit=result.net_single_premium,
        annuity_due_factor=result.annuity_due,
        annual_premium_per_unit=result.annual_premium,
        net_single_premium=result.net_single_premium * body.sum_assured,
        annual_premium=result.annual_premium * body.sum_assured,
        annual_premium_per_1000=result.annual_premium * 1000.0,
        life_expectancy_at_age=rows[age_index].ex,
        mortality_basis=(
            f"CONAPO {store.version['reference_year']}, {state.name}, {body.sex}; "
            f"Gompertz-Makeham smoothed ages {store.version['gompertz_makeham']['fit_age_min']}-"
            f"{store.version['gompertz_makeham']['fit_age_max']}"
        ),
        limitations=LIMITATIONS,
    )


@app.get("/api/methodology-version", response_model=schemas.MethodologyVersionOut)
def methodology_version() -> schemas.MethodologyVersionOut:
    return schemas.MethodologyVersionOut(**load().version)


@app.get("/api/validation")
def validation() -> list[dict]:
    """Life expectancy at birth: rebuilt vs CONAPO's published value, per state and sex."""
    store = load()
    return [
        {"state": _state(store, code).model_dump(), "sex": sex, **values}
        for (code, sex), values in sorted(store.validation.items())
    ]
