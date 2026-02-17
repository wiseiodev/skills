---
name: gt
description: Create Graphite stacked PRs from staged git changes. Use when user says "/gt", "create a PR", "submit PR", or wants to commit and create a pull request using Graphite. Optionally accepts a Linear issue ID (e.g., "/gt A-35") to auto-close issues on merge.
---

Analyze staged changes and create a Graphite stacked PR with user confirmation.

**Usage:** `/gt` or `/gt A-35` (with optional Linear issue ID)

## 1. Analysis Phase
1. **Check for Linear Issue ID**: If user provided an issue ID argument (e.g., A-35):
   - Validate format matches `A-\d+` pattern
   - Store for use in commit message and PR description
   - Prepare "Completes [ISSUE_ID]" phrase
2. **Check Prerequisites**: Verify git staged changes exist, if not prompt user to stage changes first
3. **Analyze Staged Changes**: Use `git status`, `git diff --cached --stat`, and `git diff --cached` to understand:
   - Files modified, added, deleted
   - Lines added/removed
   - Nature of changes (features, fixes, refactoring, etc.)
4. **Review Recent Commits**: Check `git log --oneline -5` for context and commit message patterns

## 2. Suggestion Generation
Generate and present to user:

### **Suggested Branch Name:**
`[type]/[brief-kebab-case-description]`
- Use conventional prefixes: `feat/`, `fix/`, `chore/`, `refactor/`, `docs/`
- Keep under 50 characters
- Be descriptive but concise

### **Suggested Commit Message:**
Follow conventional commits format:
```
[type]([scope]): [description]

[optional body with more details]

[If Linear Issue ID provided: Completes ISSUE_ID]
```

### **Suggested PR Description:**
Format strictly using this template:

**Detailed Summary:**
[Summary of changes]

**Impact Metrics:**
- **Files Changed:** [Count]
- **Lines Added:** [Count]
- **Lines Removed:** [Count]

**Change Categories:**
- [ ] New Feature
- [ ] Bug Fix
- [ ] Refactor
- [ ] Tests
- [ ] Documentation

**Testing Instructions:**
[Instructions]

[If Issue ID provided]: Completes [ISSUE_ID]

## 3. User Confirmation
Present all suggestions clearly and ask:
```
Review the suggestions above. Would you like to:
1. Proceed with these suggestions
2. Modify any suggestions (specify which)
3. Cancel the operation
```

## 4. Execution Phase (Only after user confirms)

**IMPORTANT**: Follow these CLI commands exactly. Do not use Graphite MCP server.

1. **Create Graphite Branch & Commit**:
   ```bash
   gt create [BRANCH_NAME] -m "[COMMIT_MESSAGE]"
   ```

2. **Submit Stacked PR (without editing prompts)**:
   ```bash
   gt ss --no-edit -p
   ```

3. **Update PR Description via GitHub CLI**:
   ```bash
   gh pr edit [PR_NUMBER] --title "[PR_TITLE]" --body "[PR_DESCRIPTION]"
   ```
   Note: Escape internal double quotes and backticks in the body string.

## 5. Error Handling
- If Graphite commands fail, provide clear error messages and suggested fixes
- Handle common issues: no staged changes, Graphite not initialized, auth problems, branch name exists

## 6. Success Reporting
```
## Success Report:

✅ Graphite stacked PR created successfully!

- **Branch:** `[BRANCH_NAME]`
- **Commit:** `[COMMIT_HASH]`
- **PR #[NUMBER]:** [GITHUB_URL]
- **Graphite URL:** [GRAPHITE_URL]
[If Issue ID provided: - **Linear Issue:** [ISSUE_ID]]

**Next steps:**
- Review the PR in GitHub or Graphite
- Request reviewers if needed
- Monitor CI/CD checks
```
