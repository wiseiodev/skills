# Google Gemini CLI Reference

## Non-Interactive Execution

```bash
gemini -p "prompt" --output-format json
```

## Key Flags

| Flag | Purpose |
|------|---------|
| `-p "prompt"` / `--prompt "prompt"` | Non-interactive mode (exits after response) |
| `--output-format json` | Structured JSON output |
| `--model <model>` / `-m <model>` | Model selection (e.g., `gemini-2.5-flash`) |
| `--approval-mode auto_edit` | Auto-approve edits |
| `--yolo` / `-y` | Auto-approve all actions |
| `--include-directories <dirs>` | Add directories to scope |
| `--all-files` / `-a` | Include all files in context |
| `--debug` / `-d` | Enable debug output |

## Permission Modes

- **Default:** Prompts for approval on file changes
- **`--approval-mode auto_edit`:** Auto-approve edits
- **`--yolo`:** Approve everything (use with caution)

## Pipe Pattern

```bash
cat prompt.md | gemini -p "Review this plan for completeness and flaws" \
  --output-format json
```

## Notes

- No dedicated system-prompt flag; use stdin pipe for custom context
- Auth via Google Cloud credentials or API key
- `--checkpointing` available for long-running tasks
