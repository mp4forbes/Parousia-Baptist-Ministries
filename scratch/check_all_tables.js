const Database = require('better-sqlite3');
const path = require('path');
const dbPath = path.resolve(__dirname, '../church.db');
const db = new Database(dbPath);

console.log('--- DB PATH ---');
console.log(dbPath);

console.log('\n--- ADMINS TABLE ---');
const admins = db.prepare('SELECT * FROM admins').all();
console.log(admins);

console.log('\n--- MINISTRIES TABLE ---');
const ministries = db.prepare('SELECT slug, title_english, title_kreyol FROM ministries').all();
console.log(ministries);

console.log('\n--- SETTINGS SPECIFIC ---');
const checkPayable = db.prepare("SELECT * FROM settings WHERE key IN ('check_payable_to', 'zelle_name', 'devotional_theme')").all();
console.log(checkPayable);
