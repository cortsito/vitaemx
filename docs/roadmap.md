# Roadmap

VitaeMX is built in phases, each shipped as a working, deployed release rather than as one large unreleased build. Every phase maps back to one of the original project variations explored before development started; the mapping is kept here so the "why" behind the order is not lost.

## Phase 1 — Foundations (current)

**Goal:** a correct, validated, deployed mortality engine for Mexico, end to end.

- [x] Build life tables for Mexico (national + 32 states) from CONAPO data.
- [x] Fit a Gompertz-Makeham curve per state; report goodness of fit.
- [x] Compute simplified term-life and whole-life premiums from the fitted curve.
- [x] FastAPI backend and React frontend described in [`architecture.md`](architecture.md), with Vercel configuration in the repo.
- [ ] Deploy to Vercel and put the public URL in the README.
- [x] Full methodology written up in [`methodology.md`](methodology.md).
- [ ] Cross-check against raw INEGI death registrations (deferred, see [ADR 0004](0004_qx-from-conapo-deaths-and-population.md)).

**Definition of done:** a public URL where anyone can pick a state and an age, see the underlying life table and fitted mortality curve, get a premium quote, and read exactly how each number was produced.

## Phase 2 — Mortality projection (Lee-Carter)

*Maps to seed variation 1.*

**Goal:** stop treating mortality as static and project it forward.

- Implement the Lee-Carter model on historical CONAPO/INEGI time series.
- Project mortality forward and **back-test**: fit on data through a past year, project forward, and compare against what actually happened in subsequent years — the honest way to show a projection model works.
- Add a "projected life table for year Y" view to the app, with the back-test error shown alongside it, not hidden.

**Definition of done:** the app can show a projected life table for any future year with a stated, validated error margin.

## Phase 3 — Reserve simulation (Monte Carlo)

*Maps to seed variation 2.*

**Goal:** turn the pricing engine into a solvency question.

- Build a Monte Carlo simulation of a fictional insurer's reserves over time, given a block of policies priced with the Phase 1 engine.
- Simulate under multiple scenarios (baseline, stressed mortality, low interest rate) and report the probability and timing of capital exhaustion.
- Add a "run the simulation" view to the app with adjustable scenario parameters.

**Definition of done:** a user can pick a scenario, run N simulated paths, and see a distribution of outcomes, not just a point estimate.

## Phase 4 — Interactive geography

*Maps to seed variation 5.*

**Goal:** make the state-level variation in mortality visible at a glance.

- Interactive choropleth map of life expectancy by state (and municipality, data permitting), built following the project's [dataviz](../) design system.
- Updated automatically when CONAPO/INEGI publish new figures (documented refresh process, not necessarily automated in Phase 4).

**Definition of done:** a map a recruiter can play with for thirty seconds and immediately understand what the project does.

## Parked for later (not yet scheduled)

These remain good ideas, deliberately not committed to a phase yet, so the roadmap stays honest about what is actually planned versus what is possible:

- **AFORE-style pension calculator** — simulate contribution trajectories against retirement life expectancy (seed variation 6).
- **Cause-of-death decomposition** — multiple-decrement life tables, simulate the effect of "eliminating" a disease (seed variation 7).
- **Spreadsheet-only proof of concept** — the same actuarial math in pure Excel/Sheets formulas, as a standalone artifact (seed variation 8).
- **Catastrophic/heavy-tail risk model** — replace the smooth Gompertz-Makeham tail with heavy-tailed distributions for pandemic/earthquake-type mortality shocks (seed variation 10).
- **Inverse pricing problem** — given a real Mexican insurer's published policy price, infer what mortality table and interest rate it implies (seed variation 4).
- **Insurer simulation game** — a lightweight "SimCity for insurers" built on top of the Phase 3 reserve engine (seed variation 9).

## Explicitly out of scope

- Anything requiring paid infrastructure, a paid data source, or a paid API.
- Real underwriting logic (medical exams, occupation classes) — this is a population-mortality educational tool, not a pricing engine for real policies, and the app says so.