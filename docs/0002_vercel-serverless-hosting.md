# ADR 0002: Deploy on Vercel as serverless functions, not a traditional free-tier server

**Status:** Accepted
**Date:** 2026-09

## Context

The project has a hard constraint of $0 hosting cost. The typical free-tier options for a Python backend (Render, Railway, Fly.io, and similar) put the service to sleep after a period of inactivity; the first request after idle time can take several seconds to over a minute to respond while the container cold-boots. For a portfolio project that a recruiter might open once, unannounced, that delay is a real risk — it reads as "broken" rather than "free tier."

## Decision

Deploy the frontend as a static build and the FastAPI backend as serverless functions, both from the same Vercel project.

## Rationale

Serverless functions on Vercel spin up per-request rather than running a persistent process that can go to sleep; the cold-start penalty is real but is measured in the low hundreds of milliseconds to a couple of seconds, not the "wake up a sleeping full server" delay of the free tiers on platforms like Render. Hosting both halves of the app in one Vercel project also means one deploy pipeline, one domain, and automatic preview deployments per pull request — which is a meaningful, free "this person runs a real engineering workflow" signal for a portfolio repo.

## Alternatives considered

- **Render / Railway free tier for the backend, GitHub Pages/Vercel for the frontend.** Rejected primarily due to the sleep/cold-start UX problem documented by the platforms' own communities; also means managing two separate deploy pipelines instead of one.
- **Precompute everything to static JSON, no backend at all.** Would remove the cold-start risk entirely and is worth doing for data that never depends on user input, but Phase 1 includes a premium calculator that takes user-chosen parameters (age, term, interest rate) — a genuine request-time computation — so a pure static site isn't sufficient on its own. This may still be used as a partial optimization: serving pre-computed life tables as static JSON while keeping only the premium calculation as a serverless endpoint.
- **Fly.io free allowance.** Has a real always-on free allowance but adds a third hosting account/dashboard to manage for no clear benefit over Vercel given the app's small scale.

## Consequences

Backend code must be written in a way that's compatible with a serverless execution model (stateless handlers, fast cold start, no long-running background processes) — this is documented as a constraint in [`ARCHITECTURE.md`](../../ARCHITECTURE.md) and will matter more once Phase 3's Monte Carlo simulation is added (large simulations may need to be precomputed rather than run per-request).