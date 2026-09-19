# ADR 0001: Python (FastAPI) backend + React frontend

**Status:** Accepted
**Date:** 2026-09

## Context

VitaeMX needs a stack that can (a) do real statistical/actuarial computation, (b) serve that computation to a genuinely interactive frontend, and (c) be developed and maintained by someone who is rebuilding their programming fluency and needs the codebase to stay understandable, not just "working."

## Decision

Use Python for the backend, via FastAPI, and React (with TypeScript) for the frontend, as two separate applications in one repository.

## Rationale

Python is the only reasonable choice for the modeling layer — pandas, numpy, scipy, and statsmodels are the standard tools for exactly this kind of work (life table construction, curve fitting, Monte Carlo simulation), and there is no equivalent tooling elsewhere that's worth the switch. Given that, using Python for the API layer as well (rather than introducing a second backend language) keeps the number of languages in the project to two instead of three.

React is chosen over a simpler static-site approach because the product is meant to be interactive in a way a static page cannot comfortably deliver: switching between states, adjusting an interest rate and watching a premium recompute, comparing mortality curves. FastAPI pairs naturally with a separate frontend because it generates a typed OpenAPI schema automatically, which keeps the contract between the two halves explicit and self-documenting — useful both for development and as something a reviewer can point at.

## Alternatives considered

- **Single-language stack (e.g., Python + Streamlit or Dash).** Faster to build initially and would have removed the need to learn/re-learn a frontend framework, but produces an app that looks and feels like an internal tool rather than a product, and caps how much the UI can be made to look like the intended "official report" design. Rejected because the design quality of the final product matters as much as the modeling for a portfolio piece.
- **Python backend + a JS meta-framework (Next.js) that also serves the frontend.** Would reduce this to effectively one deployable unit. Considered but not chosen for Phase 1 to keep the backend's API surface explicit and independently testable; may be revisited later if it simplifies the Vercel deployment further.

## Consequences

Two codebases to keep in sync (a typed API contract mitigates this). Two sets of tooling/conventions to document in [`CLAUDE.md`](../../CLAUDE.md) so future work sessions don't have to rediscover them each time.