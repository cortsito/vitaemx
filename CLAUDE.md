# Working notes for AI-assisted development on VitaeMX

This file is context for whoever (human or AI) picks up development work on this repo in a new session. Read this first, then the specific doc for whatever you're touching.

## What this project is

VitaeMX is a portfolio project: an open-source actuarial mortality engine for Mexico. The point of the project is not just that it works, but that it *reads as professionally built* — clear methodology, documented decisions, clean git history. Every technical choice made along the way should be defensible in a job interview.

## Who's building it

Luis is learning/re-sharpening programming skills. He's comfortable reading and understanding code, knows git conceptually, but is out of practice writing code day-to-day and is rebuilding fluency. Implications for how to work with him:

- Explain *why*, not just *what*, when proposing code — he's rebuilding intuition, not just copying snippets.
- Prefer clear, conventional code over clever code. This project should look like something a mid-level engineer wrote carefully, not like a one-liner golf exercise.
- **Luis makes every git commit himself.** Do not run `git commit`, `git push`, or open pull requests on his behalf. Prepare code/diffs and explain what should be staged and what a good commit message would be, but he executes it — this is intentional, so his own commit history and GitHub activity reflect his own hands-on work.

## Current status

Phase 1 (Foundations) — see [`ROADMAP.md`](ROADMAP.md) for the full phased plan. Check that file for what's actually in progress vs. done before assuming scope.

## Conventions

**Commits:** Conventional Commits style — `feat:`, `fix:`, `docs:`, `chore:`, `refactor:`, `test:`. Keeps the history readable and is a recognizable, professional pattern for anyone reviewing the repo.

**Python (backend, research):** PEP 8, formatted with `black`, imports sorted with `isort`. Type hints on function signatures. Docstrings on anything that isn't self-evident, especially actuarial functions — link back to the relevant section of [`METHODOLOGY.md`](METHODOLOGY.md) in the docstring where relevant.

**TypeScript/React (frontend):** formatted with `prettier`, linted with `eslint`. Functional components with hooks, no class components. Keep components small and named for what they show (`LifeTableView`, `PremiumCalculator`), not generic (`Box1`, `Panel`).

**Branching:** feature branches off `main`, named `phase-N/short-description` (e.g. `phase-1/gompertz-makeham-fit`), merged via pull request even though this is a solo project — the PR description is where design tradeoffs get written down, and it keeps a reviewable history.

## Design system (short version)

Serif for headings (Source Serif or Spectral), humanist sans for UI/data (Inter or IBM Plex Sans). Restrained palette: one deep institutional color (navy or dark red) plus a neutral gray scale — no gradients, no glassmorphism, no decorative icons. Tables and numbers are the visual focus, generous whitespace, thin rule lines — the goal is "official statistical report," specifically closer to INEGI/CONAPO's own publications than to a typical SaaS dashboard. When building any chart, follow the project's dataviz guidance for consistency (categorical/sequential palette rules, mark specs) rather than improvising per-component.

## Where things live

See the structure in [`README.md`](README.md). In short: science goes in `research/`, its output goes in `data/processed/`, the API in `backend/` only ever reads that processed data, the UI is in `frontend/`. Don't put modeling logic in the backend — if it needs `scipy`/`statsmodels`, it belongs in a notebook in `research/`, with its output written to `data/processed/`.

## Source of truth for each topic

- What's being built, in what order → [`ROADMAP.md`](ROADMAP.md)
- How the math works → [`METHODOLOGY.md`](METHODOLOGY.md)
- How the system is put together → [`ARCHITECTURE.md`](ARCHITECTURE.md)
- Where data comes from and its license → [`DATA_SOURCES.md`](DATA_SOURCES.md)
- Why a specific technical decision was made → [`docs/adr/`](docs/adr/)

If a decision of real consequence gets made during a session that isn't already covered by an existing ADR, write a new one using [`docs/adr/template.md`](docs/adr/template.md) rather than letting the reasoning live only in chat history.