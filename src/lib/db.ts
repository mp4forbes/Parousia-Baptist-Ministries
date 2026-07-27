import Database from 'better-sqlite3';
import path from 'path';
import crypto from 'crypto';

// Locate database file in the root of the project
const dbPath = path.resolve(process.cwd(), 'church.db');
const db = new Database(dbPath, { timeout: 10000 });

// Enable WAL mode for performance
db.pragma('journal_mode = WAL');

// Define dynamic typescript interfaces
export interface AdminRecord {
  id: number;
  email: string;
  created_at: string;
}

export interface AdminDevice {
  id: number;
  email: string;
  device_hash: string;
  verified: number;
  created_at: string;
}

export interface PrayerRequest {
  id: number;
  requester_name: string | null;
  request_text: string;
  is_anonymous: number;
  created_at: string;
}

export interface ContactSubmission {
  id: number;
  name: string;
  email: string;
  phone: string | null;
  message: string;
  created_at: string;
}

export interface BlogPost {
  id: number;
  title_kreyol: string;
  title_english: string;
  content_kreyol: string;
  content_english: string;
  date: string;
  created_at: string;
}

export interface ServiceSchedule {
  id: number;
  day_kreyol: string;
  day_english: string;
  time: string;
  title_kreyol: string;
  title_english: string;
  description_kreyol: string;
  description_english: string;
  image_url?: string;
  is_livestreamed?: number;
}

export interface HaitiMission {
  id: number;
  title_kreyol: string;
  title_english: string;
  date: string;
  description_kreyol: string;
  description_english: string;
  image_url: string;
  funds_raised: number;
  funds_goal: number;
}

export interface LocalOutreach {
  id: number;
  title_kreyol: string;
  title_english: string;
  description_kreyol: string;
  description_english: string;
  schedule_kreyol: string;
  schedule_english: string;
}

export interface EventRecord {
  id: number;
  title_kreyol: string;
  title_english: string;
  date: string;
  time: string;
  location_kreyol: string;
  location_english: string;
  description_kreyol: string;
  description_english: string;
}

export interface Registration {
  id: number;
  event_id: number;
  event_title_kreyol?: string;
  event_title_english?: string;
  name: string;
  email: string;
  phone: string;
  notes: string;
}

export interface Lead {
  id: number;
  name: string;
  email: string;
  phone: string;
  created_at: string;
}

export interface DailyDevotional {
  id: number;
  date: string;
  verse_ref_english: string;
  verse_ref_kreyol: string;
  verse_text_english: string;
  verse_text_kreyol: string;
  lesson_english: string;
  lesson_kreyol: string;
  status: 'pending' | 'approved';
}

export interface Sermon {
  id: number;
  title_kreyol: string;
  title_english: string;
  date: string;
  speaker: string;
  youtube_id: string;
  description_kreyol: string;
  description_english: string;
}

export interface KnowledgeBaseItem {
  id: number;
  title: string;
  type: string; // 'pdf' | 'google_doc' | 'google_sheet' | 'link'
  url: string;
  created_at: string;
}

export interface Ministry {
  slug: string;
  title_kreyol: string;
  title_english: string;
  description_kreyol: string;
  description_english: string;
  image_url: string;
  bullets_kreyol: string;
  bullets_english: string;
}


