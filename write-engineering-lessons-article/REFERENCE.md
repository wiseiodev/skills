# Reference

## Goal

Produce a retrospective article that explains a real failure and the real path to a working system. The article should feel credible to a skeptical engineer who reads it cold — without access to the original issue, PR, or chat logs.

The output has three published parts plus an internal note:

1. Executive summary
2. Main article
3. Appendix of verbatim code excerpts
4. Evidence and omissions note (for the user, not for publication)

## Evidence discipline

### Minimum viable evidence

Every stage in the article must be backed by at least two of:

- a git commit or PR with the relevant diff
- an ADR or design note written at the time
- a failing input, trace, log line, metric, or dashboard
- a test or eval that demonstrated the problem or the fix
- a dated chat log or user report
- a file the user explicitly identifies as belonging to that stage

A stage with fewer than two artifacts must be omitted. If fewer than two stages survive, stop and tell the user the repo lacks the evidence for a retrospective; offer a shorter explainer instead.

### No invented content

- Do not describe evaluations that did not run.
- Do not describe attempted fixes that are not in the git history or the user's notes.
- Do not paraphrase code from memory.
- Do not reconstruct a failure the user has not pointed at.

If you are tempted to write "the team then tried X", first find the commit, PR, or chat log where X was tried. If you cannot, remove the sentence.

### Per-claim source mapping

Before delivery, walk the main article sentence by sentence. Every non-trivial technical claim must map to one of:

- an appendix snippet, by id
- a named file path
- a named test or eval
- a named PR, commit sha, or issue
- a direct quote from the user

Claims with no source are removed or softened to qualified language. The mechanical form of this check lives in **Delivery gate**.

## Deliverables

### Executive summary — 120–220 words

Four moves, in order:

1. Name the failure in plain language.
2. State why the first-order diagnosis was incomplete.
3. Name the change or combination that actually held.
4. State the operational rule the team now follows, referencing a specific file, check, or runbook.

The summary is a briefing for a technical leader, not an abstract for a paper. Write it *after* the main body — it is a distillation, not a thesis.

### Main article — 900–1500 words (hard upper bound 1700)

Body covers:

1. The concrete failure that kept happening
2. Why the first-order diagnosis was wrong or incomplete
3. The attempts that did not work, and what each one ruled in or out
4. How the fix was validated
5. The change or combination that actually held
6. The generalizable rule other teams can reuse

Per-section soft cap: 100–300 words. Report the final word count on delivery.

### Appendix

Verbatim excerpts that tell the same story as the article at the code level. Each entry has:

- a short title
- a stage label
- a file attribution in the form `file: <relative/path>:<start>-<end>`
- for historical stages, `revision: <git_sha>`
- a byte-for-byte excerpt
- a 1–3 sentence explanation

Minimum two entries. Include only stages backed by real artifacts.

### Evidence and omissions note

Delivered alongside the article, not for publication. Contents:

- the artifacts cited (files, shas, PRs, tests, logs)
- any stage the user mentioned that was dropped, and why
- any claim you softened or removed for lack of evidence
- any substitution or collision the sanitization pass flagged

## Domain-neutral article skeleton

Use this skeleton unless the user asks for a different shape. It works for any incident class — races, leaks, migrations, latency regressions, build or CI failures, data quality, retrieval, authz, integrations.

### 1. Open with the concrete failure

One sentence. A specific system, a specific behavior, a specific audience who saw it. No hook, no industry framing, no "in this post".

Illustrative openings across domains:

- "Every deploy at 04:00 UTC tripled p99 latency for twenty minutes, then recovered on its own."
- "The migration that added a NOT NULL column to `accounts` passed in staging and wedged production at 40% rollout."
- "Our payments webhook handler occasionally double-charged cards when the upstream retried a timed-out request."
- "A product assistant kept giving wrong setup instructions even though the correct page already existed in the docs."

These are illustrations. Do not reuse them verbatim. Do not reuse more than five consecutive words from them.

### 2. Explain why the first-order diagnosis was incomplete

Stubborn failures survive because the first explanation is too shallow. Say, in specific terms, what the team initially thought was wrong and why that explanation did not account for the evidence.

### 3. Walk through the attempts in the order they happened

For each attempt: what changed, what improved, what still failed. Be specific about what the step ruled in or ruled out. This is where the article earns its honesty — do not skip to the unlock.

