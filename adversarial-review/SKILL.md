---
name: adversarial-review
description: Run a multi-round adversarial code review with two independent AI reviewers that cross-examine each other's findings. Iterates until only nitpicks remain (max 3 rounds). Use when you want deep, debate-style review that catches issues a single pass misses. Triggers on "adversarial review", "debate review", "cross-review", "deep review".
---

# Adversarial Review

Two independent reviewers examine code, then cross-review each other's findings in iterative rounds until only nitpicks remain.

## Inputs

Determine from user message or ask:
1. **Target** — file paths, PR number (`gh pr diff <N>`), or git diff range
2. **Focus** (optional) — security, performance, correctness, architecture, or all
3. **Max iterations** — default 3

## Phase 0: Gather the diff

Create working directory first, then write diff into it:
```bash
REVIEW_DIR=$(mktemp -d /tmp/adversarial-review-XXXXXX) && chmod 700 "$REVIEW_DIR"
echo "Review artifacts: $REVIEW_DIR"

# PR
gh pr diff <N> > "$REVIEW_DIR/diff.patch"

# Or staged changes
git diff --cached > "$REVIEW_DIR/diff.patch"

# Or specific files — read them directly into $REVIEW_DIR
```

## Phase 1: Independent Review (parallel)

Launch two reviewers in parallel. Use cmux if available (`cmux ping` returns PONG), otherwise background Bash tasks.

### Reviewer A — "The Architect"

Write the prompt from [prompts/reviewer-a.md](prompts/reviewer-a.md) to `$REVIEW_DIR/prompt-a.md`, substituting:
- `{{DIFF}}` — the diff or file contents
- `{{FOCUS}}` — the focus area
- `{{OUTPUT_PATH}}` — always `$REVIEW_DIR/review-a.json` (must be inside `$REVIEW_DIR`, never an arbitrary path)

Launch via stdin (never interpolate prompt content into shell arguments):
```bash
# cmux
cmux send-keys reviewer-a "claude --print < '$REVIEW_DIR/prompt-a.md' > '$REVIEW_DIR/review-a.json'"

# or background Bash
claude --print < "$REVIEW_DIR/prompt-a.md" > "$REVIEW_DIR/review-a.json"
```

### Reviewer B — "The Skeptic"

Same pattern with [prompts/reviewer-b.md](prompts/reviewer-b.md) → `$REVIEW_DIR/review-b.json`.

### Wait for both

Poll for completion (both files exist and are non-empty), or use `cmux wait-for` if available.

## Phase 2: Cross-Review (parallel)

Each reviewer reads the other's findings and produces a cross-review.

Write prompts from [prompts/cross-review.md](prompts/cross-review.md), substituting:
- `{{OWN_REVIEW}}` — this reviewer's Phase 1 output
- `{{OTHER_REVIEW}}` — the other reviewer's Phase 1 output
- `{{DIFF}}` — original diff
- `{{OUTPUT_PATH}}` — `$REVIEW_DIR/cross-a.json` or `cross-b.json`

Launch both in parallel (same mechanism as Phase 1).

## Phase 3: Synthesis

Read both cross-reviews. Write prompt from [prompts/synthesis.md](prompts/synthesis.md), substituting:
- `{{CROSS_A}}` — cross-review from A
- `{{CROSS_B}}` — cross-review from B
- `{{DIFF}}` — original diff
- `{{ITERATION}}` — current iteration number

Run synthesis yourself (no sub-agent needed).

### Output format

The synthesis produces a structured report:

```json
{
  "iteration": 1,
  "findings": [
    {
      "id": "F1",
      "severity": "critical|major|minor|nitpick",
      "category": "bug|security|performance|design|style",
      "file": "path/to/file.ts",
      "line": 42,
      "title": "Short description",
      "detail": "Full explanation with context",
      "agreed_by": ["A", "B"] | ["A"] | ["B"],
      "suggested_fix": "Optional code suggestion"
    }
  ],
  "resolved_disagreements": [...],
  "terminal": false
}
```

## Phase 4: Circuit Breaker

Check if review should terminate:
- `terminal: true` if ALL remaining findings are severity `nitpick` or `minor`
- `terminal: true` if iteration count reaches max (default 3)
- Otherwise, feed unresolved `critical` and `major` findings back to Phase 1 as additional context and repeat

If not terminal, start next iteration with the unresolved findings prepended to the diff context.

## Final Output

Present to the user:
1. **Summary** — iteration count, total findings by severity
2. **Critical/Major findings** — with file, line, explanation, suggested fix
3. **Minor/Nitpick findings** — collapsed or summarized
4. **Disagreements** — where reviewers differed and how it was resolved
5. **Offer to apply fixes** — for any findings with `suggested_fix`

## Tips

- For large diffs (>500 lines), split into logical chunks and review each
- If reviewers agree on everything in round 1, that's fine — no need to force iteration
- The adversarial value comes from *disagreement resolution*, not volume of findings
