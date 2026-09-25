"""Pydantic models: the API contract from ARCHITECTURE.md, made concrete."""

from __future__ import annotations

from typing import Literal

from pydantic import BaseModel, Field

Sex = Literal["total", "male", "female"]
Product = Literal["term", "whole_life"]


class State(BaseModel):
    code: int
    name: str


class LifeTableRowOut(BaseModel):
    age: int
    mx: float | None
    qx: float
    lx: float
    dx: float
    Lx: float
    Tx: float
    ex: float
    qx_fitted: float
    qx_source: Literal["raw", "fitted"]


class LifeTableOut(BaseModel):
    state: State
    sex: Sex
    reference_year: int
    radix: int
    rows: list[LifeTableRowOut]


class GompertzMakehamOut(BaseModel):
    A: float
    B: float
    c: float
    r2_log_mu: float
    rmse_log_mu: float
    age_min: int
    age_max: int


class CurvePoint(BaseModel):
    age: int
    mu_raw: float | None
    mu_fitted: float
    qx_raw: float
    qx_fitted: float
    qx_source: Literal["raw", "fitted"]


class MortalityCurveOut(BaseModel):
    state: State
    sex: Sex
    parameters: GompertzMakehamOut
    points: list[CurvePoint]


class PremiumIn(BaseModel):
    state_code: int = Field(0, ge=0, le=32, description="0 = national")
    sex: Sex = "total"
    age: int = Field(..., ge=0, le=100)
    product: Product = "term"
    term: int | None = Field(
        20, ge=1, le=60, description="Years; ignored for whole life"
    )
    interest_rate: float = Field(
        0.05, ge=0.0, le=0.30, description="Annual effective rate"
    )
    sum_assured: float = Field(1_000_000.0, gt=0)


class PremiumOut(BaseModel):
    inputs: PremiumIn
    state: State
    net_single_premium_per_unit: float
    annuity_due_factor: float
    annual_premium_per_unit: float
    net_single_premium: float
    annual_premium: float
    annual_premium_per_1000: float
    life_expectancy_at_age: float
    mortality_basis: str
    limitations: list[str]


class MethodologyVersionOut(BaseModel):
    methodology_version: str
    data_source: str
    reference_year: int
    processed_on: str
    raw_files: list[dict]
    gompertz_makeham: dict
    life_table: dict
    produced_by: list[str]
