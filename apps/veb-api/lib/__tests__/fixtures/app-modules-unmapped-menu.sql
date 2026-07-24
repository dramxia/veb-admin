-- A legacy MENU permission without one retained PAGE or LINK is ambiguous and
-- must stop the final migration before any schema or data changes are retained.
INSERT INTO "Permission" ("id", "code", "name", "type", "updatedAt")
VALUES (
    'unmapped-menu-permission', 'custom:orphan:view', 'Orphan menu permission',
    'MENU', CURRENT_TIMESTAMP
);
