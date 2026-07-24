-- A custom BUTTON needs Permission.parentId to resolve to one retained PAGE.
INSERT INTO "Permission" ("id", "code", "name", "type", "updatedAt")
VALUES (
    'unmapped-button-permission', 'custom:orphan:execute', 'Orphan button permission',
    'BUTTON', CURRENT_TIMESTAMP
);
