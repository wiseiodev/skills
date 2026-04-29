#!/usr/bin/env tsx
import { execSync } from 'node:child_process';
import {
  findNeonBranch,
  getConnectionUri,
  gitBranch,
  neonctl,
  neonctlJson,
  neonParentBranch,
  neonProjectId,
  refuseIfPrimary,
  vercelEnvSync,
  writeManagedEnvFile,
} from './_lib.ts';
import { Client } from 'pg';

type CreateResult = { branch: { id: string; name: string } };

const ENV_FILE = '.env.development.local';

async function softReset(): Promise<void> {
  const branch = gitBranch();
  refuseIfPrimary(branch, 'reset');

  const existing = findNeonBranch(branch);
  if (!existing) {
    throw new Error(`No Neon branch named "${branch}". Run db:branch:create first.`);
  }

  const unpooled = getConnectionUri(branch, false);
  console.log('Dropping schema public cascade and recreating...');
  const client = new Client({ connectionString: unpooled });
  await client.connect();
  await client.query('DROP SCHEMA public CASCADE;');
  await client.query('CREATE SCHEMA public;');
  await client.query('GRANT ALL ON SCHEMA public TO public;');
  await client.end();

  console.log('Re-applying schema.ts via drizzle-kit push...');
  execSync('pnpm drizzle-kit push --force', {
    stdio: 'inherit',
    env: {
      ...process.env,
      DATABASE_URL: unpooled,
      DATABASE_URL_UNPOOLED: unpooled,
    },
  });
  console.log('Soft reset complete.');
}

function hardReset(): void {
  const branch = gitBranch();
  refuseIfPrimary(branch, 'reset');

  const existing = findNeonBranch(branch);
  if (existing) {
    console.log(`Deleting Neon branch "${branch}"...`);
    neonctl(
      `branches delete ${shellArg(branch)} --project-id ${neonProjectId()}`,
    );
  }

  const parent = neonParentBranch();
  console.log(`Recreating Neon branch "${branch}" from "${parent}"...`);
  neonctlJson<CreateResult>(
    `branches create --project-id ${neonProjectId()} --name ${shellArg(branch)} --parent ${shellArg(parent)}`,
  );

  const pooled = getConnectionUri(branch, true);
  const unpooled = getConnectionUri(branch, false);

  writeManagedEnvFile(ENV_FILE, {
    DATABASE_URL: pooled,
    DATABASE_URL_UNPOOLED: unpooled,
  });

  vercelEnvSync(branch, {
    DATABASE_URL: pooled,
    DATABASE_URL_UNPOOLED: unpooled,
  });

  console.log('Re-applying schema.ts via drizzle-kit push...');
  execSync('pnpm drizzle-kit push --force', {
    stdio: 'inherit',
    env: {
      ...process.env,
      DATABASE_URL: unpooled,
      DATABASE_URL_UNPOOLED: unpooled,
    },
  });
  console.log('Hard reset complete.');
}

function shellArg(s: string): string {
  if (/^[A-Za-z0-9_./-]+$/.test(s)) return s;
  return `'${s.replace(/'/g, `'\\''`)}'`;
}

async function main(): Promise<void> {
  const args = process.argv.slice(2);
  const hard = args.includes('--hard');
  const soft = args.includes('--soft') || args.length === 0;

  if (hard && soft && args.includes('--soft')) {
    throw new Error('Pass either --soft or --hard, not both.');
  }

  if (hard) {
    hardReset();
  } else {
    await softReset();
  }
}

main().catch((err) => {
  console.error(err.message ?? err);
  process.exit(1);
});
