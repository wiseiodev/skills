# Claude Code CLI Reference

## Non-Interactive Execution

```bash
claude -p "prompt" --output-format json
```

## Key Flags

| Flag | Purpose |
|------|---------|
| `-p "prompt"` | Non-interactive print mode (exits after response) |
| `--output-format json` | Structured JSON: `result`, `session_id`, `usage`, `cost`, `duration` |
| `--output-format stream-json` | Newline-delimited JSON (real-time streaming) |
| `--append-system-prompt "text"` | Append instructions to default system prompt |
| `--append-system-prompt-file <path>` | Append instructions from file |
| `--system-prompt "text"` | Replace entire system prompt |
| `--system-prompt-file <path>` | Replace system prompt from file |
| `--allowedTools "Tool1,Tool2"` | Auto-approve specific tools |
| `--disallowedTools "Tool1"` | Remove tools from context |
| `--max-turns N` | Limit agentic turns |
| `--max-budget-usd N` | Cost cap in dollars |
| `--model <model>` | Model selection (e.g., `claude-sonnet-4-6`, `opus`) |
| `--no-session-persistence` | Don't save session |
| `-c` / `--continue` | Continue most recent session |
| `-r` / `--resume <id>` | Resume specific session |
| `--add-dir <path>` | Add directories to access |
| `--verbose` | Show full turn-by-turn output |

## Permission Patterns

```bash
# Read-only (safe for review tasks)
--allowedTools "Read,Glob,Grep"

# Prefix match (note space before *)
--allowedTools "Bash(git *)"

# Full auto
--dangerously-skip-permissions
```

## Pipe Pattern

```bash
cat prompt.md | claude -p "Review this plan for completeness and flaws" \
  --output-format json \
  --allowedTools "Read,Glob,Grep" \
  --max-turns 5 \
  --no-session-persistence
```

## Parsing JSON Output

```bash
# Extract text result
claude -p "query" --output-format json | jq -r '.result'

# Extract session_id for resumption
claude -p "query" --output-format json | jq -r '.session_id'
```

## Structured Output

```bash
claude -p "Extract function names" \
  --output-format json \
  --json-schema '{"type":"object","properties":{"items":{"type":"array","items":{"type":"string"}}}}'
```
