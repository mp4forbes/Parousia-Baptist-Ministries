import crypto from 'crypto';
import type { Pool } from 'pg';
import { getSuperAdminEmails } from '../super-admin';
import { HOME_FRENCH_DEFAULTS, MINISTRY_FRENCH_DEFAULTS, resolveFrenchContent } from '../french-content';
import { FREE_GIFT_FILE_SETTING_KEYS, assetFileExists } from '../asset-storage';
import { sanitizeTeamDepartmentsForFrench } from '../team-departments';
import { DEFAULT_CHURCH_LOCATIONS } from '../church-locations';

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

async function migrateLegacyFrenchContent(pool: Pool): Promise<void> {
  for (const [key, canonical] of Object.entries(HOME_FRENCH_DEFAULTS)) {
    const englishKey = key.replace(/_ht$/, '_en');
    const current = await pool.query<{ value: string }>('SELECT value FROM settings WHERE key = $1', [key]);
    const english = await pool.query<{ value: string }>('SELECT value FROM settings WHERE key = $1', [englishKey]);
    const stored = current.rows[0]?.value;
    const englishValue = english.rows[0]?.value;
    const resolved = resolveFrenchContent(stored, canonical, englishValue);

    if (!stored) {
      await upsertSetting(pool, key, canonical, true);
      continue;
    }

    if (resolved !== stored) {
      await upsertSetting(pool, key, resolved, true);
    }
  }

  for (const [slug, defaults] of Object.entries(MINISTRY_FRENCH_DEFAULTS)) {
    const result = await pool.query<{
      title_kreyol: string;
      title_english: string;
      description_kreyol: string;
      description_english: string;
      bullets_kreyol: string;
      bullets_english: string;
    }>(
      `SELECT title_kreyol, title_english, description_kreyol, description_english, bullets_kreyol, bullets_english
       FROM ministries WHERE slug = $1`,
      [slug]
    );
    const row = result.rows[0];
    if (!row) continue;

    const title = resolveFrenchContent(row.title_kreyol, defaults.title, row.title_english);
    const description = resolveFrenchContent(row.description_kreyol, defaults.description, row.description_english);
    const bullets = resolveFrenchContent(row.bullets_kreyol, defaults.bullets, row.bullets_english);

    if (
      title !== row.title_kreyol ||
      description !== row.description_kreyol ||
      bullets !== row.bullets_kreyol
    ) {
      await pool.query(
        `UPDATE ministries
         SET title_kreyol = $1, description_kreyol = $2, bullets_kreyol = $3
         WHERE slug = $4`,
        [title, description, bullets, slug]
      );
    }
  }

  const teamSetting = await pool.query<{ value: string }>(
    "SELECT value FROM settings WHERE key = 'team_departments_json'"
  );
  const teamJson = teamSetting.rows[0]?.value;
  if (!teamJson) return;

  try {
    const parsed = JSON.parse(teamJson);
    if (!Array.isArray(parsed) || parsed.length === 0) return;

    const sanitized = sanitizeTeamDepartmentsForFrench(parsed);
    const updated = JSON.stringify(sanitized);
    if (updated !== teamJson) {
      await upsertSetting(pool, 'team_departments_json', updated, true);
    }
  } catch {
    // Ignore invalid team JSON during migration.
  }
}

async function sanitizeMissingFreeGiftAssets(pool: Pool): Promise<void> {
  for (const key of FREE_GIFT_FILE_SETTING_KEYS) {
    const result = await pool.query<{ value: string }>('SELECT value FROM settings WHERE key = $1', [key]);
    const value = result.rows[0]?.value || '';
    if (!value.startsWith('/api/assets/') || assetFileExists(value)) {
      continue;
    }

    await pool.query('DELETE FROM settings WHERE key = $1', [key]);
  }
}

