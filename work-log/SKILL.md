---
name: work-log
description: Log accomplishments, solved problems, learnings, and milestones to Obsidian daily notes via the Obsidian CLI. Also answers questions about the Obsidian CLI. Triggers on "/log", "log accomplishment", "log what I did", "work log", "obsidian cli", "daily note", or when user wants to record something noteworthy they did.
---

Append structured entries to today's Obsidian daily note. Two modes: logging and CLI reference.

## Mode 1: Log entry

### Quick invocation (args provided)

Parse args: `/log <type> "<description>"`

Types: `accomplishment`, `problem-solved`, `learning`, `milestone`

### Interactive invocation (no args or incomplete)

Prompt for missing fields using AskUserQuestion:
1. Entry type (if not provided)
2. Description (if not provided)

### Append workflow

```bash
# 1. Read current daily note
obsidian daily:read vault=Personal 2>&1 | grep -v "Loading\|installer"

# 2. If no "## Work Log" section exists, prepend header + table header
obsidian daily:prepend vault=Personal content="## Work Log\n\n| Time | Type | Entry |\n|------|------|-------|\n"

# 3. Append table row (use current HH:MM timestamp)
obsidian daily:append vault=Personal content="| HH:MM | <type> | <description> |"
```

**Important:**
- Use `inline` flag when appending table rows so they stay on the same line
- Get current time via `date +%H:%M`
- Escape special characters in content (pipes `|` → `\|`)
- The `vault=Personal` is the default — override with `vault=<name>` if user specifies

### Entry format in daily note

```markdown
## Work Log

| Time | Type | Entry |
|------|------|-------|
| 14:30 | accomplishment | Shipped evlog structured logging across codebase |
| 11:15 | problem-solved | Fixed React Compiler + RHF incompatibility |
| 09:00 | learning | Discovered cmux workspace-per-agent pattern |
```

### After logging

Confirm what was logged: type, description, and timestamp. Do not open the note unless user asks.

## Mode 2: Obsidian CLI reference

When user asks about Obsidian CLI commands (not logging), read [references/obsidian-cli.md](references/obsidian-cli.md) and answer their question.

## Notes

- Obsidian must be running for CLI to work
- If CLI fails, suggest: "Is Obsidian running?" and check `obsidian ping` or `obsidian version`
- The CLI binary is at `/Applications/Obsidian.app/Contents/MacOS/obsidian` (macOS)
- Suppress stderr noise: `2>&1 | grep -v "Loading\|installer"`
