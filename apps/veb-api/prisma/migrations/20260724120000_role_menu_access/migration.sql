BEGIN;

LOCK TABLE "Menu", "Permission", "RolePermission", "Role"
IN SHARE ROW EXCLUSIVE MODE;

-- Keep the production bootstrap data beside the migration that creates its
-- schema. The TEXT columns let this table exist before MenuType gains BUTTON.
CREATE TEMP TABLE "_BuiltinMenuSeed" (
    "id" TEXT PRIMARY KEY,
    "parentId" TEXT,
    "name" TEXT NOT NULL,
    "path" TEXT,
    "component" TEXT,
    "sort" INTEGER NOT NULL,
    "type" TEXT NOT NULL,
    "permissionCode" TEXT,
    "visible" BOOLEAN NOT NULL
) ON COMMIT DROP;

INSERT INTO "_BuiltinMenuSeed" (
    "id", "parentId", "name", "path", "component", "sort", "type",
    "permissionCode", "visible"
) VALUES
    ('menu-dashboard', NULL, '仪表盘', '/admin', 'dashboard/page', 0, 'PAGE', 'dashboard:view', true),
    ('content-root', NULL, '内容管理', NULL, NULL, 5, 'DIR', NULL, true),
    ('menu-content-article', 'content-root', '文章管理', '/admin/content/article', 'content/article/page', 6, 'PAGE', 'content:article:view', true),
    ('button-content-article-create', 'menu-content-article', '新增文章', NULL, NULL, 1001, 'BUTTON', 'content:article:create', false),
    ('button-content-article-update', 'menu-content-article', '编辑文章', NULL, NULL, 1002, 'BUTTON', 'content:article:update', false),
    ('button-content-article-delete', 'menu-content-article', '删除文章', NULL, NULL, 1003, 'BUTTON', 'content:article:delete', false),
    ('button-content-article-publish', 'menu-content-article', '发布文章', NULL, NULL, 1004, 'BUTTON', 'content:article:publish', false),
    ('menu-content-tag', 'content-root', '标签管理', '/admin/content/tag', 'content/tag/page', 7, 'PAGE', 'content:tag:view', true),
    ('button-content-tag-create', 'menu-content-tag', '新增标签', NULL, NULL, 1001, 'BUTTON', 'content:tag:create', false),
    ('button-content-tag-update', 'menu-content-tag', '编辑标签', NULL, NULL, 1002, 'BUTTON', 'content:tag:update', false),
    ('button-content-tag-delete', 'menu-content-tag', '删除标签', NULL, NULL, 1003, 'BUTTON', 'content:tag:delete', false),
    ('button-content-tag-assign', 'menu-content-tag', '关联标签', NULL, NULL, 1004, 'BUTTON', 'content:tag:assign', false),
    ('menu-content-like', 'content-root', '喜欢记录', '/admin/content/like', 'content/like/page', 8, 'PAGE', 'content:like:view', true),
    ('button-content-like-stats', 'menu-content-like', '喜欢统计', NULL, NULL, 1001, 'BUTTON', 'content:like:stats', false),
    ('button-content-like-delete', 'menu-content-like', '删除喜欢记录', NULL, NULL, 1002, 'BUTTON', 'content:like:delete', false),
    ('system-root', NULL, '系统管理', NULL, NULL, 10, 'DIR', NULL, true),
    ('menu-system-module', 'system-root', '模块管理', '/admin/system/module', 'system/module/page', 11, 'PAGE', 'system:module:view', true),
    ('button-system-module-create', 'menu-system-module', '新增模块', NULL, NULL, 1001, 'BUTTON', 'system:module:create', false),
    ('button-system-module-update', 'menu-system-module', '编辑模块', NULL, NULL, 1002, 'BUTTON', 'system:module:update', false),
    ('button-system-module-delete', 'menu-system-module', '删除模块', NULL, NULL, 1003, 'BUTTON', 'system:module:delete', false),
    ('menu-system-user', 'system-root', '用户管理', '/admin/system/user', 'system/user/page', 12, 'PAGE', 'system:user:view', true),
    ('button-system-user-create', 'menu-system-user', '新增用户', NULL, NULL, 1001, 'BUTTON', 'system:user:create', false),
    ('button-system-user-update', 'menu-system-user', '编辑用户', NULL, NULL, 1002, 'BUTTON', 'system:user:update', false),
    ('button-system-user-delete', 'menu-system-user', '删除用户', NULL, NULL, 1003, 'BUTTON', 'system:user:delete', false),
    ('button-system-user-reset-password', 'menu-system-user', '重置用户密码', NULL, NULL, 1004, 'BUTTON', 'system:user:reset-password', false),
    ('button-system-user-assign-role', 'menu-system-user', '分配用户角色', NULL, NULL, 1005, 'BUTTON', 'system:user:assign-role', false),
    ('menu-system-role', 'system-root', '角色管理', '/admin/system/role', 'system/role/page', 13, 'PAGE', 'system:role:view', true),
    ('button-system-role-create', 'menu-system-role', '新增角色', NULL, NULL, 1001, 'BUTTON', 'system:role:create', false),
    ('button-system-role-update', 'menu-system-role', '编辑角色', NULL, NULL, 1002, 'BUTTON', 'system:role:update', false),
    ('button-system-role-delete', 'menu-system-role', '删除角色', NULL, NULL, 1003, 'BUTTON', 'system:role:delete', false),
    ('button-system-role-assign-access', 'menu-system-role', '配置访问权限', NULL, NULL, 1004, 'BUTTON', 'system:role:assign-access', false),
    ('button-system-role-assign-user', 'menu-system-role', '分配角色用户', NULL, NULL, 1005, 'BUTTON', 'system:role:assign-user', false),
    ('menu-system-menu', 'system-root', '菜单与权限', '/admin/system/menu', 'system/menu/page', 14, 'PAGE', 'system:menu:view', true),
    ('button-system-menu-create', 'menu-system-menu', '新增菜单或按钮', NULL, NULL, 1001, 'BUTTON', 'system:menu:create', false),
    ('button-system-menu-update', 'menu-system-menu', '编辑菜单或按钮', NULL, NULL, 1002, 'BUTTON', 'system:menu:update', false),
    ('button-system-menu-delete', 'menu-system-menu', '删除菜单或按钮', NULL, NULL, 1003, 'BUTTON', 'system:menu:delete', false),
    ('menu-system-file', 'system-root', '文件管理', '/admin/system/file', 'system/file/page', 16, 'PAGE', 'system:file:view', true),
    ('button-system-file-upload', 'menu-system-file', '上传文件', NULL, NULL, 1001, 'BUTTON', 'system:file:upload', false),
    ('button-system-file-delete', 'menu-system-file', '删除文件', NULL, NULL, 1002, 'BUTTON', 'system:file:delete', false),
    ('menu-system-log', 'system-root', '日志管理', NULL, NULL, 90, 'DIR', NULL, true),
    ('menu-system-log-operation', 'menu-system-log', '操作日志', '/admin/system/log/operation', 'system/log/operation/page', 91, 'PAGE', 'log:operation:view', true),
    ('button-system-log-operation-export', 'menu-system-log-operation', '导出操作日志', NULL, NULL, 1001, 'BUTTON', 'log:operation:export', false);

