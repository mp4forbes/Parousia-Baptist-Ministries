const Database = require('better-sqlite3');
const path = require('path');
const dbPath = path.resolve(__dirname, '../church.db');
const db = new Database(dbPath, { verbose: console.log });
const rows = db.prepare('SELECT * FROM settings').all();
console.log('Database Settings:', rows);
