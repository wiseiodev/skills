# cmux CLI Reference

## Global flags

| Flag | Description |
|------|-------------|
| `--socket PATH` | Override socket path (default `/tmp/cmux.sock`) |
| `--window WINDOW` | Target window |
| `--password PASSWORD` | Socket auth password |
| `--json` | JSON output (supported on some commands) |
| `--id-format refs|uuids|both` | Output format for IDs (default: refs) |
| `--version` | Show version |

## Ref format

Most commands accept refs like `workspace:1`, `surface:3`, `pane:2`, `tab:4`, `window:1` or UUIDs.

## System

```
cmux ping                    # → PONG
cmux capabilities            # list available methods + access mode
cmux identify                # focused window/workspace/surface context
cmux version                 # version string
```

## Window management

```
cmux list-windows
cmux current-window
cmux new-window
cmux focus-window --window <id>
cmux close-window --window <id>
cmux rename-window [--workspace <ref>] <title>
cmux move-workspace-to-window --workspace <ref> --window <ref>
```

## Workspace management

```
cmux list-workspaces
cmux new-workspace [--command <text>]
cmux select-workspace --workspace <ref>
cmux current-workspace
cmux close-workspace --workspace <ref>
cmux rename-workspace [--workspace <ref>] <title>
cmux reorder-workspace --workspace <ref> (--index <n> | --before <ref> | --after <ref>)
cmux workspace-action --action <name> [--workspace <ref>] [--title <text>]
```

## Surface/pane management

```
cmux new-split <left|right|up|down> [--workspace <ref>] [--surface <ref>]
cmux new-pane [--type terminal|browser] [--direction <dir>] [--workspace <ref>] [--url <url>]
cmux new-surface [--type terminal|browser] [--pane <ref>] [--workspace <ref>] [--url <url>]
cmux close-surface [--surface <ref>] [--workspace <ref>]
cmux list-panes [--workspace <ref>]
cmux list-pane-surfaces [--workspace <ref>] [--pane <ref>]
cmux focus-pane --pane <ref> [--workspace <ref>]
cmux list-panels [--workspace <ref>]
cmux focus-panel --panel <ref> [--workspace <ref>]
cmux move-surface --surface <ref> [--pane <ref>] [--before <ref>] [--after <ref>] [--index <n>]
cmux reorder-surface --surface <ref> (--index <n> | --before <ref> | --after <ref>)
cmux drag-surface-to-split --surface <ref> <left|right|up|down>
cmux swap-pane --pane <ref> --target-pane <ref> [--workspace <ref>]
cmux break-pane [--workspace <ref>] [--pane <ref>] [--surface <ref>] [--no-focus]
cmux join-pane --target-pane <ref> [--workspace <ref>] [--pane <ref>] [--surface <ref>]
cmux resize-pane --pane <ref> [--workspace <ref>] (-L|-R|-U|-D) [--amount <n>]
cmux respawn-pane [--workspace <ref>] [--surface <ref>] [--command <cmd>]
cmux refresh-surfaces
cmux surface-health [--workspace <ref>]
```

## Input/Output

```
cmux send [--workspace <ref>] [--surface <ref>] <text>
cmux send-key [--workspace <ref>] [--surface <ref>] <key>
cmux send-panel --panel <ref> [--workspace <ref>] <text>
cmux send-key-panel --panel <ref> [--workspace <ref>] <key>
cmux read-screen [--workspace <ref>] [--surface <ref>] [--scrollback] [--lines <n>]
cmux capture-pane [--workspace <ref>] [--surface <ref>] [--scrollback] [--lines <n>]
cmux clear-history [--workspace <ref>] [--surface <ref>]
```

Key values for `send-key`: enter, tab, escape, backspace, delete, up, down, left, right.

## Synchronization

```
cmux wait-for <name> [--timeout <seconds>]      # block until signal received
cmux wait-for --signal <name>                    # emit signal
```

## Notifications

```
cmux notify --title <text> [--subtitle <text>] [--body <text>] [--workspace <ref>] [--surface <ref>]
cmux list-notifications
cmux clear-notifications
cmux trigger-flash [--workspace <ref>] [--surface <ref>]
```

## Sidebar metadata

