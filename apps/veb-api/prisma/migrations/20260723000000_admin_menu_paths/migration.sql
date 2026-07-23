-- Prisma does not wrap PostgreSQL migrations in a transaction by default. Keep
-- the preflight and all writes atomic, and prevent concurrent menu writes from
-- invalidating the preflight result.
BEGIN;

LOCK TABLE "Menu" IN SHARE ROW EXCLUSIVE MODE;

-- Validate the path each row will have after all transformations before making
-- any changes. Harmless legacy separators are normalized in the projection,
-- while unsafe URL syntax and path segments stop the migration without writes.
DO $$
BEGIN
  IF EXISTS (
    WITH projected_paths AS (
      SELECT REGEXP_REPLACE(
        REGEXP_REPLACE(
          CASE
            WHEN "type" = 'LINK' AND "path" ~* '^https?://'
              THEN '/admin/link/' || "id"
            WHEN "path" = '/admin' OR "path" LIKE '/admin/%'
              THEN "path"
            WHEN "path" = '/'
              THEN '/admin'
            WHEN "path" LIKE '/%'
              THEN '/admin' || "path"
            ELSE '/admin/' || "path"
          END,
          '/+',
          '/',
          'g'
        ),
        '/+$',
        ''
      ) AS "path"
      FROM "Menu"
    )
    SELECT 1
    FROM projected_paths
    WHERE "path" <> '/admin'
      AND (
        "path" NOT LIKE '/admin/%'
        OR "path" ~ '(^|/)\.{1,2}(/|$)'
        OR POSITION('?' IN "path") > 0
        OR POSITION('#' IN "path") > 0
        OR POSITION('%' IN "path") > 0
        OR POSITION(CHR(92) IN "path") > 0
        OR "path" ~ '[[:space:]]'
      )
  ) THEN
    RAISE EXCEPTION 'Menu.path contains a non-canonical admin route';
  END IF;
END $$;

-- Older versions allowed HTTP(S) LINK destinations to live in path. Preserve
-- those destinations before path becomes an internal admin route.
UPDATE "Menu"
SET
  "externalUrl" = COALESCE(NULLIF(BTRIM("externalUrl"), ''), "path"),
  "path" = '/admin/link/' || "id"
WHERE "type" = 'LINK'
  AND "path" ~* '^https?://';

-- Move existing internal menu routes under the admin module. The predicates
-- make this safe to re-run.
UPDATE "Menu"
SET "path" = CASE
  WHEN "path" = '/' THEN '/admin'
  WHEN "path" LIKE '/%' THEN '/admin' || "path"
  ELSE '/admin/' || "path"
END
WHERE "path" <> '/admin'
  AND "path" NOT LIKE '/admin/%';

-- Canonicalize harmless legacy separators so stored paths match browser URLs.
UPDATE "Menu"
SET "path" = REGEXP_REPLACE(REGEXP_REPLACE("path", '/+', '/', 'g'), '/+$', '')
WHERE "path" LIKE '/admin/%';

COMMIT;
