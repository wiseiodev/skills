#!/usr/bin/env tsx
import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { Client } from 'pg';

const DATA_DIR = 'drizzle/data';

async function main(): Promise<void> {
  // Next.js projects: load env via @next/env (matches drizzle-kit's behavior).
  // Non-Next projects: rely on env already being set by the caller (or use dotenv).
  try {
    const { loadEnvConfig } = await import('@next/env');
    loadEnvConfig(process.cwd());
  } catch {
    // not a Next.js project
  }

  if (!existsSync(DATA_DIR)) {
    console.log('No drizzle/data directory; nothing to apply.');
    return;
  }

  const files = readdirSync(DATA_DIR)
    .filter((f) => /\.sql$/.test(f))
    .sort();

  if (files.length === 0) {
    console.log('No data migration files.');
    return;
  }

  const url = process.env.DATABASE_URL_UNPOOLED || process.env.DATABASE_URL;
  if (!url) {
    throw new Error('DATABASE_URL_UNPOOLED or DATABASE_URL must be set.');
  }

  const client = new Client({ connectionString: url });
  await client.connect();
  try {
    for (const f of files) {
      console.log(`Applying ${f}`);
      const sql = readFileSync(join(DATA_DIR, f), 'utf8');
      await client.query(sql);
    }
  } finally {
    await client.end();
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
