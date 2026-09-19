# Methodology

This document specifies the mathematical and statistical methodology behind VitaeMX Phase 1: life table construction, mortality law fitting, and simplified premium calculation. It exists so that every number the application shows can be traced back to a formula and a stated assumption — this is the credibility backbone of the project, and it is expected to grow as later phases add Lee-Carter projection and Monte Carlo reserve simulation.

## 1. Life table construction

A life table follows a hypothetical cohort of `l0` people (conventionally `l0 = 100,000`) from birth, applying age-specific mortality probabilities until everyone has died. The standard columns are:

| Symbol | Meaning |
|---|---|
| `qx` | Probability that a person aged exactly `x` dies before reaching age `x+1` |
| `lx` | Number of people from the original cohort still alive at exact age `x` |
| `dx` | Number of people who die between age `x` and `x+1` (`dx = lx · qx`) |
| `Lx` | Person-years lived between age `x` and `x+1` |
| `Tx` | Total person-years lived after age `x` (`Tx = Σ Lx` for all ages ≥ x) |
| `ex` | Life expectancy at exact age `x` (`ex = Tx / lx`) |

**Source of `qx`:** VitaeMX uses CONAPO's published `qx` values directly (from the *Proyecciones de la Población de México y las Entidades Federativas 2020-2070*) rather than estimating them from raw INEGI death counts and population estimates. Rationale is documented in [`docs/adr/0003-conapo-as-primary-source.md`](docs/adr/0003-conapo-as-primary-source.md). Raw INEGI mortality microdata is used as a secondary cross-check, not as the primary input, because CONAPO's figures are already reconciled for underreporting and migration effects that raw death counts are not.

**Derivation of `lx`, `dx`, `Lx`, `Tx`, `ex`:** computed from `qx` using the standard actuarial recursion, with the conventional midyear approximation `Lx ≈ (lx + lx+1) / 2` for ages where CONAPO does not supply a finer breakdown, and a stated terminal-age closure assumption (see §4).

## 2. Gompertz-Makeham fitting

The Gompertz-Makeham law models the force of mortality as:

```
μ(x) = A + B·c^x
```

where `A` is an age-independent (accident/background) hazard, and `B·c^x` is the Gompertz term capturing the exponential rise in mortality with age. This is fit to the CONAPO-derived `qx` series (converted to `μx` via `μx ≈ -ln(1 - qx)` under the standard piecewise-constant-hazard assumption) using nonlinear least squares (`scipy.optimize.curve_fit`), restricted to the adult age range (conventionally 30–90) where the law is known to hold well — infant and very-old-age mortality are documented departures and are explicitly excluded from the fit rather than silently mismodeled.

**Goodness of fit** is reported as both R² on `log(μx)` and a plotted residual comparison against the raw CONAPO curve, shown alongside every fitted table in the application rather than only in the notebooks — the user should always be able to see how much smoothing has been applied.

## 3. Simplified premium calculation

Given a fitted mortality curve and a stated annual effective interest rate `i` (default assumption stated in the UI, user-adjustable), VitaeMX computes:

- **Net single premium for an n-year term life policy**, paying 1 at the end of the year of death if death occurs within `n` years:

  ```
  A(1)x:n = Σ (v^(k+1) · k|qx)   for k = 0 to n-1
  ```

  where `v = 1/(1+i)` and `k|qx` is the deferred mortality probability derived from the fitted `lx` series.

- **Net single premium for a whole life policy**, paying 1 at the end of the year of death:

  ```
  Ax = Σ (v^(k+1) · k|qx)   for k = 0 to ω-x
  ```

  where `ω` is the terminal age of the table.

- **Level annual premium**, obtained by dividing the relevant single premium by the corresponding life annuity-due factor `äx` (or `äx:n` for term products), computed from the same `lx` series and discount rate.

These are the classical formulas from actuarial mathematics (e.g., Dickson, Hardy & Waters, *Actuarial Mathematics for Life Contingent Risks*), applied without loading, expenses, profit margin, or reserving adjustments — hence "simplified." This is stated explicitly in the application UI next to every premium shown.

## 4. Explicit assumptions and limitations

Stated here in full so nothing is implicit:

- **No selection effects.** Real insurers price based on underwritten risk (health status, smoking, occupation); VitaeMX prices from population-average mortality only.
- **No socioeconomic stratification.** CONAPO's tables are state-level aggregates; mortality varies significantly within a state by income, education, and access to healthcare, which this model does not capture.
- **Terminal age closure.** The table is closed at the oldest age CONAPO reports (currently 109+ grouped); the tail beyond that is not separately modeled in Phase 1.
- **Constant discount rate.** A flat, user-adjustable interest rate is assumed for the full duration of any contract; no yield curve.
- **No expenses, lapses, or profit loading.** Premiums shown are net (pure risk) premiums only, not what a real insurer would charge.
- **Fitting window.** The Gompertz-Makeham fit is restricted to ages 30–90 by default; results outside that range fall back to the raw CONAPO `qx`, and the application marks which values are "fitted" vs "raw."

These limitations are not hidden in fine print — every premium result in the UI links back to this section.

## 5. References

- CONAPO, *Proyecciones de la Población de México y las Entidades Federativas 2020-2070*. https://conapo.segob.gob.mx/work/models/CONAPO/pry23/PP/index.html
- INEGI, *Estadísticas de Defunciones Registradas*. https://www.inegi.org.mx/programas/edr/
- WHO, *Methods and data sources for life tables 2000-2021*. https://cdn.who.int/media/docs/default-source/gho-documents/global-health-estimates/ghe2021_lifetable_methods.pdf
- Dickson, D.C.M., Hardy, M.R., Waters, H.R. (2019). *Actuarial Mathematics for Life Contingent Risks*, 3rd ed. Cambridge University Press.
- Bowers, N.L. et al. (1997). *Actuarial Mathematics*, 2nd ed. Society of Actuaries.
- Gompertz, B. (1825). "On the Nature of the Function Expressive of the Law of Human Mortality." *Philosophical Transactions of the Royal Society*.

Methodology for Phase 2 (Lee-Carter projection) and Phase 3 (Monte Carlo reserving) will be added to this document as those phases are implemented — see [`ROADMAP.md`](ROADMAP.md).