### 4. Describe how the fix was validated

Name the actual verification mechanism. If there was a test or eval, name the file. If there was a dashboard or metric, name it. If validation was manual spot-check or customer feedback, say so plainly. Do not invent an eval harness the team did not run.

### 5. Name the change that actually held

One clear sentence. Often it is a combination, not a single line. Say that.

### 6. State the generalizable rule

One or two sentences. The rule must be concrete enough that another team could apply it to their own system. A rule that would survive being copy-pasted into an unrelated retrospective is too generic — rewrite it.

## Optional lenses

Some incident classes have recurring patterns worth naming explicitly. Load the relevant lens **only if** the gathered evidence involves that domain. Do not introduce a lens's vocabulary into an article whose evidence does not use it.

Available lenses:

- [lenses/retrieval.md](lenses/retrieval.md) — RAG, doc-search, ranking, grounding, answerer behavior

When in doubt, skip the lens. The domain-neutral skeleton is the default.

## Appendix rules

### Verbatim excerpts only

Every snippet must be a literal substring of a real file at a real revision. Before including a snippet:

- read the file at that revision and confirm the bytes match
- record `file: <path>:<start>-<end>`
- record `revision: <sha>` for historical stages

Trimming is allowed only by deleting whole lines, and only with an inline marker:

```
// ... (N lines omitted)
```

Renaming variables, simplifying types, removing error handling, or rewriting for clarity is FORBIDDEN. A "cleaned-up" snippet is a fake snippet. If a real snippet is too long or too noisy, pick a different one or split it into two.

### What not to do

- Do not paste an entire file when twenty lines carry the point.
- Do not include a code block with no explanation.
- Do not show only the final code without the earlier stages.
- Do not paraphrase code. Ever.

### Stage selection

The appendix has between two and six entries. Include only stages whose artifacts survive the evidence discipline. Do not pad.

## Style checks (mechanical)

Voice is enforced by rules you can grep for, not by aesthetic judgments.

### Forbidden phrases

Grep the draft case-insensitively for each phrase. Any non-zero count must be rewritten. Report the full grep result on delivery.

- `in this post`
- `today I want`
- `have you ever`
- `picture this`
- `as engineers`
- `in the world of`
- `journey`
- `deep dive`
- `under the hood`
- `unlock` (as a noun)
- `game-changer`, `game changer`
- `leverage` (as a verb)
- `at the end of the day`
- `key takeaways`
- `learnings`
- `turns out`
- `little did we know`
- `we were stuck`
- `spoiler`
- `the lesson is`
- `the takeaway`
- `ultimately`
- `remember` (as an imperative to the reader)
- `imagine` at the start of a sentence

### Structural rules

- First sentence of the article: 8–25 words, contains a noun naming the system or behavior that broke, no metaphor, no second-person address.
- No section begins with a rhetorical question.
- No sentence exceeds 35 words.
- No more than one em-dash per 200 words of body.
- Prose-to-bullet ratio in the body: at least 4:1 (count body sentences vs bullet lines).
- Closing sentence names a specific file, function, check, or runbook. It must not begin with "The lesson", "The takeaway", "Ultimately", or any imperative directed at the reader.

### Vocabulary rule

Use the team's existing vocabulary. Read the repo's ADRs, PR descriptions, and comments to pick up the real words. Do not introduce a term (for example: grounding, retrieval, ranking, abstention, contract) unless it already appears in the gathered evidence.

### Plainspoken, not dramatized

Show that several attempts did not work before the final fix. Let the sequence speak for itself. Do not dramatize the stuckness.

Dramatized: "It was a nightmare. Nothing worked. We were about to give up when..."
Plainspoken: "Three attempts did not move the failure rate. The fourth did."

Dramatized: "The bug that nearly killed our launch."
Plainspoken: "A ranking bug that blocked a launch for two days."

## Sanitization

### No real names in this file

This file must never contain real entity names. Mappings are supplied per-run by the user in the form:

```
<real_1> -> <pseudo_1>
<real_2> -> <pseudo_2>
```

If this file ever contains a real name, it becomes the deanonymization key. Remove it.

### Replacement rules

