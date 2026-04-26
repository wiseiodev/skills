---
name: work
description: Execute one implementation slice end-to-end from either (1) a PRD plus plan plus phase, where PRD and plan may be files or GitHub issues, (2) a GitHub PRD issue plus optional work issue, or (3) a Linear issue with its project/docs as PRD context. Use when the user says "/work", "do work", "do issue work", "do linear work", asks to implement a planned phase, asks to pick/execute the next GitHub slice from a PRD, or asks to complete a Linear issue. Always includes dependency intake, clarifications, feature branch, implementation, mandatory gates, adversarial review, Playwright self-QA or fallback evidence, local conventional commit, 2-page HTML report, opening the report, pushing the branch, and opening a Ready PR whose body mirrors the report.
---

# Work

Execute exactly one work item end-to-end. This skill replaces `do-work`, `do-issue-work`, and `do-linear-work`.

## Usage

```text
/work <prd> <plan> <phase> [additional instructions...]
/work <github-prd-issue> [<github-work-issue>] [additional instructions...]
/work <linear-issue> [additional instructions...]
```

Examples:

```text
/work docs/prds/redis.md plans/redis.md 2
/work 316 742
/work 316
/work ANN-546 focus on schema resources first
```

## Resolve Input Mode

Classify the request before touching code:

- **Plan phase mode**: Three leading args: `<prd> <plan> <phase>`. PRD and plan may be file paths, GitHub issue numbers, or `gh:<number>`. Read the full PRD and full plan, locate the exact `## Phase <N>` heading, then execute only that section. Stop for clarification if the phase heading is missing or duplicated.
- **GitHub issue mode**: One or two numeric leading args without a plan phase. First number is the PRD issue. Second number is the work issue. If omitted, auto-pick a ready work issue from the PRD, but ask the user to confirm before proceeding.
- **Linear mode**: First arg matches a Linear key such as `ANN-546`. Fetch that issue, its project, project docs, sibling issues, and blockers.

Extra instructions override source docs when they conflict.

## Source Loading

Load all relevant source material before implementation.

For files, read them directly. For GitHub issues, use `gh issue view <number> --comments` unless only the body is needed for candidate discovery. For Linear, use the Linear CLI or connector available in the environment; read the issue title, description, comments, project, project documents, sibling issues, and blocker state.

Extract:

- Work item id and title for artifact ids, QA files, report files, and commit footer.
- In Linear mode, the branch name must come from `linear issues branch <LINEAR-ID> --json`, using `data.branchName` exactly.
- Acceptance criteria/checklist for the exact phase or issue.
- Scope boundaries and sibling work to avoid.
- Blockers, dependencies, ADRs, conventions, commands, and handoff notes.

For plan phase mode, extract checklist items, gates, and scope only from the matched `## Phase <N>` section. Do not pull tasks from summaries, later phases, or incidental mentions of the same phase number.

Canonical artifact ids:

- GitHub issue mode: `issue-<N>`
- Linear mode: lowercase issue key, such as `ann-546`
- Plan phase mode: `phase-<N>-<short-slug>`

Use the same canonical id for `tests/qa/<artifact-id>.spec.ts`, `.reports/<artifact-id>-qa.webm`, `.reports/<artifact-id>-qa.md`, and `.reports/<artifact-id>.html`. For branch names, use the canonical artifact id in GitHub and plan phase modes, but in Linear mode always use Linear's canonical branch name from `linear issues branch <LINEAR-ID> --json`.

## Auto-Pick GitHub Work Issue

Only run this when GitHub issue mode omits the work issue.

1. Fetch the PRD issue body.
2. Extract referenced issue numbers from Mermaid node ids, `#N` mentions, and slice lists.
3. Fetch each candidate issue's state, title, body, comments, labels, linked issues, and project/dependency metadata available through `gh`.
4. Enumerate blocker signals from `Blocked by`, `Depends on`, comments, labels, linked issues, checklists, and dependency/project metadata. Verify every referenced blocker is resolved.
5. Keep only open issues with no unresolved blocker signals.
6. Offer the lowest-numbered ready issue as the recommended choice, with up to three alternatives, and include the blocker/dependency summary for each option.
7. Stop if no candidate is ready; do not invent work.

