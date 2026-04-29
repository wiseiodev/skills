#!/usr/bin/env tsx
import { execSync } from 'node:child_process';
import { existsSync, readFileSync } from 'node:fs';
import { findNeonBranch, gitBranch, neonParentBranch } from './_lib.ts';

type Check = { name: string; ok: boolean; detail?: string };

function tryExec(cmd: string): string | undefined {
  try {
    return execSync(cmd, { encoding: 'utf8', stdio: ['pipe', 'pipe', 'pipe'] }).trim();
  } catch {
    return undefined;
  }
}

const checks: Check[] = [];

const ghVersion = tryExec('gh --version');
checks.push({ name: 'gh CLI installed', ok: !!ghVersion, detail: ghVersion?.split('\n')[0] });

const ghAuth = tryExec('gh auth status 2>&1');
checks.push({
  name: 'gh authenticated',
  ok: !!ghAuth && !ghAuth.includes('not logged in'),
});

const vercelVersion = tryExec('vercel --version');
checks.push({
  name: 'vercel CLI installed',
  ok: !!vercelVersion,
  detail: vercelVersion,
});

const vercelWho = tryExec('vercel whoami');
checks.push({ name: 'vercel authenticated', ok: !!vercelWho, detail: vercelWho });

const neonctlVersion = tryExec('neonctl --version');
checks.push({
  name: 'neonctl CLI installed',
  ok: !!neonctlVersion,
  detail: neonctlVersion,
});

const neonWho = tryExec('neonctl me --output json');
checks.push({
  name: 'neonctl authenticated',
  ok: !!neonWho,
});

checks.push({
  name: 'NEON_PROJECT_ID set',
  ok: !!process.env.NEON_PROJECT_ID,
  detail: process.env.NEON_PROJECT_ID,
});

checks.push({
  name: 'NEON_PARENT_BRANCH set or default',
  ok: true,
  detail: neonParentBranch(),
});

const branch = gitBranch();
checks.push({
  name: 'on a git branch',
  ok: branch !== 'HEAD',
  detail: branch,
});

if (branch !== neonParentBranch()) {
  try {
    const neonBranch = findNeonBranch(branch);
    checks.push({
      name: `Neon branch exists for "${branch}"`,
      ok: !!neonBranch,
      detail: neonBranch?.id,
    });
  } catch (e) {
    checks.push({
      name: `Neon branch lookup for "${branch}"`,
      ok: false,
      detail: (e as Error).message,
    });
  }
}

if (existsSync('.env.development.local')) {
  const text = readFileSync('.env.development.local', 'utf8');
  checks.push({
    name: '.env.development.local has DATABASE_URL',
    ok: /\bDATABASE_URL=/.test(text),
  });
} else {
  checks.push({
    name: '.env.development.local exists',
    ok: false,
    detail: 'run pnpm db:branch:create',
  });
}

const requiredScripts = [
  'scripts/db/branch.ts',
  'scripts/db/reset.ts',
  'scripts/db/guard-generate.ts',
  'scripts/db/doctor.ts',
];
for (const path of requiredScripts) {
  checks.push({ name: `${path} present`, ok: existsSync(path) });
}

const requiredWorkflows = [
  '.github/workflows/db-validate-and-prepare.yml',
  '.github/workflows/db-migrate-and-deploy.yml',
  '.github/workflows/code-only-deploy.yml',
  '.github/workflows/cleanup-neon-branch.yml',
  '.github/workflows/pr-no-migrations.yml',
];
for (const path of requiredWorkflows) {
  checks.push({ name: `${path} present`, ok: existsSync(path) });
}

let failed = 0;
for (const c of checks) {
  const mark = c.ok ? 'OK ' : 'FAIL';
  const line = `[${mark}] ${c.name}${c.detail ? ` — ${c.detail}` : ''}`;
  console.log(line);
  if (!c.ok) failed++;
}

if (failed > 0) {
  console.error(`\n${failed} check(s) failed.`);
  process.exit(1);
}
console.log('\nAll checks passed.');
