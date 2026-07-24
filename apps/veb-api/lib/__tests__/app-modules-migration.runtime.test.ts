import { spawnSync } from 'node:child_process';
import { randomUUID } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

const apiRoot = fileURLToPath(new URL('../..', import.meta.url));
const migrationTestDatabaseUrl =
  process.env.MIGRATION_TEST_DATABASE_URL?.trim();
const psqlAvailable =
  Boolean(migrationTestDatabaseUrl) &&
  spawnSync('psql', ['--version'], { stdio: 'ignore' }).status === 0;
const runtimeAvailable = Boolean(migrationTestDatabaseUrl) && psqlAvailable;

const migrationFiles = [
  '../../prisma/migrations/20260526000000_init/migration.sql',
  '../../prisma/migrations/20260712000000_content_articles/migration.sql',
  '../../prisma/migrations/20260723000000_admin_menu_paths/migration.sql',
  '../../prisma/migrations/20260723120000_app_modules/migration.sql',
  '../../prisma/migrations/20260724120000_role_menu_access/migration.sql',
] as const;
const migrations = migrationFiles.map((path) =>
  readFileSync(fileURLToPath(new URL(path, import.meta.url)), 'utf8'),
);

const fixtureFiles = {
  legacyValid: './fixtures/app-modules-legacy-valid.sql',
  invalidParent: './fixtures/app-modules-invalid-parent.sql',
  unmappedMenu: './fixtures/app-modules-unmapped-menu.sql',
  unmappedButton: './fixtures/app-modules-unmapped-button.sql',
  incompleteUnifiedActions:
    './fixtures/app-modules-incomplete-unified-actions.sql',
} as const;
const fixtures = Object.fromEntries(
  Object.entries(fixtureFiles).map(([name, path]) => [
    name,
    readFileSync(fileURLToPath(new URL(path, import.meta.url)), 'utf8'),
  ]),
) as Record<keyof typeof fixtureFiles, string>;

type ProcessResult = {
  status: number | null;
  stdout: string;
  stderr: string;
  error?: Error;
};

function quoteIdentifier(value: string) {
  if (!/^[a-z][a-z0-9_]*$/.test(value)) {
    throw new Error(`Unsafe PostgreSQL identifier: ${value}`);
  }
  return `"${value}"`;
}

function databaseUrlForPsql() {
  const url = new URL(migrationTestDatabaseUrl!);
  for (const parameter of [
    'schema',
    'connection_limit',
    'pool_timeout',
    'pgbouncer',
  ]) {
    url.searchParams.delete(parameter);
  }
  return url.toString();
}

function databaseUrlForSchema(schema: string) {
  const url = new URL(migrationTestDatabaseUrl!);
  url.searchParams.set('schema', schema);
  return url.toString();
}

function runPsql(sql: string, schema?: string): ProcessResult {
  const scopedSql = schema
    ? `SET search_path TO ${quoteIdentifier(schema)};\n${sql}`
    : sql;
  const result = spawnSync(
    'psql',
    [
      '-X',
      '--quiet',
      '--no-align',
      '--tuples-only',
      '--set=ON_ERROR_STOP=1',
      '--dbname',
      databaseUrlForPsql(),
    ],
    {
      encoding: 'utf8',
      env: { ...process.env, PSQLRC: '/dev/null' },
      input: scopedSql,
      maxBuffer: 10 * 1024 * 1024,
    },
  );

  return {
    status: result.status,
    stdout: String(result.stdout ?? ''),
    stderr: String(result.stderr ?? ''),
    error: result.error,
  };
}

function requireSuccess(result: ProcessResult, action: string) {
  if (result.error || result.status !== 0) {
    throw new Error(
      [
        `${action} failed with status ${String(result.status)}`,
        result.error?.message,
        result.stdout,
        result.stderr,
      ]
        .filter(Boolean)
        .join('\n'),
    );
  }
}

function executeSql(schema: string, sql: string, action: string) {
  const result = runPsql(sql, schema);
  requireSuccess(result, action);
}

function queryJson<T>(schema: string, sql: string): T {
  const result = runPsql(sql, schema);
  requireSuccess(result, 'PostgreSQL query');
  return JSON.parse(result.stdout.trim()) as T;
}

function withSchema(label: string, run: (schema: string) => void) {
  const schema = `veb_migration_${label}_${process.pid}_${randomUUID().slice(0, 8)}`;
  requireSuccess(
    runPsql(`CREATE SCHEMA ${quoteIdentifier(schema)};`),
    `Create schema ${schema}`,
  );
  try {
    run(schema);
  } finally {
    requireSuccess(
      runPsql(`DROP SCHEMA IF EXISTS ${quoteIdentifier(schema)} CASCADE;`),
      `Drop schema ${schema}`,
    );
  }
}