-- Validate the legacy tree and all routable nodes before changing data.
DO $$
DECLARE
    invalid_values TEXT;
BEGIN
    SELECT string_agg(m."id", ', ' ORDER BY m."id")
    INTO invalid_values
    FROM "Menu" m
    LEFT JOIN "Menu" parent ON parent."id" = m."parentId"
    WHERE m."parentId" IS NOT NULL
      AND parent."id" IS NULL
      AND NOT (
          m."id" = 'menu-system-module'
          AND m."parentId" = 'system-root'
      );
    IF invalid_values IS NOT NULL THEN
        RAISE EXCEPTION 'Menu migration aborted: orphan nodes: %', invalid_values;
    END IF;

    SELECT string_agg(m."id" || '->' || parent."id", ', ' ORDER BY m."id")
    INTO invalid_values
    FROM "Menu" m
    JOIN "Menu" parent ON parent."id" = m."parentId"
    WHERE m."type" IN ('DIR', 'PAGE', 'LINK')
      AND parent."type" <> 'DIR';
    IF invalid_values IS NOT NULL THEN
        RAISE EXCEPTION 'Menu migration aborted: navigation nodes with non-DIR parents: %', invalid_values;
    END IF;

    IF EXISTS (
        WITH RECURSIVE ancestry AS (
            SELECT m."id" AS origin, m."parentId" AS cursor, ARRAY[m."id"] AS visited
            FROM "Menu" m
            UNION ALL
            SELECT a.origin, parent."parentId", a.visited || parent."id"
            FROM ancestry a
            JOIN "Menu" parent ON parent."id" = a.cursor
            WHERE NOT parent."id" = ANY(a.visited)
        )
        SELECT 1
        FROM ancestry a
        JOIN "Menu" parent ON parent."id" = a.cursor
        WHERE parent."id" = ANY(a.visited)
    ) THEN
        RAISE EXCEPTION 'Menu migration aborted: the legacy tree contains a cycle';
    END IF;

    IF EXISTS (
        WITH RECURSIVE tree AS (
            SELECT m."id", 1 AS depth
            FROM "Menu" m
            WHERE m."parentId" IS NULL
            UNION ALL
            SELECT child."id", tree.depth + 1
            FROM tree
            JOIN "Menu" child ON child."parentId" = tree."id"
        )
        SELECT 1 FROM tree WHERE depth > 4
    ) THEN
        RAISE EXCEPTION 'Menu migration aborted: navigation depth exceeds four levels';
    END IF;

    SELECT string_agg(m."id", ', ' ORDER BY m."id")
    INTO invalid_values
    FROM "Menu" m
    WHERE m."type" IN ('PAGE', 'LINK')
      AND m."id" NOT IN ('menu-dashboard', 'menu-profile')
      AND m."permissionCode" IS NULL;
    IF invalid_values IS NOT NULL THEN
        RAISE EXCEPTION 'Menu migration aborted: routable nodes without permission codes: %', invalid_values;
    END IF;

    SELECT string_agg(m."id", ', ' ORDER BY m."id")
    INTO invalid_values
    FROM "Menu" m
    LEFT JOIN "Permission" p ON p."code" = m."permissionCode"
    WHERE m."type" IN ('PAGE', 'LINK')
      AND m."id" NOT IN ('menu-dashboard', 'menu-profile')
      AND (p."id" IS NULL OR p."type" <> 'MENU');
    IF invalid_values IS NOT NULL THEN
        RAISE EXCEPTION 'Menu migration aborted: routable nodes must reference MENU permissions: %', invalid_values;
    END IF;

    SELECT string_agg(m."id", ', ' ORDER BY m."id")
    INTO invalid_values
    FROM "Menu" m
    WHERE m."type" = 'PAGE'
      AND m."id" NOT IN ('menu-dashboard', 'menu-profile')
      AND (m."component" IS NULL OR btrim(m."component") = '');
    IF invalid_values IS NOT NULL THEN
        RAISE EXCEPTION 'Menu migration aborted: pages without components: %', invalid_values;
    END IF;

    SELECT string_agg(m."id", ', ' ORDER BY m."id")
    INTO invalid_values
    FROM "Menu" m
    WHERE m."type" = 'LINK'
      AND (m."externalUrl" IS NULL OR m."externalUrl" !~* '^https?://[^[:space:]]+$');
    IF invalid_values IS NOT NULL THEN
        RAISE EXCEPTION 'Menu migration aborted: links without valid HTTP(S) URLs: %', invalid_values;
    END IF;

    SELECT string_agg(m."id", ', ' ORDER BY m."id")
    INTO invalid_values
    FROM "Menu" m
    WHERE m."type" = 'PAGE'
      AND m."id" NOT IN ('menu-profile', 'menu-system-permission')
      AND (
          m."path" IS NULL
          OR left(m."path", 1) <> '/'
          OR (m."path" <> '/' AND right(m."path", 1) = '/')
          OR strpos(m."path", '//') > 0
          OR strpos(m."path", E'\\') > 0
          OR strpos(m."path", '?') > 0
          OR strpos(m."path", '#') > 0
          OR strpos(m."path", '%') > 0
          OR m."path" IN ('/', '/403', '/404', '/login', '/profile', '/admin/profile', '/admin/system/permission')
          OR m."path" = '/api'
          OR m."path" LIKE '/api/%'
          OR m."path" = '/articles'
          OR m."path" LIKE '/articles/%'
          OR m."path" = '/_next'
          OR m."path" LIKE '/_next/%'
      );
    IF invalid_values IS NOT NULL THEN
        RAISE EXCEPTION 'Menu migration aborted: pages with non-canonical or reserved paths: %', invalid_values;
    END IF;

    SELECT string_agg(duplicates."path", ', ' ORDER BY duplicates."path")
    INTO invalid_values
    FROM (
        SELECT m."path"
        FROM "Menu" m
        WHERE m."type" = 'PAGE' AND m."id" <> 'menu-profile'
        GROUP BY m."path"
        HAVING count(*) > 1
    ) duplicates;
    IF invalid_values IS NOT NULL THEN
        RAISE EXCEPTION 'Menu migration aborted: duplicate page paths: %', invalid_values;
    END IF;

    SELECT string_agg(duplicates."permissionCode", ', ' ORDER BY duplicates."permissionCode")
    INTO invalid_values
    FROM (
        SELECT m."permissionCode"
        FROM "Menu" m
        WHERE m."type" IN ('PAGE', 'LINK')
          AND m."permissionCode" IS NOT NULL
        GROUP BY m."permissionCode"
        HAVING count(*) > 1
    ) duplicates;
    IF invalid_values IS NOT NULL THEN
        RAISE EXCEPTION 'Menu migration aborted: duplicate routable permission codes: %', invalid_values;
    END IF;

    SELECT string_agg(conflict, ', ' ORDER BY conflict)
    INTO invalid_values
    FROM (
        SELECT 'menu-id:' || m."id" AS conflict
        FROM "Menu" m
        WHERE m."id" IN (
            'button-system-module-create',
            'button-system-module-update',
            'button-system-module-delete'
        )
        UNION ALL
        SELECT 'permission-id:' || p."id"
        FROM "Permission" p
        WHERE p."id" IN (
            'menu-system-module',
            'button-system-module-create',
            'button-system-module-update',
            'button-system-module-delete'
        )
        UNION ALL
        SELECT 'menu-path:' || m."path"
        FROM "Menu" m
        WHERE m."path" = '/admin/system/module'
          AND m."id" <> 'menu-system-module'
        UNION ALL
        SELECT 'permission-code:' || p."code"
        FROM "Permission" p
        WHERE p."code" IN (
            'dashboard:view',
            'system:role:assign-access'
        )
        UNION ALL
        SELECT 'menu-permission-code:' || m."permissionCode"
        FROM "Menu" m
        WHERE m."permissionCode" IN (
            'dashboard:view',
            'system:role:assign-access'
        )
        UNION ALL
        SELECT 'builtin-path:' || seeded."path" || '->' || m."id"
        FROM "_BuiltinMenuSeed" seeded
        JOIN "Menu" m ON m."path" = seeded."path" AND m."id" <> seeded."id"
        WHERE seeded."type" <> 'BUTTON' AND seeded."path" IS NOT NULL
        UNION ALL
        SELECT 'builtin-permission-code:' || seeded."permissionCode" || '->' || m."id"
        FROM "_BuiltinMenuSeed" seeded
        JOIN "Menu" m
          ON m."permissionCode" = seeded."permissionCode"
         AND m."id" <> seeded."id"
        WHERE seeded."type" <> 'BUTTON' AND seeded."permissionCode" IS NOT NULL
          AND NOT (
              seeded."id" = 'menu-system-log-operation'
              AND m."id" = 'menu-system-log'
          )
        UNION ALL
        SELECT 'builtin-button-menu-id:' || m."id"
        FROM "Menu" m
        JOIN "_BuiltinMenuSeed" seeded ON seeded."id" = m."id"
        WHERE seeded."type" = 'BUTTON'
        UNION ALL
        SELECT 'builtin-button-permission-id:' || p."id"
        FROM "Permission" p
        JOIN "_BuiltinMenuSeed" seeded ON seeded."id" = p."id"
        WHERE seeded."type" = 'BUTTON'
          AND NOT (
              p."type" = 'BUTTON'
              AND (
                  p."code" = seeded."permissionCode"
                  OR (
                      seeded."permissionCode" = 'system:role:assign-access'
                      AND p."code" = 'system:role:assign-permission'
                  )
              )
          )
    ) conflicts;
    IF invalid_values IS NOT NULL THEN
        RAISE EXCEPTION 'Menu migration aborted: new and legacy identifiers conflict: %', invalid_values;
    END IF;
