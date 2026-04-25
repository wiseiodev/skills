---
name: pr-comments
description: Review and resolve unresolved GitHub PR review threads. Use when the user wants to process PR comments, address requested changes, triage reviewer feedback, reply to invalid feedback, push fixes to the PR branch, and resolve review threads safely. Adapts quality gates to the repository instead of assuming a fixed package manager or test suite.
---

Triage, fix, and resolve all unresolved review threads on a PR.

## Operating Rules

- Preserve the numbered workflow order. The push-before-resolve rule is the core safety invariant.
- Treat every review comment as a claim to evaluate, not an instruction to blindly follow.
- Resolve exactly the PR threads in scope. Do not expand into unrelated refactors.
- Discover repo conventions and quality gates from local files before assuming commands.
- Never resolve a thread before the fix commit is pushed to the PR branch unless the user explicitly waives push.

## 1. Fetch PR Context

Determine `PR_NUM` from the user request, current branch, or `gh pr view --json number --jq .number`. If no PR can be identified, ask for the PR number.

```bash
# Get owner/repo
REPO=$(gh repo view --json nameWithOwner --jq '.nameWithOwner')
OWNER=$(echo "$REPO" | cut -d/ -f1)
NAME=$(echo "$REPO" | cut -d/ -f2)
```

Fetch all review threads via GraphQL (only way to get thread node IDs for resolution):

```bash
gh api graphql -f owner="$OWNER" -f name="$NAME" -F pr="$PR_NUM" -f query='
query($owner: String!, $name: String!, $pr: Int!) {
  repository(owner: $owner, name: $name) {
    pullRequest(number: $pr) {
      reviewThreads(first:100) {
        pageInfo { hasNextPage endCursor }
        nodes {
          id
          isResolved
          comments(first:10) {
            pageInfo { hasNextPage endCursor }
            nodes {
              body
              databaseId
              author { login }
              path
              line
            }
          }
        }
      }
    }
  }
}'
```

Filter to threads where `isResolved: false`. If none exist, report "No unresolved threads" and stop. If review threads or comments report `hasNextPage`, paginate before triage.

## 2. Read Referenced Code

For each unresolved thread:
1. Read the file at the `path` referenced by the first comment
2. Focus on the `line` range the comment targets
3. Read the full comment chain to understand the discussion
4. Read adjacent code, tests, and types enough to verify the claim
5. Read repo guidance such as `CLAUDE.md`, `AGENTS.md`, `CONTEXT.md`, README, `.agents/instructions/`, and relevant ADRs when present

## 3. Analyze & Classify

For each thread, critically evaluate the comment against the actual code and project conventions. Classify as:

**`fix`** — Comment identifies a real issue:
- Actual bug, type error, missing edge case
- Legitimate security concern
- Correct observation about missing error handling at a system boundary
- Clear mismatch with the PR's intended behavior or acceptance criteria
- Missing or weak test coverage for a behavior the PR changed

**`reject`** — Comment is wrong or unnecessary:
- Contradicts project conventions in `.agents/instructions/`
- Bikeshedding or style preference already handled by linter/formatter
- Suggests adding unnecessary abstractions, comments, or over-engineering
- Factually incorrect about the code's behavior
- Requests changes that would break existing patterns

Apply the same critical standard you would to your own code review. Not every comment deserves a code change.

Use **`needs-user`** only when the reviewer is asking a product/design/API decision that cannot be inferred from the PR, repo conventions, or surrounding code. Batch these questions before changing files.

## 4. Present Plan

Show user a summary table before making any changes:

```
## PR #N Review Threads — Triage Plan

### Will Fix (X threads)
| # | File:Line | Reviewer | Issue | Planned Fix |
|---|-----------|----------|-------|-------------|
| 1 | path:42   | @user    | ...   | ...         |

### Will Reject (Y threads)
| # | File:Line | Reviewer | Issue | Rejection Reason |
|---|-----------|----------|-------|------------------|
| 1 | path:18   | @user    | ...   | ...              |

### Needs User Decision (Z threads)
| # | File:Line | Reviewer | Question | Recommended Option |
|---|-----------|----------|----------|--------------------|
| 1 | path:64   | @user    | ...      | ...                |
```

