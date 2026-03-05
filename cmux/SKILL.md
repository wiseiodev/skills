---
name: cmux
description: Use cmux terminal multiplexer to launch parallel agents, manage workspaces, read agent output, and orchestrate multi-agent workflows. Triggers on "cmux", "launch agent in new pane", "parallel workspace", "read agent output", "fan out to agents", or when orchestrating work across multiple terminal workspaces. Preferred over background Bash tasks when cmux is available — provides workspace isolation, screen reading, notifications, and built-in browser.
---

Use cmux to orchestrate work across isolated terminal workspaces. Each agent runs in its own workspace with full terminal context, screen-readable output, and notification support.

## Why cmux over background Bash tasks

| Feature | Background Bash | cmux |
|---------|----------------|------|
| Output capture | Redirect to file | `read-screen` reads live terminal |
| Isolation | Shared shell env | Separate workspace per agent |
| Monitoring | Check file existence | Sidebar status, progress bars, notifications |
| Browser | N/A | Built-in browser pane |
| Signaling | Poll files | `wait-for` named signals |

## Quick start

```bash
# Verify cmux is running
cmux ping  # → PONG

# Create workspace, send command, read output
WS_ID=$(cmux new-workspace | awk '{print $2}')       # capture workspace ref
cmux send --workspace "$WS_ID" 'echo hello'
cmux send-key --workspace "$WS_ID" enter
sleep 1
cmux read-screen --workspace "$WS_ID" --lines 5      # → last 5 lines
cmux close-workspace --workspace "$WS_ID"
```

## Agentic workflow patterns

### Pattern 1: Launch agent in dedicated workspace

```bash
# Create workspace and launch Claude Code
WS_ID=$(cmux new-workspace | awk '{print $2}')
cmux send --workspace "$WS_ID" 'claude -p "$(cat .dispatch/prompt.md)" --output-format json --allowedTools "Read,Glob,Grep" --max-turns 10 --no-session-persistence | jq -r ".result" > .dispatch/output.md'
cmux send-key --workspace "$WS_ID" enter
```

### Pattern 2: Parallel fan-out to multiple agents

Create multiple workspaces in a single orchestration step:

```bash
# Launch 3 agents in parallel workspaces
WS1=$(cmux new-workspace | awk '{print $2}')
WS2=$(cmux new-workspace | awk '{print $2}')
WS3=$(cmux new-workspace | awk '{print $2}')

cmux send --workspace "$WS1" 'claude -p "$(cat .dispatch/prompt.md)" --output-format json --allowedTools "Read,Glob,Grep" --no-session-persistence 2>/dev/null | jq -r ".result" > .dispatch/out-claude.md && cmux wait-for --signal agent-1-done'
cmux send-key --workspace "$WS1" enter

cmux send --workspace "$WS2" 'codex exec "$(cat .dispatch/prompt.md)" --json --ephemeral 2>/dev/null | grep "\"type\":\"item.completed\"" | jq -rs "[.[].item.text] | join(\"\\n\")" > .dispatch/out-codex.md && cmux wait-for --signal agent-2-done'
cmux send-key --workspace "$WS2" enter

cmux send --workspace "$WS3" 'gemini -p "$(cat .dispatch/prompt.md)" 2>/dev/null > .dispatch/out-gemini.md && cmux wait-for --signal agent-3-done'
cmux send-key --workspace "$WS3" enter
```

### Pattern 3: Poll with read-screen (no file output needed)

```bash
# Read terminal output directly — no file redirect needed
cmux read-screen --workspace "$WS_ID" --lines 50
cmux read-screen --workspace "$WS_ID" --scrollback  # full scrollback
```

### Pattern 4: Signal-based synchronization

```bash
# Wait until the 'task-done' signal is observed (blocks until signal or 300s)
cmux wait-for task-done --timeout 300

# From agent workspace (or hook), emit the signal:
cmux wait-for --signal task-done
```

### Pattern 5: Progress tracking via sidebar

```bash
cmux set-status review "Running" --icon "clock" --color "#FFA500" --workspace "$WS_ID"
cmux set-progress 0.5 --label "2 of 4 agents done" --workspace "$WS_ID"
cmux log --level success --source "council" "Agent 1 complete" --workspace "$WS_ID"
```

## Key CLI commands

For full reference, see [references/cli.md](references/cli.md).

### Workspace lifecycle
- `cmux new-workspace [--command <cmd>]` — create workspace (optionally run command)
- `cmux list-workspaces` — list all workspaces
- `cmux select-workspace --workspace <ref>` — switch to workspace
- `cmux close-workspace --workspace <ref>` — close workspace
- `cmux rename-workspace --workspace <ref> <title>` — rename

### I/O
- `cmux send --workspace <ref> <text>` — type text into workspace
- `cmux send-key --workspace <ref> <key>` — press key (enter, tab, escape, etc.)
- `cmux read-screen --workspace <ref> [--lines N] [--scrollback]` — read terminal output

### Synchronization
- `cmux wait-for <name> [--timeout <s>]` — block until signal
- `cmux wait-for --signal <name>` — emit signal

### Notifications
- `cmux notify --title <text> [--body <text>]` — send notification
- `cmux list-notifications` — list notifications

### Sidebar metadata
- `cmux set-status <key> <value> [--icon <name>] [--color <hex>]`
- `cmux set-progress <0.0-1.0> [--label <text>]`
- `cmux log [--level <level>] <message>`

### Splits and panes
- `cmux new-split <left|right|up|down> [--workspace <ref>]`
- `cmux new-pane [--type terminal|browser] [--workspace <ref>]`

### Browser
- `cmux browser open [url]` — open browser pane
- `cmux browser goto <url>` — navigate
- `cmux browser snapshot` — get page DOM snapshot
- `cmux browser eval <script>` — run JavaScript

## Environment variables

Inside cmux terminals, these are auto-set:
- `CMUX_WORKSPACE_ID` — current workspace UUID
- `CMUX_SURFACE_ID` — current surface UUID
- `CMUX_SOCKET_PATH` — socket path (default `/tmp/cmux.sock`)

## Integration with dispatch-cli-agent

cmux can replace background Bash tasks in the `dispatch-cli-agent` skill. Instead of `run_in_background: true`, create a cmux workspace per agent:

1. `cmux new-workspace` — get workspace ref
2. `cmux rename-workspace` — label it (e.g., "Claude Review")
3. `cmux send` + `cmux send-key enter` — launch the CLI command
4. Poll with `cmux read-screen` or use `cmux wait-for` for signals
5. `cmux close-workspace` — clean up

This gives the orchestrator live visibility into each agent's progress via the sidebar.
