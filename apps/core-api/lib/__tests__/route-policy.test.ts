import fs from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';

const delegatedHandlerModules = new Set([
  '@/src/http/blog-manage',
  '@/src/http/blog-public',
]);

function routeFiles(directory: string): string[] {
  return fs.readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const target = path.join(directory, entry.name);
    return entry.isDirectory()
      ? routeFiles(target)
      : entry.name === 'route.ts'
        ? [target]
        : [];
  });
}

function delegatedHandlerModule(source: string) {
  return source.match(/from ['"](@\/src\/http\/[^'"]+)['"]/u)?.[1];
}

describe('route access policy coverage', () => {
  it('classifies every standard route handler except the Auth.js adapter', () => {
    const apiRoot = path.resolve(process.cwd(), 'app/api');
    const files = routeFiles(apiRoot).filter(
      (file) => !file.includes(`${path.sep}auth${path.sep}[...nextauth]`),
    );

    const missing = files.flatMap((file) => {
      const source = fs.readFileSync(file, 'utf8');
      const delegatedModule = delegatedHandlerModule(source);
      if (source.includes('defineApiRoute')) return [];
      if (delegatedModule && delegatedHandlerModules.has(delegatedModule)) {
        return [];
      }
      return [path.relative(apiRoot, file)];
    });

    expect(missing).toEqual([]);
  });

  it('allows no duplicate session or declared-permission guards in handlers', () => {
    const files = [
      ...routeFiles(path.resolve(process.cwd(), 'app/api')),
      ...[...delegatedHandlerModules].map((moduleName) =>
        path.resolve(process.cwd(), `${moduleName.replace('@/', '')}.ts`),
      ),
    ];
    const guardedFiles = files.flatMap((file) => {
      const source = fs.readFileSync(file, 'utf8');
      const matches = source.match(
        /\b(?:requireUser|requirePermission)\s*\(/gu,
      );
      return (
        matches?.map(
          (match) => `${path.relative(process.cwd(), file)}: ${match}`,
        ) ?? []
      );
    });

    expect(guardedFiles).toEqual([]);
  });

  it('builds every delegated HTTP handler with defineApiRoute', () => {
    const unclassified = [...delegatedHandlerModules].flatMap((moduleName) => {
      const file = path.resolve(
        process.cwd(),
        `${moduleName.replace('@/', '')}.ts`,
      );
      const source = fs.readFileSync(file, 'utf8');
      const exportedHandlers = [
        ...source.matchAll(/export const (\w+)\s*=\s*/gu),
      ].map((match) => match[1]);
      return exportedHandlers
        .filter(
          (name) =>
            !new RegExp(
              `export const ${name}\\s*=\\s*defineApiRoute\\b`,
              'u',
            ).test(source),
        )
        .map((name) => `${moduleName}:${name}`);
    });

    expect(unclassified).toEqual([]);
  });
});
