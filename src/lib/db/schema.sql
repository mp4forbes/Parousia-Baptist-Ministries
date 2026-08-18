CREATE TABLE IF NOT EXISTS sermons (
  id SERIAL PRIMARY KEY,
  title_kreyol TEXT NOT NULL,
  title_english TEXT NOT NULL,
  date TEXT NOT NULL,
  speaker TEXT NOT NULL,
  youtube_id TEXT NOT NULL,
  description_kreyol TEXT,
  description_english TEXT
);

CREATE TABLE IF NOT EXISTS service_schedules (
  id SERIAL PRIMARY KEY,
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
  id SERIAL PRIMARY KEY,
  title_kreyol TEXT NOT NULL,
  title_english TEXT NOT NULL,
  date TEXT NOT NULL,
  description_kreyol TEXT NOT NULL,
  description_english TEXT NOT NULL,
  image_url TEXT,
  funds_raised DOUBLE PRECISION DEFAULT 0,
  funds_goal DOUBLE PRECISION DEFAULT 0
);

CREATE TABLE IF NOT EXISTS local_outreach (
  id SERIAL PRIMARY KEY,
  title_kreyol TEXT NOT NULL,
  title_english TEXT NOT NULL,
  description_kreyol TEXT NOT NULL,
  description_english TEXT NOT NULL,
  schedule_kreyol TEXT NOT NULL,
  schedule_english TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS events (
  id SERIAL PRIMARY KEY,
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
  id SERIAL PRIMARY KEY,
  event_id INTEGER NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  email TEXT,
  phone TEXT NOT NULL,
  notes TEXT
);

CREATE TABLE IF NOT EXISTS settings (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS knowledge_base (
  id SERIAL PRIMARY KEY,
  title TEXT NOT NULL,
  type TEXT NOT NULL,
  url TEXT NOT NULL,
  created_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS leads (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT NOT NULL,
  created_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS daily_devotionals (
  id SERIAL PRIMARY KEY,
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
  id SERIAL PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  created_at TEXT NOT NULL,
  password_hash TEXT,
  is_super_admin INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS admin_devices (
  id SERIAL PRIMARY KEY,
  email TEXT NOT NULL,
  device_hash TEXT NOT NULL,
  verified INTEGER DEFAULT 0,
  created_at TEXT NOT NULL,
  UNIQUE(email, device_hash)
);

CREATE TABLE IF NOT EXISTS admin_otps (
  email TEXT PRIMARY KEY,
  code TEXT NOT NULL,
  expires_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS prayer_requests (
  id SERIAL PRIMARY KEY,
  requester_name TEXT,
  request_text TEXT NOT NULL,
  is_anonymous INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS contact_submissions (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT,
  message TEXT NOT NULL,
  created_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS blog_posts (
  id SERIAL PRIMARY KEY,
  title_kreyol TEXT NOT NULL,
  title_english TEXT NOT NULL,
  content_kreyol TEXT NOT NULL,
  content_english TEXT NOT NULL,
  date TEXT NOT NULL,
  created_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS ministries (
  slug TEXT PRIMARY KEY,
  title_kreyol TEXT NOT NULL,
  title_english TEXT NOT NULL,
  description_kreyol TEXT NOT NULL,
  description_english TEXT NOT NULL,
  image_url TEXT NOT NULL,
  bullets_kreyol TEXT NOT NULL,
  bullets_english TEXT NOT NULL,
  contact_name TEXT DEFAULT '',
  contact_email TEXT DEFAULT '',
  contact_phone TEXT DEFAULT '',
  notification_emails TEXT DEFAULT '',
  google_sheet_id TEXT DEFAULT ''
);

CREATE TABLE IF NOT EXISTS ministry_signups (
  id SERIAL PRIMARY KEY,
  ministry_slug TEXT NOT NULL,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT,
  responses TEXT NOT NULL DEFAULT '{}',
  created_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS admin_section_configs (
  section_slug TEXT PRIMARY KEY,
  contact_name TEXT DEFAULT '',
  contact_email TEXT DEFAULT '',
  contact_phone TEXT DEFAULT '',
  notification_emails TEXT DEFAULT ''
);

ALTER TABLE ministries ADD COLUMN IF NOT EXISTS contact_name TEXT DEFAULT '';
ALTER TABLE ministries ADD COLUMN IF NOT EXISTS contact_email TEXT DEFAULT '';
ALTER TABLE ministries ADD COLUMN IF NOT EXISTS contact_phone TEXT DEFAULT '';
ALTER TABLE ministries ADD COLUMN IF NOT EXISTS notification_emails TEXT DEFAULT '';
ALTER TABLE ministries ADD COLUMN IF NOT EXISTS google_sheet_id TEXT DEFAULT '';

ALTER TABLE service_schedules ADD COLUMN IF NOT EXISTS image_url TEXT;
ALTER TABLE service_schedules ADD COLUMN IF NOT EXISTS is_livestreamed INTEGER DEFAULT 0;
ALTER TABLE admins ADD COLUMN IF NOT EXISTS password_hash TEXT;
ALTER TABLE admins ADD COLUMN IF NOT EXISTS is_super_admin INTEGER NOT NULL DEFAULT 0;
ALTER TABLE events ADD COLUMN IF NOT EXISTS images_json TEXT DEFAULT '[]';
ALTER TABLE events ADD COLUMN IF NOT EXISTS registration_type TEXT DEFAULT 'general';
ALTER TABLE registrations ADD COLUMN IF NOT EXISTS responses_json TEXT DEFAULT '{}';
ALTER TABLE events ADD COLUMN IF NOT EXISTS payment_required INTEGER DEFAULT 0;
ALTER TABLE events ADD COLUMN IF NOT EXISTS payment_amount TEXT DEFAULT '';
ALTER TABLE events ADD COLUMN IF NOT EXISTS payment_zelle_name TEXT DEFAULT '';
ALTER TABLE events ADD COLUMN IF NOT EXISTS payment_zelle_phone TEXT DEFAULT '';
ALTER TABLE events ADD COLUMN IF NOT EXISTS payment_instructions_english TEXT DEFAULT '';
ALTER TABLE events ADD COLUMN IF NOT EXISTS payment_instructions_kreyol TEXT DEFAULT '';
ALTER TABLE events ADD COLUMN IF NOT EXISTS end_date TEXT DEFAULT '';
ALTER TABLE registrations ADD COLUMN IF NOT EXISTS payment_status TEXT DEFAULT 'not_paid';
