import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

const migrationSql = readFileSync(
  fileURLToPath(
    new URL(
      '../../prisma/migrations/20260724120000_role_menu_access/migration.sql',
      import.meta.url,
    ),
  ),
  'utf8',
);
const appliedAppModulesMigrationSql = readFileSync(
  fileURLToPath(
    new URL(
      '../../prisma/migrations/20260723120000_app_modules/migration.sql',
      import.meta.url,
    ),
  ),
  'utf8',
);
const invalidParentFixtureSql = readFileSync(
  fileURLToPath(
    new URL('./fixtures/app-modules-invalid-parent.sql', import.meta.url),
  ),
  'utf8',
);

describe('app modules migration', () => {
  it('keeps the already-applied module migration immutable', () => {
    expect(
      createHash('sha256').update(appliedAppModulesMigrationSql).digest('hex'),
    ).toBe('3e62df8307066b8821b9f1509ae84942a751aa88cfe4f8fa4da5392481dc5c04');
  });

  it('applies the schema and authorization backfill atomically', () => {
    expect(migrationSql.trimStart().startsWith('BEGIN;')).toBe(true);
    expect(migrationSql.trimEnd().endsWith('COMMIT;')).toBe(true);
    expect(migrationSql.match(/\bCOMMIT;/g)).toHaveLength(1);
  });

  it('upgrades the existing module schema instead of recreating it', () => {
    const dropLegacyComponent = migrationSql.indexOf(
      'ALTER TABLE "AppModule" DROP COLUMN "componentKey";',
    );
    const updateAdmin = migrationSql.indexOf('INSERT INTO "AppModule"');

    expect(dropLegacyComponent).toBeGreaterThan(-1);
    expect(updateAdmin).toBeGreaterThan(dropLegacyComponent);
    expect(migrationSql).not.toContain(
      'ALTER TABLE "Menu" ADD COLUMN "moduleId" TEXT;',
    );
    expect(migrationSql).not.toContain('CREATE TABLE "RoleModule"');
  });

  it('preserves the dashboard and removes legacy profile and permission pages', () => {
    expect(migrationSql).toContain("'menu-dashboard'");
    expect(migrationSql).toContain(
      `DELETE FROM "Menu" WHERE "id" = 'menu-profile';`,
    );
    expect(migrationSql).toContain(
      `DELETE FROM "Menu" WHERE "id" = 'menu-system-permission';`,
    );
    expect(migrationSql).toContain(`"permissionCode" = 'dashboard:view'`);
    expect(migrationSql).toContain(
      "'/admin/profile', '/admin/system/permission'",
    );
  });

  it('preflights button mappings and invalid role grants before writing', () => {
    expect(migrationSql).toContain('CREATE TEMP TABLE "_ButtonMenuMapping"');
    expect(migrationSql).toContain('unmapped BUTTON permissions');
    expect(migrationSql).toContain('BUTTON grants without their PAGE grant');
    expect(migrationSql).toContain(
      'roles without an enabled visible PAGE landing',
    );
  });

  it('rejects the legacy invalid-parent fixture before migration writes', () => {
    expect(invalidParentFixtureSql).toContain("'parent-page'");
    expect(invalidParentFixtureSql).toContain("'child-page'");

    const invalidParentCheck = migrationSql.indexOf(
      'navigation nodes with non-DIR parents',
    );
    const firstMigrationWrite = migrationSql.indexOf(
      'CREATE TEMP TABLE "_ButtonMenuMapping"',
    );
    expect(invalidParentCheck).toBeGreaterThan(migrationSql.indexOf('BEGIN;'));
    expect(invalidParentCheck).toBeLessThan(firstMigrationWrite);
  });

  it('requires every landing page ancestor to stay enabled and visible', () => {
    expect(
      migrationSql.match(/WITH RECURSIVE landing_ancestors AS/g),
    ).toHaveLength(2);
    expect(
      migrationSql.match(/WHERE "status" <> 'ENABLED' OR "visible" = false/g),
    ).toHaveLength(2);
  });

  it('replaces legacy permissions with composite role-menu constraints', () => {
    const createRoleMenu = migrationSql.indexOf('CREATE TABLE "RoleMenu"');
    const migrateRoleMenus = migrationSql.indexOf(
      'INSERT INTO "RoleMenu" ("roleId", "moduleId", "menuId")',
    );
    const dropPermissions = migrationSql.indexOf('DROP TABLE "Permission";');

    expect(createRoleMenu).toBeGreaterThan(-1);
    expect(migrateRoleMenus).toBeGreaterThan(createRoleMenu);
    expect(dropPermissions).toBeGreaterThan(migrateRoleMenus);
    expect(migrationSql).toContain('"RoleMenu_roleId_moduleId_fkey"');
    expect(migrationSql).toContain('"RoleMenu_menuId_moduleId_fkey"');
    expect(migrationSql).toContain('"Menu_parentId_moduleId_fkey"');
    expect(migrationSql).toContain(
      'ALTER TABLE "AppModule" DROP COLUMN "componentKey";',
    );
    expect(migrationSql).toContain(
      'module_permission."code" = \'system:role:assign-module\'',
    );
  });
});