END $$;

-- Every legacy MENU permission must either resolve to one retained PAGE/LINK or
-- be one of the three explicit legacy resources intentionally folded away.
CREATE TEMP TABLE "_MenuPermissionMapping" (
    "permissionId" TEXT PRIMARY KEY,
    "menuId" TEXT NOT NULL
) ON COMMIT DROP;

INSERT INTO "_MenuPermissionMapping" ("permissionId", "menuId")
SELECT p."id", min(m."id")
FROM "Permission" p
JOIN "Menu" m
  ON m."permissionCode" = p."code"
 AND m."type" IN ('PAGE', 'LINK')
 AND m."id" NOT IN ('menu-profile', 'menu-system-permission')
WHERE p."type" = 'MENU'
GROUP BY p."id"
HAVING count(*) = 1;

DO $$
DECLARE
    invalid_values TEXT;
BEGIN
    SELECT string_agg(p."code", ', ' ORDER BY p."code")
    INTO invalid_values
    FROM "Permission" p
    LEFT JOIN "_MenuPermissionMapping" mapping ON mapping."permissionId" = p."id"
    WHERE p."type" = 'MENU'
      AND mapping."permissionId" IS NULL
      AND NOT (
          p."code" = 'content:view'
          AND EXISTS (
              SELECT 1 FROM "Menu" m
              WHERE m."id" = 'content-root'
                AND m."type" = 'DIR'
                AND m."permissionCode" = p."code"
          )
      )
      AND NOT (
          p."code" = 'system:view'
          AND EXISTS (
              SELECT 1 FROM "Menu" m
              WHERE m."id" = 'system-root'
                AND m."type" = 'DIR'
                AND m."permissionCode" = p."code"
          )
      )
      AND NOT (
          p."code" = 'system:permission:view'
          AND EXISTS (
              SELECT 1 FROM "Menu" m
              WHERE m."id" = 'menu-system-permission'
                AND m."type" = 'PAGE'
                AND m."permissionCode" = p."code"
          )
      );
    IF invalid_values IS NOT NULL THEN
        RAISE EXCEPTION 'Menu migration aborted: unmapped MENU permissions: %', invalid_values;
    END IF;
