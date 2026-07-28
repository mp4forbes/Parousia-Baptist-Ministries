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
  created_at TEXT NOT NULL
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
  bullets_english TEXT NOT NULL
);

ALTER TABLE service_schedules ADD COLUMN IF NOT EXISTS image_url TEXT;
ALTER TABLE service_schedules ADD COLUMN IF NOT EXISTS is_livestreamed INTEGER DEFAULT 0;
