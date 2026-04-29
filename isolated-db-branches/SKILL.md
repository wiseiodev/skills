---
name: isolated-db-branches
description: Per-feature Neon database branch for each git branch in a Drizzle + Vercel project. Schema changes use `db:push` (no migration files on feature branches); migrations are auto-generated and validated post-merge against a throwaway prod clone, then applied to prod with deploy gated on success. Use when setting up or operating a project where multiple agents/worktrees need isolated DB schemas without conflicting migration files. Triggers on "isolated db branches", "neon branching", "per-branch database", "db isolation", "drizzle migration conflict", "neon worktree", "/isolated-db-branches".
---

# Isolated DB Branches

Per-feature Neon DB branch + safe post-merge migration generation for Drizzle + Vercel projects.

## Pattern

- Each git branch gets its own Neon branch (parented from prod, copy-on-write)
- Schema changes flow through `db:push` against the Neon branch — **no migration files on feature branches**
- On merge to main, a CI workflow generates the migration, validates it against a throwaway Neon clone of prod, applies to actual prod, commits the migration back to main, then deploys
- Code deploy is gated on migration success; failure halts deploy + blocks new merges via a required status check

## When to use

- New Drizzle + Neon + Vercel project being scaffolded
- Existing project where parallel agents in worktrees produce conflicting migration sequence numbers
- Want preview deploys to use isolated DBs without manually wiring per-PR env vars

## Stack assumptions (v1)

- Neon Postgres
- Drizzle ORM, single schema entry (e.g. `src/db/schema.ts`)
- Vercel hosting
- GitHub Actions
- pnpm
- Optional: Next.js (env precedence works automatically; non-Next projects need `dotenv` loading the same files)

## Setup (one-time per repo)

The skill installs files into a target repo. Two modes:

- **Interactive**: Claude walks the user through prompts using `AskUserQuestion`.
- **Autopilot**: Claude infers what it can from the repo and only asks when a value cannot be determined.

### Setup steps