// Create tables schemas if they don't exist yet
db.exec(`
  CREATE TABLE IF NOT EXISTS sermons (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title_kreyol TEXT NOT NULL,
    title_english TEXT NOT NULL,
    date TEXT NOT NULL,
    speaker TEXT NOT NULL,
    youtube_id TEXT NOT NULL,
    description_kreyol TEXT,
    description_english TEXT
  );

  CREATE TABLE IF NOT EXISTS service_schedules (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    day_kreyol TEXT NOT NULL,
    day_english TEXT NOT NULL,
    time TEXT NOT NULL,
    title_kreyol TEXT NOT NULL,
    title_english TEXT NOT NULL,
    description_kreyol TEXT,
    description_english TEXT,
    image_url TEXT,
    is_livestreamed INTEGER DEFAULT 0
  );

  CREATE TABLE IF NOT EXISTS haiti_missions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title_kreyol TEXT NOT NULL,
    title_english TEXT NOT NULL,
    date TEXT NOT NULL,
    description_kreyol TEXT NOT NULL,
    description_english TEXT NOT NULL,
    image_url TEXT,
    funds_raised REAL DEFAULT 0,
    funds_goal REAL DEFAULT 0
  );

  CREATE TABLE IF NOT EXISTS local_outreach (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title_kreyol TEXT NOT NULL,
    title_english TEXT NOT NULL,
    description_kreyol TEXT NOT NULL,
    description_english TEXT NOT NULL,
    schedule_kreyol TEXT NOT NULL,
    schedule_english TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS events (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title_kreyol TEXT NOT NULL,
    title_english TEXT NOT NULL,
    date TEXT NOT NULL,
    time TEXT NOT NULL,
    location_kreyol TEXT NOT NULL,
    location_english TEXT NOT NULL,
    description_kreyol TEXT,
    description_english TEXT
  );

  CREATE TABLE IF NOT EXISTS registrations (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    event_id INTEGER NOT NULL,
    name TEXT NOT NULL,
    email TEXT,
    phone TEXT NOT NULL,
    notes TEXT,
    FOREIGN KEY(event_id) REFERENCES events(id) ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS settings (
    key TEXT UNIQUE PRIMARY KEY,
    value TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS knowledge_base (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT NOT NULL,
    type TEXT NOT NULL,
    url TEXT NOT NULL,
    created_at TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS leads (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    email TEXT NOT NULL,
    phone TEXT NOT NULL,
    created_at TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS daily_devotionals (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    date TEXT UNIQUE NOT NULL,
    verse_ref_english TEXT NOT NULL,
    verse_ref_kreyol TEXT NOT NULL,
    verse_text_english TEXT NOT NULL,
    verse_text_kreyol TEXT NOT NULL,
    lesson_english TEXT NOT NULL,
    lesson_kreyol TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'pending'
  );

  CREATE TABLE IF NOT EXISTS admins (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    email TEXT UNIQUE NOT NULL,
    created_at TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS admin_devices (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    email TEXT NOT NULL,
    device_hash TEXT NOT NULL,
    verified INTEGER DEFAULT 0,
    created_at TEXT NOT NULL,
    UNIQUE(email, device_hash)
  );

  CREATE TABLE IF NOT EXISTS admin_otps (
    email TEXT UNIQUE PRIMARY KEY,
    code TEXT NOT NULL,
    expires_at TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS prayer_requests (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    requester_name TEXT,
    request_text TEXT NOT NULL,
    is_anonymous INTEGER NOT NULL DEFAULT 0,
    created_at TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS contact_submissions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    email TEXT NOT NULL,
    phone TEXT,
    message TEXT NOT NULL,
    created_at TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS blog_posts (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title_kreyol TEXT NOT NULL,
    title_english TEXT NOT NULL,
    content_kreyol TEXT NOT NULL,
    content_english TEXT NOT NULL,
    date TEXT NOT NULL,
    created_at TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS ministries (
    slug TEXT UNIQUE PRIMARY KEY,
    title_kreyol TEXT NOT NULL,
    title_english TEXT NOT NULL,
    description_kreyol TEXT NOT NULL,
    description_english TEXT NOT NULL,
    image_url TEXT NOT NULL,
    bullets_kreyol TEXT NOT NULL,
    bullets_english TEXT NOT NULL
  );
`);

// Migration block to append image_url to service_schedules if table already exists
try {
  db.exec('ALTER TABLE service_schedules ADD COLUMN image_url TEXT');
} catch (e) {
  // Ignore error if column already exists
}

// Migration block to append is_livestreamed to service_schedules if table already exists
try {
  db.exec('ALTER TABLE service_schedules ADD COLUMN is_livestreamed INTEGER DEFAULT 0');
} catch (e) {
  // Ignore error if column already exists
}

// Ensure Sunday service is always defaulted to live stream = 1 in the database
try {
  db.prepare("UPDATE service_schedules SET is_livestreamed = 1 WHERE LOWER(day_english) = 'sunday' OR LOWER(day_kreyol) = 'dimanch'").run();
} catch (e) {
  // Ignore error
}


