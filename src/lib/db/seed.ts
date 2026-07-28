import crypto from 'crypto';
import type { Pool } from 'pg';

async function countRows(pool: Pool, table: string): Promise<number> {
  const result = await pool.query<{ count: string }>(`SELECT COUNT(*)::text AS count FROM ${table}`);
  return Number(result.rows[0]?.count ?? 0);
}

async function upsertSetting(pool: Pool, key: string, value: string, replace = false): Promise<void> {
  if (replace) {
    await pool.query(
      `INSERT INTO settings (key, value) VALUES ($1, $2)
       ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value`,
      [key, value]
    );
    return;
  }

  await pool.query(
    `INSERT INTO settings (key, value) VALUES ($1, $2)
     ON CONFLICT (key) DO NOTHING`,
    [key, value]
  );
}

export async function seedDatabase(pool: Pool): Promise<void> {
  const settingsCount = await countRows(pool, 'settings');
  if (settingsCount === 0) {
    const hashedDefaultPass = crypto.createHash('sha256').update('parousie2026').digest('hex');
    await upsertSetting(pool, 'admin_password', hashedDefaultPass, true);
    await upsertSetting(pool, 'pastor_name', 'Pasteur Jean-Claude');
    await upsertSetting(pool, 'pastor_message_kreyol', "Mwen kontan salye nou nan non Jezikri. Egliz nou an se yon fanmi kwayan k'ap sèvi Seyè a epi k'ap tann retou li. Vin adore ak nou!");
    await upsertSetting(pool, 'pastor_message_english', "I welcome you in the name of Jesus Christ. Our church is a family of believers serving the Lord and waiting for His return. Come worship with us!");
    await upsertSetting(pool, 'church_phone', '+1 (954) 555-1234');
    await upsertSetting(pool, 'church_email', 'info@eglizparousie.org');
    await upsertSetting(pool, 'church_address', '789 Community Blvd, Fort Lauderdale, FL 33311');
  } else {
    const currentPass = await pool.query<{ value: string }>(
      "SELECT value FROM settings WHERE key = 'admin_password'"
    );
    const value = currentPass.rows[0]?.value;
    if (value && !/^[a-f0-9]{64}$/i.test(value)) {
      const hashed = crypto.createHash('sha256').update(value).digest('hex');
      await upsertSetting(pool, 'admin_password', hashed, true);
      console.log('[DB MIGRATE] Migrated plain-text admin_password to secure SHA-256 hash successfully.');
    }
  }

  const defaultSettings: Array<[string, string, boolean?]> = [
    ['pastor_name', 'Pasteur Jean-Claude'],
    ['home_background_url', 'https://images.unsplash.com/photo-1438032005730-c779502df39b?q=80&w=1920&auto=format&fit=crop'],
    ['live_stream_active', 'false'],
    ['live_stream_url', 'dQw4w9WgXcQ'],
    ['youtube_channel_url', 'https://www.youtube.com/@parousiabaptistchurch1438/streams'],
    ['live_stream_event_id', 'default'],
    ['custom_live_event_thumbnail_url', ''],
    ['logo_url', '/logo.png'],
    ['theme_primary', '#f59e0b'],
    ['theme_hover', '#d97706'],
    ['theme_accent', '#3b82f6'],
    ['theme_mode', 'dark'],
    ['hide_stripe', 'false'],
    ['cashapp_id', '$EgliseParousie'],
    ['venmo_id', '@EgliseParousie'],
    ['apple_pay_phone', '929 599 8809'],
    ['show_cashapp', 'true'],
    ['show_venmo', 'true'],
    ['show_apple_pay', 'true'],
    ['show_check', 'true'],
    ['check_payable_to', 'Parousia Baptist Ministries', true],
    ['check_mailing_address', '789 Community Blvd, Fort Lauderdale, FL 33311'],
    ['hero_bg_opacity_light', '15'],
    ['hero_bg_opacity_dark', '25'],
    ['zelle_phone', '929 599 8809'],
    ['zelle_name', 'Parousia Baptist Ministries', true],
    ['devotional_theme', 'none'],
    ['devotional_auto_publish', 'false'],
  ];

  for (const [key, value, replace] of defaultSettings) {
    await upsertSetting(pool, key, value, replace);
  }

  await pool.query(
    "UPDATE service_schedules SET is_livestreamed = 1 WHERE LOWER(day_english) = 'sunday' OR LOWER(day_kreyol) = 'dimanch'"
  );

  const superAdminEmail = 'straightlineaffiliate@gmail.com';
  await pool.query(
    `INSERT INTO admins (email, created_at) VALUES ($1, $2)
     ON CONFLICT (email) DO NOTHING`,
    [superAdminEmail, new Date().toISOString().split('T')[0]]
  );

  await pool.query("DELETE FROM admins WHERE LOWER(email) = 'pastor@parousiabaptist.org'");
  await pool.query("DELETE FROM admins WHERE LOWER(email) = 'it@parousiabaptist.org'");

  if ((await countRows(pool, 'blog_posts')) === 0) {
    await pool.query(
      `INSERT INTO blog_posts (title_kreyol, title_english, content_kreyol, content_english, date, created_at)
       VALUES ($1, $2, $3, $4, $5, $6), ($7, $8, $9, $10, $11, $12)`,
      [
        'Fèmte nan mitan Tanpèt yo', 'Steadfastness in the Storms of Life',
        'Frè m ak sè m yo, pandan n ap mache sou tè sa a, n ap jwenn anpil difikilte ak tanpèt. Men, nou mèt pran kouraj paske Jezikri te deja genyen mond lan pou nou. Lè n asire fèmte nou nan pawòl li, anyen pa kapab dekouraje nou.',
        'Dear brothers and sisters, as we walk this earth, we will face many trials and storms. But we must take heart because Jesus Christ has already overcome the world for us. When our lives are firmly anchored in His word, nothing can move us.',
        '2026-06-04', new Date().toISOString(),
        'Viv kòm yon Kominote Beni', 'Living as a Blessed Community',
        'Kominote nou an se yon kado ki gen anpil valè. Lè n sipòte yonn lòt ak lanmou ak respè, nou vin tounen yon vrè modèl kwasans espirityèl ak fratènèl pou tout moun bò kote nou.',
        'Our community is a deeply precious gift. When we support one another in love and mutual respect, we become a true beacon of spiritual growth and brotherly fellowship for everyone around us.',
        '2026-06-11', new Date().toISOString(),
      ]
    );
  }

  if ((await countRows(pool, 'prayer_requests')) === 0) {
    await pool.query(
      `INSERT INTO prayer_requests (requester_name, request_text, is_anonymous, created_at)
       VALUES ($1, $2, $3, $4), ($5, $6, $7, $8), ($9, $10, $11, $12)`,
      [
        'Sè Marie', 'Tanpri lapriyè pou pitit gason m k ap pase yon egzamen lekòl trè enpòtan demen.', 0, new Date().toISOString(),
        null, 'Praying for healing and strength for a family member diagnosed with a severe illness. Thank you.', 1, new Date().toISOString(),
        'Frè Pierre', 'Mwen mande lapriyè pou gidans ak direksyon nan travay mwen.', 0, new Date().toISOString(),
      ]
    );
  }

  if ((await countRows(pool, 'sermons')) === 0) {
    await pool.query(
      `INSERT INTO sermons
       (title_kreyol, title_english, date, speaker, youtube_id, description_kreyol, description_english)
       VALUES ($1, $2, $3, $4, $5, $6, $7), ($8, $9, $10, $11, $12, $13, $14)`,
      [
        'Mache Nan Lafwa Chak Jou', 'Walking in Faith Every Day', '2026-05-17',
        'Pasteur Jean-Claude', 'dQw4w9WgXcQ',
        'Yon mesaj ankourajan sou kòman pou n bati lafwa nou e fè Bondye konfyans nan mitan eprèv lavi a.',
        'An encouraging message on how to build our faith and trust God through the storms of life.',
        'Retou Seyè a ak Preparasyon Nou', "The Lord's Return and Our Readiness", '2026-05-10',
        'Pasteur Jean-Claude', 'dQw4w9WgXcQ',
        'Etid apwofondi sou 1 Thessaloniciens 4:16-17. Kisa sa vle di pou nou pare chak jou.',
        'A deep-dive study on 1 Thessalonians 4:16-17. What it means for us to live ready every day.',
      ]
    );
  }

  if ((await countRows(pool, 'service_schedules')) === 0) {
    await pool.query(
      `INSERT INTO service_schedules
       (day_kreyol, day_english, time, title_kreyol, title_english, description_kreyol, description_english)
       VALUES ($1, $2, $3, $4, $5, $6, $7), ($8, $9, $10, $11, $12, $13, $14), ($15, $16, $17, $18, $19, $20, $21)`,
      [
        'Dimanch', 'Sunday', '9:00 AM - 11:30 AM',
        'Gwo Sèvis Adorasyon', 'Main Worship Service',
        'Vin koute pawòl Bondye a, chante lwanj, ak lapriyè ansanm ak tout fanmi an.',
        'Come hear the word of God, sing praises, and pray together with the whole family.',
        'Mèkredi', 'Wednesday', '7:00 PM - 8:30 PM',
        'Lapriyè ak Etid Biblik', 'Prayer & Bible Study',
        'Yon tan pou n chèche prezans Bondye e konprann Pawòl li pi byen nan kominote.',
        "A time to seek God's presence and understand His Word deeper in fellowship.",
        'Samdi', 'Saturday', '6:00 PM - 8:00 PM',
        'Sèvis Jèn yo', 'Youth Fellowship',
        'Aktivite kwasans espirityèl, amitye, ak kominyon fratènèl pou jèn yo.',
        'Spiritual growth activities, friendship, and brotherly fellowship for youth.',
      ]
    );
  }

  if ((await countRows(pool, 'haiti_missions')) === 0) {
    await pool.query(
      `INSERT INTO haiti_missions
       (title_kreyol, title_english, date, description_kreyol, description_english, image_url, funds_raised, funds_goal)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8), ($9, $10, $11, $12, $13, $14, $15, $16)`,
      [
        'Sipò Lekòl Parousie nan Okay', 'Parousie School Support in Les Cayes', '2026-05-10',
        "N'ap sipòte edikasyon ak manje chak jou pou plis pase 150 timoun lekòl nan zòn Okay, Ayiti. Nou bay materyèl ak salè pwofesè yo.",
        'Supporting education and daily hot meals for over 150 school children in Les Cayes, Haiti. We provide school supplies and teacher salaries.',
        'https://images.unsplash.com/photo-1547082299-de196ea013d6?q=80&w=600&auto=format&fit=crop',
        3500.0, 5000.0,
        'Klinik Sante Mobil', 'Mobile Health Clinic', '2026-05-18',
        "Acha medikaman ak finansman ekipman pou klinik mobil nou an k'ap pote swen medikal gratis bay fanmi nan zòn riral yo ki lwen lopital.",
        'Purchasing medicines and funding equipment for our mobile health clinic that brings free medical care to families in remote rural areas.',
        'https://images.unsplash.com/photo-1576091160550-2173dba999ef?q=80&w=600&auto=format&fit=crop',
        1200.0, 3000.0,
      ]
    );
  }

  if ((await countRows(pool, 'local_outreach')) === 0) {
    await pool.query(
      `INSERT INTO local_outreach
       (title_kreyol, title_english, description_kreyol, description_english, schedule_kreyol, schedule_english)
       VALUES ($1, $2, $3, $4, $5, $6), ($7, $8, $9, $10, $11, $12)`,
      [
        'Distribisyon Manje (Food Pantry)', 'Community Food Pantry',
        'Chak samdi maten, nou distribye bwat manje fre ak machandiz sèk bay fanmi ki nan bezwen nan zòn diaspora a san gade sou kote yo soti.',
        'Every Saturday morning, we distribute fresh food boxes and dry goods to families in need within our diaspora area regardless of background.',
        'Chak Samdi, 8:00 AM - 10:00 AM', 'Every Saturday, 8:00 AM - 10:00 AM',
        'Asistans pou Imigran', 'Immigrant Assistance Services',
        'Konsiltasyon gratis ak oryantasyon pou fanmi ki fenk rive pou ede yo konprann sistèm nan, tradwi dokiman, ak jwenn resous debaz.',
        'Free consultation and orientation for newly arrived families to help them navigate paperwork, translate documents, and find basic resources.',
        'Madi ak Jedi (Sèlman sou Randevou)', 'Tuesdays & Thursdays (By Appointment Only)',
      ]
    );
  }

  if ((await countRows(pool, 'events')) === 0) {
    await pool.query(
      `INSERT INTO events
       (title_kreyol, title_english, date, time, location_kreyol, location_english, description_kreyol, description_english)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8), ($9, $10, $11, $12, $13, $14, $15, $16)`,
      [
        'Gwo Piknik Fanmi Kominotè', 'Annual Community Family Picnic', '2026-06-20', '11:00 AM - 4:00 PM',
        'Parc Central (Zòn Pavilion B)', 'Central Park (Pavilion B Area)',
        "Yon bèl tan kominyon fratènèl ak aktivite pou timoun ak granmoun. Y'ap gen babekyou gratis, bwason, ak bèl konvèsasyon. Tout kominote a envite!",
        'A wonderful time of Christian fellowship and activities for children and adults. Free BBQ, drinks, and great conversations. The entire community is welcome!',
        'Konferans Jèn yo "Leve Kanpe"', 'Youth Conference "Rise Up"', '2026-07-10', '6:00 PM - 9:00 PM',
        'Tanp Egliz la', 'Church Sanctuary',
        'Yon sware espesyal ak adorasyon dinamik, konferansye envite, ak bèl pataj sou defi ak opòtinite jèn kretyen yo genyen jodi a.',
        'A special evening with dynamic worship, guest speakers, and sharing panels on the challenges and opportunities young Christians face today.',
      ]
    );
  }

  if ((await countRows(pool, 'daily_devotionals')) === 0) {
    await pool.query(
      `INSERT INTO daily_devotionals
       (date, verse_ref_english, verse_ref_kreyol, verse_text_english, verse_text_kreyol, lesson_english, lesson_kreyol, status)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
      [
        '2026-05-25',
        'Galatians 6:9',
        'Galat 6:9',
        'And let us not grow weary of doing good, for in due season we will reap, if we do not give up.',
        "Annou pa janm bouke fè sa ki byen. Paske, si nou pa dekouraje, n'a rekòlte lè lè a va rive.",
        "Dear family, serving others and doing good can sometimes feel exhausting, especially when we are far from home. But the Apostle Paul reminds us that our labor in the Lord is never in vain and a bountiful harvest of blessings is coming. Let us stand united today, strengthening one another's hands to keep shining Christ's light in our community.",
        'Frè m ak sè m yo, fè sa ki byen kapab fatigan pafwa, sitou lè nou lwen peyi nou. Men, Apòt Pòl fè nou chonje ke travay nou pou Seyè a pa janm anven e yon bèl rekòt benediksyon ap vini. Annou rete ini jodi a, pou nou ankouraje yonn lòt pou n kontinye klere limyè Kris la nan mitan kominote nou an.',
        'approved',
      ]
    );
  }

  if ((await countRows(pool, 'ministries')) === 0) {
    await pool.query(
      `INSERT INTO ministries
       (slug, title_kreyol, title_english, description_kreyol, description_english, image_url, bullets_kreyol, bullets_english)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8), ($9, $10, $11, $12, $13, $14, $15, $16), ($17, $18, $19, $20, $21, $22, $23, $24)`,
      [
        'women',
        'Ministè Medam Yo',
        "Women's Ministry",
        'Ministè sa a reyini tout sè nan legliz la pou bati yon solidite espirityèl ak fratènèl. Nou fè etid biblik, priyè espesyal, ak seminè pou ede chak fanm mache daprè modèl Bib la rekòmande.',
        "Our Women's Ministry gathers sisters in Christ to build spiritual strength, fellowship, and support. Through targeted Bible studies, prayer groups, and workshops, we empower women to live out their biblical calling.",
        'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?q=80&w=800&auto=format&fit=crop',
        'Reyinyon Priyè: Chak Samdi a 6:00 AM\nEtid Biblik Espesyal ak Konferans Anyèl\nSipò ak swen fratènèl pou tout medam yo',
        "Weekly Prayer Fellowship: Saturdays at 6:00 AM\nSpecial Bible Studies and Annual Women's Conference\nMutual encouragement, support networks, and community outreach",
        'men',
        'Ministè Gason Yo',
        "Men's Fellowship",
        'Objektif nou se fòme gason daprè kè Bondye pou yo kapab lidè espirityèl ki solid nan fwaye yo, nan legliz la, ak nan kominote a. Gason yo reyini pou pataje, ankouraje yonn lòt, epi grandi ansanm.',
        'We aim to raise godly men who stand strong as spiritual leaders in their homes, in our ministry, and in the community. Our fellowship provides a safe space for accountability, Bible study, and discipleship.',
        'https://images.unsplash.com/photo-1507679799987-c73779587ccf?q=80&w=800&auto=format&fit=crop',
        'Reyinyon Etid ak Kominote: Premye Samdi nan mwa a\nSeminè sou responsabilite fanmi ak finans\nAktivite sèvis ak konstriksyon',
        'Monthly Discipleship Breakfast: First Saturday of the month\nSeminars on family leadership, finance, and biblical manhood\nService projects and practical community assistance',
        'children',
        'Lekòl Dimanch & Jenès',
        'Children & Youth Ministry',
        "N'ap enstwi timoun ak jèn yo nan chemen Seyè a depi nan ti laj yo. Nou ofri klas Lekòl Dimanch enteresan, aktivite mizikal, jwèt, ak fòmasyon biblik ki prepare yo pou yon lafwa solid ak dirab.",
        "We believe in investing in the next generation. Our children's Sunday school and youth programs offer engaging, age-appropriate lessons, worship, music, and fun games that ground young hearts in God's Word.",
        'https://images.unsplash.com/photo-1489710437720-ebb67ec84dd2?q=80&w=800&auto=format&fit=crop',
        'Klas Lekòl Dimanch: Chak Dimanch a 10:30 AM\nKoral Timoun ak Jèn yo\nKan Biblik pandan ete',
        "Sunday School Classes: Sundays at 10:30 AM\nChildren's Choir and Instrumental Training\nAnnual Vacation Bible School (VBS) summer camps",
      ]
    );
  }
}
