<!--
Work-skill PR body template.

Mirrors the cards in templates/report.html so the PR description and the
.reports/<id>.html report carry the same content.

Replace every {{PLACEHOLDER}} before passing to `gh pr create --body-file`.
-->

## What shipped

{{WHAT_SHIPPED_BULLETS}}

## Dependencies collected

| Dependency | Value / status |
| --- | --- |
{{DEPENDENCIES_ROWS}}

## Files changed

```
{{FILES_CHANGED_STAT}}
```

## Tests added

{{TESTS_ADDED}}

## Quality gates

{{GATES_CHECKLIST}}

## Adversarial review

- Iterations: {{AR_ITERATIONS}}
- Critical / Major: {{AR_CRITICAL}} / {{AR_MAJOR}}
- Minor: {{AR_MINOR}}
- Nitpick: {{AR_NITPICK}}
- Resolved or accepted findings:
{{AR_FINDINGS_BULLETS}}

## Self-QA

{{QA_BLOCK}}

<!--
QA_BLOCK rules:

1. Browser-demoable work with .reports/<id>-qa.webm present — emit BOTH
   an inline <video> tag and a plain markdown link:

   <video src="https://raw.githubusercontent.com/<owner>/<repo>/<branch>/.reports/<id>-qa.webm" controls></video>

   [Download QA recording](.reports/<id>-qa.webm)

   <id> is the canonical artifact id. <branch> is the branch the PR is from.

2. No browser surface — link the fallback:

   See [QA fallback log](.reports/<id>-qa.md) for the per-AC verification trail.
-->

## Acceptance criteria

{{ACCEPTANCE_CHECKLIST}}

## Commits

```
{{COMMIT_LIST}}
```

## Linear

{{LINEAR_FOOTER}}

<!--
LINEAR_FOOTER rules:
- Linear mode      → "Completes <LINEAR-ID>"
- GitHub issue     → "Refs: #<work-issue>"
- Plan phase mode  → "Refs: <prd-or-plan-reference> phase <N>"
-->
