import { execSync } from 'node:child_process';
import { existsSync, readFileSync, writeFileSync } from 'node:fs';

const MANAGED_MARKER = '# managed-by isolated-db-branches';

export function gitBranch(): string {
  return execSync('git rev-parse --abbrev-ref HEAD', {
    encoding: 'utf8',
  }).trim();
}

export function neonProjectId(): string {
  const id = process.env.NEON_PROJECT_ID;
  if (!id) throw new Error('NEON_PROJECT_ID not set in env');
  return id;
}

export function neonParentBranch(): string {
  return process.env.NEON_PARENT_BRANCH || 'main';
}

export function neonctl(args: string): string {
  return execSync(`neonctl ${args}`, { encoding: 'utf8' });
}

export function neonctlJson<T = unknown>(args: string): T {
  return JSON.parse(neonctl(`${args} --output json`));
}

export type NeonBranch = {
  id: string;
  name: string;
  primary?: boolean;
  created_at: string;
};

export function listNeonBranches(): NeonBranch[] {
  return neonctlJson<NeonBranch[]>(
    `branches list --project-id ${neonProjectId()}`,
  );
}

export function findNeonBranch(name: string): NeonBranch | undefined {
  return listNeonBranches().find((b) => b.name === name);
}

export function getConnectionUri(branchName: string, pooled: boolean): string {
  const flags = pooled ? '--pooled' : '';
  return neonctl(
    `connection-string ${shellQuote(branchName)} --project-id ${neonProjectId()} ${flags}`,
  ).trim();
}

export function refuseIfPrimary(branchName: string, action: string): void {
  if (branchName === neonParentBranch()) {
    throw new Error(
      `Refusing to ${action} the primary Neon branch "${branchName}".`,
    );
  }
}

export function writeManagedEnvFile(
  path: string,
  vars: Record<string, string>,
): void {
  let content = existsSync(path) ? readFileSync(path, 'utf8') : '';

  const pattern = new RegExp(
    `\\n?${escapeRegex(MANAGED_MARKER)}[\\s\\S]*?${escapeRegex(MANAGED_MARKER)}\\n?`,
    'g',
  );
  content = content.replace(pattern, '');

  const block = [
    MANAGED_MARKER,
    ...Object.entries(vars).map(([k, v]) => `${k}=${quoteEnvValue(v)}`),
    MANAGED_MARKER,
  ].join('\n');

  const out = content.trimEnd();
  writeFileSync(path, (out ? `${out}\n\n` : '') + block + '\n');
}

function quoteEnvValue(v: string): string {
  if (/^[A-Za-z0-9_./:@?&=,+\-]*$/.test(v)) return v;
  return JSON.stringify(v);
}

function escapeRegex(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

export function vercelEnvSync(
  gitBranchName: string,
  vars: Record<string, string>,
): void {
  if (!process.env.VERCEL_TOKEN) {
    console.warn(
      'VERCEL_TOKEN not set; skipping Vercel preview env sync. Run with VERCEL_TOKEN to wire previews.',
    );
    return;
  }
  const quotedBranch = shellQuote(gitBranchName);
  const quotedToken = shellQuote(process.env.VERCEL_TOKEN);
  for (const [name, value] of Object.entries(vars)) {
    try {
      execSync(
        `vercel env rm ${name} preview ${quotedBranch} --yes --token=${quotedToken}`,
        { stdio: 'pipe' },
      );
    } catch {
      // not present; fine
    }
    execSync(
      `printf %s ${shellQuote(value)} | vercel env add ${name} preview ${quotedBranch} --token=${quotedToken}`,
      { stdio: 'inherit', shell: '/bin/sh' },
    );
  }
}

export function vercelEnvRemove(gitBranchName: string, names: string[]): void {
  if (!process.env.VERCEL_TOKEN) return;
  const quotedBranch = shellQuote(gitBranchName);
  const quotedToken = shellQuote(process.env.VERCEL_TOKEN);
  for (const name of names) {
    try {
      execSync(
        `vercel env rm ${name} preview ${quotedBranch} --yes --token=${quotedToken}`,
        { stdio: 'pipe' },
      );
    } catch {
      // already gone
    }
  }
}

export function shellQuote(s: string): string {
  return `'${s.replace(/'/g, `'\\''`)}'`;
}

export function listGitHubBranches(): string[] {
  const repo = execSync('gh repo view --json nameWithOwner --jq .nameWithOwner', {
    encoding: 'utf8',
  }).trim();
  const out = execSync(
    `gh api repos/${repo}/branches --paginate --jq '.[].name'`,
    { encoding: 'utf8' },
  );
  return out.trim().split('\n').filter(Boolean);
}