END $$;

-- The preceding app-modules migration removed the permissionless dashboard and
-- granted the admin module to every existing role. Preserve that access when
-- the dashboard becomes an explicitly authorized page.
CREATE TEMP TABLE "_LegacyOpenDashboardRole" (
    "roleId" TEXT PRIMARY KEY
) ON COMMIT DROP;

INSERT INTO "_LegacyOpenDashboardRole" ("roleId")
SELECT r."id"
FROM "Role" r
WHERE r."code" <> 'superadmin'
  AND EXISTS (
      SELECT 1
      FROM "RoleModule" role_module
      WHERE role_module."roleId" = r."id"
        AND role_module."moduleId" = 'module-admin'
  );

-- Map every legacy BUTTON permission to one concrete PAGE. Built-in mappings are
-- explicit; custom permissions may use Permission.parentId when it resolves to
-- exactly one PAGE permission.
CREATE TEMP TABLE "_ButtonMenuMapping" (
    "permissionId" TEXT PRIMARY KEY,
    "menuId" TEXT NOT NULL
) ON COMMIT DROP;

INSERT INTO "_ButtonMenuMapping" ("permissionId", "menuId")
SELECT p."id", mapping."menuId"
FROM "Permission" p
JOIN (VALUES
    ('content:article:create', 'menu-content-article'),
    ('content:article:update', 'menu-content-article'),
    ('content:article:delete', 'menu-content-article'),
    ('content:article:publish', 'menu-content-article'),
    ('content:tag:create', 'menu-content-tag'),
    ('content:tag:update', 'menu-content-tag'),
    ('content:tag:delete', 'menu-content-tag'),
    ('content:tag:assign', 'menu-content-tag'),
    ('content:like:stats', 'menu-content-like'),
    ('content:like:delete', 'menu-content-like'),
    ('system:module:create', 'menu-system-module'),
    ('system:module:update', 'menu-system-module'),
    ('system:module:delete', 'menu-system-module'),
    ('system:user:create', 'menu-system-user'),
    ('system:user:update', 'menu-system-user'),
    ('system:user:delete', 'menu-system-user'),
    ('system:user:reset-password', 'menu-system-user'),
    ('system:user:assign-role', 'menu-system-user'),
    ('system:role:create', 'menu-system-role'),
    ('system:role:update', 'menu-system-role'),
    ('system:role:delete', 'menu-system-role'),
    ('system:role:assign-permission', 'menu-system-role'),
    ('system:role:assign-user', 'menu-system-role'),
    ('system:menu:create', 'menu-system-menu'),
    ('system:menu:update', 'menu-system-menu'),
    ('system:menu:delete', 'menu-system-menu'),
    ('system:file:upload', 'menu-system-file'),
    ('system:file:delete', 'menu-system-file'),
    ('log:operation:export', 'menu-system-log-operation')
) AS mapping("code", "menuId") ON mapping."code" = p."code"
WHERE p."type" = 'BUTTON';

INSERT INTO "_ButtonMenuMapping" ("permissionId", "menuId")
SELECT p."id", parent_mapping."menuId"
FROM "Permission" p
JOIN "Permission" parent_permission ON parent_permission."id" = p."parentId"
JOIN "_MenuPermissionMapping" parent_mapping
  ON parent_mapping."permissionId" = parent_permission."id"
JOIN "Menu" m ON m."id" = parent_mapping."menuId" AND m."type" = 'PAGE'
LEFT JOIN "_ButtonMenuMapping" existing ON existing."permissionId" = p."id"
WHERE p."type" = 'BUTTON'
  AND existing."permissionId" IS NULL
      AND p."code" NOT IN (
          'system:permission:create',
          'system:permission:update',
          'system:permission:delete',
          'system:role:assign-module'
      );

DO $$
DECLARE
    invalid_values TEXT;
