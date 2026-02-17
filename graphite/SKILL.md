---
name: graphite
description: Comprehensive Graphite CLI for stacked PRs. Triggers on stack management, gt commands, rebasing/syncing, branch navigation (up/down/top/bottom), merge conflicts, reorganizing branches, recovery (undo/abort), teammate stacks. For simple PR creation, use gt skill instead.
---

# Graphite CLI

## Live Docs Fallback

For edge cases or latest features not covered here:
https://graphite.com/docs/llms-full.txt

## Key Concepts

- **Stack**: Linear chain of branches, each = 1 PR, building on previous
- **Trunk**: Main integration branch (main/develop)
- **Upstack**: Branches further from trunk (children)
- **Downstack**: Branches closer to trunk (parents)
- **Parent/Child**: Each branch has one parent; children depend on parent changes

## Prerequisites

Before using Graphite:
1. Install: `brew install withgraphite/tap/graphite-cli`
2. Authenticate: `gt auth` (GitHub App or PAT)
3. Initialize: repo must have trunk configured (auto-detected on first use)

## Quick Decision Trees

### "I need to navigate my stack"
- Up one branch: `gt up` or `gt u`
- Down one branch: `gt down` or `gt d`
- Jump to stack top: `gt top` or `gt t`
- Jump to stack bottom: `gt bottom` or `gt b`
- Checkout specific branch: `gt checkout <branch>` or `gt co <branch>`
- See full stack state: `gt log` or `gt ls` (short)

### "I need to modify code"
- Add to current branch: `gt modify --all` or `gt m -a`
- Add to specific downstack branch: `gt modify --into <branch>`
- Split branch into multiple: `gt split` or `gt sp`
- Squash commits: `gt squash` or `gt sq`
- Auto-distribute changes to relevant commits: `gt absorb` or `gt ab`
- Rename current branch: `gt rename <new-name>`

### "I need to reorganize branches"
- Move branch to new parent: `gt move`
- Merge branch into parent: `gt fold`
- Delete branch, keep changes: `gt pop`
- Reorder branches in stack: `gt reorder`
- Delete branch (close PR): `gt delete --close`

### "I need to sync/submit"
- Update trunk + restack all: `gt sync`
- Submit current branch PR: `gt submit`
- Submit entire stack: `gt ss` (alias: `gt submit --stack`)
- Update PR without new PRs: `gt submit --update-only`
- Fetch teammate's stack: `gt get <branch>`
- Track existing git branch: `gt track <branch>` or `gt tr`

### "Something went wrong"
- Undo last Graphite action: `gt undo`
- Cancel in-progress rebase: `gt abort`
- Continue after resolving conflicts: `gt continue`
- Check what went wrong: `gt info`

### "Merge conflicts during sync"
1. `gt sync` encounters conflict
2. Resolve conflicts in affected files
3. `git add <resolved-files>`
4. `gt continue`
5. If more conflicts, repeat 2-4
6. If hopeless, `gt abort` to restore pre-sync state

## Command Reference

See [references/commands.md](references/commands.md) for full command details.

## Common Workflows

See [references/workflows.md](references/workflows.md) for step-by-step guides.

## Best Practices

See [references/best-practices.md](references/best-practices.md) for team recommendations.

## Troubleshooting

| Problem | Solution |
|---------|----------|
| "Not authenticated" | Run `gt auth` |
| "Branch name exists" | Choose different name or delete existing |
| "Trunk not configured" | Run `gt trunk --set main` |
| "Stack out of sync" | Run `gt sync` |
| "Conflict during rebase" | Resolve files, `git add`, `gt continue` |
| "Accidentally modified wrong branch" | `gt undo` to reverse |
| "Need to see what changed" | `gt log` shows full stack with PR status |
