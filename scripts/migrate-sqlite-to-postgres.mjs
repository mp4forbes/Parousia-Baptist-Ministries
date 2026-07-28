#!/usr/bin/env node
/**
 * Migrate data from local SQLite church.db into PostgreSQL.
 *
 * Usage:
 *   npm install --no-save better-sqlite3
 *   SQLITE_PATH=./church.db DATABASE_URL=postgresql://... node scripts/migrate-sqlite-to-postgres.mjs
 */

import Database from 'better-sqlite3';
import fs from 'fs';
import path from 'path';
import { Pool } from 'pg';

const SQLITE_PATH = process.env.SQLITE_PATH || path.join(process.cwd(), 'church.db');
const DATABASE_URL = process.env.DATABASE_URL;

if (!DATABASE_URL) {
  console.error('DATABASE_URL is required.');
  process.exit(1);
}

const TABLES_IN_ORDER = [
  'settings',
  'admins',
  'admin_devices',
  'admin_otps',
  'ministries',
  'service_schedules',
  'haiti_missions',
  'local_outreach',
  'events',
  'registrations',
  'leads',
  'knowledge_base',
  'daily_devotionals',
  'sermons',
  'prayer_requests',
  'contact_submissions',
  'blog_posts',
];

const SERIAL_TABLES = new Set([
  'registrations',
  'admin_devices',
  'prayer_requests',
  'contact_submissions',
  'blog_posts',
  'daily_devotionals',
  'knowledge_base',
  'leads',
  'sermons',
  'events',
  'local_outreach',
  'haiti_missions',
  'service_schedules',
  'admins',
]);

function quoteIdent(name) {
  return `"${name.replace(/"/g, '""')}"`;
}

async function main() {
  console.log(`Reading SQLite database: ${SQLITE_PATH}`);
  const sqlite = new Database(SQLITE_PATH, { readonly: true });

  const pool = new Pool({
    connectionString: DATABASE_URL,
    ssl: process.env.PGSSLMODE === 'disable' ? false : undefined,
  });

  const client = await pool.connect();

  try {
    const schemaCandidates = [
      path.join(process.cwd(), 'src/lib/db/schema.sql'),
      path.join(process.cwd(), 'db/schema.sql'),
    ];
    const schemaPath = schemaCandidates.find((candidate) => fs.existsSync(candidate));
    if (schemaPath) {
      await client.query(fs.readFileSync(schemaPath, 'utf8'));
      console.log(`Applied schema from ${schemaPath}`);
    }

    await client.query('BEGIN');

    const tableList = TABLES_IN_ORDER.map(quoteIdent).join(', ');
    await client.query(`TRUNCATE TABLE ${tableList} RESTART IDENTITY CASCADE`);

    for (const table of TABLES_IN_ORDER) {
      const columns = sqlite
        .prepare(`PRAGMA table_info(${table})`)
        .all()
        .map((col) => col.name);

      if (columns.length === 0) {
        console.warn(`Skipping missing table: ${table}`);
        continue;
      }

      const rows = sqlite.prepare(`SELECT * FROM ${table}`).all();
      if (rows.length === 0) {
        console.log(`  ${table}: 0 rows`);
        continue;
      }

      const quotedColumns = columns.map(quoteIdent).join(', ');
      const placeholders = columns.map((_, index) => `$${index + 1}`).join(', ');
      const insertSql = `INSERT INTO ${quoteIdent(table)} (${quotedColumns}) VALUES (${placeholders})`;

      for (const row of rows) {
        const values = columns.map((column) => {
          const value = row[column];
          return value === undefined ? null : value;
        });
        await client.query(insertSql, values);
      }

      if (SERIAL_TABLES.has(table)) {
        await client.query(`
          SELECT setval(
            pg_get_serial_sequence('${table}', 'id'),
            COALESCE((SELECT MAX(id) FROM ${quoteIdent(table)}), 1),
            (SELECT COUNT(*) > 0 FROM ${quoteIdent(table)})
          )
        `);
      }

      console.log(`  ${table}: ${rows.length} rows`);
    }

    await client.query('COMMIT');
    console.log('Migration completed successfully.');
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Migration failed:', error);
    process.exitCode = 1;
  } finally {
    client.release();
    await pool.end();
    sqlite.close();
  }
}

main();
