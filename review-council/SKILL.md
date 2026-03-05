---
name: review-council
description: Send a document (plan, spec, PRD, ADR, code) to a review council of 2+ AI agents (Claude Code + Codex CLI by default, optionally Gemini CLI and Copilot CLI) for independent parallel review. Synthesizes feedback, auto-revises the document, and re-reviews if council members had high variance. Use when wanting multi-agent review, "review council", peer review from multiple AIs, or validating plans/specs/code before finalizing.
---

Fan out a document to multiple AI agents for independent review, synthesize feedback, and auto-revise.

**Default council:** Claude Code, Codex CLI
**Optional:** Gemini CLI, Copilot CLI (add if installed and authenticated)

## Step 1: Select persona

Read [references/personas.md](references/personas.md) and select based on document type:

| Document type | Persona |
|---------------|---------|
| System design, implementation plan, architecture spec, ADR | Architect |
| PRD, feature spec, user stories, roadmap | Product Manager |
| Code review, PR diff, implementation | Staff Engineer |
| Test plan, deployment plan, migration | QA Lead |

All council members use the **same persona** for a given review.

## Step 2: Check CLI availability

```bash
which claude && echo "claude: available" || echo "claude: NOT FOUND"
which codex && echo "codex: available" || echo "codex: NOT FOUND"
which gemini && echo "gemini: available" || echo "gemini: NOT FOUND"
which copilot && echo "copilot: available" || echo "copilot: NOT FOUND"
```

Skip unavailable CLIs. Warn the user. Minimum 2 council members required.

## Step 3: Write review prompt

Write to `.dispatch/council-<YYYY-MM-DDTHH-MM-SS>.md`:

```markdown
# Review Assignment

## Your Role
[Paste the selected persona from personas.md — role description + review focus areas]

## Document to Review
Read and review the following file: `<absolute-path-to-document>`

## Review Criteria
Evaluate for: completeness, logical flaws, missing ideas, DRY violations,
edge cases, unstated assumptions, and anything that could cause problems.

## Output Format
Structure your response exactly as:

## Strengths
- ...

## Critical Issues
- ...

## Minor Issues
- ...

## Suggestions
- ...

## Overall Assessment
[1-2 sentences: ready to proceed / needs minor revisions / needs major rework]
```

## Step 4: Fan out to council

**IMPORTANT:** Do NOT use sub-agents (Agent tool) — they cannot get Bash permissions to run external CLIs. Instead, run CLI commands directly as **background Bash tasks** (`run_in_background: true`). This still parallelizes the work.

Launch all CLI commands in a **single message** with multiple Bash tool calls.

For detailed CLI flags, read `~/.claude/skills/dispatch-cli-agent/references/<cli>.md`.

### Background Bash commands

Launch all in parallel (single message, multiple Bash calls, all with `run_in_background: true`):

**Claude Code:**
```bash
claude -p "$(cat <PROMPT_FILE>)" \
  --output-format json \
  --allowedTools "Read,Glob,Grep" \
  --max-turns 10 \
  --no-session-persistence 2>/dev/null \
  | jq -r '.result' > .dispatch/review-claude.md
```

**Codex CLI:**
```bash
codex exec "$(cat <PROMPT_FILE>)" \
  --json --ephemeral 2>/dev/null \
  | grep '"type":"item.completed"' \
  | jq -rs '[.[].item.text] | join("\n")' > .dispatch/review-codex.md
```

**Gemini CLI:**
```bash
gemini -p "$(cat <PROMPT_FILE>)" 2>/dev/null \
  > .dispatch/review-gemini.md
```
Note: Gemini `--output-format json` may not produce stdout. Use plain text output instead.

**Copilot CLI (optional):**
```bash
copilot -p "$(cat <PROMPT_FILE>)" \
  -s --no-ask-user --no-custom-instructions \
  --deny-tool "shell(rm *)" --deny-tool "shell(git push*)" 2>/dev/null \
  > .dispatch/review-copilot.md
```

Replace `<PROMPT_FILE>` with the exact path from Step 3. Read the output files after all background tasks complete.

## Step 5: Collect and assess variance

When all background tasks complete, compare their reviews:

**Low variance** — council broadly agrees on the same issues and direction. Proceed to synthesis.

**High variance** — council members explicitly contradict each other:
- One says "critical flaw" on an aspect while another says "looks good" on the same aspect
- Members propose fundamentally incompatible suggestions
- One recommends "needs major rework" while another says "ready to proceed"

**Flag high variance for mandatory re-review in Step 7.**

## Step 6: Synthesize and auto-revise

1. **Deduplicate** — merge identical or overlapping feedback
2. **Prioritize** — rank by severity (critical → minor → suggestion)
3. **Revise** — apply changes directly to the original document
4. **Log** — write synthesis summary to `.dispatch/council-synthesis-<timestamp>.md`:
   - Which feedback items were applied
   - Which were skipped and why
   - Variance assessment (low/high)

## Step 7: Re-review (conditional)

| Variance | Action |
|----------|--------|
| High | **Mandatory** — send revised document back through council (repeat Steps 4-6) |
| Low | **Optional** — skip unless orchestrator judges revisions were significant |

**Max 2 total rounds** to prevent infinite loops. If still high variance after round 2, present unresolved disagreements to the user.

## Step 8: Present result

Show the user:
1. **Final revised document** (or diff from original)
2. **Changes summary** — what was modified and why
3. **Unresolved disagreements** — if any council members still disagree after revision
4. **Council participation** — which CLIs were used, which were unavailable
