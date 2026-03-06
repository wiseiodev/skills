# Obsidian CLI Reference

Usage: `obsidian <command> [options]`

Global option: `vault=<name>` — target a specific vault by name.

Notes:
- `file` resolves by name (like wikilinks), `path` is exact (folder/note.md)
- Most commands default to the active file when file/path is omitted
- Quote values with spaces: `name="My Note"`
- Use `\n` for newline, `\t` for tab in content values
- Obsidian app must be running for CLI to work

## Daily Notes

```
daily                      Open daily note
  paneType=tab|split|window

daily:append               Append content to daily note
  content=<text>           (required)
  inline                   Append without newline
  open                     Open file after adding
  paneType=tab|split|window

daily:prepend              Prepend content to daily note
  content=<text>           (required)
  inline                   Prepend without newline
  open                     Open file after adding
  paneType=tab|split|window

daily:read                 Read daily note contents

daily:path                 Get daily note path
```

## File Operations

```
create                     Create a new file
  name=<name>              File name
  path=<path>              File path
  content=<text>           Initial content
  template=<name>          Template to use
  overwrite                Overwrite if exists
  open                     Open after creating
  newtab                   Open in new tab

read                       Read file contents
  file=<name> | path=<path>

append                     Append content to a file
  file=<name> | path=<path>
  content=<text>           (required)
  inline                   Append without newline

prepend                    Prepend content to a file
  file=<name> | path=<path>
  content=<text>           (required)
  inline                   Prepend without newline

delete                     Delete a file
  file=<name> | path=<path>
  permanent                Skip trash

move                       Move or rename a file
  file=<name> | path=<path>
  to=<path>                Destination (required)

rename                     Rename a file
  file=<name> | path=<path>
  name=<name>              New name (required)

open                       Open a file
  file=<name> | path=<path>
  newtab                   Open in new tab
```

## Search

```
search                     Search vault for text
  query=<text>             (required)
  path=<folder>            Limit to folder
  limit=<n>                Max files
  total                    Return match count
  case                     Case sensitive
  format=text|json

search:context             Search with matching line context
  query=<text>             (required)
  path=<folder>            Limit to folder
  limit=<n>                Max files
  case                     Case sensitive
  format=text|json

search:open                Open search view
  query=<text>             Initial query
```

## Properties (Frontmatter)

```
properties                 List properties in vault
  file=<name> | path=<path>
  name=<name>              Get specific property count
  total                    Return count
  sort=count               Sort by count
  counts                   Include counts
  format=yaml|json|tsv

property:read              Read a property value
  name=<name>              (required)
  file=<name> | path=<path>

property:set               Set a property
  name=<name>              (required)
  value=<value>            (required)
  type=text|list|number|checkbox|date|datetime
  file=<name> | path=<path>

property:remove            Remove a property
  name=<name>              (required)
  file=<name> | path=<path>
```

## Tasks

```
task                       Show or update a task
  ref=<path:line>          Task reference
  file=<name> | path=<path>
  line=<n>                 Line number
  toggle                   Toggle status
  done                     Mark as done
  todo                     Mark as todo
  daily                    Use daily note
  status="<char>"          Set status character

tasks                      List tasks in vault
  file=<name> | path=<path>
  total                    Return count
  done                     Show completed
  todo                     Show incomplete
  status="<char>"          Filter by status
  verbose                  Group by file with line numbers
  format=json|tsv|csv
  active                   Active file tasks
  daily                    Daily note tasks
```

## Vault & Files

```
vault                      Show vault info
  info=name|path|files|folders|size

vaults                     List known vaults
  total                    Return count
  verbose                  Include paths

files                      List files in vault
  folder=<path>            Filter by folder
  ext=<extension>          Filter by extension
  total                    Return count

folders                    List folders
  folder=<path>            Filter by parent
  total                    Return count

folder                     Show folder info
  path=<path>              (required)
  info=files|folders|size
```

## Tags

```
tag                        Get tag info
  name=<tag>               (required)
  total                    Return count
  verbose                  Include file list

tags                       List tags in vault
  file=<name> | path=<path>
  total                    Return count
  counts                   Include counts
  sort=count               Sort by count
  format=json|tsv|csv
```

## Links & Graph

```
links                      List outgoing links from file
  file=<name> | path=<path>
  total                    Return count

backlinks                  List backlinks to file
  file=<name> | path=<path>
  counts                   Include link counts
  total                    Return count
  format=json|tsv|csv

aliases                    List aliases in vault
  file=<name> | path=<path>
  total                    Return count
  verbose                  Include file paths

orphans                    List files with no incoming links
  total | all

deadends                   List files with no outgoing links
  total | all

unresolved                 List unresolved links
  total | counts | verbose
  format=json|tsv|csv

outline                    Show headings for file
  file=<name> | path=<path>
  format=tree|md|json
  total                    Return count
```

## Templates

```
templates                  List templates
  total                    Return count

template:insert            Insert template into active file
  name=<template>          (required)

template:read              Read template content
  name=<template>          (required)
  resolve                  Resolve template variables
  title=<title>            Title for resolution
```

