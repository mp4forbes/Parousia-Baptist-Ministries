import { Pool } from 'pg';

let pool: Pool | null = null;

export function getPool(): Pool {
  if (!pool) {
    const connectionString = process.env.DATABASE_URL;
    if (!connectionString) {
      throw new Error('DATABASE_URL is required. Set it in .env.local or Cloud Run secrets.');
    }

    pool = new Pool({
      connectionString,
      max: 10,
      ssl: process.env.PGSSLMODE === 'disable' ? false : undefined,
    });
  }

  return pool;
}