BEGIN
    SELECT string_agg(pair."action", ', ' ORDER BY pair."action")
    INTO invalid_values
    FROM (VALUES ('create'), ('update'), ('delete')) AS pair("action")
    WHERE (
        EXISTS (
            SELECT 1 FROM "Permission" p
            WHERE p."code" = 'system:menu:' || pair."action" AND p."type" = 'BUTTON'
        )
        OR EXISTS (
            SELECT 1 FROM "Permission" p
            WHERE p."code" = 'system:permission:' || pair."action" AND p."type" = 'BUTTON'
        )
    )
      AND NOT (
          EXISTS (
              SELECT 1 FROM "Permission" p
              WHERE p."code" = 'system:menu:' || pair."action" AND p."type" = 'BUTTON'
          )
          AND EXISTS (
              SELECT 1 FROM "Permission" p
              WHERE p."code" = 'system:permission:' || pair."action" AND p."type" = 'BUTTON'
          )
          AND EXISTS (
              SELECT 1 FROM "Menu" m
              WHERE m."id" = 'menu-system-menu'
                AND m."type" = 'PAGE'
                AND m."permissionCode" = 'system:menu:view'
          )
          AND EXISTS (
              SELECT 1 FROM "Menu" m
              WHERE m."id" = 'menu-system-permission'
                AND m."type" = 'PAGE'
                AND m."permissionCode" = 'system:permission:view'
          )
      );
    IF invalid_values IS NOT NULL THEN
        RAISE EXCEPTION 'Menu migration aborted: incomplete system menu/permission action pairs or missing parent PAGEs: %', invalid_values;
    END IF;

    SELECT string_agg(p."code", ', ' ORDER BY p."code")
    INTO invalid_values
    FROM "Permission" p
    LEFT JOIN "_ButtonMenuMapping" mapping ON mapping."permissionId" = p."id"
    WHERE p."type" = 'BUTTON'
      AND p."code" NOT IN (
          'system:permission:create',
          'system:permission:update',
          'system:permission:delete',
          'system:role:assign-module'
      )
      AND mapping."permissionId" IS NULL;
    IF invalid_values IS NOT NULL THEN
        RAISE EXCEPTION 'Menu migration aborted: unmapped BUTTON permissions or deleted PAGE parents: %', invalid_values;
    END IF;

    SELECT string_agg(p."code", ', ' ORDER BY p."code")
    INTO invalid_values
    FROM "Permission" p
    JOIN "_ButtonMenuMapping" mapping ON mapping."permissionId" = p."id"
    LEFT JOIN "Menu" parent_menu
      ON parent_menu."id" = mapping."menuId"
     AND parent_menu."type" = 'PAGE'
    WHERE parent_menu."id" IS NULL;
    IF invalid_values IS NOT NULL THEN
        RAISE EXCEPTION 'Menu migration aborted: BUTTON mappings without PAGE targets: %', invalid_values;
    END IF;

    SELECT string_agg(p."code", ', ' ORDER BY p."code")
    INTO invalid_values
    FROM "Permission" p
    JOIN "_ButtonMenuMapping" mapping ON mapping."permissionId" = p."id"
    JOIN "Menu" m ON m."id" = p."id";
    IF invalid_values IS NOT NULL THEN
        RAISE EXCEPTION 'Menu migration aborted: permission IDs collide with menu IDs: %', invalid_values;
    END IF;

    SELECT string_agg(r."code" || ':' || p."code", ', ' ORDER BY r."code", p."code")
    INTO invalid_values
    FROM "RolePermission" rp
    JOIN "Role" r ON r."id" = rp."roleId" AND r."code" <> 'superadmin'
    JOIN "Permission" p ON p."id" = rp."permissionId" AND p."type" = 'BUTTON'
    JOIN "_ButtonMenuMapping" mapping ON mapping."permissionId" = p."id"
    JOIN "Menu" parent_menu ON parent_menu."id" = mapping."menuId"
    JOIN "Permission" page_permission ON page_permission."code" = parent_menu."permissionCode"
    LEFT JOIN "RolePermission" page_grant
      ON page_grant."roleId" = rp."roleId"
     AND page_grant."permissionId" = page_permission."id"
    WHERE p."code" NOT IN ('system:menu:create', 'system:menu:update', 'system:menu:delete')
      AND page_grant."roleId" IS NULL;
    IF invalid_values IS NOT NULL THEN
        RAISE EXCEPTION 'Menu migration aborted: BUTTON grants without their PAGE grant: %', invalid_values;
    END IF;

    SELECT string_agg(r."code" || ':' || action_permission."code", ', ' ORDER BY r."code", action_permission."code")
    INTO invalid_values
    FROM "RolePermission" action_grant
    JOIN "Role" r ON r."id" = action_grant."roleId" AND r."code" <> 'superadmin'
    JOIN "Permission" action_permission
      ON action_permission."id" = action_grant."permissionId"
     AND action_permission."code" IN (
         'system:menu:create',
         'system:menu:update',
         'system:menu:delete',
         'system:permission:create',
         'system:permission:update',
         'system:permission:delete'
     )
    JOIN "Permission" page_permission
      ON page_permission."code" = CASE
          WHEN action_permission."code" LIKE 'system:menu:%' THEN 'system:menu:view'
          ELSE 'system:permission:view'
      END
    LEFT JOIN "RolePermission" page_grant
      ON page_grant."roleId" = action_grant."roleId"
     AND page_grant."permissionId" = page_permission."id"
    WHERE page_grant."roleId" IS NULL;
    IF invalid_values IS NOT NULL THEN
        RAISE EXCEPTION 'Menu migration aborted: paired system menu/permission actions without their parent PAGE grant: %', invalid_values;
    END IF;

    SELECT string_agg(r."code", ', ' ORDER BY r."code")
    INTO invalid_values
    FROM "Role" r
    WHERE r."code" <> 'superadmin'
      AND (
          EXISTS (
              SELECT 1
              FROM "RolePermission" rp
              JOIN "Permission" p ON p."id" = rp."permissionId"
              JOIN "Menu" m ON m."permissionCode" = p."code"
              WHERE rp."roleId" = r."id"
                AND m."type" IN ('PAGE', 'LINK')
                AND m."id" NOT IN ('menu-system-permission', 'menu-system-menu', 'menu-profile')
          )
          OR EXISTS (
              SELECT 1
              FROM "RolePermission" rp
              JOIN "_ButtonMenuMapping" mapping ON mapping."permissionId" = rp."permissionId"
              JOIN "Permission" mapped_permission ON mapped_permission."id" = rp."permissionId"
              WHERE rp."roleId" = r."id"
                AND mapped_permission."code" NOT IN (
                    'system:menu:create',
                    'system:menu:update',
                    'system:menu:delete'
                )
          )
          OR (
              EXISTS (
                  SELECT 1 FROM "RolePermission" rp
                  JOIN "Permission" p ON p."id" = rp."permissionId"
                  WHERE rp."roleId" = r."id" AND p."code" = 'system:menu:view'
              )
              AND EXISTS (
                  SELECT 1 FROM "RolePermission" rp
                  JOIN "Permission" p ON p."id" = rp."permissionId"
                  WHERE rp."roleId" = r."id" AND p."code" = 'system:permission:view'
              )
          )
      )
      AND NOT EXISTS (
          SELECT 1
          FROM "_LegacyOpenDashboardRole" dashboard_role
          WHERE dashboard_role."roleId" = r."id"
      )
      AND NOT EXISTS (
          SELECT 1
          FROM "RolePermission" rp
          JOIN "Permission" p ON p."id" = rp."permissionId"
          JOIN "Menu" m ON m."permissionCode" = p."code"
          WHERE rp."roleId" = r."id"
            AND m."type" = 'PAGE'
            AND m."status" = 'ENABLED'
            AND m."visible" = true
            AND m."id" NOT IN ('menu-system-permission', 'menu-profile')
            AND NOT EXISTS (
                WITH RECURSIVE landing_ancestors AS (
                    SELECT parent."id", parent."parentId", parent."status", parent."visible"
                    FROM "Menu" parent
                    WHERE parent."id" = m."parentId"
                    UNION ALL
                    SELECT parent."id", parent."parentId", parent."status", parent."visible"
                    FROM "Menu" parent
                    JOIN landing_ancestors child ON child."parentId" = parent."id"
                )
                SELECT 1
                FROM landing_ancestors
                WHERE "status" <> 'ENABLED' OR "visible" = false
            )
            AND (
                m."id" <> 'menu-system-menu'
                OR EXISTS (
                    SELECT 1 FROM "RolePermission" paired
                    JOIN "Permission" paired_permission ON paired_permission."id" = paired."permissionId"
                    WHERE paired."roleId" = r."id"
                      AND paired_permission."code" = 'system:permission:view'
                )
            )
      );
    IF invalid_values IS NOT NULL THEN
        RAISE EXCEPTION 'Menu migration aborted: roles without an enabled visible PAGE landing: %', invalid_values;
    END IF;
