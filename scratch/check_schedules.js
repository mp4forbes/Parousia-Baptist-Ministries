const Database = require('better-sqlite3');
const path = require('path');
const dbPath = path.resolve(__dirname, '../church.db');
const db = new Database(dbPath);

console.log('--- SCHEDULES TABLE ---');
const schedules = db.prepare('SELECT * FROM service_schedules').all();
console.log(schedules);

console.log('\n--- EVENTS TABLE ---');
const events = db.prepare('SELECT * FROM events').all();
console.log(events);
