# Failure Runbook

What to do when the merge → migrate → deploy chain breaks.

## Migration failed on prod

**Signal**: Workflow B (`db-migrate-and-deploy.yml`) failed. A GitHub issue is open with label `migration-failed`. Required status check `prod-migration-state` is red on `main`. New PRs cannot merge until cleared.

**Diagnose**

1. Open the linked workflow run in the issue. Read the migration step output.
2. The failure is one of:
   - **Transient infra** (network, Neon timeout, lock contention). Workflow already retried 3x.
   - **Schema / data conflict** (e.g., NOT NULL on a column with NULLs in prod that weren't in the throwaway clone — clones can drift if prod writes between clone-time and apply-time).
   - **Drizzle migrations table lock** held by another process.
3. The migration file is in `main` already (Workflow A merged it). Don't revert it casually — it'll be reapplied on retry.
4. If you need a fresh validation: a recent throwaway clone may still exist. Find it via `pnpm db:branch:list`. Otherwise create one manually:

   ```bash
   neonctl branches create \
     --project-id "$NEON_PROJECT_ID" \
     --name "migration-debug-$(date +%s)" \
     --parent "$NEON_PARENT_BRANCH"
   ```

**Fix**

- **Transient**: rerun. `pnpm db:migrate:retry`.
- **Data drift**: reconcile prod data so the migration can apply. Examples:
  - `UPDATE users SET email = '' WHERE email IS NULL;` before a NOT NULL migration.
  - Drop conflicting orphaned rows for new FKs.
- **Schema bug** (auto-generated SQL is wrong): revert the migration commit on `main`, fix `schema.ts`, push to a new feature branch and start over. Workflow B's failure means prod schema was *not* changed (transaction rollback), so reverting just the file is safe.
- **Migrations table lock**: confirm no concurrent migration runners. `SELECT * FROM pg_locks WHERE relation = '__drizzle_migrations'::regclass;`. Resolve, then retry.

**Resolve**

```bash
pnpm db:migrate:retry
```

This re-runs the prod migration step + deploy. On success:

- Status check `prod-migration-state` flips green.
- Migration issue closed automatically.
- New PRs can merge again.

## Migration succeeded on prod but `vercel deploy --prod` failed

**Signal**: Issue with label `deploy-failed`. Status check stays green (migration is fine).

**Diagnose**

- Check Vercel deployment logs.
- Common causes: build error introduced by the same merge, missing prod env var, Vercel platform issue.

**Fix**

- For build errors in the merge itself: revert the offending commit. The migration commit can stay — it's already applied to prod and is the correct schema state.
- For env var issues: add the missing var to Vercel prod, then re-deploy: `pnpm dlx vercel deploy --prod --token=$VERCEL_TOKEN`.

## Auto-PR for migration didn't auto-merge

**Signal**: A PR labeled `automated-migration` is open, not merged.

**Diagnose**

- Branch protection requires checks the migration PR can't pass (e.g., a required `lint` job that runs on every PR but the migration PR has `[skip ci]` so the job never runs).
- `MIGRATION_BOT_TOKEN` lacks bypass-protection permission.

**Fix**

- Either configure the bot token with bypass, or have the auto-PR re-run CI without `[skip ci]` and rely on existing CI passing because the diff is migration-only.

## Drizzle complains about destructive operations during `db:generate:ci`

**Signal**: Workflow A failed at the generate step with an interactive prompt (in CI: hangs, then times out).

**Cause**

Drizzle-kit prompts when it detects renames or drops it can't unambiguously map. CI can't answer prompts.

**Fix**

- Use `db:custom` to author the migration by hand on a feature branch. Commit it to `drizzle/data/<seq>.sql`.
- Or accept the auto-generated migration on a local checkout: run `pnpm db:generate:ci` locally on `main`, answer the prompts, commit, push to `main`. Workflow B picks it up via the `migration-ready` label (apply manually if needed).

## Stale Neon branches accumulating

**Signal**: Hitting Neon project branch quota.

**Fix**

```bash
pnpm db:branch:prune          # dry run
pnpm db:branch:prune --yes    # actually delete
```

Prune deletes Neon branches whose name does not match any current GitHub branch in the repo. Never deletes the primary branch.

## Local dev DB seems wrong

**Signal**: `pnpm dev` connects to wrong DB, or queries return unexpected data.

**Diagnose**

```bash
pnpm db:doctor
```

Checks:
- `neonctl whoami` — auth
- `vercel whoami` — auth
- `.env.development.local` exists and has DATABASE_URL
- DATABASE_URL points at the expected Neon branch for current git branch
- Required scripts and workflows present

**Fix**

```bash
pnpm db:branch:create   # idempotent; rewrites .env.development.local
```

If state is broken:

```bash
pnpm db:reset --soft    # drops schema, repushes
pnpm db:reset --hard    # full Neon branch recreation
```