// Seed default settings and details if empty
const settingsCount = db.prepare('SELECT count(*) as count FROM settings').get() as { count: number };
if (settingsCount.count === 0) {
  const insertSetting = db.prepare('INSERT INTO settings (key, value) VALUES (?, ?)');
  const hashedDefaultPass = crypto.createHash('sha256').update('parousie2026').digest('hex');
  insertSetting.run('admin_password', hashedDefaultPass);
  insertSetting.run('pastor_name', 'Pasteur Jean-Claude');
  insertSetting.run('pastor_message_kreyol', "Mwen kontan salye nou nan non Jezikri. Egliz nou an se yon fanmi kwayan k'ap sèvi Seyè a epi k'ap tann retou li. Vin adore ak nou!");
  insertSetting.run('pastor_message_english', "I welcome you in the name of Jesus Christ. Our church is a family of believers serving the Lord and waiting for His return. Come worship with us!");
  insertSetting.run('church_phone', "+1 (954) 555-1234");
  insertSetting.run('church_email', "info@eglizparousie.org");
  insertSetting.run('church_address', "789 Community Blvd, Fort Lauderdale, FL 33311");
}

// Unconditionally hash any existing plain-text admin_password in the settings table
try {
  const currentPass = db.prepare("SELECT value FROM settings WHERE key = 'admin_password'").get() as { value: string } | undefined;
  if (currentPass && currentPass.value && !/^[a-f0-9]{64}$/i.test(currentPass.value)) {
    const hashed = crypto.createHash('sha256').update(currentPass.value).digest('hex');
    db.prepare("INSERT OR REPLACE INTO settings (key, value) VALUES ('admin_password', ?)").run(hashed);
    console.log("[DB MIGRATE] Migrated plain-text admin_password to secure SHA-256 hash successfully.");
  }
} catch (e) {
  console.error("Error migrating plain-text admin_password to hash:", e);
}

// Ensure live stream, sermon archives, and custom background configurations are seeded
db.prepare("INSERT OR IGNORE INTO settings (key, value) VALUES ('pastor_name', 'Pasteur Jean-Claude')").run();
db.prepare("INSERT OR IGNORE INTO settings (key, value) VALUES ('home_background_url', 'https://images.unsplash.com/photo-1438032005730-c779502df39b?q=80&w=1920&auto=format&fit=crop')").run();
db.prepare("INSERT OR IGNORE INTO settings (key, value) VALUES ('live_stream_active', 'false')").run();
db.prepare("INSERT OR IGNORE INTO settings (key, value) VALUES ('live_stream_url', 'dQw4w9WgXcQ')").run();
db.prepare("INSERT OR IGNORE INTO settings (key, value) VALUES ('youtube_channel_url', 'https://www.youtube.com/@parousiabaptistchurch1438/streams')").run();
db.prepare("INSERT OR IGNORE INTO settings (key, value) VALUES ('live_stream_event_id', 'default')").run();
db.prepare("INSERT OR IGNORE INTO settings (key, value) VALUES ('custom_live_event_thumbnail_url', '')").run();
db.prepare("INSERT OR IGNORE INTO settings (key, value) VALUES ('logo_url', '/logo.png')").run();
db.prepare("INSERT OR IGNORE INTO settings (key, value) VALUES ('theme_primary', '#f59e0b')").run();
db.prepare("INSERT OR IGNORE INTO settings (key, value) VALUES ('theme_hover', '#d97706')").run();
db.prepare("INSERT OR IGNORE INTO settings (key, value) VALUES ('theme_accent', '#3b82f6')").run();
db.prepare("INSERT OR IGNORE INTO settings (key, value) VALUES ('theme_mode', 'dark')").run();
db.prepare("INSERT OR IGNORE INTO settings (key, value) VALUES ('hide_stripe', 'false')").run();
db.prepare("INSERT OR IGNORE INTO settings (key, value) VALUES ('cashapp_id', '$EgliseParousie')").run();
db.prepare("INSERT OR IGNORE INTO settings (key, value) VALUES ('venmo_id', '@EgliseParousie')").run();
db.prepare("INSERT OR IGNORE INTO settings (key, value) VALUES ('apple_pay_phone', '929 599 8809')").run();
db.prepare("INSERT OR IGNORE INTO settings (key, value) VALUES ('show_cashapp', 'true')").run();
db.prepare("INSERT OR IGNORE INTO settings (key, value) VALUES ('show_venmo', 'true')").run();
db.prepare("INSERT OR IGNORE INTO settings (key, value) VALUES ('show_apple_pay', 'true')").run();
db.prepare("INSERT OR IGNORE INTO settings (key, value) VALUES ('show_check', 'true')").run();
db.prepare("INSERT OR REPLACE INTO settings (key, value) VALUES ('check_payable_to', 'Parousia Baptist Ministries')").run();
db.prepare("INSERT OR IGNORE INTO settings (key, value) VALUES ('check_mailing_address', '789 Community Blvd, Fort Lauderdale, FL 33311')").run();
db.prepare("INSERT OR IGNORE INTO settings (key, value) VALUES ('hero_bg_opacity_light', '15')").run();
db.prepare("INSERT OR IGNORE INTO settings (key, value) VALUES ('hero_bg_opacity_dark', '25')").run();
db.prepare("INSERT OR IGNORE INTO settings (key, value) VALUES ('zelle_phone', '929 599 8809')").run();
db.prepare("INSERT OR REPLACE INTO settings (key, value) VALUES ('zelle_name', 'Parousia Baptist Ministries')").run();