Default mode: wait for user confirmation before proceeding. User may reclassify
threads.

Autonomous mode (for no-questions workflows like `autoship`): record the same
triage table in the run report/log and proceed without pausing for confirmation.

## 5. Implement Fixes

For each `fix` thread, make the code change. Do NOT reply or resolve yet — that happens in step 7 after the fixes are pushed.

Keep fixes tightly scoped to the review feedback. Add or update tests when the comment identifies behavior, regression risk, or an edge case. Do not make style-only changes unless they are necessary to satisfy a real review request or repo convention.

## 6. Quality Gate

Run repository-appropriate quality checks and ensure each selected command passes with zero errors. Discover commands from package scripts, task runners, CI config, Makefiles, README, and repo instructions. Prefer the package manager already used by the repo (`pnpm`, `npm`, `yarn`, `bun`, `uv`, `poetry`, `cargo`, `go`, etc.).

Default gates when available:

- Format or lint
- Typecheck or compile check
- Unit tests relevant to the touched files
- Integration tests when touched code crosses module/service boundaries
- Build or package check
- E2E/browser tests when UI behavior changed

If a gate does not exist, record it as "not available" rather than inventing a command. If a full gate is too expensive for the current PR, run the narrow relevant command and state the residual risk before proceeding. In autonomous ship workflows, run the broadest discovered sequential set that the repo supports.

## 7. Commit & Push BEFORE Resolving

**CRITICAL: Never resolve a thread before the fix commit is pushed to the PR branch.**

Why: PRs with auto-merge enabled merge the instant the last thread resolves.
Resolving before pushing means the PR merges without your fix, stranding the
changes locally. Reviewers also see "Fixed" replies on a PR that doesn't
contain the fix.

Sequence — do not reorder:

1. Fetch PR branch metadata with `gh pr view "$PR_NUM" --json headRefName,headRepositoryOwner,headRepository,url`.
2. Confirm the PR branch is checked out (`git branch --show-current`). If HEAD is detached or on the wrong branch, stop and ask the user.
3. Stage only the files you changed (name them explicitly — no `git add -A`).
4. Review the staged diff and confirm it contains only review-comment work.
5. Create a conventional commit. Ask the user first unless they've pre-authorized commits.
6. Push to the PR's remote branch. Verify push succeeded (non-zero exit = stop).
7. Confirm the pushed commit appears on the PR with `gh pr view "$PR_NUM" --json commits`.
8. Proceed to step 8.

If the user does NOT want you to commit/push (e.g. they want to review the
diff first), STOP here and tell them: fixes are staged locally, threads remain
unresolved, resume when ready.

## 8. Reply & Resolve Threads

Only reachable after step 7 succeeded (or user explicitly waived push).

For each `fix` thread:
1. Reply acknowledging the fix via REST API:
   ```bash
   gh api repos/"$OWNER"/"$NAME"/pulls/"$PR_NUM"/comments \
     -f body="Fixed." \
     -F in_reply_to="$DATABASE_ID"
   ```
2. Resolve the thread via GraphQL:
   ```bash
   gh api graphql -f threadId="$NODE_ID" -f query='
   mutation($threadId: ID!) {
     resolveReviewThread(input: { threadId: $threadId }) {
       thread { isResolved }
     }
   }'
   ```

For each `reject` thread:
1. Reply with a concise, respectful explanation of why the feedback doesn't apply:
   ```bash
   gh api repos/"$OWNER"/"$NAME"/pulls/"$PR_NUM"/comments \
     -f body="REASON" \
     -F in_reply_to="$DATABASE_ID"
   ```
2. Resolve the thread via the same GraphQL mutation as above.

Keep rejection replies brief (1-3 sentences). Reference specific project conventions or code behavior — don't be vague.

After resolving, re-fetch unresolved review threads. If any remain, report them with their reason. If all are resolved, report the pushed commit SHA, quality gates run, and a concise summary of fixed and rejected threads.
