---
name: dispatch-cli-agent
description: Dispatch work to an external CLI agent (Claude Code, Codex CLI, Gemini CLI, or GitHub Copilot CLI) by writing a prompt and launching the agent via background Bash tasks. Use when orchestrating multi-agent workflows, sending work for external review, parallel task fan-out, or the "review council" pattern where multiple agents review a plan in parallel. Triggers on words like "dispatch", "fan-out", "review council", "send to agent", "launch agent", or when orchestrating parallel CLI agent work.
---

Dispatch prompts to external CLI agents and collect results.

## Supported CLIs

| CLI | Command | Output | Reference |
|-----|---------|--------|-----------|
| Claude Code | `claude -p "prompt" --output-format json` | JSON (`result`, `session_id`, `usage`) | [claude-code.md](references/claude-code.md) |
| Codex CLI | `codex exec "prompt" --json` | JSONL events | [codex-cli.md](references/codex-cli.md) |
| Gemini CLI | `gemini -p "prompt"` | Plain text (recommended; `--output-format json` may not print to stdout) | [gemini-cli.md](references/gemini-cli.md) |
| Copilot CLI | `copilot -p "prompt" -s` | Plain text (silent mode) | [copilot-cli.md](references/copilot-cli.md) |

## Dispatch Workflow

### 1. Write the prompt file

Write the prompt to `.dispatch/<cli>-<timestamp>.md` so it's inspectable and replayable.

```bash
mkdir -p .dispatch
# Write prompt file using the Write tool
# Path: .dispatch/claude-code-2024-03-04T12-00-00.md
```

### 2. Read the CLI reference

Read `references/<cli>.md` for the target CLI to get exact flags. Each reference includes pipe patterns, permission flags, and output parsing.

### 3. Launch via background Bash tasks

**IMPORTANT:** Do NOT use Agent sub-agents — they cannot get Bash permissions to run external CLIs. Instead, run CLI commands directly as **background Bash tasks** (`run_in_background: true`). This still parallelizes the work while keeping output in files rather than the context window.

For **single dispatch**:
```bash
# Bash tool with run_in_background: true
cat .dispatch/<file>.md | claude -p - \
  --output-format json \
  --allowedTools "Read,Glob,Grep" \
  --max-turns 5 \
  --no-session-persistence 2>/dev/null \
  | jq -r '.result' > .dispatch/output-claude.md
```

For **parallel fan-out**, launch multiple Bash calls in a single message (all with `run_in_background: true`):

```bash
# Bash 1 — Claude Code
cat .dispatch/prompt.md | claude -p - --output-format json \
  --allowedTools "Read,Glob,Grep" --no-session-persistence 2>/dev/null \
  | jq -r '.result' > .dispatch/output-claude.md

# Bash 2 — Codex CLI
cat .dispatch/prompt.md | codex exec - --json --ephemeral 2>/dev/null \
  | grep '"type":"item.completed"' \
  | jq -rs '[.[].item.text] | join("\n")' > .dispatch/output-codex.md

# Bash 3 — Gemini CLI (use plain text, --output-format json may not produce stdout)
cat .dispatch/prompt.md | gemini -p - 2>/dev/null \
  > .dispatch/output-gemini.md

# Bash 4 — Copilot CLI
cat .dispatch/prompt.md | copilot -p - -s --no-ask-user --no-custom-instructions 2>/dev/null \
  > .dispatch/output-copilot.md
```

### 4. Collect results

Read the output files after all background tasks complete:
1. Read `.dispatch/output-<cli>.md` for each CLI
2. Aggregate feedback
3. Synthesize a unified response

## Safe Defaults

Always use read-only/minimal permissions unless the caller explicitly needs more:

| CLI | Safe flags |
|-----|-----------|
| Claude Code | `--allowedTools "Read,Glob,Grep" --no-session-persistence` |
| Codex CLI | `--ephemeral` (default sandbox is read-only) |
| Gemini CLI | (default prompts for approval) |
| Copilot CLI | `--no-ask-user --no-custom-instructions` |

## File-Based Output (alternative)

When JSON stdout is insufficient or output is very large:

```bash
# Claude Code: capture to file, parse later
claude -p "prompt" --output-format json > .dispatch/output-claude.json

# Codex CLI: use -o flag
codex exec "prompt" -o .dispatch/output-codex.md --ephemeral

# Copilot CLI: use --share flag
copilot -p "prompt" -s --share .dispatch/output-copilot.md
```

## Tips

- Set `--max-turns` / `--max-autopilot-continues` to prevent runaway agents
- Set `--max-budget-usd` (Claude Code) for cost control
- Use `--model` to select cheaper models for review tasks
- Prompt files in `.dispatch/` can be reused — pipe the same file to multiple CLIs
- Ensure `.dispatch/` is ignored (e.g., add it to a `.gitignore` file or `.git/info/exclude`)