// Seed devotional theme setting
db.prepare("INSERT OR IGNORE INTO settings (key, value) VALUES ('devotional_theme', 'none')").run();

// Seed default admin email if empty, and ensure super-admin straightlineaffiliate@gmail.com is unconditionally present
const superAdminEmail = 'straightlineaffiliate@gmail.com';
const superAdminExists = db.prepare('SELECT * FROM admins WHERE LOWER(email) = ?').get(superAdminEmail);
if (!superAdminExists) {
  db.prepare("INSERT INTO admins (email, created_at) VALUES (?, ?)").run(superAdminEmail, new Date().toISOString().split('T')[0]);
}

// Clean up non-existent seed emails if they are in the table
try {
  db.prepare("DELETE FROM admins WHERE LOWER(email) = 'pastor@parousiabaptist.org'").run();
  db.prepare("DELETE FROM admins WHERE LOWER(email) = 'it@parousiabaptist.org'").run();
} catch (e) {
  // Ignore error
}

// Seed default blog posts if empty
const blogCount = db.prepare('SELECT count(*) as count FROM blog_posts').get() as { count: number };
if (blogCount.count === 0) {
  const insertBlog = db.prepare(`
    INSERT INTO blog_posts (title_kreyol, title_english, content_kreyol, content_english, date, created_at)
    VALUES (?, ?, ?, ?, ?, ?)
  `);
  insertBlog.run(
    'Fèmte nan mitan Tanpèt yo', 'Steadfastness in the Storms of Life',
    'Frè m ak sè m yo, pandan n ap mache sou tè sa a, n ap jwenn anpil difikilte ak tanpèt. Men, nou mèt pran kouraj paske Jezikri te deja genyen mond lan pou nou. Lè n asire fèmte nou nan pawòl li, anyen pa kapab dekouraje nou.',
    'Dear brothers and sisters, as we walk this earth, we will face many trials and storms. But we must take heart because Jesus Christ has already overcome the world for us. When our lives are firmly anchored in His word, nothing can move us.',
    '2026-06-04', new Date().toISOString()
  );
  insertBlog.run(
    'Viv kòm yon Kominote Beni', 'Living as a Blessed Community',
    'Kominote nou an se yon kado ki gen anpil valè. Lè n sipòte yonn lòt ak lanmou ak respè, nou vin tounen yon vrè modèl kwasans espirityèl ak fratènèl pou tout moun bò kote nou.',
    'Our community is a deeply precious gift. When we support one another in love and mutual respect, we become a true beacon of spiritual growth and brotherly fellowship for everyone around us.',
    '2026-06-11', new Date().toISOString()
  );
}

// Seed default prayer requests if empty
const prayerCount = db.prepare('SELECT count(*) as count FROM prayer_requests').get() as { count: number };
if (prayerCount.count === 0) {
  const insertPrayer = db.prepare(`
    INSERT INTO prayer_requests (requester_name, request_text, is_anonymous, created_at)
    VALUES (?, ?, ?, ?)
  `);
  insertPrayer.run('Sè Marie', 'Tanpri lapriyè pou pitit gason m k ap pase yon egzamen lekòl trè enpòtan demen.', 0, new Date().toISOString());
  insertPrayer.run(null, 'Praying for healing and strength for a family member diagnosed with a severe illness. Thank you.', 1, new Date().toISOString());
  insertPrayer.run('Frè Pierre', 'Mwen mande lapriyè pou gidans ak direksyon nan travay mwen.', 0, new Date().toISOString());
}

