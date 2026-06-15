---
name: ship
description: Execute exactly one Linear issue end-to-end with branch safety, repo-discovered gates, self-QA, adversarial review, decision logging, single-source report and PR-body rendering, Ready PR creation, and autonomous post-PR review-comment handling. Use when the user says /ship, ship issue, ship Linear issue work, or asks to complete a specific Linear issue such as ENG-123; reject GitHub issues, plan phases, and vague next-work requests.
---

# Ship

Autonomously ship exactly one Linear issue from issue lookup through PR review cleanup. If the request does not contain exactly one Linear issue key such as `ENG-123`, state that `/ship` needs one Linear issue key and stop without editing.

The distinctive artifacts of this skill are a per-issue **decision log** (`DECISIONS.md`), self-QA **video/evidence**, an **adversarial review** gate, and an HTML **report plus PR body rendered from one validated JSON file** so they cannot drift. These artifacts let a reviewer decide how deep to read.

## Setup

This skill ships a renderer and templates. Resolve `<skill-dir>` to the directory this `SKILL.md` lives in (its install path varies: `.claude/skills/ship`, `.agents/skills/ship`, etc.). The renderer needs Node and has no dependencies beyond the standard library.

- Renderer: `<skill-dir>/scripts/render-report.mjs`
- Data contract: `<skill-dir>/templates/report-data.schema.json`
- HTML template: `<skill-dir>/templates/report.html`
- PR-body template: `<skill-dir>/templates/pr-body.md`
- QA fallback template: `<skill-dir>/templates/qa-fallback.md`

Artifacts for a run live under `.reports/<artifact-id>/`, where `<artifact-id>` is the lowercase issue key, for example `.reports/eng-123/`.

## Execution Model

- Run autonomously. Do not ask implementation, preference, or permission questions during normal issue work.
- Make the smallest repo-consistent decision that satisfies the issue, then log it in `.reports/<artifact-id>/DECISIONS.md`.
- Stop only when continuing is unsafe or impossible: dirty worktree, explicit blockers, missing external dependencies, destructive/irreversible action, conflicting instructions, unresolved critical/major review findings, renderer validation failure, push failure, or required remote checks/review threads that cannot be resolved.
- If you stop, report the blocker and the decision you would have made. Do not ask a question unless the user explicitly requested an interactive planning session.

## Lifecycle

1. **Intake**
   - Fetch only the target issue, its parent project if present, and its parent issue if present. Extract scope, acceptance criteria, non-goals, blockers/dependencies, artifact id, and parent context.
   - Get the canonical branch with `linear issues branch <LINEAR-ID> --json`; use `.data.branchName` exactly.
   - Move the Linear issue to In Progress, create the branch, and create `.reports/<artifact-id>/DECISIONS.md`.
   - Read repo instructions and only the relevant docs: `AGENTS.md`, `CLAUDE.md`, README, and relevant architecture/ADR/feature docs.
   - If the repo keeps a root `LESSONS.md`, read it and search it narrowly for lessons relevant to the issue area before editing.

2. **Build**
   - Implement only this issue. Do not start siblings, children, broad project work, or opportunistic refactors.
   - Keep Linear/checklists updated as criteria are actually verified.
   - Record product, technical, scope, testing, fallback, and reviewer-facing decisions as you make them.

3. **Verify**
   - Run focused tests for the touched behavior and the repo-discovered quality gates. Discover the gate commands from repo docs and package scripts; do not hard-code a toolchain. Run the repository's full checks command (lint, typecheck, tests, build) before claiming implementation is done.
   - Produce self-QA evidence. Any committed UI component change (for example a `.tsx`/`.jsx`/`.vue`/`.svelte` file) requires a Playwright video unless a video is genuinely impossible and the fallback decision is logged.
   - Stage exact intended paths and run adversarial review on the staged diff. Resolve every critical and major finding before continuing.

4. **Report and PR**
   - If the repo keeps a root `LESSONS.md`, append new evidence-backed rows for this run.
   - Write `.reports/<artifact-id>/<artifact-id>-report-data.json` against `<skill-dir>/templates/report-data.schema.json`.
   - Include `decisions` and `lessons` sections in report data, mirroring `DECISIONS.md` and the root `LESSONS.md` rows added for this run.
   - Render both report and PR body from that single JSON file:

     ```bash
     node <skill-dir>/scripts/render-report.mjs \
       --data .reports/<artifact-id>/<artifact-id>-report-data.json \
       --html .reports/<artifact-id>/<artifact-id>.html \
       --pr-body .reports/<artifact-id>/<artifact-id>-pr-body.md
     ```

     The renderer validates the JSON against the schema and the workflow rules (critical/major findings must be 0, no failed gate, no blocked acceptance criterion, QA video required when UI changed) and fails loudly rather than emit a misleading report. Fix the data or the underlying work until it renders.
   - Commit once with a Conventional Commit and exactly one `Completes <LINEAR-ID>` footer (a Linear closing magic word, so repos that require a completion footer pass). Never bypass hooks. Stage every `.reports/<artifact-id>/**` file with the commit; never leave report files uncommitted.
   - Move Linear to the review-equivalent state, never Done. If no review state exists, comment with local completion status.
   - Push with `git push -u origin <branch>` and open a Ready PR with a Conventional Commit PR title, for example `feat(api): harden channel URL lookup`, and the generated PR body. Record the PR URL in `DECISIONS.md`.