- **Whole-word, case-sensitive matching only.** Use regex `\b<term>\b` for prose. For code identifiers, match on token boundaries, not substring.
- **Longest-first ordering.** Multi-word terms ("Acme Robotics") apply before single-word terms ("Acme").
- **Never rewrite substrings inside other words.** A short lowercase token must not touch word-internal matches, filesystem paths, or identifiers that happen to contain it.
- **Operate on a copy.** Diff the result against the original and list every line that changed.
- **Collision check.** Grep the result for unintended combinations (original token remnants, awkward joins where a replacement clearly fired mid-word). If any hit, revert and ask the user for a more specific mapping.

### Other things to sanitize

Scan the draft and all snippets for:

- URLs matching `*.corp`, `*.internal`, `*.local`, `vpn.*`, or any internal-domain list the user supplies
- npm scopes matching `@<org>/*`
- ticket prefixes matching `[A-Z]{2,10}-\d+`
- Slack channel references matching `#[a-z0-9-]+`
- email addresses on non-public domains
- any user-supplied entity name

List every hit and either replace via the mapping or flag for the user to decide. Do not auto-replace these — ask.

### Order of passes

The order is fixed and must not be violated:

1. Draft body, summary, appendix
2. Style pass against the mechanical rules
3. Sanitization pass
4. Sanitization re-check: grep the output for every original token. If any reappears, repeat sanitization.

Do not edit the prose between the re-check and delivery. If a sentence breaks during sanitization, fix it and run the re-check again.

## Delivery gate

Before delivering, produce an evidence table and run the mechanical checks. Any failed check blocks delivery.

### Evidence table

For every material claim in the main article, one row:

| Claim | Evidence type | File / sha / test | Verified? |
| ----- | ------------- | ----------------- | --------- |
| ...   | ...           | ...               | yes / no  |

Any row with `no` or empty evidence must be fixed — either by finding evidence, softening the claim, or removing it. The table is for internal use; it is not part of the article.

List every proper noun, percentage, number, and named tool in the article. Each one must appear in the evidence table with a real source.

### Mechanical checks (report each, yes/no + number)

- [ ] Main body word count is in [900, 1500]. **Report the number.**
- [ ] Main body word count is ≤ 1700 (hard upper bound).
- [ ] Executive summary word count is in [120, 220].
- [ ] Appendix has ≥ 2 entries, each with `file: path:L-L` attribution.
- [ ] Every appendix snippet has been read from the file and matches byte-for-byte.
- [ ] Forbidden phrase grep: each phrase returns zero matches. **Report the full list.**
- [ ] First sentence passes the structural rule (8–25 words, names the system, no metaphor, no second-person).
- [ ] No section begins with a rhetorical question.
- [ ] No sentence exceeds 35 words.
- [ ] Em-dash count ≤ (body word count / 200).
- [ ] Prose-to-bullet ratio in body ≥ 4:1.
- [ ] Every proper noun, percentage, number, and named tool is traceable to a row in the evidence table.
- [ ] Sanitization diff shows only intended spans changed.
- [ ] Sanitization re-check: zero matches for any original token.
- [ ] Closing sentence names a specific file, function, check, or runbook.
- [ ] Evidence and omissions note is attached.

If any check fails, fix it and rerun. Do not deliver a partial pass.

## Title guidance

If the user wants a title, it should be concrete and descriptive, not a tagline.

- Good: "Why our payments assistant kept inventing setup steps that already existed"
- Good: "A NOT NULL migration that passed staging and wedged production at 40% rollout"
- Bad: "The Hidden Cost of Bad Grounding"
- Bad: "Lessons From the Trenches: What a Webhook Bug Taught Us About Idempotency"

Subtitle, if any, names the unlock in one line. No colons for drama.

## Quality checklist

The checklist restates the delivery gate in a human-readable form. It is a final review, not a substitute for the gate.

- Article names the repeated failure concretely in the first sentence
- Distinguishes partial fixes from the final fix
- Identifies the real unlock, not a list of improvements
- Every technical claim maps to a cited artifact
- Appendix is verbatim; no paraphrased code
- Word counts are within the specified ranges
- Forbidden-phrase grep returned zero matches
- Sanitization mapping was applied correctly and the re-check passed
- The evidence and omissions note is attached

If the article feels polished but not grounded, it is not done. If it feels grounded but thin, expand the evidence — do not pad the prose.