## Intake Before Code

Surface dependencies before implementation: env vars, OAuth clients, DNS, third-party keys, marketplace provisioning, domain verification, assets, translated copy, design handoff, production access, or human approvals.

Ask concise clarifying questions for missing dependencies or ambiguous acceptance criteria. When a source doc already resolves an ambiguity, follow it. If durable decisions are made, update the owning artifact:

- GitHub issue mode: edit the work issue body.
- Plan phase mode: edit the plan file if it is a file; otherwise comment/edit the relevant GitHub issue if appropriate.
- Linear mode: fetch the team's workflow states, update/comment on the Linear issue, and move it to In Progress when starting.

If no external dependencies are detected, record "No external dependencies detected" for the report and continue.

## Branch

Create a fresh feature branch before file changes. There is no main/default-branch override in this skill.

1. Check `git status --porcelain`; stop if any dirty state exists. Ask the user whether to stash, commit separately, or abandon the workflow.
2. Confirm the current/default branch and fetch remote refs.
3. Inspect existing branch names and match local convention.
4. For Linear mode, run `linear issues branch <LINEAR-ID> --json` and create a branch using exactly `data.branchName`, such as `feature/ann-546-schema-resources`. Do not hand-craft a `feat/` or `feature/` branch when Linear can provide one.
5. For GitHub issue and plan phase modes, create a branch using the work id and slug, such as `feat/issue-742-auth-callbacks` or `feat/phase-2-redis-cache`.
6. Report the branch name before editing.

Never commit to `main` or the default branch. If the user asks to do that, stop and explain that `work` requires a feature branch.

## Implement

Work only on the resolved work item. Do not begin sibling phases or sibling issues.

- Read repo instructions such as `CLAUDE.md`, `AGENTS.md`, `CONTEXT.md`, README, and relevant ADRs.
- Use TDD when tests are in scope or the repo convention calls for it.
- Mark checkboxes as each criterion is verified, not all at the end.
- For GitHub issues, update the issue body checkboxes.
- For plan files, update the phase checkboxes in the plan.
- For Linear issues, update the issue checklist/status as the workflow allows.

## Quality Gates

All applicable gates must pass with zero errors and zero warnings before staging, review, report, or commit. Discover commands from repo docs and package scripts; do not hard-code.

Required gates:

- Lint
- Typecheck
- Unit tests
- Build
- E2E tests if the repo has them or the work has browser behavior

If a gate fails, fix the root cause and rerun. If the fix is outside the work item's scope, stop and ask.

## Self-QA

Create deterministic proof that the work behaves correctly.

For browser-demoable work:

- Write `tests/qa/<artifact-id>.spec.ts`.
- Cover the golden path plus at least one edge case per acceptance criterion.
- Fail on console errors with a `page.on('console', ...)` listener.
- Ensure Playwright video is enabled and trace is `on-first-retry`.
- Pace the golden path at human speed with `slowMo`, milestone waits, and `pressSequentially` for visible typing.
- Run the spec and copy the successful WebM to `.reports/<artifact-id>-qa.webm`.

For work with no browser surface, copy [`templates/qa-fallback.md`](templates/qa-fallback.md) to `.reports/<artifact-id>-qa.md`, fill every placeholder, and link concrete evidence such as commands, logs, screenshots, DB snapshots, curl transcripts, or test outputs.

Never skip self-QA silently. If QA finds a defect, return to implementation.

If self-QA adds or changes committed files, such as QA specs or Playwright config, rerun affected quality gates before staging.

## Stage And Adversarial Review

Stage the exact intended commit with explicit paths before review. Include implementation files, tests, QA specs, config changes, tracked documentation updates, and `.reports/` artifacts when the repository tracks work reports.

Use the `adversarial-review` skill against the staged diff. Resolve every `critical` and `major` finding. If review fixes or QA changes alter the staged diff, restage and rerun adversarial review. Record remaining `minor` and `nitpick` findings in the report.

Do not proceed to commit while unresolved critical or major findings remain.

## Commit

Commit only after gates, self-QA, and adversarial review all pass.

