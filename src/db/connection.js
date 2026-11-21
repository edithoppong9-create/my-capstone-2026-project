import { DatabaseSync } from 'node:sqlite';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const currentDir = path.dirname(fileURLToPath(import.meta.url));

const schema = readFileSync(
  path.join(currentDir, 'schema.sql'),
  'utf8'
);

export function createDatabase(dbPath = 'data/ticketing.db') {
  const db = new DatabaseSync(dbPath);

  db.exec('PRAGMA foreign_keys = ON;');
  db.exec(schema);

  return db;
}