#!/usr/bin/env tsx
import { gitBranch, neonParentBranch } from './_lib.ts';

const branch = gitBranch();
const parent = neonParentBranch();

if (branch !== parent) {
  console.error(
    [
      `Refusing to run \`db:generate\` on feature branch "${branch}".`,
      '',
      'Migrations are auto-generated post-merge by the db-validate-and-prepare workflow.',
      'During feature work, evolve the schema with:',
      '  pnpm db:push           # apply schema.ts to your Neon branch',
      '',
      'For hand-authored data migrations:',
      '  pnpm db:custom <name>  # scaffolds drizzle/data/<seq>_<name>.sql',
      '',
      `If you really need to generate locally on "${parent}", use db:generate:ci.`,
    ].join('\n'),
  );
  process.exit(1);
}