5. **Post-PR Review Loop**
   - PR creation is not the finish line. Monitor until the PR is actually clean.
   - Watch for unresolved review comments from ANY reviewer — automated bots (for example Copilot `copilot-pull-request-reviewer[bot]`, Greptile `greptile-apps[bot]`, CodeRabbit, or any other configured review app) AND humans — plus immediate remote check/mergeability failures. Do not hard-code a single bot; discover the repo's active automated reviewer.
   - Use `gh pr view --json number,mergeable,mergeStateStatus,statusCheckRollup,reviewDecision` and a GraphQL `reviewThreads` query. Also list every reviewer with `gh api repos/<owner>/<repo>/pulls/<n>/reviews --jq '.[].user.login'` and unresolved threads, since some reviewers post inline review threads plus a summary issue comment rather than a single named review.
   - If the repo has a configured automated reviewer, it normally posts a review. Poll `gh api repos/<owner>/<repo>/pulls/<n>/reviews` and the unresolved `reviewThreads` every ~120-150s until an automated review/thread from a known bot login appears (`*[bot]`) — do not close out before then. If none is configured/observed after a reasonable wait, record that and proceed.
   - When comments appear, triage in autonomous mode: do not pause for confirmation; log the triage table, classifications, fixes/rejections, rationale, evidence, and affected files in `DECISIONS.md`.
   - For valid comments, patch only reviewed issue scope, rerun relevant gates plus full checks when feasible, update report/decision/lesson artifacts if decisions/proof/learnings changed, commit with exactly one `Completes <LINEAR-ID>` footer (staging updated `.reports/<artifact-id>/**` files with the fix), push, verify the commit appears on the PR, then reply and resolve threads.
   - For invalid comments, log the rejection decision, reply respectfully with the concrete reason, and resolve only after confirming the PR branch is current.
   - Re-fetch unresolved review threads after every pass.

6. **Final Handoff**
   - Once the PR is pushed, comments addressed, required checks clean, and the configured automated reviewer(s) have reviewed, post a concise update comment on the Linear issue with PR URL, commit SHA(s), validation status, review-thread status, report path, and remaining risks if any.
   - If the Linear issue is linked to a Linear Project, also post a real Linear Project Update, not a project comment. Summarize what shipped, current merge readiness, validation evidence, and any follow-up risk.
   - Report branch, commit SHA(s), PR URL, report path, decisions path, lessons path, QA artifact path, remote check status, automated-reviewer status, Linear issue update status, Linear project update status, and unresolved review-thread count.
   - Done means: the configured automated reviewer(s) have reviewed, no unresolved review threads, no immediate failing required checks, all `.reports/<artifact-id>/**` files committed and pushed, Linear issue/project updates posted when applicable, and material decisions are in `DECISIONS.md` and the rendered report/PR body.

## Contracts

### Linear

- One Linear issue only.
- Discovery is capped at three Linear read calls: target issue, parent project, parent issue.
- Do not fetch siblings, children, whole project lists, project documents, workflow-state lists, or broad searches during discovery.
- `linear issues branch` is only for branch naming; do not use it as an excuse for extra discovery.
- If the Linear CLI hits API limits, assume earlier calls were inefficient. Stop retrying the same CLI pattern, record the failure in `DECISIONS.md`, and switch to the configured Linear MCP/connector for the minimal remaining Linear operation.
- Closeout requires a Linear issue comment after the PR is clean and ready to merge.
- If the issue has a linked project, closeout also requires a Linear Project Update through Linear's project-updates feature; do not substitute a normal project comment.

### Decisions

- `DECISIONS.md` lives at `.reports/<artifact-id>/DECISIONS.md`.
- Each non-trivial decision records date/time, context, options considered, chosen path, rationale, tradeoffs/risks, evidence, and affected files.
- If no meaningful decisions were needed, record one `No Material Decisions` entry with evidence.
- The report JSON must include a `decisions` section that mirrors `DECISIONS.md`.

### Lessons

- If the repo tracks lessons, `LESSONS.md` lives at the repo root.
- Read and search `LESSONS.md` during intake before editing.
- Capture only reusable, evidence-backed lessons in a Markdown table; do not write a changelog or generic summary.
- The report JSON must include a `lessons` section that mirrors the root `LESSONS.md` rows added during this run. The renderer requires `lessons.filePath` to be `LESSONS.md`; if the repo has no lessons file, create one with the rows for this run.

### QA

- Any committed UI component change requires a Playwright video.
- Browser-demoable non-UI work also gets video.
- Non-browser work fills `<skill-dir>/templates/qa-fallback.md` as `.reports/<artifact-id>/<artifact-id>-qa.md`.
- `selfQa.artifactPath` is repo-root-relative, for example `.reports/<artifact-id>/<artifact-id>-qa.webm`; the renderer rewrites it for HTML playback.

### Report and PR Body

- Commit all `.reports/<artifact-id>/` artifacts needed for review.
- The PR title must be a Conventional Commit title, matching the same standard as the commit message subject.
- The PR body must foreground what changed, why, what was checked, decisions made, explicit review focus, acceptance proof, rollout, and artifacts.
- The HTML report and PR body must come from the same report JSON via `scripts/render-report.mjs`. Never hand-edit one without the other; re-render instead.

### Never

- Never commit to the default branch.
- Never force-push, bypass hooks, skip self-QA, skip adversarial review, skip `DECISIONS.md`, skip the report, open a draft PR, or move Linear to Done.
- Never resolve a review thread before its fix commit is pushed and verified on the PR.
