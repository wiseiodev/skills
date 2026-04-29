#!/usr/bin/env tsx
import { existsSync, mkdirSync, readdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

const DATA_DIR = 'drizzle/data';

function nextSeq(): string {
  if (!existsSync(DATA_DIR)) return '0001';
  const existing = readdirSync(DATA_DIR)
    .filter((f) => /^\d{4}_/.test(f))
    .map((f) => parseInt(f.slice(0, 4), 10))
    .sort((a, b) => a - b);
  const next = existing.length === 0 ? 1 : existing[existing.length - 1] + 1;
  return String(next).padStart(4, '0');
}

function slugify(s: string): string {
  return s
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_|_$/g, '');
}

function main(): void {
  const name = process.argv[2];
  if (!name) {
    console.error('Usage: tsx custom.ts <migration-name>');
    process.exit(1);
  }

  if (!existsSync(DATA_DIR)) mkdirSync(DATA_DIR, { recursive: true });

  const filename = `${nextSeq()}_${slugify(name)}.sql`;
  const path = join(DATA_DIR, filename);

  const stub = [
    `-- Hand-authored data migration: ${name}`,
    '-- Runs after the auto-generated schema migration in db-migrate-and-deploy workflow.',
    '-- Wrap in a transaction; idempotency is your responsibility.',
    '',
    'BEGIN;',
    '',
    '-- TODO: write your data migration here.',
    '',
    'COMMIT;',
    '',
  ].join('\n');

  writeFileSync(path, stub);
  console.log(`Created ${path}`);
}

main();
