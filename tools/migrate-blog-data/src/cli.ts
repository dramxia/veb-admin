#!/usr/bin/env node

import 'dotenv/config';
import {
  parseMigrationMode,
  readMigrationEnvironment,
  runMigration,
} from './core';
import { PostgresMigrationRepository } from './postgres';

async function main() {
  const mode = parseMigrationMode(process.argv.slice(2));
  const environment = readMigrationEnvironment(process.env);
  const repository = new PostgresMigrationRepository(
    environment.sourceDatabaseUrl,
    environment.blogDatabaseUrl,
  );

  try {
    const report = await runMigration(mode, repository);
    process.stdout.write(`${JSON.stringify(report, null, 2)}\n`);
    if (!report.ok) process.exitCode = 1;
  } finally {
    await repository.close();
  }
}

main().catch((error: unknown) => {
  const message = error instanceof Error ? error.message : String(error);
  process.stderr.write(`博客数据迁移失败: ${message}\n`);
  process.exitCode = 1;
});