END $$;

-- Replace MenuType so BUTTON can be used inside the same transaction.
ALTER TABLE "Menu" ALTER COLUMN "type" DROP DEFAULT;
ALTER TYPE "MenuType" RENAME TO "MenuType_legacy";
CREATE TYPE "MenuType" AS ENUM ('DIR', 'PAGE', 'LINK', 'BUTTON');
ALTER TABLE "Menu"
    ALTER COLUMN "type" TYPE "MenuType"
    USING ("type"::text::"MenuType");
ALTER TABLE "Menu" ALTER COLUMN "type" SET DEFAULT 'PAGE';
DROP TYPE "MenuType_legacy";

ALTER TABLE "AppModule" DROP COLUMN "componentKey";

INSERT INTO "AppModule" (
    "id", "code", "name", "description", "icon", "sort", "status",
    "isSystem", "createdAt", "updatedAt"
) VALUES (
    'module-admin', 'admin', '后台管理', '系统内置后台管理模块',
    'LayoutDashboard', 0, 'ENABLED', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
)
ON CONFLICT ("id") DO UPDATE SET
    "code" = EXCLUDED."code",
    "name" = EXCLUDED."name",
    "description" = EXCLUDED."description",
    "icon" = EXCLUDED."icon",
    "sort" = EXCLUDED."sort",
    "status" = EXCLUDED."status",
    "isSystem" = true,
    "updatedAt" = CURRENT_TIMESTAMP;

ALTER TABLE "Menu" DROP CONSTRAINT "Menu_permissionCode_fkey";
ALTER TABLE "Menu" ADD COLUMN "description" TEXT;
ALTER TABLE "Menu" ALTER COLUMN "path" DROP NOT NULL;
UPDATE "Menu" SET "moduleId" = 'module-admin';

UPDATE "Menu" m
SET "description" = p."description"
FROM "Permission" p
WHERE p."code" = m."permissionCode" AND m."type" IN ('PAGE', 'LINK');

DELETE FROM "Menu" WHERE "id" = 'menu-profile';
DELETE FROM "Menu" WHERE "id" = 'menu-system-permission';

UPDATE "Menu"
SET "name" = '菜单与权限', "sort" = 14, "updatedAt" = CURRENT_TIMESTAMP
WHERE "id" = 'menu-system-menu';

UPDATE "Menu"
SET "permissionCode" = 'dashboard:view',
    "component" = 'dashboard/page',
    "description" = '后台仪表盘',
    "updatedAt" = CURRENT_TIMESTAMP
WHERE "id" = 'menu-dashboard';

UPDATE "Menu"
SET "path" = NULL,
    "component" = NULL,
    "permissionCode" = NULL,
    "externalUrl" = NULL,
    "updatedAt" = CURRENT_TIMESTAMP
WHERE "type" = 'DIR';

UPDATE "Menu"
SET "path" = NULL,
    "component" = NULL,
    "updatedAt" = CURRENT_TIMESTAMP
WHERE "type" = 'LINK';

-- externalUrl had no meaning for legacy PAGE rows, but the old schema allowed
-- it. Normalize retained pages before installing the final type-field check.
UPDATE "Menu"
SET "externalUrl" = NULL,
    "updatedAt" = CURRENT_TIMESTAMP
WHERE "type" = 'PAGE' AND "externalUrl" IS NOT NULL;

-- Canonicalize retained built-ins and bootstrap every root/page on a fresh
-- database. Legacy custom nodes remain untouched.
INSERT INTO "Menu" (
    "id", "parentId", "moduleId", "name", "description", "path", "component",
    "icon", "sort", "type", "permissionCode", "visible", "status",
    "externalUrl", "isSystem", "createdAt", "updatedAt"
)
SELECT
    seeded."id",
    seeded."parentId",
    'module-admin',
    seeded."name",
    NULL,
    seeded."path",
    seeded."component",
    NULL,
    seeded."sort",
    seeded."type"::"MenuType",
    seeded."permissionCode",
    seeded."visible",
    'ENABLED',
    NULL,
    true,
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
FROM "_BuiltinMenuSeed" seeded
WHERE seeded."type" <> 'BUTTON'
ON CONFLICT ("id") DO UPDATE SET
    "parentId" = EXCLUDED."parentId",
    "moduleId" = EXCLUDED."moduleId",
    "name" = EXCLUDED."name",
    "description" = EXCLUDED."description",
    "path" = EXCLUDED."path",
    "component" = EXCLUDED."component",
    "icon" = EXCLUDED."icon",
    "sort" = EXCLUDED."sort",
    "type" = EXCLUDED."type",
    "permissionCode" = EXCLUDED."permissionCode",
    "externalUrl" = EXCLUDED."externalUrl",
    "isSystem" = EXCLUDED."isSystem",
    "updatedAt" = CURRENT_TIMESTAMP;