```
cmux set-status <key> <value> [--icon <name>] [--color <#hex>] [--workspace <ref>]
cmux clear-status <key> [--workspace <ref>]
cmux list-status [--workspace <ref>]
cmux set-progress <0.0-1.0> [--label <text>] [--workspace <ref>]
cmux clear-progress [--workspace <ref>]
cmux log [--level info|progress|success|warning|error] [--source <name>] [--workspace <ref>] [--] <message>
cmux clear-log [--workspace <ref>]
cmux list-log [--limit <n>] [--workspace <ref>]
cmux sidebar-state [--workspace <ref>]
```

## Tab management

```
cmux rename-tab [--workspace <ref>] [--tab <ref>] [--surface <ref>] <title>
cmux tab-action --action <name> [--tab <ref>] [--surface <ref>] [--workspace <ref>] [--title <text>] [--url <url>]
```

## Navigation (tmux compat)

```
cmux next-window | previous-window | last-window
cmux last-pane [--workspace <ref>]
cmux find-window [--content] [--select] <query>
```

## Clipboard

```
cmux set-buffer [--name <name>] <text>
cmux list-buffers
cmux paste-buffer [--name <name>] [--workspace <ref>] [--surface <ref>]
cmux copy-mode
```

## Hooks

```
cmux set-hook [--list] [--unset <event>] | <event> <command>
cmux claude-hook <session-start|stop|notification> [--workspace <ref>] [--surface <ref>]
```

## Browser

```
cmux browser open [url]                           # open browser in caller's workspace
cmux browser open-split [url]                     # open as split
cmux browser goto|navigate <url>                  # navigate to URL
cmux browser back|forward|reload                  # navigation
cmux browser url|get-url                          # get current URL
cmux browser snapshot [--interactive] [--compact]  # DOM snapshot
cmux browser eval <script>                        # run JS
cmux browser wait [--selector <css>] [--text <text>] [--url-contains <text>] [--timeout-ms <ms>]
cmux browser click|dblclick|hover|focus <selector>
cmux browser type <selector> <text>
cmux browser fill <selector> [text]               # empty clears input
cmux browser press|keydown|keyup <key>
cmux browser select <selector> <value>
cmux browser scroll [--selector <css>] [--dx <n>] [--dy <n>]
cmux browser get <url|title|text|html|value|attr|count|box|styles> [...]
cmux browser is <visible|enabled|checked> <selector>
cmux browser find <role|text|label|placeholder|alt|title|testid|first|last|nth> ...
cmux browser frame <selector|main>
cmux browser dialog <accept|dismiss> [text]
cmux browser download [wait] [--path <path>] [--timeout-ms <ms>]
cmux browser cookies <get|set|clear> [...]
cmux browser storage <local|session> <get|set|clear> [...]
cmux browser tab <new|list|switch|close|<index>> [...]
cmux browser console <list|clear>
cmux browser errors <list|clear>
cmux browser highlight <selector>
cmux browser state <save|load> <path>
cmux browser addinitscript|addscript <script>
cmux browser addstyle <css>
cmux browser viewport <width> <height>
cmux browser identify [--surface <ref>]
```

## Environment variables

| Variable | Description |
|----------|-------------|
| `CMUX_WORKSPACE_ID` | Auto-set: current workspace UUID |
| `CMUX_SURFACE_ID` | Auto-set: current surface UUID |
| `CMUX_SOCKET_PATH` | Override socket path (default `/tmp/cmux.sock`) |
| `CMUX_SOCKET_PASSWORD` | Socket auth password |
| `CMUX_TAB_ID` | Optional alias for `tab-action`/`rename-tab` |
| `CMUX_CLI_SENTRY_DISABLED` | Set `1` to disable CLI diagnostics |

## Socket API (JSON-RPC)

For programmatic access via Unix socket:

```bash
# Bash
printf '{"id":"1","method":"workspace.list","params":{}}\n' | nc -U /tmp/cmux.sock

# Python
import json, os, socket
def rpc(method, params=None):
    payload = {"id": "1", "method": method, "params": params or {}}
    with socket.socket(socket.AF_UNIX, socket.SOCK_STREAM) as s:
        s.connect(os.environ.get("CMUX_SOCKET_PATH", "/tmp/cmux.sock"))
        s.sendall(json.dumps(payload).encode() + b"\n")
        return json.loads(s.recv(65536))
```
