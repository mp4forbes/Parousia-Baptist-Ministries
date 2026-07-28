import fs from 'fs';
import path from 'path';
import { getPool } from './pool';
import { seedDatabase } from './seed';

let initialized = false;

export async function initializeDatabase(): Promise<void> {
  if (initialized) {
    return;
  }

  const pool = getPool();
  const candidates = [
    path.join(process.cwd(), 'db/schema.sql'),
    path.join(process.cwd(), 'src/lib/db/schema.sql'),
  ];
  const schemaPath = candidates.find((candidate) => fs.existsSync(candidate));
  if (!schemaPath) {
    throw new Error('Could not locate schema.sql for database initialization.');
  }
  const schema = fs.readFileSync(schemaPath, 'utf8');
  await pool.query(schema);
  await seedDatabase(pool);
  initialized = true;
}