export async function seedDatabase(pool: Pool): Promise<void> {
  // Legacy `*_kreyol` keys and columns remain for compatibility; their seeded content is now French.
  const settingsCount = await countRows(pool, 'settings');
  if (settingsCount === 0) {
    const hashedDefaultPass = crypto.createHash('sha256').update('parousie2026').digest('hex');
    await upsertSetting(pool, 'admin_password', hashedDefaultPass, true);
    await upsertSetting(pool, 'pastor_name', 'Pasteur Jean-Claude');
    await upsertSetting(pool, 'pastor_message_kreyol', "Je suis heureux de vous accueillir au nom de Jésus-Christ. Notre église est une famille de croyants qui servent le Seigneur et attendent son retour. Venez adorer avec nous !");
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
    ['devotional_theme_enabled', 'false'],
    ['devotional_auto_publish', 'false'],
  ];

  for (const [key, value, replace] of defaultSettings) {
    await upsertSetting(pool, key, value, replace);
  }

  const churchLocationsRow = await pool.query<{ value: string }>(
    "SELECT value FROM settings WHERE key = 'church_locations_json'"
  );
  if (!churchLocationsRow.rows[0]?.value) {
    await upsertSetting(pool, 'church_locations_json', JSON.stringify(DEFAULT_CHURCH_LOCATIONS), true);
  }

  await pool.query(
    "UPDATE service_schedules SET is_livestreamed = 1 WHERE LOWER(day_english) = 'sunday' OR LOWER(day_kreyol) = 'dimanche'"
  );

  for (const superAdminEmail of getSuperAdminEmails()) {
    await pool.query(
      `INSERT INTO admins (email, created_at, is_super_admin) VALUES ($1, $2, 1)
       ON CONFLICT (email) DO UPDATE SET is_super_admin = 1`,
      [superAdminEmail, new Date().toISOString().split('T')[0]]
    );
  }

  await pool.query("DELETE FROM admins WHERE LOWER(email) = 'pastor@parousiabaptist.org'");
  await pool.query("DELETE FROM admins WHERE LOWER(email) = 'it@parousiabaptist.org'");

  if ((await countRows(pool, 'blog_posts')) === 0) {
    await pool.query(
      `INSERT INTO blog_posts (title_kreyol, title_english, content_kreyol, content_english, date, created_at)
       VALUES ($1, $2, $3, $4, $5, $6), ($7, $8, $9, $10, $11, $12)`,
      [
        'La fermeté au cœur des tempêtes', 'Steadfastness in the Storms of Life',
        'Chers frères et sœurs, tandis que nous cheminons sur cette terre, nous rencontrerons bien des épreuves et des tempêtes. Mais prenons courage, car Jésus-Christ a déjà vaincu le monde pour nous. Lorsque notre vie est fermement ancrée dans sa Parole, rien ne peut nous ébranler.',
        'Dear brothers and sisters, as we walk this earth, we will face many trials and storms. But we must take heart because Jesus Christ has already overcome the world for us. When our lives are firmly anchored in His word, nothing can move us.',
        '2026-06-04', new Date().toISOString(),
        'Vivre comme une communauté bénie', 'Living as a Blessed Community',
        'Notre communauté est un don d’une valeur inestimable. Lorsque nous nous soutenons les uns les autres avec amour et respect, nous devenons un véritable modèle de croissance spirituelle et de communion fraternelle pour tous ceux qui nous entourent.',
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
        'Sœur Marie', 'Merci de prier pour mon fils, qui passera demain un examen scolaire très important.', 0, new Date().toISOString(),
        null, 'Praying for healing and strength for a family member diagnosed with a severe illness. Thank you.', 1, new Date().toISOString(),
        'Frère Pierre', 'Je demande la prière afin d’être guidé et orienté dans mon travail.', 0, new Date().toISOString(),
      ]
    );
  }

  if ((await countRows(pool, 'sermons')) === 0) {
    await pool.query(
      `INSERT INTO sermons
       (title_kreyol, title_english, date, speaker, youtube_id, description_kreyol, description_english)
       VALUES ($1, $2, $3, $4, $5, $6, $7), ($8, $9, $10, $11, $12, $13, $14)`,
      [
        'Marcher dans la foi chaque jour', 'Walking in Faith Every Day', '2026-05-17',
        'Pasteur Jean-Claude', 'dQw4w9WgXcQ',
        'Un message encourageant sur la manière d’affermir notre foi et de faire confiance à Dieu au cœur des épreuves de la vie.',
        'An encouraging message on how to build our faith and trust God through the storms of life.',
        'Le retour du Seigneur et notre préparation', "The Lord's Return and Our Readiness", '2026-05-10',
        'Pasteur Jean-Claude', 'dQw4w9WgXcQ',
        'Une étude approfondie de 1 Thessaloniciens 4.16-17 et de ce que signifie vivre chaque jour dans l’attente du Seigneur.',
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
        'Dimanche', 'Sunday', '9:00 AM - 11:30 AM',
        'Culte principal', 'Main Worship Service',
        'Venez écouter la Parole de Dieu, chanter ses louanges et prier avec toute la famille.',
        'Come hear the word of God, sing praises, and pray together with the whole family.',
        'Mercredi', 'Wednesday', '7:00 PM - 8:30 PM',
        'Prière et étude biblique', 'Prayer & Bible Study',
        'Un temps pour rechercher la présence de Dieu et mieux comprendre sa Parole dans la communion fraternelle.',
        "A time to seek God's presence and understand His Word deeper in fellowship.",
        'Samedi', 'Saturday', '6:00 PM - 8:00 PM',
        'Rencontre des jeunes', 'Youth Fellowship',
        'Des activités de croissance spirituelle, d’amitié et de communion fraternelle destinées aux jeunes.',
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
        'Soutien à l’école Parousie des Cayes', 'Parousie School Support in Les Cayes', '2026-05-10',
        'Nous soutenons la scolarisation et fournissons chaque jour des repas à plus de 150 enfants de la région des Cayes, en Haïti. Nous finançons également les fournitures scolaires et les salaires des enseignants.',
        'Supporting education and daily hot meals for over 150 school children in Les Cayes, Haiti. We provide school supplies and teacher salaries.',
        'https://images.unsplash.com/photo-1547082299-de196ea013d6?q=80&w=600&auto=format&fit=crop',
        3500.0, 5000.0,
        'Clinique médicale mobile', 'Mobile Health Clinic', '2026-05-18',
        'Achat de médicaments et financement d’équipements pour notre clinique mobile, qui offre des soins médicaux gratuits aux familles des régions rurales éloignées des hôpitaux.',
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
        'Distribution alimentaire', 'Community Food Pantry',
        'Chaque samedi matin, nous distribuons des paniers de produits frais et de denrées non périssables aux familles dans le besoin de notre communauté, quelle que soit leur origine.',
        'Every Saturday morning, we distribute fresh food boxes and dry goods to families in need within our diaspora area regardless of background.',
        'Chaque samedi, de 8 h à 10 h', 'Every Saturday, 8:00 AM - 10:00 AM',
        'Services d’aide aux immigrants', 'Immigrant Assistance Services',
        'Des consultations et un accompagnement gratuits pour aider les familles nouvellement arrivées à effectuer leurs démarches, à faire traduire leurs documents et à trouver les ressources essentielles.',
        'Free consultation and orientation for newly arrived families to help them navigate paperwork, translate documents, and find basic resources.',
        'Les mardis et jeudis (sur rendez-vous uniquement)', 'Tuesdays & Thursdays (By Appointment Only)',
      ]
    );
  }

  if ((await countRows(pool, 'events')) === 0) {
    await pool.query(
      `INSERT INTO events
       (title_kreyol, title_english, date, time, location_kreyol, location_english, description_kreyol, description_english)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8), ($9, $10, $11, $12, $13, $14, $15, $16)`,
      [
        'Grand pique-nique familial de la communauté', 'Annual Community Family Picnic', '2026-06-20', '11:00 AM - 4:00 PM',
        'Parc Central (pavillon B)', 'Central Park (Pavilion B Area)',
        'Un merveilleux moment de communion fraternelle avec des activités pour les enfants et les adultes. Barbecue et boissons seront offerts, dans une ambiance propice aux échanges. Toute la communauté est invitée !',
        'A wonderful time of Christian fellowship and activities for children and adults. Free BBQ, drinks, and great conversations. The entire community is welcome!',
        'Conférence des jeunes « Lève-toi »', 'Youth Conference "Rise Up"', '2026-07-10', '6:00 PM - 9:00 PM',
        'Sanctuaire de l’église', 'Church Sanctuary',
        'Une soirée spéciale de louange dynamique, avec des conférenciers invités et des échanges enrichissants sur les défis et les possibilités qui se présentent aujourd’hui aux jeunes chrétiens.',
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
        'Galates 6.9',
        'And let us not grow weary of doing good, for in due season we will reap, if we do not give up.',
        'Ne nous lassons pas de faire le bien, car nous récolterons au moment voulu, si nous ne nous relâchons pas.',
        "Dear family, serving others and doing good can sometimes feel exhausting, especially when we are far from home. But the Apostle Paul reminds us that our labor in the Lord is never in vain and a bountiful harvest of blessings is coming. Let us stand united today, strengthening one another's hands to keep shining Christ's light in our community.",
        'Chers frères et sœurs, servir les autres et faire le bien peut parfois être éprouvant, surtout lorsque nous sommes loin de notre pays. Mais l’apôtre Paul nous rappelle que notre travail dans le Seigneur n’est jamais vain et qu’une abondante moisson de bénédictions nous attend. Restons unis aujourd’hui et encourageons-nous mutuellement à continuer de faire rayonner la lumière du Christ dans notre communauté.',
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
        'Ministère des femmes',
        "Women's Ministry",
        'Ce ministère rassemble les sœurs de l’église afin de fortifier leur vie spirituelle, leur communion fraternelle et leur soutien mutuel. Par des études bibliques, des groupes de prière et des ateliers, nous aidons chaque femme à vivre pleinement sa vocation biblique.',
        "Our Women's Ministry gathers sisters in Christ to build spiritual strength, fellowship, and support. Through targeted Bible studies, prayer groups, and workshops, we empower women to live out their biblical calling.",
        'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?q=80&w=800&auto=format&fit=crop',
        'Rencontre de prière : chaque samedi à 6 h\nÉtudes bibliques thématiques et conférence annuelle des femmes\nEncouragement mutuel, réseaux de soutien et service communautaire',
        "Weekly Prayer Fellowship: Saturdays at 6:00 AM\nSpecial Bible Studies and Annual Women's Conference\nMutual encouragement, support networks, and community outreach",
        'men',
        'Ministère des hommes',
        "Men's Fellowship",
        'Notre objectif est de former des hommes selon le cœur de Dieu, capables d’être de solides responsables spirituels dans leur foyer, dans l’église et dans la communauté. Ces rencontres offrent un cadre fraternel propice au partage, à l’encouragement, à l’étude biblique et à la croissance commune.',
        'We aim to raise godly men who stand strong as spiritual leaders in their homes, in our ministry, and in the community. Our fellowship provides a safe space for accountability, Bible study, and discipleship.',
        'https://images.unsplash.com/photo-1507679799987-c73779587ccf?q=80&w=800&auto=format&fit=crop',
        'Petit-déjeuner mensuel de formation : le premier samedi du mois\nSéminaires sur la responsabilité familiale, les finances et la masculinité biblique\nProjets de service et aide concrète à la communauté',
        'Monthly Discipleship Breakfast: First Saturday of the month\nSeminars on family leadership, finance, and biblical manhood\nService projects and practical community assistance',
        'children',
        'Ministère des enfants et des jeunes',
        'Children & Youth Ministry',
        'Nous enseignons aux enfants et aux jeunes les voies du Seigneur dès leur plus jeune âge. Nos classes d’école du dimanche et nos programmes pour la jeunesse proposent des leçons bibliques adaptées, des temps de louange, de la musique et des jeux qui enracinent leur foi dans la Parole de Dieu.',
        "We believe in investing in the next generation. Our children's Sunday school and youth programs offer engaging, age-appropriate lessons, worship, music, and fun games that ground young hearts in God's Word.",
        'https://images.unsplash.com/photo-1489710437720-ebb67ec84dd2?q=80&w=800&auto=format&fit=crop',
        'Classes d’école du dimanche : chaque dimanche à 10 h 30\nChorale des enfants et formation instrumentale\nCamps bibliques d’été annuels',
        "Sunday School Classes: Sundays at 10:30 AM\nChildren's Choir and Instrumental Training\nAnnual Vacation Bible School (VBS) summer camps",
      ]
    );
  }

  await pool.query(
    `INSERT INTO ministries
     (slug, title_kreyol, title_english, description_kreyol, description_english, image_url, bullets_kreyol, bullets_english, contact_name, contact_email, contact_phone, notification_emails, google_sheet_id)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, '', '', '', '', '')
     ON CONFLICT (slug) DO NOTHING`,
    [
      'missions',
      'Missions et évangélisation',
      'Missions & Outreach',
      'Rejoignez notre ministère des missions pour soutenir l’évangélisation et les œuvres de service communautaire en Haïti et dans notre région.',
      'Join our missions ministry to support evangelism and community service work in Haiti and in our local community.',
      'https://images.unsplash.com/photo-1547082299-de196ea013d6?q=80&w=800&auto=format&fit=crop',
      'Projets scolaires et sanitaires en Haïti\nSoutien à l’évangélisation locale\nPossibilités de bénévolat au service de la communauté',
      'School and healthcare projects in Haiti\nLocal evangelism support\nVolunteer opportunities for community outreach',
    ]
  );

  const careCategories = [
    {
      slug: 'weddings',
      title_english: 'Weddings',
      title_kreyol: 'Mariages',
      description_english:
        '“That is why a man leaves his father and mother and is united to his wife, and they become one flesh.” (Genesis 2:24) Marriage is a lifelong commitment and should not be entered into lightly. All couples who desire an ordained minister from Parousia Baptist Ministries to officiate their wedding ceremony must complete premarital counseling sessions.',
      description_kreyol:
        '« C’est pourquoi l’homme quittera son père et sa mère et s’attachera à sa femme, et ils deviendront une seule chair. » (Genèse 2:24) Le mariage est un engagement pour la vie et ne doit pas être pris à la légère. Tout couple qui souhaite qu’un ministre ordonné de Parousia Baptist Ministries célèbre son mariage doit suivre des séances de counseling prénuptial.',
    },
    {
      slug: 'funerals',
      title_english: 'Funerals & Bereavement',
      title_kreyol: 'Funérailles et deuil',
      description_english:
        '“The Lord replied, ‘My Presence will go with you, and I will give you rest.’” (Exodus 33:14) Of all life experiences, death is often the most painful and challenging. Parousia Baptist Ministries is available to comfort, direct, and support you during this season of life.',
      description_kreyol:
        '« L’Éternel répondit : Ma présence ira avec toi, et je te donnerai du repos. » (Exode 33:14) Parmi toutes les expériences de la vie, la mort est souvent la plus douloureuse. Parousia Baptist Ministries est là pour vous consoler, vous orienter et vous soutenir en cette période.',
    },
    {
      slug: 'baptisms',
      title_english: 'Baptisms',
      title_kreyol: 'Baptêmes',
      description_english:
        'Baptism is a public declaration of faith in Jesus Christ. Our pastoral team will walk with you as you prepare for this important step of obedience and celebration with the church family.',
      description_kreyol:
        'Le baptême est une déclaration publique de foi en Jésus-Christ. Notre équipe pastorale vous accompagnera dans cette étape importante d’obéissance et de célébration avec la famille de l’église.',
    },
    {
      slug: 'childrens-dedications',
      title_english: "Children's Dedications",
      title_kreyol: "Présentation d'enfants",
      description_english:
        '“So now I give him to the Lord. For his whole life he will be given over to the Lord.” (1 Samuel 1:28) Any parent who desires to have a child dedicated must complete this request form. Our team will confirm scheduling details with you.',
      description_kreyol:
        '« C’est pourquoi je le donne à l’Éternel ; il appartiendra à l’Éternel pour toujours. » (1 Samuel 1:28) Tout parent qui souhaite présenter son enfant au Seigneur doit remplir ce formulaire. Notre équipe vous confirmera les détails de la célébration.',
    },
    {
      slug: 'hospice-support',
      title_english: 'Hospice & Pastoral Visitation',
      title_kreyol: 'Soins palliatifs et visites pastorales',
      description_english:
        '“I was sick and you looked after me…” (Matthew 25:36) From diagnosis through recuperation or end-of-life care, we provide pastoral support through prayer, visitation, and compassionate presence.',
      description_kreyol:
        '« J’étais malade, et vous m’avez visité… » (Matthieu 25:36) Du diagnostic à la convalescence ou aux soins de fin de vie, nous offrons un soutien pastoral par la prière, les visites et une présence compatissante.',
    },
  ];

  for (const category of careCategories) {
    await pool.query(
      `INSERT INTO administrative_care_categories
       (slug, title_english, title_kreyol, description_english, description_kreyol, images_json, contact_name, contact_email, contact_phone, notification_emails)
       VALUES ($1, $2, $3, $4, $5, '[]', '', '', '', '')
       ON CONFLICT (slug) DO NOTHING`,
      [
        category.slug,
        category.title_english,
        category.title_kreyol,
        category.description_english,
        category.description_kreyol,
      ]
    );
  }

  await migrateLegacyFrenchContent(pool);
  await sanitizeMissingFreeGiftAssets(pool);
}
