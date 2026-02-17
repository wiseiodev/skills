# Graphite Workflows

## Creating a Stack

```bash
# Start from trunk
gt checkout main

# Create first branch
gt create feat/auth-base -m "Add auth types"
# Make changes...
gt modify -a

# Stack second branch on top
gt create feat/auth-login -m "Add login flow"
# Make changes...
gt modify -a

# Stack third branch
gt create feat/auth-tests -m "Add auth tests"
# Make changes...
gt modify -a

# Submit entire stack
gt ss --no-edit
```

## Syncing After Trunk Updates

```bash
gt sync
# If conflicts:
#   1. Resolve files
#   2. git add <files>
#   3. gt continue
#   Repeat until done
```

## Rebasing After Review Feedback

```bash
# On branch with feedback
gt checkout feat/auth-login
# Make requested changes
gt modify -a
# Update PR (existing only)
gt submit --update-only
```

## Collaborating on Teammate's Stack

```bash
# Fetch their stack
gt get teammate-branch
# Branch is frozen by default to prevent accidental edits
# Review code, add comments in GitHub
# To make changes, unfreeze first
gt unfreeze
```

## Recovering from Mistakes

```bash
# Undo last Graphite action
gt undo

# If mid-rebase and stuck
gt abort

# If conflicts resolved, continue
gt continue
```

## Handling Merged Downstack PRs

```bash
# After downstack merges
gt sync
# Automatically cleans merged branches, restacks remaining
```

## Moving a Branch to Different Parent

```bash
# On branch you want to move
gt move
# Interactive: select new parent
# Graphite restacks upstack branches automatically
```

## Splitting a Large Branch

```bash
# On branch that's too big
gt split
# Interactive: select commits for each new branch
# Creates multiple stacked branches from one
```

## Squashing WIP Commits

```bash
# On branch with many small commits
gt squash
# Interactive: choose which commits to combine
```

## Adding Changes to Downstack Branch

```bash
# You're on feat/c, need to fix something in feat/a
# Stage the fix
git add <files>
# Modify into the downstack branch
gt modify --into feat/a
# Graphite restacks everything automatically
```

## Creating PR from Existing Git Branch

```bash
# You have a regular git branch
git checkout existing-branch
# Start tracking it with Graphite
gt track existing-branch
# Now you can use gt submit, gt log, etc.
```

## Reordering Branches in Stack

```bash
# Stack is: main -> a -> b -> c
# You want: main -> b -> a -> c
gt reorder
# Interactive: drag/drop to reorder
# Graphite handles rebasing
```
