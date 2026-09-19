# Contributing

VitaeMX is primarily a solo portfolio project, but it's built and documented as if it weren't — issues, questions, and pull requests are genuinely welcome, especially anything pointing out a methodological error or a data inconsistency.

## Commit conventions

This repo follows [Conventional Commits](https://www.conventionalcommits.org/):

```
feat: add Gompertz-Makeham fitting to research notebook
fix: correct discount factor in annuity calculation
docs: document Phase 2 methodology
chore: update dependencies
refactor: extract life table builder into its own module
test: add unit tests for premium calculation
```

Keep commits scoped to one logical change. A commit message should explain *why* a change was made when that isn't obvious from the diff alone.

## Branching and pull requests

Feature branches off `main`, named `phase-N/short-description`. Even as a solo project, changes land via pull request rather than direct pushes to `main` — the PR description is where the reasoning behind a change gets written down, which keeps the project's history genuinely reviewable rather than just a list of commits.

## Reporting a data or methodology issue

If you spot a mortality figure that looks wrong, please open an issue with: the state/age/year in question, what value the app shows, what value you'd expect, and your source. Data issues are taken seriously — see [`DATA_SOURCES.md`](DATA_SOURCES.md) for how each figure is sourced and [`METHODOLOGY.md`](METHODOLOGY.md) for how it's derived.

## Code style

See [`CLAUDE.md`](CLAUDE.md) for the full conventions (Python: PEP 8 / black / isort; TypeScript: prettier / eslint). Please match the existing style rather than introducing a new one in a single PR.

## Adding a significant technical decision

If a change involves a real architectural tradeoff (a new dependency, a new hosting choice, a change to the data pipeline), please add a short ADR under `docs/adr/` using [`docs/adr/template.md`](docs/adr/template.md) as part of the same PR, rather than leaving the reasoning only in the PR description.