INSERT INTO "Menu" (
    "id", "parentId", "moduleId", "name", "description", "path", "component",
    "icon", "sort", "type", "permissionCode", "visible", "status",
    "externalUrl", "isSystem", "createdAt", "updatedAt"
)
SELECT
    p."id",
    mapping."menuId",
    'module-admin',
    CASE
        WHEN p."code" = 'system:role:assign-permission' THEN '配置访问权限'
        ELSE p."name"
    END,
    p."description",
    NULL,
    NULL,
    NULL,
    1000 + row_number() OVER (PARTITION BY mapping."menuId" ORDER BY p."code"),
    'BUTTON',
    CASE
        WHEN p."code" = 'system:role:assign-permission' THEN 'system:role:assign-access'
        ELSE p."code"
    END,
    false,
    'ENABLED',
    NULL,
    p."isSystem",
    p."createdAt",
    p."updatedAt"
FROM "Permission" p
JOIN "_ButtonMenuMapping" mapping ON mapping."permissionId" = p."id"
WHERE p."code" NOT IN (
    'system:permission:create',
    'system:permission:update',
    'system:permission:delete'
);

-- A migrated built-in button keeps its legacy Permission ID, but its stable
-- permissionCode and all mutable fields match seed.ts. Fresh databases use the
-- deterministic seed ID.
UPDATE "Menu" button
SET "parentId" = seeded."parentId",
    "moduleId" = 'module-admin',
    "name" = seeded."name",
    "description" = NULL,
    "path" = NULL,
    "component" = NULL,
    "icon" = NULL,
    "sort" = seeded."sort",
    "type" = 'BUTTON',
    "visible" = false,
    "status" = 'ENABLED',
    "externalUrl" = NULL,
    "isSystem" = true,
    "updatedAt" = CURRENT_TIMESTAMP
FROM "_BuiltinMenuSeed" seeded
WHERE seeded."type" = 'BUTTON'
  AND button."type" = 'BUTTON'
  AND button."permissionCode" = seeded."permissionCode";

INSERT INTO "Menu" (
    "id", "parentId", "moduleId", "name", "description", "path", "component",
    "icon", "sort", "type", "permissionCode", "visible", "status",
    "externalUrl", "isSystem", "createdAt", "updatedAt"
)
SELECT
    seeded."id",
    seeded."parentId",
    'module-admin',
    seeded."name",
    NULL,
    NULL,
    NULL,
    NULL,
    seeded."sort",
    'BUTTON',
    seeded."permissionCode",
    false,
    'ENABLED',
    NULL,
    true,
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
FROM "_BuiltinMenuSeed" seeded
WHERE seeded."type" = 'BUTTON'
  AND NOT EXISTS (
      SELECT 1
      FROM "Menu" existing
      WHERE existing."permissionCode" = seeded."permissionCode"
  );

ALTER TABLE "Menu" ALTER COLUMN "moduleId" SET NOT NULL;

ALTER TABLE "Menu"
    ADD CONSTRAINT "Menu_type_fields_check"
    CHECK (
        (
            "type" = 'DIR'
            AND "path" IS NULL
            AND "component" IS NULL
            AND "permissionCode" IS NULL
            AND "externalUrl" IS NULL
        )
        OR (
            "type" = 'PAGE'
            AND "path" IS NOT NULL
            AND btrim("path") <> ''
            AND "component" IS NOT NULL
            AND btrim("component") <> ''
            AND "permissionCode" IS NOT NULL
            AND btrim("permissionCode") <> ''
            AND "externalUrl" IS NULL
        )
        OR (
            "type" = 'LINK'
            AND "path" IS NULL
            AND "component" IS NULL
            AND "permissionCode" IS NOT NULL
            AND btrim("permissionCode") <> ''
            AND "externalUrl" IS NOT NULL
            AND btrim("externalUrl") <> ''
        )
        OR (
            "type" = 'BUTTON'
            AND "parentId" IS NOT NULL
            AND "path" IS NULL
            AND "component" IS NULL
            AND "icon" IS NULL
            AND "permissionCode" IS NOT NULL
            AND btrim("permissionCode") <> ''
            AND "visible" = false
            AND "externalUrl" IS NULL
        )
    );

CREATE UNIQUE INDEX "Menu_path_key" ON "Menu"("path");
CREATE UNIQUE INDEX "Menu_permissionCode_key" ON "Menu"("permissionCode");
CREATE UNIQUE INDEX "Menu_id_moduleId_key" ON "Menu"("id", "moduleId");
CREATE INDEX "Menu_moduleId_parentId_idx" ON "Menu"("moduleId", "parentId");

-- Superadmin access is computed implicitly and must not retain explicit grants
-- written by the preceding module migration.
DELETE FROM "RoleModule" role_module
USING "Role" role
WHERE role_module."roleId" = role."id"
  AND role."code" = 'superadmin';

CREATE TABLE "RoleMenu" (
    "roleId" TEXT NOT NULL,
    "moduleId" TEXT NOT NULL,
    "menuId" TEXT NOT NULL,
    CONSTRAINT "RoleMenu_pkey" PRIMARY KEY ("roleId", "menuId")
);

CREATE INDEX "RoleMenu_roleId_moduleId_idx" ON "RoleMenu"("roleId", "moduleId");
CREATE INDEX "RoleMenu_menuId_moduleId_idx" ON "RoleMenu"("menuId", "moduleId");

