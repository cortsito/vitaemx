# ADR 0003: Use CONAPO life tables as the primary data source

**Status:** Accepted
**Date:** 2026-09

## Context

Two plausible primary sources exist for Mexican mortality data: INEGI's raw registered death counts (*Estadísticas de Defunciones Registradas*), which would require building life tables from scratch (raw deaths ÷ population estimates, with adjustments for underreporting and late registration), or CONAPO's already-constructed official life tables, published as part of its population projections.

## Decision

Use CONAPO's published `qx`/`lx` values as the primary and authoritative input to every life table in VitaeMX. Use INEGI's raw death registrations as a secondary cross-check in Phase 1, and as a primary input only for the Phase 4 cause-of-death work, where CONAPO does not publish the needed breakdown.

## Rationale

Building life tables correctly from raw death counts is itself a significant demographic modeling exercise — it requires correcting for underreporting, late registration, and population estimate uncertainty, all of which CONAPO has already done as part of producing its official population projections. Using CONAPO's figures directly means VitaeMX's life tables are consistent with the numbers Mexico's own population-planning agency publishes and relies on, which is a stronger credibility claim than an independently-derived estimate would be, and avoids silently reproducing known demographic estimation problems.

## Alternatives considered

- **Derive tables from raw INEGI death counts.** More "from scratch" and arguably more impressive as a from-first-principles exercise, but introduces real risk of the resulting tables being wrong in ways that are hard to detect without demographic expertise the project doesn't claim to have. Rejected for Phase 1; this remains a possible future exercise explicitly framed as "compare our own estimate against CONAPO's" rather than as the primary source.
- **Use WHO's tables for Mexico directly.** Rejected as primary because WHO's national-level tables don't provide the state-level breakdown the project needs, and CONAPO is the more authoritative source for Mexico specifically.

## Consequences

VitaeMX inherits whatever assumptions CONAPO made in its own projection methodology (documented in CONAPO's own technical notes, linked from [`DATA_SOURCES.md`](../../DATA_SOURCES.md)) rather than making independent ones. This is stated explicitly rather than presented as if VitaeMX built the tables from raw data itself.