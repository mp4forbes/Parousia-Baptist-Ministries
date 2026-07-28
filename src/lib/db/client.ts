import { Pool, type QueryResultRow } from 'pg';
import { getPool } from './pool';

let initPromise: Promise<void> | null = null;

function translateSqliteToPostgres(sql: string): string {
  let text = sql.trim();

  if (/INSERT OR REPLACE INTO settings/i.test(text)) {
    text = text.replace(/INSERT OR REPLACE INTO settings/i, 'INSERT INTO settings');
    if (!/ON CONFLICT/i.test(text)) {
      text += ' ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value';
    }
  } else if (/INSERT OR IGNORE INTO settings/i.test(text)) {
    text = text.replace(/INSERT OR IGNORE INTO settings/i, 'INSERT INTO settings');
    if (!/ON CONFLICT/i.test(text)) {
      text += ' ON CONFLICT (key) DO NOTHING';
    }
  } else if (/INSERT OR REPLACE INTO admin_otps/i.test(text)) {
    text = text.replace(/INSERT OR REPLACE INTO admin_otps/i, 'INSERT INTO admin_otps');
    if (!/ON CONFLICT/i.test(text)) {
      text += ' ON CONFLICT (email) DO UPDATE SET code = EXCLUDED.code, expires_at = EXCLUDED.expires_at';
    }
  } else if (/INSERT OR REPLACE INTO daily_devotionals/i.test(text)) {
    text = text.replace(/INSERT OR REPLACE INTO daily_devotionals/i, 'INSERT INTO daily_devotionals');
    if (!/ON CONFLICT/i.test(text)) {
      text += ` ON CONFLICT (date) DO UPDATE SET
        verse_ref_english = EXCLUDED.verse_ref_english,
        verse_ref_kreyol = EXCLUDED.verse_ref_kreyol,
        verse_text_english = EXCLUDED.verse_text_english,
        verse_text_kreyol = EXCLUDED.verse_text_kreyol,
        lesson_english = EXCLUDED.lesson_english,
        lesson_kreyol = EXCLUDED.lesson_kreyol,
        status = EXCLUDED.status`;
    }
  } else {
    text = text.replace(/INSERT OR REPLACE INTO/i, 'INSERT INTO');
    text = text.replace(/INSERT OR IGNORE INTO/i, 'INSERT INTO');
  }

  let paramIndex = 0;
  return text.replace(/\?/g, () => `$${++paramIndex}`);
}

async function ensureInitialized(): Promise<void> {
  if (!initPromise) {
    initPromise = (async () => {
      const { initializeDatabase } = await import('./init');
      await initializeDatabase();
    })();
  }

  await initPromise;
}

async function queryAll<T extends QueryResultRow>(sql: string, params: unknown[] = []): Promise<T[]> {
  await ensureInitialized();
  const text = translateSqliteToPostgres(sql);
  const result = await getPool().query<T>(text, params);
  return result.rows;
}

async function queryOne<T extends QueryResultRow>(sql: string, params: unknown[] = []): Promise<T | undefined> {
  const rows = await queryAll<T>(sql, params);
  return rows[0];
}

async function execute(sql: string, params: unknown[] = []): Promise<void> {
  await ensureInitialized();
  const text = translateSqliteToPostgres(sql);
  await getPool().query(text, params);
}

export interface PreparedStatement {
  all<T extends QueryResultRow = QueryResultRow>(...params: unknown[]): Promise<T[]>;
  get<T extends QueryResultRow = QueryResultRow>(...params: unknown[]): Promise<T | undefined>;
  run(...params: unknown[]): Promise<void>;
}

export function prepare(sql: string): PreparedStatement {
  return {
    all: <T extends QueryResultRow = QueryResultRow>(...params: unknown[]) => queryAll<T>(sql, params),
    get: <T extends QueryResultRow = QueryResultRow>(...params: unknown[]) => queryOne<T>(sql, params),
    run: (...params: unknown[]) => execute(sql, params),
  };
}

export const db = { prepare };

export async function query<T extends QueryResultRow>(sql: string, params: unknown[] = []): Promise<T[]> {
  return queryAll<T>(sql, params);
}

export async function runSql(sql: string, params: unknown[] = []): Promise<void> {
  await execute(sql, params);
}
