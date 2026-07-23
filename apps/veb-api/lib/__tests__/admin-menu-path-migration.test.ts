import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

const migrationSql = readFileSync(
  fileURLToPath(
    new URL(
      '../../prisma/migrations/20260723000000_admin_menu_paths/migration.sql',
      import.meta.url,
    ),
  ),
  'utf8',
);

describe('admin menu path migration', () => {
  it('validates projected paths before the first mutation', () => {
    const preflightIndex = migrationSql.indexOf('DO $$');
    const firstUpdateIndex = migrationSql.indexOf('UPDATE "Menu"');
    const exceptionIndex = migrationSql.indexOf('RAISE EXCEPTION');

    expect(preflightIndex).toBeGreaterThan(-1);
    expect(exceptionIndex).toBeGreaterThan(preflightIndex);
    expect(exceptionIndex).toBeLessThan(firstUpdateIndex);
    expect(migrationSql.match(/RAISE EXCEPTION/g)).toHaveLength(1);
  });

  it('projects every write transformation during preflight', () => {
    const preflight = migrationSql.slice(
      migrationSql.indexOf('DO $$'),
      migrationSql.indexOf('UPDATE "Menu"'),
    );

    expect(preflight).toContain(
      `WHEN "type" = 'LINK' AND "path" ~* '^https?://'`,
    );
    expect(preflight).toContain(`THEN '/admin/link/' || "id"`);
    expect(preflight).toContain(`WHEN "path" LIKE '/%'`);
    expect(preflight).toContain(`THEN '/admin' || "path"`);
    expect(preflight).toContain(`ELSE '/admin/' || "path"`);
    expect(preflight).toContain('REGEXP_REPLACE(');

    for (const unsafeSyntax of [
      "'?'",
      "'#'",
      "'%'",
      'CHR(92)',
      '.{1,2}',
      '[[:space:]]',
    ]) {
      expect(preflight).toContain(unsafeSyntax);
    }
  });

  it('uses explicit PostgreSQL transaction and locking boundaries', () => {
    const beginIndex = migrationSql.indexOf('BEGIN;');
    const lockIndex = migrationSql.indexOf('LOCK TABLE "Menu"');
    const preflightIndex = migrationSql.indexOf('DO $$');
    const lastUpdateIndex = migrationSql.lastIndexOf('UPDATE "Menu"');
    const commitIndex = migrationSql.lastIndexOf('COMMIT;');

    for (const boundaryIndex of [
      beginIndex,
      lockIndex,
      preflightIndex,
      lastUpdateIndex,
      commitIndex,
    ]) {
      expect(boundaryIndex).toBeGreaterThan(-1);
    }
    expect(beginIndex).toBeLessThan(lockIndex);
    expect(lockIndex).toBeLessThan(preflightIndex);
    expect(commitIndex).toBeGreaterThan(lastUpdateIndex);
    expect(migrationSql.match(/\bBEGIN;/g)).toHaveLength(1);
    expect(migrationSql.match(/\bCOMMIT;/g)).toHaveLength(1);
    expect(migrationSql.trimEnd().endsWith('COMMIT;')).toBe(true);
  });
});
