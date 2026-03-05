# OpenAI Codex CLI Reference

## Non-Interactive Execution

```bash
codex exec "prompt" --json
```

## Key Flags

| Flag | Purpose |
|------|---------|
| `codex exec "prompt"` | Non-interactive mode |
| `--json` | JSONL output (newline-delimited JSON events) |
| `-o <path>` / `--output-last-message <path>` | Write final message to file |
| `--output-schema <path>` | JSON Schema for structured response |
| `--model <model>` | Model selection (e.g., `gpt-5-codex`) |
| `--ephemeral` | Don't persist session files |
| `--skip-git-repo-check` | Allow runs outside git repos |
| `--full-auto` | Broader permissions (auto-approve edits) |
| `-a <mode>` / `--ask-for-approval <mode>` | `untrusted` / `on-request` / `never` |
| `--sandbox <policy>` | `read-only` / `workspace-write` / `danger-full-access` |
| `--add-dir <path>` | Grant additional directory access |
| `-C <path>` / `--cd <path>` | Set working directory |
| `--search` | Enable live web search |

## Permission Modes

- **Default:** Read-only sandbox (safe for review)
- **`--full-auto`:** Auto-approve edits
- **`--sandbox danger-full-access`:** Unrestricted (CI only)
- **`--yolo`:** Skip all approvals and sandboxing

## Pipe Pattern

```bash
cat prompt.md | codex exec "Review this plan for completeness and flaws" \
  --json \
  --ephemeral
```

## File Output Pattern

```bash
codex exec "Review this plan" \
  -o /tmp/codex-review-output.md \
  --ephemeral
```

## Session Resumption

```bash
codex exec resume --last "Follow-up question"
codex exec resume <SESSION_ID>
```

## Notes

- Final agent message streams to stdout; progress to stderr
- Default sandbox is read-only (safe for review tasks)
- No dedicated system-prompt-file flag; use stdin pipe for custom prompts
- Auth via `CODEX_API_KEY` env var
