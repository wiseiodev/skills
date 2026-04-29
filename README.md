# skills

Repo to store + share agent skills.

## Install

Install a skill with:

```bash
npx skills add wiseiodev/skills/<skill>
```

## Available skills

### adversarial-review

Multi-round debate review: two independent AI reviewers cross-examine each other's findings until only nitpicks remain.

```bash
npx skills add wiseiodev/skills/adversarial-review
```

### code-principles

SOLID, DRY, YAGNI, design heuristics, testing, API design, architecture, React. Reference for review, plan validation, council criteria.

```bash
npx skills add wiseiodev/skills/code-principles
```

### dispatch-cli-agent

Fan work out to external CLI agents (Claude Code, Codex, Gemini, Copilot) via background Bash. Building block for multi-agent orchestration.

```bash
npx skills add wiseiodev/skills/dispatch-cli-agent
```

### isolated-db-branches

Per-feature Neon DB branch for each git branch in a Drizzle + Vercel project. Schema changes via `db:push` (no migration files on feature branches); migrations are auto-generated and validated post-merge against a throwaway prod clone, then applied to prod with deploy gated on success.

```bash
npx skills add wiseiodev/skills/isolated-db-branches
```

### pr-comments

Triage, fix, reply to, and resolve unresolved GitHub PR review threads. Adapts gates to the repo instead of assuming a fixed toolchain.

```bash
npx skills add wiseiodev/skills/pr-comments
```

### readability

Score text with Flesch-Kincaid, Gunning Fog, SMOG, etc. Returns metrics with interpretation.

```bash
npx skills add wiseiodev/skills/readability
```

### review-council

Send a plan/spec/PRD/ADR/code to 2+ AI agents in parallel. Synthesizes feedback, auto-revises, re-reviews on high variance.

```bash
npx skills add wiseiodev/skills/review-council
```

### work

Execute one implementation slice end-to-end from a PRD+plan+phase, GitHub issue, or Linear issue. Includes intake, branch, gates, adversarial review, self-QA, commit, HTML report.

```bash
npx skills add wiseiodev/skills/work
```

### work-log

Log accomplishments, problems solved, and learnings to Obsidian daily notes via the Obsidian CLI.

```bash
npx skills add wiseiodev/skills/work-log
```

### write-engineering-lessons-article

Write a technical retrospective grounded in real artifacts (commits, PRs, ADRs, logs). Refuses to fabricate when evidence is missing.

```bash
npx skills add wiseiodev/skills/write-engineering-lessons-article
```

## License

MIT — each skill ships with its own `LICENSE.md`. Copyright Wise IO Dev (https://www.wiseio.dev).
