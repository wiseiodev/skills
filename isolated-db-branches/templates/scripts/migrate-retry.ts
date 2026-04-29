#!/usr/bin/env tsx
import { execSync } from 'node:child_process';

const OWNER_REPO = execSync(
  'gh repo view --json nameWithOwner --jq .nameWithOwner',
  { encoding: 'utf8' },
).trim();

const WORKFLOW = 'db-migrate-and-deploy.yml';

console.log(`Re-dispatching ${WORKFLOW} on main branch of ${OWNER_REPO}...`);

execSync(
  `gh workflow run ${WORKFLOW} --ref main --field retry=true`,
  { stdio: 'inherit' },
);

console.log('\nDispatched. Watch progress:');
console.log(`  gh run watch --exit-status`);
console.log(`  gh run list --workflow=${WORKFLOW} --limit 5`);
