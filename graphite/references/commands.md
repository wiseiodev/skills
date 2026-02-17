# Graphite Command Reference

## Navigation

| Command | Shortcut | Description |
|---------|----------|-------------|
| `gt checkout [branch]` | `gt co` | Switch to branch (interactive if no arg) |
| `gt up [n]` | `gt u` | Move up n branches (default 1) |
| `gt down [n]` | `gt d` | Move down n branches (default 1) |
| `gt top` | `gt t` | Jump to top of current stack |
| `gt bottom` | `gt b` | Jump to bottom of current stack |

## Branch Creation & Modification

| Command | Shortcut | Description |
|---------|----------|-------------|
| `gt create [name]` | `gt c` | Create new branch on current. `-m "msg"` for commit message |
| `gt modify` | `gt m` | Amend current branch. `-a` stages all changes |
| `gt modify --into <branch>` | - | Amend into a downstack branch |
| `gt split` | `gt sp` | Interactive split into multiple branches |
| `gt squash` | `gt sq` | Consolidate commits in current branch |
| `gt absorb` | `gt ab` | Auto-distribute staged changes to relevant commits |
| `gt rename <name>` | - | Rename current branch |

## Stack Reorganization

| Command | Shortcut | Description |
|---------|----------|-------------|
| `gt move` | - | Relocate branch to new parent (interactive) |
| `gt fold` | - | Merge current branch into its parent |
| `gt pop` | - | Delete branch but keep changes in working tree |
| `gt reorder` | - | Rearrange branch ordering in stack |
| `gt delete` | - | Remove branch. `--close` closes associated PR |

## Sync & Submit

| Command | Shortcut | Description |
|---------|----------|-------------|
| `gt sync` | - | Fetch trunk, clean merged branches, restack all |
| `gt submit` | - | Push and create/update PR for current branch |
| `gt submit --stack` | `gt ss` | Submit entire stack (all branches) |
| `gt submit --update-only` | - | Update existing PRs only, no new PRs |
| `gt submit --draft` | - | Create PR as draft |
| `gt get <branch>` | - | Fetch teammate's stack locally |
| `gt track <branch>` | `gt tr` | Start tracking existing git branch |
| `gt untrack` | `gt utr` | Stop tracking current branch |

## Recovery

| Command | Shortcut | Description |
|---------|----------|-------------|
| `gt undo` | - | Reverse last Graphite mutation |
| `gt abort` | - | Cancel in-progress rebase, restore pre-command state |
| `gt continue` | - | Resume after conflict resolution |

## Utilities

| Command | Shortcut | Description |
|---------|----------|-------------|
| `gt log` | - | Full branch + PR info for stack |
| `gt log short` | `gt ls` | Branches only (compact view) |
| `gt info` | - | Current branch metadata |
| `gt pr` | - | Open PR in browser |
| `gt freeze [branch]` | - | Lock branch against accidental edits |
| `gt unfreeze [branch]` | - | Unlock branch |
| `gt auth` | - | Authenticate with GitHub |
| `gt trunk --set <branch>` | - | Configure trunk branch |

## Common Flag Patterns

### Submit flags
- `--no-edit` - Skip PR title/body prompts
- `-p` or `--publish` - Publish draft PRs
- `--draft` - Create as draft
- `--update-only` - Only update existing PRs
- `--stack` - Submit entire stack

### Create flags
- `-m "message"` - Commit message
- `-a` or `--all` - Stage all changes first

### Delete flags
- `--close` - Close associated PR
- `--force` - Force delete even with unmerged changes