// Seed default sermons if empty
const sermonsCount = db.prepare('SELECT count(*) as count FROM sermons').get() as { count: number };
if (sermonsCount.count === 0) {
  const insertSermon = db.prepare(`
    INSERT INTO sermons 
    (title_kreyol, title_english, date, speaker, youtube_id, description_kreyol, description_english) 
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `);

  insertSermon.run(
    'Mache Nan Lafwa Chak Jou', 'Walking in Faith Every Day', '2026-05-17',
    'Pasteur Jean-Claude', 'dQw4w9WgXcQ',
    'Yon mesaj ankourajan sou kòman pou n bati lafwa nou e fè Bondye konfyans nan mitan eprèv lavi a.',
    'An encouraging message on how to build our faith and trust God through the storms of life.'
  );

  insertSermon.run(
    'Retou Seyè a ak Preparasyon Nou', 'The Lord\'s Return and Our Readiness', '2026-05-10',
    'Pasteur Jean-Claude', 'dQw4w9WgXcQ',
    'Etid apwofondi sou 1 Thessaloniciens 4:16-17. Kisa sa vle di pou nou pare chak jou.',
    'A deep-dive study on 1 Thessalonians 4:16-17. What it means for us to live ready every day.'
  );
}

// Seed default service schedules if empty
const scheduleCount = db.prepare('SELECT count(*) as count FROM service_schedules').get() as { count: number };
if (scheduleCount.count === 0) {
  const insertSchedule = db.prepare(`
    INSERT INTO service_schedules 
    (day_kreyol, day_english, time, title_kreyol, title_english, description_kreyol, description_english) 
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `);
  
  insertSchedule.run(
    'Dimanch', 'Sunday', '9:00 AM - 11:30 AM',
    'Gwo Sèvis Adorasyon', 'Main Worship Service',
    'Vin koute pawòl Bondye a, chante lwanj, ak lapriyè ansanm ak tout fanmi an.',
    'Come hear the word of God, sing praises, and pray together with the whole family.'
  );
  
  insertSchedule.run(
    'Mèkredi', 'Wednesday', '7:00 PM - 8:30 PM',
    'Lapriyè ak Etid Biblik', 'Prayer & Bible Study',
    'Yon tan pou n chèche prezans Bondye e konprann Pawòl li pi byen nan kominote.',
    'A time to seek God\'s presence and understand His Word deeper in fellowship.'
  );
  
  insertSchedule.run(
    'Samdi', 'Saturday', '6:00 PM - 8:00 PM',
    'Sèvis Jèn yo', 'Youth Fellowship',
    'Aktivite kwasans espirityèl, amitye, ak kominyon fratènèl pou jèn yo.',
    'Spiritual growth activities, friendship, and brotherly fellowship for youth.'
  );
}

// Seed default Haiti missions if empty
const missionCount = db.prepare('SELECT count(*) as count FROM haiti_missions').get() as { count: number };
if (missionCount.count === 0) {
  const insertMission = db.prepare(`
    INSERT INTO haiti_missions 
    (title_kreyol, title_english, date, description_kreyol, description_english, image_url, funds_raised, funds_goal) 
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `);
  
  insertMission.run(
    'Sipò Lekòl Parousie nan Okay', 'Parousie School Support in Les Cayes', '2026-05-10',
    'N\'ap sipòte edikasyon ak manje chak jou pou plis pase 150 timoun lekòl nan zòn Okay, Ayiti. Nou bay materyèl ak salè pwofesè yo.',
    'Supporting education and daily hot meals for over 150 school children in Les Cayes, Haiti. We provide school supplies and teacher salaries.',
    'https://images.unsplash.com/photo-1547082299-de196ea013d6?q=80&w=600&auto=format&fit=crop',
    3500.0, 5000.0
  );
  
  insertMission.run(
    'Klinik Sante Mobil', 'Mobile Health Clinic', '2026-05-18',
    'Acha medikaman ak finansman ekipman pou klinik mobil nou an k\'ap pote swen medikal gratis bay fanmi nan zòn riral yo ki lwen lopital.',
    'Purchasing medicines and funding equipment for our mobile health clinic that brings free medical care to families in remote rural areas.',
    'https://images.unsplash.com/photo-1576091160550-2173dba999ef?q=80&w=600&auto=format&fit=crop',
    1200.0, 3000.0
  );
}

