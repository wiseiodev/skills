---
name: write-engineering-lessons-article
description: Write a technical retrospective grounded in artifacts the user can verify — commits, PRs, ADRs, tests, logs. Use only when the user has a specific past incident with concrete evidence to cite. Refuses to fabricate stages when evidence is missing. Triggers on "engineering retrospective", "lessons-learned article", "technical postmortem write-up", or "blog post about a bug, incident, or fix".
---

# Write Engineering Lessons Article

## What this skill is for

Turn a real engineering incident into a publishable article that a skeptical engineer would find credible reading it cold. The output is an executive summary, a main body of 900–1500 words, and an appendix of verbatim code excerpts with file-path and revision attribution.

This skill does not run on a generic topic. It runs on a specific past incident the user can point at.

## Minimum viable evidence

Before drafting anything, confirm you have all three of:

1. A concrete failing input, trace, metric, or reproduction
2. The commit, PR, or diff that changed behavior to fix it
3. Evidence the fix held — a test, an eval run, a log, a dashboard, or explicit user confirmation

If any is missing, stop and ask the user for it. Do not infer stages from vibes. Do not reconstruct a failure that is not evidenced.

## Deliverables

1. **Executive summary** — 120–220 words
2. **Main article** — 900–1500 words, not counting summary or appendix
3. **Appendix** — verbatim code excerpts, each with `file: path:L-L` attribution and (for historical stages) a git sha
4. **Evidence and omissions note** — a short internal note for the user, not for publication, listing what was cited, what was dropped, and any claim you softened

Optional: title and subtitle. See REFERENCE.md > Title guidance.

## Workflow

1. **Gather evidence.** Read the repo, ADRs, tests, PRs, commits, logs, and user messages. Build a working timeline.
2. **Report what you found and what is missing.** Tell the user which stages you can back with ≥2 artifacts and which you cannot. Wait for confirmation before drafting.
3. **Reconstruct the timeline** from the evidence only. Each stage must cite real artifacts.
4. **Draft the main body** section by section from the timeline. Do not write the summary yet.
5. **Identify the real unlock** once the body is written. Often a combination, not a single line.
6. **Draft the executive summary as a distillation** of the body. If summary and body disagree, the body wins — rewrite the summary.
7. **Build the appendix** from verbatim excerpts. Every snippet is byte-for-byte from a real file at a real revision. Paraphrase is forbidden.
8. **Style pass.** Check the draft against the mechanical rules in REFERENCE.md > Style checks.
9. **Sanitization pass.** Apply the user-supplied replacement mapping using the rules in REFERENCE.md > Sanitization.
10. **Sanitization re-check.** Grep the output for every original token. If any reappears, redo sanitization. Do not touch the prose again after this step.
11. **Run the delivery gate** from REFERENCE.md > Delivery gate. Any failed check blocks delivery.
12. **Deliver** the article, the evidence-and-omissions note, and the word count of the main body.

## Rules

- Open with the concrete failure, not a hook.
- Prose over bullets in the body unless a list is strictly clearer.
- Distinguish partial fixes from the final fix. Do not flatten the story.
- Every non-trivial technical claim in the body must be traceable to a named artifact.
- Every appendix snippet is a verbatim excerpt. No paraphrase.
- Do not introduce vocabulary (retrieval, grounding, ranking, embeddings, contract, abstention, etc.) unless it already appears in the gathered evidence.
- If evidence is insufficient for a stage, omit the stage. If fewer than two stages survive, stop and tell the user the repo lacks the evidence for a retrospective.

## References

- [REFERENCE.md](REFERENCE.md) — evidence discipline, domain-neutral article skeleton, appendix rules, mechanical style checks, sanitization rules, and the delivery gate
- [lenses/retrieval.md](lenses/retrieval.md) — optional pattern deck for RAG / doc-search / grounding incidents. Load only if the gathered evidence explicitly involves retrieval, search, embeddings, ranking, or grounding.
