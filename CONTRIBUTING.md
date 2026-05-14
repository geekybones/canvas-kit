# Contributing to CanvasKit

Thank you for your interest in contributing. This document covers everything you need to know to get started, write good commits, and understand how releases work.

---

## Table of contents

- [Getting started](#getting-started)
- [Development workflow](#development-workflow)
- [Commit message format](#commit-message-format)
- [How releases work](#how-releases-work)
- [Pull request guidelines](#pull-request-guidelines)

---

## Getting started

**Prerequisites:** Node.js `>=24`, pnpm `>=10`

```bash
# Clone the repo
git clone https://github.com/geekybones/canvas-kit.git
cd canvas-kit

# Install dependencies (root + playground)
pnpm install

# Start the playground dev server
pnpm dev:playground

# Run tests
pnpm test

# Run linter
pnpm lint
```

---

## Development workflow

The repo is a pnpm workspace with two packages:

| Path | Purpose |
|---|---|
| `/` | The `@geekybones/canvas-kit` library |
| `playground/` | React app for manual testing and demos |

**Building the library:**
```bash
pnpm build
```

**Building the playground (requires library build first):**
```bash
pnpm build:playground
```

**Type checking:**
```bash
pnpm typecheck
```

**Running tests with coverage:**
```bash
pnpm coverage
```

---

## Commit message format

This project follows [Conventional Commits](https://www.conventionalcommits.org). Every commit message is parsed by [semantic-release](https://semantic-release.gitbook.io) to automatically determine the next version and generate the changelog — **the format is not optional**.

### Structure

```
<type>(<scope>): <short summary>

[optional body]

[optional footer]
```

- **type** — what kind of change (see table below)
- **scope** — what part of the codebase is affected (optional but recommended)
- **summary** — a short description of the change

### Types and their effect on versioning

| Type | Description | Version bump |
|---|---|---|
| `feat` | A new feature visible to consumers | minor `1.0.0 → 1.1.0` |
| `fix` | A bug fix | patch `1.0.0 → 1.0.1` |
| `perf` | A performance improvement | patch |
| `revert` | Reverts a previous commit | patch |
| `docs` | Documentation changes only | none |
| `chore` | Build process, tooling, dependencies | none |
| `style` | Formatting, whitespace, missing semicolons | none |
| `refactor` | Code restructure with no behavior change | none |
| `test` | Adding or updating tests | none |
| `ci` | CI/CD pipeline changes | none |

### Breaking changes → major release

A breaking change bumps the major version (`1.x.x → 2.0.0`). There are two ways to mark one:

**Option 1 — `!` after the type (preferred for simple cases):**
```
feat!: remove deprecated createElement API
fix!: change default export from class to factory function
```

**Option 2 — `BREAKING CHANGE:` in the footer (use when explanation is needed):**
```
feat(interaction): redesign selection model

The selection API has been rewritten to support multi-canvas scenarios.

BREAKING CHANGE: SelectionEvent shape has changed — `ids` is now `elementIds`.
Update all handlers that destructure the event object.
```

### Scopes

Use the name of the module or area being changed. Common scopes in this project:

| Scope | Area |
|---|---|
| `elements` | Element types (shape, text, image, etc.) |
| `history` | Undo/redo system |
| `interaction` | Selection, drag, resize, rotate |
| `camera` | Pan, zoom, coordinate mapping |
| `snap` | Snap-to-grid and object snapping |
| `grid` | Background grid rendering |
| `alignment` | Element alignment tools |
| `layering` | Z-index management |
| `serialization` | Scene serialize/restore |
| `export` | PNG/blob export |
| `fonts` | Font loading |
| `context-menu` | Right-click menu |
| `playground` | Changes to the demo app only |
| `deps` | Dependency updates |
| `ci` | Pipeline and workflow changes |

### Full examples

```
feat(elements): add polygon element type
fix(camera): clamp zoom level to prevent negative scale
perf(grid): skip redraw when camera position has not changed
feat(interaction): add keyboard nudge for selected elements
fix(serialization): preserve element z-index on restore
feat!: rename CanvasKit constructor option `bg` to `backgroundColor`
chore(deps): update pixi.js to 8.17.0
docs: add serialization usage example to README
test(history): add coverage for redo after branching
ci: pin semantic-release to node 24
refactor(history): extract command stack to its own class
```

### Rules

- Use the **imperative mood**: "add feature", not "added feature" or "adds feature"
- Keep the summary under **72 characters**
- Do not end the summary with a period
- Reference issues in the footer when applicable: `Closes #42`, `Fixes #17`
- Do not combine unrelated changes in a single commit — split them up

---

## How releases work

Releases are **fully automated** via semantic-release. You never manually bump the version in `package.json` or create git tags — the CI pipeline handles all of that on every push to `main`.

### What happens on each push to `main`

```
push to main
    │
    ├── lint (parallel)
    └── test (parallel)
            │
            └── release
                    │
                    ├── analyze commits since last tag
                    ├── determine next version (or skip if no releasable commits)
                    ├── build the library
                    ├── publish to npm (via OIDC trusted publisher — no token needed)
                    ├── create git tag (e.g. v1.1.0)
                    └── create GitHub Release with generated notes
```

### When does a release happen?

Only when there is at least one `feat`, `fix`, `perf`, or `revert` commit since the last release. Commits of type `docs`, `chore`, `style`, `refactor`, `test`, or `ci` do **not** trigger a release.

### Current version

The project is at **v1.0.0**. The next releasable commit will produce:

| Commit type | Next version |
|---|---|
| `fix:` / `perf:` | `1.0.1` |
| `feat:` | `1.1.0` |
| `feat!:` / `BREAKING CHANGE:` | `2.0.0` |

---

## Pull request guidelines

- Target the `main` branch for all PRs
- Keep PRs focused — one feature or fix per PR
- Ensure `pnpm lint` and `pnpm test` pass locally before opening a PR
- Write commit messages that follow the format above — each commit in the PR is what drives the changelog, not the PR title
- If your change affects the public API, update the relevant docs in `/docs`