// Seed default local outreach if empty
const outreachCount = db.prepare('SELECT count(*) as count FROM local_outreach').get() as { count: number };
if (outreachCount.count === 0) {
  const insertOutreach = db.prepare(`
    INSERT INTO local_outreach 
    (title_kreyol, title_english, description_kreyol, description_english, schedule_kreyol, schedule_english) 
    VALUES (?, ?, ?, ?, ?, ?)
  `);
  
  insertOutreach.run(
    'Distribisyon Manje (Food Pantry)', 'Community Food Pantry',
    'Chak samdi maten, nou distribye bwat manje fre ak machandiz sèk bay fanmi ki nan bezwen nan zòn diaspora a san gade sou kote yo soti.',
    'Every Saturday morning, we distribute fresh food boxes and dry goods to families in need within our diaspora area regardless of background.',
    'Chak Samdi, 8:00 AM - 10:00 AM', 'Every Saturday, 8:00 AM - 10:00 AM'
  );
  
  insertOutreach.run(
    'Asistans pou Imigran', 'Immigrant Assistance Services',
    'Konsiltasyon gratis ak oryantasyon pou fanmi ki fenk rive pou ede yo konprann sistèm nan, tradwi dokiman, ak jwenn resous debaz.',
    'Free consultation and orientation for newly arrived families to help them navigate paperwork, translate documents, and find basic resources.',
    'Madi ak Jedi (Sèlman sou Randevou)', 'Tuesdays & Thursdays (By Appointment Only)'
  );
}

// Seed default events if empty
const eventCount = db.prepare('SELECT count(*) as count FROM events').get() as { count: number };
if (eventCount.count === 0) {
  const insertEvent = db.prepare(`
    INSERT INTO events 
    (title_kreyol, title_english, date, time, location_kreyol, location_english, description_kreyol, description_english) 
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `);
  
  insertEvent.run(
    'Gwo Piknik Fanmi Kominotè', 'Annual Community Family Picnic', '2026-06-20', '11:00 AM - 4:00 PM',
    'Parc Central (Zòn Pavilion B)', 'Central Park (Pavilion B Area)',
    'Yon bèl tan kominyon fratènèl ak aktivite pou timoun ak granmoun. Y\'ap gen babekyou gratis, bwason, ak bèl konvèsasyon. Tout kominote a envite!',
    'A wonderful time of Christian fellowship and activities for children and adults. Free BBQ, drinks, and great conversations. The entire community is welcome!'
  );
  
  insertEvent.run(
    'Konferans Jèn yo "Leve Kanpe"', 'Youth Conference "Rise Up"', '2026-07-10', '6:00 PM - 9:00 PM',
    'Tanp Egliz la', 'Church Sanctuary',
    'Yon sware espesyal ak adorasyon dinamik, konferansye envite, ak bèl pataj sou defi ak opòtinite jèn kretyen yo genyen jodi a.',
    'A special evening with dynamic worship, guest speakers, and sharing panels on the challenges and opportunities young Christians face today.'
  );
}

// Seed devotional settings
db.prepare("INSERT OR IGNORE INTO settings (key, value) VALUES ('devotional_auto_publish', 'false')").run();

