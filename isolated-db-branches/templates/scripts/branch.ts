#!/usr/bin/env tsx
import {
  findNeonBranch,
  getConnectionUri,
  gitBranch,
  gitBranchExists,
  listGitHubBranches,
  listNeonBranches,
  neonctl,
  neonctlJson,
  neonParentBranch,
  neonProjectId,
  refuseIfPrimary,
  vercelEnvRemove,
  vercelEnvSync,
  writeManagedEnvFile,
} from './_lib.ts';

type BranchCreateResult = {
  branch: { id: string; name: string };
  connection_uris: Array<{ connection_uri: string }>;
};

const ENV_FILE = '.env.development.local';
const VERCEL_VARS = ['DATABASE_URL', 'DATABASE_URL_UNPOOLED'] as const;

function create(): void {
  const branch = gitBranch();
  refuseIfPrimary(branch, 'create');

  const existing = findNeonBranch(branch);
  if (existing) {
    console.log(`Reusing existing Neon branch "${branch}" (${existing.id})`);
  } else {
    const parent = neonParentBranch();
    console.log(`Creating Neon branch "${branch}" from "${parent}"...`);
    neonctlJson<BranchCreateResult>(
      `branches create --project-id ${neonProjectId()} --name ${shellArg(branch)} --parent ${shellArg(parent)}`,
    );
  }

  const pooled = getConnectionUri(branch, true);
  const unpooled = getConnectionUri(branch, false);

  writeManagedEnvFile(ENV_FILE, {
    DATABASE_URL: pooled,
    DATABASE_URL_UNPOOLED: unpooled,
  });
  console.log(`Wrote ${ENV_FILE}`);

  vercelEnvSync(branch, {
    DATABASE_URL: pooled,
    DATABASE_URL_UNPOOLED: unpooled,
  });
}

function deleteBranch(): void {
  const branch = gitBranch();
  refuseIfPrimary(branch, 'delete');

  const existing = findNeonBranch(branch);
  if (!existing) {
    console.log(`No Neon branch named "${branch}" — nothing to delete.`);
  } else {
    neonctl(
      `branches delete ${shellArg(branch)} --project-id ${neonProjectId()}`,
    );
    console.log(`Deleted Neon branch "${branch}"`);
  }

  vercelEnvRemove(branch, [...VERCEL_VARS]);
}

function list(): void {
  const branches = listNeonBranches();
  for (const b of branches) {
    const tag = b.primary ? ' (primary)' : '';
    console.log(`${b.name}${tag}\t${b.id}\t${b.created_at}`);
  }
}

function prune(args: string[]): void {
  const apply = args.includes('--yes');
  const ghBranches = new Set(listGitHubBranches());
  const neon = listNeonBranches();
  const parent = neonParentBranch();

  const orphans = neon.filter(
    (b) => !b.primary && b.name !== parent && !ghBranches.has(b.name),
  );

  if (orphans.length === 0) {
    console.log('No orphan Neon branches found.');
    return;
  }

  console.log(`Found ${orphans.length} orphan Neon branch(es):`);
  for (const b of orphans) {
    console.log(`  ${b.name} (${b.id}, ${b.created_at})`);
  }

  if (!apply) {
    console.log('\nDry run. Pass --yes to delete.');
    return;
  }

  for (const b of orphans) {
    neonctl(
      `branches delete ${shellArg(b.name)} --project-id ${neonProjectId()}`,
    );
    vercelEnvRemove(b.name, [...VERCEL_VARS]);
    console.log(`Deleted ${b.name}`);
  }
}

function shellArg(s: string): string {
  if (/^[A-Za-z0-9_./-]+$/.test(s)) return s;
  return `'${s.replace(/'/g, `'\\''`)}'`;
}

function usage(): never {
  console.error('Usage: tsx branch.ts <create|delete|list|prune> [--yes]');
  process.exit(1);
}

function main(): void {
  const [, , cmd, ...rest] = process.argv;
  switch (cmd) {
    case 'create':
      create();
      break;
    case 'delete':
      deleteBranch();
      break;
    case 'list':
      list();
      break;
    case 'prune':
      prune(rest);
      break;
    default:
      usage();
  }
}

main();
