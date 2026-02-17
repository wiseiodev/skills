# Graphite Best Practices

## PR Organization

### One Logical Change Per PR
- Each PR should be reviewable independently
- Don't mix unrelated changes
- Good: "Add user schema", "Add user API", "Add user UI"
- Bad: "Add user feature" (all in one)

### Keep PRs Under 400 Lines
- Smaller PRs get faster reviews
- Split large features early, not after review starts
- Use `gt split` if a branch gets too big

### Stack Bottom-to-Top
- Foundation changes at bottom (types, schemas)
- Implementation in middle (logic, APIs)
- Integration at top (UI, tests)

## Review Workflow

### For Reviewers
- Start from stack bottom, work up
- Don't wait for downstack approval before reviewing upstack
- Use "View in Graphite" for full stack context
- Comments on downstack PRs affect upstack too

### For Authors
- Respond to all downstack feedback before upstack
- Use `gt modify --into <branch>` for targeted fixes
- Run `gt sync` after downstack merges

## When to Split vs Squash

### Split (`gt split`) When:
- Large PR with distinct logical chunks
- Reviewers requesting smaller PRs
- Commits could be reviewed independently

### Squash (`gt sq`) When:
- Many WIP commits ("wip", "fix typo", "oops")
- Commits that should be one atomic change
- Before submitting for review

## Branch Naming

### Consistent Prefixes
```
feat/   - New features
fix/    - Bug fixes
chore/  - Maintenance
refactor/ - Code reorganization
docs/   - Documentation only
test/   - Test additions/fixes
```

### Good Names
```
feat/user-auth-types
feat/user-auth-api
feat/user-auth-ui
fix/login-race-condition
chore/upgrade-deps
```

### Avoid
```
fix-stuff
my-branch
wip
temp
```

## Sync Strategy

### Sync Frequently
- Run `gt sync` at start of work session
- Run after any teammate merges
- Smaller conflicts are easier to resolve

### Before Big Changes
- Sync before starting new stack
- Sync before major modifications
- Clean slate prevents cascading conflicts

## Collaboration

### Sharing Work-in-Progress
- Use `gt submit --draft` for early feedback
- Teammates can `gt get <branch>` to see your work
- Frozen by default prevents accidents

### Handoffs
- Ensure stack is synced and submitted
- Teammate does `gt get <your-branch>`
- They can `gt unfreeze` to take over

## Configuration Tips

### Branch Name Prefix
```bash
gt config branch-prefix --set "$(whoami)/"
# Creates branches like: wise/feat/new-feature
```

### Default Behaviors
```bash
# Show config
gt config

# Set trunk explicitly
gt trunk --set main
```

## Common Mistakes to Avoid

| Mistake | Why Bad | Do Instead |
|---------|---------|------------|
| Editing frozen branch | Corrupts teammate's work | `gt unfreeze` first |
| Huge PRs | Slow reviews, merge conflicts | Split into stack early |
| Ignoring sync | Conflicts compound | Sync daily minimum |
| Wrong branch modify | Changes in wrong PR | `gt undo`, `gt modify --into` |
| Force push manually | Breaks Graphite tracking | Use `gt` commands only |