-- A role receives a module only when it has a valid visible PAGE landing.
INSERT INTO "RoleModule" ("roleId", "moduleId")
SELECT DISTINCT rp."roleId", m."moduleId"
FROM "RolePermission" rp
JOIN "Role" r ON r."id" = rp."roleId" AND r."code" <> 'superadmin'
JOIN "Permission" p ON p."id" = rp."permissionId"
JOIN "Menu" m ON m."permissionCode" = p."code"
WHERE m."type" = 'PAGE'
  AND m."status" = 'ENABLED'
  AND m."visible" = true
  AND NOT EXISTS (
      WITH RECURSIVE landing_ancestors AS (
          SELECT parent."id", parent."parentId", parent."status", parent."visible"
          FROM "Menu" parent
          WHERE parent."id" = m."parentId"
          UNION ALL
          SELECT parent."id", parent."parentId", parent."status", parent."visible"
          FROM "Menu" parent
          JOIN landing_ancestors child ON child."parentId" = parent."id"
      )
      SELECT 1
      FROM landing_ancestors
      WHERE "status" <> 'ENABLED' OR "visible" = false
  )
  AND (
      m."id" <> 'menu-system-menu'
      OR EXISTS (
          SELECT 1
          FROM "RolePermission" paired
          JOIN "Permission" paired_permission ON paired_permission."id" = paired."permissionId"
          WHERE paired."roleId" = rp."roleId"
            AND paired_permission."code" = 'system:permission:view'
      )
  )
ON CONFLICT DO NOTHING;

INSERT INTO "RoleModule" ("roleId", "moduleId")
SELECT dashboard_role."roleId", 'module-admin'
FROM "_LegacyOpenDashboardRole" dashboard_role
ON CONFLICT DO NOTHING;

INSERT INTO "RoleMenu" ("roleId", "moduleId", "menuId")
SELECT dashboard_role."roleId", dashboard."moduleId", dashboard."id"
FROM "_LegacyOpenDashboardRole" dashboard_role
JOIN "Menu" dashboard
  ON dashboard."id" = 'menu-dashboard'
 AND dashboard."type" = 'PAGE'
JOIN "RoleModule" role_module
  ON role_module."roleId" = dashboard_role."roleId"
 AND role_module."moduleId" = dashboard."moduleId"
ON CONFLICT DO NOTHING;

-- Migrate PAGE and LINK grants. Unified menu management requires both legacy
-- menu and permission management grants to avoid privilege expansion.
INSERT INTO "RoleMenu" ("roleId", "moduleId", "menuId")
SELECT DISTINCT rp."roleId", m."moduleId", m."id"
FROM "RolePermission" rp
JOIN "Role" r ON r."id" = rp."roleId" AND r."code" <> 'superadmin'
JOIN "Permission" p ON p."id" = rp."permissionId"
JOIN "Menu" m ON m."permissionCode" = p."code" AND m."type" IN ('PAGE', 'LINK')
JOIN "RoleModule" rm ON rm."roleId" = rp."roleId" AND rm."moduleId" = m."moduleId"
WHERE m."id" <> 'menu-system-menu'
   OR EXISTS (
       SELECT 1
       FROM "RolePermission" paired
       JOIN "Permission" paired_permission ON paired_permission."id" = paired."permissionId"
       WHERE paired."roleId" = rp."roleId"
         AND paired_permission."code" = 'system:permission:view'
   );

INSERT INTO "RoleMenu" ("roleId", "moduleId", "menuId")
SELECT DISTINCT rp."roleId", button_menu."moduleId", button_menu."id"
FROM "RolePermission" rp
JOIN "Role" r ON r."id" = rp."roleId" AND r."code" <> 'superadmin'
JOIN "Permission" p ON p."id" = rp."permissionId" AND p."type" = 'BUTTON'
JOIN "Menu" button_menu ON button_menu."id" = p."id" AND button_menu."type" = 'BUTTON'
JOIN "RoleModule" rm ON rm."roleId" = rp."roleId" AND rm."moduleId" = button_menu."moduleId"
WHERE p."code" NOT IN ('system:menu:create', 'system:menu:update', 'system:menu:delete')
  AND (
      p."code" <> 'system:role:assign-permission'
      OR EXISTS (
          SELECT 1
          FROM "RolePermission" module_grant
          JOIN "Permission" module_permission
            ON module_permission."id" = module_grant."permissionId"
           AND module_permission."code" = 'system:role:assign-module'
          WHERE module_grant."roleId" = rp."roleId"
      )
  );

INSERT INTO "RoleMenu" ("roleId", "moduleId", "menuId")
SELECT DISTINCT menu_grant."roleId", button_menu."moduleId", button_menu."id"
FROM "RolePermission" menu_grant
JOIN "Permission" menu_permission ON menu_permission."id" = menu_grant."permissionId"
JOIN "Permission" permission_permission
  ON permission_permission."code" = replace(menu_permission."code", 'system:menu:', 'system:permission:')
JOIN "RolePermission" permission_grant
  ON permission_grant."roleId" = menu_grant."roleId"
 AND permission_grant."permissionId" = permission_permission."id"
JOIN "Menu" button_menu ON button_menu."permissionCode" = menu_permission."code"
JOIN "RoleModule" rm
  ON rm."roleId" = menu_grant."roleId"
 AND rm."moduleId" = button_menu."moduleId"
JOIN "RoleMenu" parent_grant
  ON parent_grant."roleId" = menu_grant."roleId"
 AND parent_grant."menuId" = 'menu-system-menu'
WHERE menu_permission."code" IN ('system:menu:create', 'system:menu:update', 'system:menu:delete')
ON CONFLICT DO NOTHING;

DROP TABLE "RolePermission";
DROP TABLE "Permission";
DROP TYPE "PermissionType";

ALTER TABLE "Menu"
    ADD CONSTRAINT "Menu_parentId_moduleId_fkey"
    FOREIGN KEY ("parentId", "moduleId") REFERENCES "Menu"("id", "moduleId")
    ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "RoleMenu"
    ADD CONSTRAINT "RoleMenu_roleId_fkey"
    FOREIGN KEY ("roleId") REFERENCES "Role"("id")
    ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "RoleMenu"
    ADD CONSTRAINT "RoleMenu_roleId_moduleId_fkey"
    FOREIGN KEY ("roleId", "moduleId") REFERENCES "RoleModule"("roleId", "moduleId")
    ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "RoleMenu"
    ADD CONSTRAINT "RoleMenu_menuId_moduleId_fkey"
    FOREIGN KEY ("menuId", "moduleId") REFERENCES "Menu"("id", "moduleId")
    ON DELETE CASCADE ON UPDATE CASCADE;

COMMIT;
