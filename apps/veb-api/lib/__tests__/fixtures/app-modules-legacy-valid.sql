-- Apply after 20260723000000_admin_menu_paths and before app_modules.
-- The ordinary role can open the legacy permissionless dashboard and has one
-- PAGE grant plus a child BUTTON grant. The migration must preserve all three.
INSERT INTO "Role" (
    "id", "code", "name", "status", "sort", "isSystem", "updatedAt"
) VALUES
    ('role-editor', 'editor', 'Editor', 'ENABLED', 10, false, CURRENT_TIMESTAMP),
    ('role-superadmin', 'superadmin', 'Superadmin', 'ENABLED', 0, true, CURRENT_TIMESTAMP);

INSERT INTO "Permission" (
    "id", "code", "name", "type", "parentId", "updatedAt"
) VALUES
    (
        'legacy-content-view', 'content:view', 'View content',
        'MENU', NULL, CURRENT_TIMESTAMP
    ),
    (
        'legacy-system-view', 'system:view', 'View system',
        'MENU', NULL, CURRENT_TIMESTAMP
    ),
    (
        'legacy-system-menu-view', 'system:menu:view', 'View menus',
        'MENU', 'legacy-system-view', CURRENT_TIMESTAMP
    ),
    (
        'legacy-system-permission-view', 'system:permission:view', 'View permissions',
        'MENU', 'legacy-system-view', CURRENT_TIMESTAMP
    ),
    (
        'legacy-system-menu-create', 'system:menu:create', 'Create menus',
        'BUTTON', 'legacy-system-menu-view', CURRENT_TIMESTAMP
    ),
    (
        'legacy-system-menu-update', 'system:menu:update', 'Update menus',
        'BUTTON', 'legacy-system-menu-view', CURRENT_TIMESTAMP
    ),
    (
        'legacy-system-menu-delete', 'system:menu:delete', 'Delete menus',
        'BUTTON', 'legacy-system-menu-view', CURRENT_TIMESTAMP
    ),
    (
        'legacy-system-permission-create', 'system:permission:create', 'Create permissions',
        'BUTTON', 'legacy-system-permission-view', CURRENT_TIMESTAMP
    ),
    (
        'legacy-system-permission-update', 'system:permission:update', 'Update permissions',
        'BUTTON', 'legacy-system-permission-view', CURRENT_TIMESTAMP
    ),
    (
        'legacy-system-permission-delete', 'system:permission:delete', 'Delete permissions',
        'BUTTON', 'legacy-system-permission-view', CURRENT_TIMESTAMP
    ),
    (
        'legacy-custom-article-view', 'custom:article:view', 'View custom articles',
        'MENU', NULL, CURRENT_TIMESTAMP
    ),
    (
        'legacy-custom-article-update', 'custom:article:update', 'Update custom articles',
        'BUTTON', 'legacy-custom-article-view', CURRENT_TIMESTAMP
    );

INSERT INTO "Menu" (
    "id", "parentId", "name", "path", "component", "sort", "type",
    "permissionCode", "visible", "status", "isSystem", "updatedAt"
) VALUES
    (
        'menu-dashboard', NULL, 'Dashboard', '/admin', NULL, 0, 'PAGE',
        NULL, true, 'ENABLED', true, CURRENT_TIMESTAMP
    ),
    (
        'content-root', NULL, 'Content', '/admin/content', NULL, 5, 'DIR',
        'content:view', true, 'ENABLED', true, CURRENT_TIMESTAMP
    ),
    (
        'system-root', NULL, 'System', '/admin/system', NULL, 10, 'DIR',
        'system:view', true, 'ENABLED', true, CURRENT_TIMESTAMP
    ),
    (
        'menu-system-menu', 'system-root', 'Menu management',
        '/admin/system/menu', 'system/menu/page', 14, 'PAGE',
        'system:menu:view', true, 'ENABLED', true, CURRENT_TIMESTAMP
    ),
    (
        'menu-system-permission', 'system-root', 'Permission management',
        '/admin/system/permission', 'system/permission/page', 15, 'PAGE',
        'system:permission:view', true, 'ENABLED', true, CURRENT_TIMESTAMP
    ),
    (
        'legacy-custom-root', NULL, 'Custom', '/admin/custom', NULL, 10, 'DIR',
        NULL, true, 'ENABLED', false, CURRENT_TIMESTAMP
    ),
    (
        'legacy-custom-article-page', 'legacy-custom-root', 'Custom articles',
        '/admin/custom/article', 'custom/article/page', 11, 'PAGE',
        'custom:article:view', true, 'ENABLED', false, CURRENT_TIMESTAMP
    );

-- Older schemas allowed PAGE rows to retain a stale external destination. The
-- upgraded PAGE must keep its internal route and clear this legacy value.
UPDATE "Menu"
SET "externalUrl" = 'https://legacy.example/custom-article'
WHERE "id" = 'legacy-custom-article-page';

INSERT INTO "RolePermission" ("roleId", "permissionId") VALUES
    ('role-editor', 'legacy-content-view'),
    ('role-editor', 'legacy-system-view'),
    ('role-editor', 'legacy-system-menu-view'),
    ('role-editor', 'legacy-system-permission-view'),
    ('role-editor', 'legacy-system-menu-create'),
    ('role-editor', 'legacy-system-menu-update'),
    ('role-editor', 'legacy-system-menu-delete'),
    ('role-editor', 'legacy-system-permission-create'),
    ('role-editor', 'legacy-system-permission-update'),
    ('role-editor', 'legacy-system-permission-delete'),
    ('role-editor', 'legacy-custom-article-view'),
    ('role-editor', 'legacy-custom-article-update');