// Seed initial daily devotional if empty
const devotionalCount = db.prepare('SELECT count(*) as count FROM daily_devotionals').get() as { count: number };
if (devotionalCount.count === 0) {
  const insertDevotional = db.prepare(`
    INSERT INTO daily_devotionals 
    (date, verse_ref_english, verse_ref_kreyol, verse_text_english, verse_text_kreyol, lesson_english, lesson_kreyol, status) 
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `);
  
  insertDevotional.run(
    '2026-05-25',
    'Galatians 6:9',
    'Galat 6:9',
    'And let us not grow weary of doing good, for in due season we will reap, if we do not give up.',
    'Annou pa janm bouke fè sa ki byen. Paske, si nou pa dekouraje, n\'a rekòlte lè lè a va rive.',
    'Dear family, serving others and doing good can sometimes feel exhausting, especially when we are far from home. But the Apostle Paul reminds us that our labor in the Lord is never in vain and a bountiful harvest of blessings is coming. Let us stand united today, strengthening one another\'s hands to keep shining Christ\'s light in our community.',
    'Frè m ak sè m yo, fè sa ki byen kapab fatigan pafwa, sitou lè nou lwen peyi nou. Men, Apòt Pòl fè nou chonje ke travay nou pou Seyè a pa janm anven e yon bèl rekòt benediksyon ap vini. Annou rete ini jodi a, pou nou ankouraje yonn lòt pou n kontinye klere limyè Kris la nan mitan kominote nou an.',
    'approved'
  );
}

// Seed default ministries if empty
const ministryCount = db.prepare('SELECT count(*) as count FROM ministries').get() as { count: number };
if (ministryCount.count === 0) {
  const insertMinistry = db.prepare(`
    INSERT INTO ministries 
    (slug, title_kreyol, title_english, description_kreyol, description_english, image_url, bullets_kreyol, bullets_english) 
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `);
  
  insertMinistry.run(
    'women',
    'Ministè Medam Yo',
    "Women's Ministry",
    'Ministè sa a reyini tout sè nan legliz la pou bati yon solidite espirityèl ak fratènèl. Nou fè etid biblik, priyè espesyal, ak seminè pou ede chak fanm mache daprè modèl Bib la rekòmande.',
    "Our Women's Ministry gathers sisters in Christ to build spiritual strength, fellowship, and support. Through targeted Bible studies, prayer groups, and workshops, we empower women to live out their biblical calling.",
    'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?q=80&w=800&auto=format&fit=crop',
    'Reyinyon Priyè: Chak Samdi a 6:00 AM\nEtid Biblik Espesyal ak Konferans Anyèl\nSipò ak swen fratènèl pou tout medam yo',
    "Weekly Prayer Fellowship: Saturdays at 6:00 AM\nSpecial Bible Studies and Annual Women's Conference\nMutual encouragement, support networks, and community outreach"
  );

  insertMinistry.run(
    'men',
    'Ministè Gason Yo',
    "Men's Fellowship",
    'Objektif nou se fòme gason daprè kè Bondye pou yo kapab lidè espirityèl ki solid nan fwaye yo, nan legliz la, ak nan kominote a. Gason yo reyini pou pataje, ankouraje yonn lòt, epi grandi ansanm.',
    "We aim to raise godly men who stand strong as spiritual leaders in their homes, in our ministry, and in the community. Our fellowship provides a safe space for accountability, Bible study, and discipleship.",
    'https://images.unsplash.com/photo-1507679799987-c73779587ccf?q=80&w=800&auto=format&fit=crop',
    'Reyinyon Etid ak Kominote: Premye Samdi nan mwa a\nSeminè sou responsabilite fanmi ak finans\nAktivite sèvis ak konstriksyon',
    "Monthly Discipleship Breakfast: First Saturday of the month\nSeminars on family leadership, finance, and biblical manhood\nService projects and practical community assistance"
  );

  insertMinistry.run(
    'children',
    'Lekòl Dimanch & Jenès',
    "Children & Youth Ministry",
    "N'ap enstwi timoun ak jèn yo nan chemen Seyè a depi nan ti laj yo. Nou ofri klas Lekòl Dimanch enteresan, aktivite mizikal, jwèt, ak fòmasyon biblik ki prepare yo pou yon lafwa solid ak dirab.",
    "We believe in investing in the next generation. Our children's Sunday school and youth programs offer engaging, age-appropriate lessons, worship, music, and fun games that ground young hearts in God's Word.",
    'https://images.unsplash.com/photo-1489710437720-ebb67ec84dd2?q=80&w=800&auto=format&fit=crop',
    'Klas Lekòl Dimanch: Chak Dimanch a 10:30 AM\nKoral Timoun ak Jèn yo\nKan Biblik pandan ete',
    "Sunday School Classes: Sundays at 10:30 AM\nChildren's Choir and Instrumental Training\nAnnual Vacation Bible School (VBS) summer camps"
  );
}

export default db;
export { db };