function applyMigrations(schema: string, count = migrations.length) {
  migrations.slice(0, count).forEach((migration, index) => {
    executeSql(schema, migration, `Apply migration ${migrationFiles[index]}`);
  });
}

function runSeed(schema: string) {
  const result = spawnSync('pnpm', ['exec', 'tsx', 'prisma/seed.ts'], {
    cwd: apiRoot,
    encoding: 'utf8',
    env: {
      ...process.env,
      CI: '1',
      DATABASE_URL: databaseUrlForSchema(schema),
      SEED_ADMIN_PASSWORD: 'MigrationTest@123',
    },
    maxBuffer: 10 * 1024 * 1024,
  });
  requireSuccess(
    {
      status: result.status,
      stdout: String(result.stdout ?? ''),
      stderr: String(result.stderr ?? ''),
      error: result.error,
    },
    'Run VEB seed',
  );
}

function assertFinalMigrationRolledBack(schema: string, markerId: string) {
  const state = queryJson<{
    appModuleExists: boolean;
    buttonEnumExists: boolean;
    markerCount: number;
    menuModuleColumnExists: boolean;
  }>(
    schema,
    `
      SELECT json_build_object(
        'appModuleExists', to_regclass('"AppModule"') IS NOT NULL,
        'buttonEnumExists', EXISTS (
          SELECT 1
          FROM pg_type type
          JOIN pg_namespace namespace ON namespace.oid = type.typnamespace
          JOIN pg_enum value ON value.enumtypid = type.oid
          WHERE namespace.nspname = current_schema()
            AND type.typname = 'MenuType'
            AND value.enumlabel = 'BUTTON'
        ),
        'markerCount', (
          SELECT count(*) FROM "Permission" WHERE "id" = '${markerId}'
        ),
        'menuModuleColumnExists', EXISTS (
          SELECT 1
          FROM information_schema.columns
          WHERE table_schema = current_schema()
            AND table_name = 'Menu'
            AND column_name = 'moduleId'
        )
      )::text;
    `,
  );

  expect(state).toEqual({
    appModuleExists: true,
    buttonEnumExists: false,
    markerCount: 1,
    menuModuleColumnExists: true,
  });
}

