# GitHub Copilot CLI Reference

## Non-Interactive Execution

```bash
copilot -p "prompt" -s
```

## Key Flags

| Flag | Purpose |
|------|---------|
| `-p "prompt"` / `--prompt "prompt"` | Non-interactive mode (exits after completion) |
| `-s` / `--silent` | Output only response, no usage stats (best for scripting) |
| `--model <model>` | Model selection |
| `--agent <name>` | Use a custom agent |
| `--autopilot` | Enable autonomous continuation in prompt mode |
| `--max-autopilot-continues N` | Limit autonomous continuations (default: unlimited) |
| `--no-ask-user` | Disable user questions (fully autonomous) |
| `--cwd <path>` / `--cd <path>` | Set working directory |
| `--add-dir <path>` | Add directory to allowed list |
| `--continue` | Resume most recent session |
| `--resume [session-id]` | Resume specific session |
| `--share [path]` | Export session to markdown file |
| `--share-gist` | Export session to GitHub gist |
| `--no-custom-instructions` | Ignore AGENTS.md files |
| `--no-color` | Disable color output |

## Tool Permission Flags

| Flag | Purpose |
|------|---------|
| `--allow-tool <pattern>` | Auto-approve matching tools (glob patterns) |
| `--deny-tool <pattern>` | Block matching tools (takes precedence) |
| `--allow-all` / `--yolo` | Enable all permissions |
| `--allow-all-tools` | Auto-approve all tools |
| `--allow-all-paths` | Allow all filesystem paths |
| `--available-tools <tools>` | Restrict to only these tools |
| `--excluded-tools <tools>` | Remove these tools entirely |

## MCP Configuration

```bash
# Add MCP server for session
--additional-mcp-config '{"servers":{"name":{"command":"cmd","args":[]}}}'
--additional-mcp-config @mcp-config.json

# GitHub MCP tools
--enable-all-github-mcp-tools
--add-github-mcp-tool <tool>
--add-github-mcp-toolset <toolset>
```

## Pipe Pattern

```bash
cat prompt.md | copilot -p "Review this plan for completeness and flaws" \
  -s \
  --no-ask-user \
  --no-custom-instructions
```

## Notes

- Auth via `COPILOT_GITHUB_TOKEN`, `GH_TOKEN`, or `GITHUB_TOKEN` env vars
- Exit code 0 = success, non-zero = error
- `-s` flag is critical for scripting — omitting it includes usage stats in output
- No dedicated JSON output format flag; use `-s` for clean text output
- For structured output, use `--share <path>` to export session to markdown file
