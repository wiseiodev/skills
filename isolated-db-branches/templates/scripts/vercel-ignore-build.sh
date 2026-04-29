#!/usr/bin/env bash
# Vercel Ignored Build Step.
# Skips production deploys triggered by Vercel git integration.
# Production deploys are owned by the GitHub Actions migration workflow.
# Preview deploys (PR branches) proceed normally.
#
# Configure in Vercel Project Settings → Git → Ignored Build Step:
#   bash scripts/db/vercel-ignore-build.sh

set -euo pipefail

if [ "${VERCEL_GIT_COMMIT_REF:-}" = "main" ] && [ "${VERCEL_ENV:-}" = "production" ]; then
  echo "Skipping Vercel auto-build for main; deploys flow through GitHub Actions."
  exit 0
fi

# Build proceeds for everything else (preview deploys, manual triggers)
exit 1