1. **Detect prerequisites**: `gh`, `vercel`, `neonctl`, `pnpm`, `git`. Install missing tools or instruct the user.
2. **Gather inputs** (prompt only if missing):
   - `NEON_API_KEY` (https://console.neon.tech/app/settings/api-keys)
   - `NEON_PROJECT_ID` (`neonctl projects list`)
   - `VERCEL_TOKEN`, `VERCEL_ORG_ID`, `VERCEL_PROJECT_ID` (existing if Vercel git integration is set up)
   - `MIGRATION_BOT_TOKEN` (fine-grained PAT scoped to repo, `contents: write` + bypass branch protection)
   - `NEON_PARENT_BRANCH` (default: `main` — the Neon project's primary branch)
   - Schema file path (default: `src/db/schema.ts`)
   - Migrations dir (default: `drizzle`)
3. **Add devDependencies**: `neonctl`, `tsx` (if missing).
4. **Drop scripts** from `templates/scripts/` into `scripts/db/` in the target repo.
5. **Drop workflows** from `templates/workflows/` into `.github/workflows/`.
6. **Drop optional infra**: `templates/docker-compose.test.yml` and an `.env.test.local` example (only if user opts in and no conflicting file exists).
7. **Update `package.json`** scripts:
   - `db:branch:create` → `tsx scripts/db/branch.ts create`
   - `db:branch:delete` → `tsx scripts/db/branch.ts delete`
   - `db:branch:list` → `tsx scripts/db/branch.ts list`
   - `db:branch:prune` → `tsx scripts/db/branch.ts prune`
   - `db:reset` → `tsx scripts/db/reset.ts`
   - `db:doctor` → `tsx scripts/db/doctor.ts`
   - `db:migrate:retry` → `tsx scripts/db/migrate-retry.ts`
   - `db:custom` → `tsx scripts/db/custom.ts`
   - **Replace existing `db:generate`** with `tsx scripts/db/guard-generate.ts && drizzle-kit generate`
   - **Add `db:generate:ci`** as the unguarded version: `drizzle-kit generate`
8. **Set GH secrets** via `gh secret set`: `NEON_API_KEY`, `NEON_PROJECT_ID`, `MIGRATION_BOT_TOKEN`, `VERCEL_TOKEN`, `VERCEL_ORG_ID`, `VERCEL_PROJECT_ID`.
9. **Configure branch protection** on `main`: require status check `prod-migration-state`. Allow `MIGRATION_BOT_TOKEN`'s identity to bypass.
10. **Disable Vercel prod auto-deploy**: drop `scripts/db/vercel-ignore-build.sh`, configure Vercel project to use it as the Ignored Build Step.
11. **Update README** with: pattern overview, daily commands, runbook link.
12. **Verify**: `pnpm db:doctor`.

## Daily commands

```bash
pnpm db:branch:create   # start of work on a new git branch
pnpm db:push            # after editing schema.ts (drizzle-kit; uses Neon branch URL)
pnpm db:reset --soft    # drop schema cascade + repush (portable)
pnpm db:reset --hard    # drop & recreate Neon branch (Neon-specific)
pnpm db:custom <name>   # scaffold hand-written data migration in drizzle/data/
pnpm db:branch:list     # show this repo's Neon branches
pnpm db:branch:delete   # delete the current branch's Neon branch
pnpm db:branch:prune    # delete Neon branches with no matching GH branch (dry-run; --yes to apply)
pnpm db:doctor          # verify auth, env, scripts, workflows
pnpm db:migrate:retry   # operator: re-run prod migration after fixing a failure
```

## Workflow architecture

Five GitHub Actions workflows orchestrate the merge-to-deploy chain.

- **`db-validate-and-prepare`**: triggers on push to `main` with paths matching the schema file. Creates a throwaway Neon clone of prod, generates migration via `db:generate:ci`, applies to clone, runs smoke check (`db:health`). On success, opens an auto-PR on `migrations/auto-<sha>` with labels `[automated-migration, migration-ready, skip-copilot-review]` and `[skip ci]` in the commit body. Auto-merges. Deletes the throwaway clone.
- **`db-migrate-and-deploy`**: triggers on `pull_request: closed` with `merged == true` and label `migration-ready`. Applies migration to actual prod (3x retry on transient errors), runs hand-authored `drizzle/data/*.sql` files, then `vercel deploy --prod`. On hard failure: opens a labeled `migration-failed` GitHub issue with workflow link; flips the `prod-migration-state` status check to red.
- **`code-only-deploy`**: triggers on push to `main` with paths-ignore for the schema file and `drizzle/**`. Just runs `vercel deploy --prod`. Mixed pushes (schema + code) flow through `db-validate-and-prepare` → `db-migrate-and-deploy`; the latter handles deploy.
- **`cleanup-neon-branch`**: triggers on `pull_request: closed`. Deletes the Neon branch matching the PR head ref and removes the git-branch-scoped Vercel preview env vars.
- **`pr-lint-no-migrations`**: triggers on `pull_request` against `main`. Fails if the PR adds any new file under the migrations dir (excluding `drizzle/data/`). Tells the agent to delete those files; migrations are auto-generated post-merge.

## Guardrails

- `db:generate` (the user-facing one) aborts unless on `main` git branch. Friendly error tells the user migrations are auto-generated post-merge.
- CI lint job on PRs fails if any new file appears in the migrations dir (excluding `drizzle/data/` for hand-authored data migrations).
- `db:branch:create` refuses to create a Neon branch named the same as the configured parent.
- `db:reset --hard` and `db:branch:delete` refuse if the current git branch matches the configured parent.
- `db:branch:prune` is dry-run by default; requires `--yes` to actually delete; never touches the primary branch.

## Failure runbook

See [`references/runbook.md`](references/runbook.md). Summary:

1. Migration fails on prod → workflow B opens a labeled GH issue + flips status check red.
2. Operator inspects via the issue's workflow link and the preserved throwaway clone URI.
3. Operator fixes root cause (data fix, schema fix, infra) and runs `pnpm db:migrate:retry`.
4. Retry success → status check green, deploy proceeds, issue auto-closes.

## Hard rules

- Never `db:generate` on a feature branch — guard script blocks it.
- Never commit files under the migrations dir from a feature branch — CI lint blocks it.
- Hand-authored data migrations live in `drizzle/data/`, not `drizzle/`.
- The Neon project's primary branch (configured `NEON_PARENT_BRANCH`) is never deleted, never reset, never pushed-to from automation.
- `db:branch:create` is idempotent: if the Neon branch already exists for the current git branch, the script reuses it and rewrites env files. No surprise resets.

## Inputs reference

| Input | Where used | Notes |
|---|---|---|
| `NEON_API_KEY` | local + CI | `neonctl auth` or env var |
| `NEON_PROJECT_ID` | local + CI | `neonctl projects list` to discover |
| `NEON_PARENT_BRANCH` | scripts | default `main` (Neon's primary) |
| `VERCEL_TOKEN` | local (sync preview env) + CI (deploy) | from Vercel account tokens |
| `VERCEL_ORG_ID`, `VERCEL_PROJECT_ID` | local + CI | from `.vercel/project.json` if linked |
| `MIGRATION_BOT_TOKEN` | CI workflow B & A | fine-grained PAT, repo-scoped, `contents: write` + bypass protection |
| `DATABASE_URL` | runtime | written by `db:branch:create` to `.env.development.local` |
| `DATABASE_URL_UNPOOLED` | drizzle-kit | written alongside |
