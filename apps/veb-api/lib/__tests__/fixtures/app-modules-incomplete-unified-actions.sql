-- Both legacy create actions and the canonical menu page exist, but the old
-- permission-management parent page is missing. The paired actions therefore
-- cannot be folded into the unified menu page safely.
INSERT INTO "Permission" (
    "id", "code", "name", "type", "parentId", "updatedAt"
) VALUES
    (
        'paired-menu-view', 'system:menu:view', 'View menus',
        'MENU', NULL, CURRENT_TIMESTAMP
    ),
    (
        'paired-menu-create', 'system:menu:create', 'Create menus',
        'BUTTON', 'paired-menu-view', CURRENT_TIMESTAMP
    ),
    (
        'paired-permission-create', 'system:permission:create', 'Create permissions',
        'BUTTON', 'missing-permission-view', CURRENT_TIMESTAMP
    );

INSERT INTO "Menu" (
    "id", "parentId", "name", "path", "component", "sort", "type",
    "permissionCode", "visible", "status", "isSystem", "updatedAt"
) VALUES (
    'menu-system-menu', NULL, 'Menu management',
    '/admin/system/menu', 'system/menu/page', 10, 'PAGE',
    'system:menu:view', true, 'ENABLED', true, CURRENT_TIMESTAMP
);
