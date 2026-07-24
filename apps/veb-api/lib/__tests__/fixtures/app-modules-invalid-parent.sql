-- Apply to the schema immediately before 20260723120000_app_modules.
-- The child PAGE deliberately uses another PAGE as its parent. The migration
-- must abort before creating AppModule and leave all four rows unchanged.
INSERT INTO "Permission" ("id", "code", "name", "type", "updatedAt")
VALUES ('invalid-parent-view', 'invalid-parent:view', 'Invalid parent view', 'MENU', CURRENT_TIMESTAMP);

INSERT INTO "Permission" ("id", "code", "name", "type", "updatedAt")
VALUES ('invalid-child-view', 'invalid-child:view', 'Invalid child view', 'MENU', CURRENT_TIMESTAMP);

INSERT INTO "Menu" (
    "id", "parentId", "name", "path", "component", "type",
    "permissionCode", "visible", "status", "updatedAt"
) VALUES (
    'parent-page', NULL, 'Parent page', '/invalid-parent', 'example/page',
    'PAGE', 'invalid-parent:view', true, 'ENABLED', CURRENT_TIMESTAMP
);

INSERT INTO "Menu" (
    "id", "parentId", "name", "path", "component", "type",
    "permissionCode", "visible", "status", "updatedAt"
) VALUES (
    'child-page', 'parent-page', 'Child page', '/invalid-parent/child',
    'example/page', 'PAGE', 'invalid-child:view', true, 'ENABLED', CURRENT_TIMESTAMP
);
