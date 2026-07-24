BEGIN;

-- CreateTable
CREATE TABLE "AppModule" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "componentKey" TEXT NOT NULL,
    "icon" TEXT,
    "sort" INTEGER NOT NULL DEFAULT 0,
    "status" "CommonStatus" NOT NULL DEFAULT 'ENABLED',
    "isSystem" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AppModule_pkey" PRIMARY KEY ("id")
);

-- Add the module columns as nullable until all existing rows have been backfilled.
ALTER TABLE "Permission" ADD COLUMN "moduleId" TEXT;
ALTER TABLE "Menu" ADD COLUMN "moduleId" TEXT;

-- Seed the built-in admin module used by all existing data.
INSERT INTO "AppModule" (
    "id",
    "code",
    "name",
    "description",
    "componentKey",
    "icon",
    "sort",
    "status",
    "isSystem",
    "createdAt",
    "updatedAt"
) VALUES (
    'module-admin',
    'admin',
    '后台管理',
    '系统内置后台管理模块',
    'admin/home',
    'LayoutDashboard',
    0,
    'ENABLED',
    true,
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
);

UPDATE "Permission" SET "moduleId" = 'module-admin';
UPDATE "Menu" SET "moduleId" = 'module-admin';

-- These destinations are now the module home and the global profile page.
UPDATE "Menu"
SET "parentId" = NULL, "updatedAt" = CURRENT_TIMESTAMP
WHERE "parentId" IN (
    SELECT "id"
    FROM "Menu"
    WHERE "id" IN ('menu-dashboard', 'menu-profile')
       OR "path" IN ('/admin', '/admin/profile')
);

DELETE FROM "Menu"
WHERE "id" IN ('menu-dashboard', 'menu-profile')
   OR "path" IN ('/admin', '/admin/profile');

-- Add the management capabilities required to administer application modules.
INSERT INTO "Permission" (
    "id", "code", "name", "type", "description", "parentId", "moduleId",
    "isSystem", "createdAt", "updatedAt"
) VALUES
    ('permission-system-role-assign-module', 'system:role:assign-module', '分配角色模块', 'BUTTON', NULL, NULL, 'module-admin', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('permission-system-module-view', 'system:module:view', '模块管理', 'MENU', NULL, NULL, 'module-admin', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('permission-system-module-create', 'system:module:create', '新增模块', 'BUTTON', NULL, NULL, 'module-admin', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('permission-system-module-update', 'system:module:update', '编辑模块', 'BUTTON', NULL, NULL, 'module-admin', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('permission-system-module-delete', 'system:module:delete', '删除模块', 'BUTTON', NULL, NULL, 'module-admin', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
ON CONFLICT ("code") DO UPDATE SET
    "name" = EXCLUDED."name",
    "type" = EXCLUDED."type",
    "moduleId" = EXCLUDED."moduleId",
    "isSystem" = true,
    "updatedAt" = CURRENT_TIMESTAMP;

INSERT INTO "Menu" (
    "id", "parentId", "moduleId", "name", "path", "component", "icon",
    "sort", "type", "permissionCode", "visible", "status", "externalUrl",
    "isSystem", "createdAt", "updatedAt"
) VALUES (
    'menu-system-module', 'system-root', 'module-admin', '模块管理',
    '/admin/system/module', 'system/module/page', 'boxes', 11, 'PAGE',
    'system:module:view', true, 'ENABLED', NULL, true,
    CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
)
ON CONFLICT ("id") DO UPDATE SET
    "parentId" = EXCLUDED."parentId",
    "moduleId" = EXCLUDED."moduleId",
    "name" = EXCLUDED."name",
    "path" = EXCLUDED."path",
    "component" = EXCLUDED."component",
    "icon" = EXCLUDED."icon",
    "sort" = EXCLUDED."sort",
    "type" = EXCLUDED."type",
    "permissionCode" = EXCLUDED."permissionCode",
    "visible" = EXCLUDED."visible",
    "status" = EXCLUDED."status",
    "isSystem" = true,
    "updatedAt" = CURRENT_TIMESTAMP;

-- CreateTable
CREATE TABLE "RoleModule" (
    "roleId" TEXT NOT NULL,
    "moduleId" TEXT NOT NULL,

    CONSTRAINT "RoleModule_pkey" PRIMARY KEY ("roleId", "moduleId")
);

-- Preserve existing access: every role present at migration time receives admin.
INSERT INTO "RoleModule" ("roleId", "moduleId")
SELECT "id", 'module-admin' FROM "Role";

ALTER TABLE "Permission" ALTER COLUMN "moduleId" SET NOT NULL;
ALTER TABLE "Menu" ALTER COLUMN "moduleId" SET NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "AppModule_code_key" ON "AppModule"("code");
CREATE UNIQUE INDEX "AppModule_componentKey_key" ON "AppModule"("componentKey");
CREATE INDEX "Permission_moduleId_idx" ON "Permission"("moduleId");
CREATE INDEX "Menu_moduleId_idx" ON "Menu"("moduleId");
CREATE INDEX "RoleModule_moduleId_idx" ON "RoleModule"("moduleId");

-- AddForeignKey
ALTER TABLE "Permission" ADD CONSTRAINT "Permission_moduleId_fkey" FOREIGN KEY ("moduleId") REFERENCES "AppModule"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "Menu" ADD CONSTRAINT "Menu_moduleId_fkey" FOREIGN KEY ("moduleId") REFERENCES "AppModule"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "RoleModule" ADD CONSTRAINT "RoleModule_roleId_fkey" FOREIGN KEY ("roleId") REFERENCES "Role"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "RoleModule" ADD CONSTRAINT "RoleModule_moduleId_fkey" FOREIGN KEY ("moduleId") REFERENCES "AppModule"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

COMMIT;
