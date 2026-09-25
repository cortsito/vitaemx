"""Loading and reshaping CONAPO open data.

See ``DATA_SOURCES.md`` (primary source) and ``docs/adr/0004`` for why the
life tables start from CONAPO's projected deaths and mid-year population
rather than from a published ``qx`` column.
"""

from __future__ import annotations

from pathlib import Path

import pandas as pd

RAW_DIR = Path(__file__).resolve().parents[2] / "data" / "raw"

DEATHS_FILE = RAW_DIR / "01_Defunciones_1950_2070.csv"
POPULATION_FILE = RAW_DIR / "00_Pob_Mitad_1950_2070.csv"
INDICATORS_FILE = RAW_DIR / "05_Indicadores_demograficos_proyecciones.csv"

NATIONAL_CODE = 0
NATIONAL_NAME = "República Mexicana"

# CONAPO labels sexes in Spanish; the processed files use short English keys.
SEX_LABELS = {"Hombres": "male", "Mujeres": "female"}


def load_deaths_and_population(year: int) -> pd.DataFrame:
    """Return deaths and mid-year population by state, sex and single age.

    The result has one row per (state_code, sex, age) with sex in
    {"male", "female", "total"}, plus a national aggregate (state_code 0)
    obtained by summing the 32 states. CONAPO's open data files only carry
    the states, so the national figure is derived here.
    """
    deaths = pd.read_csv(DEATHS_FILE)
    population = pd.read_csv(POPULATION_FILE)

    deaths = deaths[deaths["ANIO"] == year]
    population = population[population["ANIO"] == year]
    if deaths.empty or population.empty:
        raise ValueError(f"No CONAPO rows for year {year}")

    keys = ["CVE_GEO", "ENTIDAD", "SEXO", "EDAD"]
    merged = deaths[keys + ["DEFUNCIONES"]].merge(
        population[keys + ["POBLACION"]], on=keys, how="inner"
    )
    merged = merged.rename(
        columns={
            "CVE_GEO": "state_code",
            "ENTIDAD": "state_name",
            "SEXO": "sex",
            "EDAD": "age",
            "DEFUNCIONES": "deaths",
            "POBLACION": "population",
        }
    )
    merged["sex"] = merged["sex"].map(SEX_LABELS)

    # Both sexes combined, per state.
    both = (
        merged.groupby(["state_code", "state_name", "age"], as_index=False)[
            ["deaths", "population"]
        ]
        .sum()
        .assign(sex="total")
    )
    merged = pd.concat([merged, both], ignore_index=True)

    # National aggregate = sum over the 32 states.
    national = (
        merged.groupby(["sex", "age"], as_index=False)[["deaths", "population"]]
        .sum()
        .assign(state_code=NATIONAL_CODE, state_name=NATIONAL_NAME)
    )
    merged = pd.concat([merged, national], ignore_index=True)

    columns = ["state_code", "state_name", "sex", "age", "deaths", "population"]
    return (
        merged[columns].sort_values(["state_code", "sex", "age"]).reset_index(drop=True)
    )


def load_published_life_expectancy(year: int) -> pd.DataFrame:
    """CONAPO's own published life expectancy at birth, used for validation."""
    indicators = pd.read_csv(INDICATORS_FILE)
    indicators = indicators[indicators["ANIO"] == year]
    long = indicators.melt(
        id_vars=["CVE_GEO", "ENTIDAD"],
        value_vars=["EVH", "EVM", "EV"],
        var_name="sex",
        value_name="e0_conapo",
    )
    long["sex"] = long["sex"].map({"EVH": "male", "EVM": "female", "EV": "total"})
    long = long.rename(columns={"CVE_GEO": "state_code", "ENTIDAD": "state_name"})
    return long.reset_index(drop=True)
