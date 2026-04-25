# Self-QA fallback — {{WORK_ID}}

> This work item has no demoable browser surface, so a Playwright video walkthrough is not possible.
> This document replaces the recording and describes what was verified instead.

## Why no video

{{WHY_NO_VIDEO}}

<!-- Example reasons:
- Pure infrastructure slice (DB migration only; no HTTP surface)
- Background worker / cron that is not invoked via UI
- Webhook handler verified via curl + logs
-->

## What was verified

{{WHAT_VERIFIED}}

<!-- For each acceptance criterion, describe HOW it was verified.
Prefer terminal commands + asserted outputs over prose. Example:

- [x] `items.blob_url` populated after onUploadCompleted webhook
  - Verified by: `curl -X POST http://localhost:3000/api/blob/completed -d @fixtures/completed.json`
  - Output: DB row updated, confirmed via `pnpm db:studio` snapshot at /tmp/qa-item-check.png

- [x] Webhook rejects unsigned requests
  - Verified by: same curl with tampered signature → 401 response captured in fixtures/unsigned-reject.txt
-->

## Evidence

<!-- Attach any screenshots, log excerpts, DB snapshots, or curl transcripts.
Keep paths relative to .reports/ so they travel with the HTML report. -->

{{EVIDENCE_LINKS}}

## Follow-up flag

{{FOLLOWUP_FLAG}}

<!-- If the fallback feels thin or if a future UI surface would make this demoable,
flag it here so the human reviewer can judge whether the fallback is acceptable
or whether this slice needs a manual QA pass from them. -->