## Bookmarks

```
bookmark                   Add a bookmark
  file=<path> | folder=<path> | search=<query> | url=<url>
  subpath=<subpath>        Heading or block within file
  title=<title>            Bookmark title

bookmarks                  List bookmarks
  total | verbose
  format=json|tsv|csv
```

## Plugins

```
plugins                    List installed plugins
  filter=core|community
  versions                 Include versions
  format=json|tsv|csv

plugins:enabled            List enabled plugins
  filter=core|community

plugin                     Get plugin info
  id=<plugin-id>           (required)

plugin:enable              Enable a plugin
  id=<id>                  (required)

plugin:disable             Disable a plugin
  id=<id>                  (required)

plugin:install             Install community plugin
  id=<id>                  (required)
  enable                   Enable after install

plugin:uninstall           Uninstall community plugin
  id=<id>                  (required)

plugin:reload              Reload plugin (dev)
  id=<id>                  (required)

plugins:restrict           Toggle restricted mode
  on | off
```

## Sync

```
sync                       Pause or resume sync
  on | off

sync:status                Show sync status

sync:history               List sync versions for file
  file=<name> | path=<path>
  total                    Return count

sync:read                  Read a sync version
  file=<name> | path=<path>
  version=<n>              (required)

sync:restore               Restore a sync version
  file=<name> | path=<path>
  version=<n>              (required)

sync:deleted               List deleted files in sync
  total

sync:open                  Open sync history
  file=<name> | path=<path>
```

## History (Local)

```
history                    List file history versions
  file=<name> | path=<path>

history:list               List files with history

history:read               Read a history version
  file=<name> | path=<path>
  version=<n>              (default: 1)

history:restore            Restore a history version
  file=<name> | path=<path>
  version=<n>              (required)

history:open               Open file recovery
  file=<name> | path=<path>

diff                       List or diff versions
  file=<name> | path=<path>
  from=<n> | to=<n>        Version range
  filter=local|sync
```

## Base (Databases)

```
bases                      List all base files

base:create                Create a new item in a base
  file=<name> | path=<path>
  view=<name>              View name
  name=<name>              New file name
  content=<text>           Initial content
  open | newtab

base:query                 Query a base
  file=<name> | path=<path>
  view=<name>              View name
  format=json|csv|tsv|md|paths

base:views                 List views in current base
```

## Themes & Snippets

```
theme                      Show active theme
  name=<name>              Theme for details

theme:set                  Set active theme
  name=<name>              (required, empty for default)

theme:install              Install community theme
  name=<name>              (required)
  enable                   Activate after install

theme:uninstall            Uninstall theme
  name=<name>              (required)

themes                     List installed themes
  versions

snippets                   List CSS snippets
snippets:enabled           List enabled snippets
snippet:enable             Enable snippet (name=<name>)
snippet:disable            Disable snippet (name=<name>)
```

## Window & Workspace

```
tabs                       List open tabs
  ids                      Include tab IDs

tab:open                   Open a new tab
  group=<id> | file=<path> | view=<type>

workspace                  Show workspace tree
  ids                      Include IDs

recents                    List recently opened files
  total
```

## Commands & Hotkeys

```
command                    Execute an Obsidian command
  id=<command-id>          (required)

commands                   List available command IDs
  filter=<prefix>          Filter by prefix

hotkey                     Get hotkey for command
  id=<command-id>          (required)
  verbose                  Show if custom

hotkeys                    List hotkeys
  total | verbose | all
  format=json|tsv|csv
```

## Notifications & Clipboard

```
wordcount                  Count words and characters
  file=<name> | path=<path>
  words | characters       Return specific count

random                     Open a random note
  folder=<path> | newtab

random:read                Read a random note
  folder=<path>

reload                     Reload the vault
restart                    Restart the app
version                    Show Obsidian version
```

## Developer Tools

```
eval                       Execute JavaScript
  code=<javascript>        (required)

dev:dom                    Query DOM elements
  selector=<css>           (required)
  total | text | inner | all
  attr=<name> | css=<prop>

dev:css                    Inspect CSS with source locations
  selector=<css>           (required)
  prop=<name>

dev:console                Show console messages
  clear | limit=<n>
  level=log|warn|error|info|debug

dev:errors                 Show captured errors
  clear

dev:screenshot             Take a screenshot
  path=<filename>

dev:cdp                    Run Chrome DevTools Protocol command
  method=<CDP.method>      (required)
  params=<json>

dev:debug                  Attach/detach debugger
  on | off

dev:mobile                 Toggle mobile emulation
  on | off

devtools                   Toggle Electron dev tools
```

## Environment Variables

| Variable | Description |
|----------|-------------|
| `OBSIDIAN_CLI_PATH` | Override CLI binary path |

## Suppressing Noise

The CLI prints loading/installer messages to stderr. Suppress with:

```bash
obsidian <command> 2>&1 | grep -v "Loading\|installer"
```