1. Confirm the branch is not `main` or the default branch.
2. Confirm the staged diff contains only files for this work item.
3. Create one local Conventional Commit without `--no-verify`.
4. Do not amend or close the source issue. Push happens in the Open PR step.

Commit footer:

- GitHub issue mode: `Refs: #<work-issue>`
- Linear mode: `Completes <LINEAR-ID>` for the completed local work item. Use a Linear closing magic word, not `Refs`, so repo commitlint rules that require Linear completion footers pass.
- Plan phase mode: `Refs: <prd-or-plan-reference> phase <N>`

## HTML Report

Copy [`templates/report.html`](templates/report.html) to `.reports/<artifact-id>.html` and replace every placeholder. Do not add `.reports/` to `.gitignore`; work reports are intended to be reviewable artifacts when the repository tracks them.

Use the canonical artifact id for filenames. Use the original work id in visible report text.

Fill:

- Work id/title, context label/id, repo, date.
- 3-6 plain-language bullets for what shipped.
- Dependency rows from intake.
- `git diff --stat` or commit stat.
- Tests added and case counts.
- Gate rows with command and status.
- Adversarial review iterations and remaining findings.
- QA caption, scenarios, and video or fallback link.
- Acceptance criteria, all satisfied unless explicitly blocked before commit.
- Commit SHA, short SHA, and commit message.

If QA used the fallback, replace the video block with a link to `./<artifact-id>-qa.md` and make the caption explicit.

## Linear Completion

Only for Linear mode, after commit and before report creation:

1. Fetch the current team workflow states again.
2. Move the issue to the review-equivalent state, usually In Review.
3. If no review-equivalent state exists, leave the issue out of Done, add a Linear comment explaining local completion and missing review state, and record that in the report.

## Open PR

After the HTML report is written, push the branch and open a Ready pull request whose body mirrors the report.

1. Push with `git push -u origin <branch>`. If push fails for any reason (no remote, auth, branch protection, push rejected, etc.), stop and report the exact error verbatim — do not retry blindly, do not open a PR, do not delete or rewrite the local commit.
2. Detect the base branch via `gh repo view --json defaultBranchRef --jq .defaultBranchRef.name`.
3. Build the PR title from the work commit's Conventional Commit subject. For multi-commit work items, use the primary feature commit's subject, not the report/chore commit. The title must be entirely lowercase (matching the lowercase commit subject convention) and under 70 characters.
4. Build the PR body by filling [`templates/pr-body.md`](templates/pr-body.md) with the same content as the HTML report's cards.
5. Open with `gh pr create --base <default-branch> --title <title> --body-file <tmpfile>`. Always Ready — never pass `--draft`.
6. Capture the PR URL for the final response.

### Recording embeds in the PR body

When `.reports/<artifact-id>-qa.webm` exists, include both an inline `<video>` tag (renders inline on github.com) and a plain markdown download link:

```html
<video src="https://raw.githubusercontent.com/<owner>/<repo>/<branch>/.reports/<artifact-id>-qa.webm" controls></video>
```

`[Download QA recording](.reports/<artifact-id>-qa.webm)`

Resolve `<owner>/<repo>` from `gh repo view --json nameWithOwner --jq .nameWithOwner` and `<branch>` from the current branch.

When the QA used the fallback (`.reports/<artifact-id>-qa.md`), link that file instead.

## Open Report

Open the completed report as the final step:

- macOS: `open .reports/<artifact-id>.html`
- Linux: `xdg-open .reports/<artifact-id>.html`
- Windows: `start .reports/<artifact-id>.html`

Final response: branch name, commit SHA, report path, QA artifact path, PR URL, and a one-line summary. Note the PR is Ready — review and merge are the user's call.

## Hard Rules

- Execute one work item only.
- Never skip branch, gates, self-QA, staged adversarial review, commit, report, push, PR creation, or report-open steps.
- Never force-push.
- Never bypass hooks.
- Never open the PR as draft.
- Never close GitHub or Linear issues.
- Never move Linear issues to Done; use In Progress at start and the review-equivalent state after local completion.
- Stop and ask when blockers, dirty worktree state, missing dependencies, out-of-scope failing gates, or push failures would make the work unsafe.