describe.skipIf(!runtimeAvailable)(
  'app modules PostgreSQL migration runtime',
  () => {
    it('bootstraps an empty schema and allows the seed to run repeatedly', () => {
      withSchema('empty', (schema) => {
        applyMigrations(schema);

        const migrated = queryJson<{
          buttonCount: number;
          dirCount: number;
          menuCount: number;
          moduleId: string;
          pageCount: number;
        }>(
          schema,
          `
            SELECT json_build_object(
              'moduleId', (
                SELECT "id" FROM "AppModule" WHERE "code" = 'admin'
              ),
              'menuCount', count(*),
              'dirCount', count(*) FILTER (WHERE "type" = 'DIR'),
              'pageCount', count(*) FILTER (WHERE "type" = 'PAGE'),
              'buttonCount', count(*) FILTER (WHERE "type" = 'BUTTON')
            )::text
            FROM "Menu";
          `,
        );

        expect(migrated).toEqual({
          moduleId: 'module-admin',
          menuCount: 42,
          dirCount: 3,
          pageCount: 10,
          buttonCount: 29,
        });

        runSeed(schema);
        runSeed(schema);

        const seeded = queryJson<{
          adminModuleCount: number;
          adminUserCount: number;
          menuCount: number;
        }>(
          schema,
          `
            SELECT json_build_object(
              'adminModuleCount', (
                SELECT count(*) FROM "AppModule" WHERE "code" = 'admin'
              ),
              'adminUserCount', (
                SELECT count(*) FROM "User" WHERE "username" = 'admin'
              ),
              'menuCount', (SELECT count(*) FROM "Menu")
            )::text;
          `,
        );
        expect(seeded).toEqual({
          adminModuleCount: 1,
          adminUserCount: 1,
          menuCount: 42,
        });
      });
    }, 120_000);

    it('preserves equivalent non-superadmin grants and the button parent page', () => {
      withSchema('legacy_valid', (schema) => {
        applyMigrations(schema, 3);
        executeSql(schema, fixtures.legacyValid, 'Apply valid legacy fixture');
        executeSql(schema, migrations[3], 'Apply app modules migration');
        executeSql(schema, migrations[4], 'Apply role menu access migration');

        const state = queryJson<{
          buttonParentId: string;
          buttonType: string;
          editorMenuCodes: string[];
          editorModuleIds: string[];
          parentPageExternalUrl: string | null;
          parentPageCount: number;
          permissionPageCount: number;
          superadminMenuCount: number;
          superadminModuleCount: number;
          unifiedButtonCount: number;
        }>(
          schema,
          `
            SELECT json_build_object(
              'editorModuleIds', (
                SELECT COALESCE(json_agg("moduleId" ORDER BY "moduleId"), '[]'::json)
                FROM "RoleModule"
                WHERE "roleId" = 'role-editor'
              ),
              'editorMenuCodes', (
                SELECT COALESCE(json_agg(menu."permissionCode" ORDER BY menu."permissionCode"), '[]'::json)
                FROM "RoleMenu" role_menu
                JOIN "Menu" menu ON menu."id" = role_menu."menuId"
                WHERE role_menu."roleId" = 'role-editor'
              ),
              'buttonParentId', (
                SELECT "parentId"
                FROM "Menu"
                WHERE "permissionCode" = 'custom:article:update'
              ),
              'buttonType', (
                SELECT "type"::text
                FROM "Menu"
                WHERE "permissionCode" = 'custom:article:update'
              ),
              'parentPageCount', (
                SELECT count(*)
                FROM "Menu"
                WHERE "id" = 'legacy-custom-article-page'
                  AND "type" = 'PAGE'
              ),
              'parentPageExternalUrl', (
                SELECT "externalUrl"
                FROM "Menu"
                WHERE "id" = 'legacy-custom-article-page'
              ),
              'permissionPageCount', (
                SELECT count(*)
                FROM "Menu"
                WHERE "id" = 'menu-system-permission'
              ),
              'unifiedButtonCount', (
                SELECT count(*)
                FROM "Menu"
                WHERE "parentId" = 'menu-system-menu'
                  AND "permissionCode" IN (
                    'system:menu:create',
                    'system:menu:update',
                    'system:menu:delete'
                  )
              ),
              'superadminModuleCount', (
                SELECT count(*) FROM "RoleModule" WHERE "roleId" = 'role-superadmin'
              ),
              'superadminMenuCount', (
                SELECT count(*) FROM "RoleMenu" WHERE "roleId" = 'role-superadmin'
              )
            )::text;
          `,
        );

        expect(state).toEqual({
          editorModuleIds: ['module-admin'],
          editorMenuCodes: [
            'custom:article:update',
            'custom:article:view',
            'dashboard:view',
            'system:menu:create',
            'system:menu:delete',
            'system:menu:update',
            'system:menu:view',
          ],
          buttonParentId: 'legacy-custom-article-page',
          buttonType: 'BUTTON',
          parentPageExternalUrl: null,
          parentPageCount: 1,
          permissionPageCount: 0,
          superadminModuleCount: 0,
          superadminMenuCount: 0,
          unifiedButtonCount: 3,
        });
      });
    }, 60_000);

    const invalidScenarios = [
      {
        label: 'unmapped_menu',
        fixture: fixtures.unmappedMenu,
        markerId: 'unmapped-menu-permission',
        error: /migration aborted: unmapped MENU permissions/i,
      },
      {
        label: 'unmapped_button',
        fixture: fixtures.unmappedButton,
        markerId: 'unmapped-button-permission',
        error: /migration aborted: unmapped BUTTON permissions/i,
      },
      {
        label: 'invalid_parent',
        fixture: fixtures.invalidParent,
        markerId: 'invalid-parent-view',
        error: /migration aborted: navigation nodes with non-DIR parents/i,
      },
      {
        label: 'incomplete_unified_actions',
        fixture: fixtures.incompleteUnifiedActions,
        markerId: 'paired-menu-view',
        error: /migration aborted: .*system menu\/permission.*parent PAGE/i,
      },
    ] as const;

    for (const scenario of invalidScenarios) {
      it(`rejects and rolls back the ${scenario.label} fixture`, () => {
        withSchema(scenario.label, (schema) => {
          applyMigrations(schema, 3);
          executeSql(
            schema,
            scenario.fixture,
            `Apply ${scenario.label} fixture`,
          );

          executeSql(schema, migrations[3], 'Apply app modules migration');
          const result = runPsql(migrations[4], schema);
          expect(result.status).not.toBe(0);
          expect(result.stderr).toMatch(scenario.error);
          assertFinalMigrationRolledBack(schema, scenario.markerId);
        });
      }, 60_000);
    }
  },
);
