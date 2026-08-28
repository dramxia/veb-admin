#!/bin/sh
set -eu

name="veb-init-check-$$"
port="${VEB_INIT_CHECK_PORT:-55432}"
cleanup() {
  docker rm -f "$name" >/dev/null 2>&1 || true
}
trap cleanup EXIT INT TERM

docker run -d --rm --name "$name" -e POSTGRES_PASSWORD=verify -e POSTGRES_DB=veb_verify -p "127.0.0.1:${port}:5432" postgres:15-alpine >/dev/null
until docker exec "$name" pg_isready -U postgres -d veb_verify >/dev/null 2>&1; do sleep 1; done
DATABASE_URL="postgresql://postgres:verify@127.0.0.1:${port}/veb_verify?schema=public" pnpm --filter @veb/core-api exec prisma migrate deploy --schema prisma/schema.prisma
DATABASE_URL="postgresql://postgres:verify@127.0.0.1:${port}/veb_verify?schema=public" SEED_ADMIN_PASSWORD="verify-admin" pnpm --filter @veb/core-api exec tsx prisma/seed.ts
article_slugs="$(
  docker exec "$name" psql -U postgres -d veb_verify -qAt -v ON_ERROR_STOP=1 -c '
    INSERT INTO "Article" ("id", "title", "contentMarkdown", "authorId", "updatedAt")
    VALUES
      ('"'"'verify-article-1'"'"', '"'"'Verify article 1'"'"', '"'"''"'"', (SELECT "id" FROM "User" WHERE "username" = '"'"'admin'"'"'), CURRENT_TIMESTAMP),
      ('"'"'verify-article-2'"'"', '"'"'Verify article 2'"'"', '"'"''"'"', (SELECT "id" FROM "User" WHERE "username" = '"'"'admin'"'"'), CURRENT_TIMESTAMP);
    SELECT string_agg("slug", '"'"','"'"' ORDER BY "slug")
    FROM "Article"
    WHERE "id" IN ('"'"'verify-article-1'"'"', '"'"'verify-article-2'"'"');
  '
)"
if [ "$article_slugs" != "20000,20001" ]; then
  echo "article slug sequence verification failed: expected 20000,20001, got $article_slugs" >&2
  exit 1
fi
