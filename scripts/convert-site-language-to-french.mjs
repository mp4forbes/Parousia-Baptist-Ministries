import pg from 'pg';

const { Client } = pg;
const MODEL = 'gemini-2.5-flash';
const force = process.argv.includes('--force');

const TEAM_MEMBERS = [
  {
    name: 'Pasteur Yvan Dalzon, M.T.',
    role_en: 'Ex Officio President',
    role_ht: 'Président ex officio',
    bio_en:
      'Ex officio president of all church committees, holder of a master’s degree in theology, and a church planter for more than three decades, he also teaches at the Bible school.',
    bio_ht:
      'Président ex officio de tous les comités de l’église, détenteur d’une maîtrise en théologie et implanteur d’églises depuis plus de trois décennies, il enseigne également à l’école biblique.',
    image_url: '/api/assets/home_team_p1_1781413370481.jpg',
    email: 'franckyvan@gmail.com',
  },
  {
    name: 'Pasteur Jean Duravit Pierre-Louis',
    role_en: 'Assistant Pastor',
    role_ht: 'Pasteur assistant',
    bio_en:
      'He assists Pastor Dalzon in his duties and administers the church’s finances with Deacon Louis.',
    bio_ht:
      'Il assiste le pasteur Dalzon dans ses fonctions et administre les finances de l’église avec le diacre Louis.',
    image_url: '/api/assets/home_team_p2_1781413370575.jpg',
    email: '',
  },
  {
    name: 'Maestro Geral Monfort',
    role_en: 'Director of Singing and Music',
    role_ht: 'Directeur des chants et de la musique',
    bio_en:
      'A former member of the Cité de Béthanie Baptist Church, he directs singing and music in the church.',
    bio_ht:
      'Ancien membre de l’Église baptiste de Cité de Béthanie, il est directeur des chants et de la musique de l’église.',
    image_url: '',
    email: '',
  },
  {
    name: 'Sœur Arlette Milfort',
    role_en: 'Women’s Association President and Diaconate Vice President',
    role_ht: 'Présidente de l’Association des dames et vice-présidente du diaconat',
    bio_en:
      'She is president of the Women’s Association and vice president of the diaconate.',
    bio_ht:
      'Elle est présidente de l’Association des dames et vice-présidente du diaconat.',
    image_url: '',
    email: '',
  },
  {
    name: 'Sœur Carline Florestal',
    role_en: 'External Relations Coordinator',
    role_ht: 'Coordinatrice des relations externes',
    bio_en:
      'She coordinates the church’s various groups and departments. She is especially responsible for external relations with visitors and prospective members of the congregation.',
    bio_ht:
      'Elle assure la coordination entre les différents groupes et départements de l’église. Elle est surtout chargée des relations externes avec les visiteurs et les fidèles potentiels de l’assemblée.',
    image_url: '',
    email: '',
  },
];

const TABLE_PAIRS = {
  service_schedules: [
    ['day_english', 'day_kreyol'],
    ['title_english', 'title_kreyol'],
    ['description_english', 'description_kreyol'],
  ],
  haiti_missions: [
    ['title_english', 'title_kreyol'],
    ['description_english', 'description_kreyol'],
  ],
  local_outreach: [
    ['title_english', 'title_kreyol'],
    ['description_english', 'description_kreyol'],
    ['schedule_english', 'schedule_kreyol'],
  ],
  events: [
    ['title_english', 'title_kreyol'],
    ['location_english', 'location_kreyol'],
    ['description_english', 'description_kreyol'],
  ],
  daily_devotionals: [
    ['verse_ref_english', 'verse_ref_kreyol'],
    ['verse_text_english', 'verse_text_kreyol'],
    ['lesson_english', 'lesson_kreyol'],
  ],
  sermons: [
    ['title_english', 'title_kreyol'],
    ['description_english', 'description_kreyol'],
  ],
  blog_posts: [
    ['title_english', 'title_kreyol'],
    ['content_english', 'content_kreyol'],
  ],
  ministries: [
    ['title_english', 'title_kreyol'],
    ['description_english', 'description_kreyol'],
    ['bullets_english', 'bullets_kreyol'],
  ],
};

function chunks(items, size) {
  const result = [];
  for (let index = 0; index < items.length; index += size) {
    result.push(items.slice(index, index + size));
  }
  return result;
}

async function translateBatch(items, apiKey) {
  const prompt = `You are a professional Christian translator for Parousia Baptist Ministries.
Translate every input text from English to natural, polished French suitable for a church website.
Preserve names, dates, Bible references, URLs, Markdown, line breaks, and JSON/list formatting.
Do not add commentary. Return every input id exactly once.

Input:
${JSON.stringify(items)}

Return JSON in this exact shape:
{"translations":[{"id":"same-id","text":"French translation"}]}`;

  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent?key=${apiKey}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: {
          responseMimeType: 'application/json',
          responseSchema: {
            type: 'OBJECT',
            properties: {
              translations: {
                type: 'ARRAY',
                items: {
                  type: 'OBJECT',
                  properties: {
                    id: { type: 'STRING' },
                    text: { type: 'STRING' },
                  },
                  required: ['id', 'text'],
                },
              },
            },
            required: ['translations'],
          },
        },
      }),
    },
  );

  if (!response.ok) {
    throw new Error(`Gemini translation failed (${response.status}): ${await response.text()}`);
  }

  const data = await response.json();
  const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!text) throw new Error('Gemini returned an empty translation response.');

  const parsed = JSON.parse(text);
  return new Map((parsed.translations || []).map((entry) => [entry.id, entry.text]));
}

async function main() {
  if (!process.env.DATABASE_URL) throw new Error('DATABASE_URL is required.');
  if (!process.env.GEMINI_API_KEY) throw new Error('GEMINI_API_KEY is required.');

  const client = new Client({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.PGSSLMODE === 'disable' ? false : undefined,
  });
  await client.connect();

  try {
    const marker = await client.query(
      "SELECT value FROM settings WHERE key = 'site_primary_language'",
    );
    if (marker.rows[0]?.value === 'fr' && !force) {
      console.log('French conversion already completed; use --force to run it again.');
      return;
    }

    const backup = { settings: [], tables: {} };
    backup.settings = (
      await client.query(
        `SELECT key, value FROM settings
         WHERE key LIKE '%\\_ht' ESCAPE '\\'
            OR key LIKE '%\\_kreyol' ESCAPE '\\'
            OR key IN ('team_members_json', 'team_title_en')`,
      )
    ).rows;

    const items = [];
    const updates = [];

    const settings = (await client.query('SELECT key, value FROM settings')).rows;
    const settingsMap = new Map(settings.map((row) => [row.key, row.value]));
    for (const { key, value } of settings) {
      let targetKey = null;
      if (key.endsWith('_en')) targetKey = `${key.slice(0, -3)}_ht`;
      if (key.endsWith('_english')) targetKey = `${key.slice(0, -8)}_kreyol`;
      if (!targetKey || !settingsMap.has(targetKey) || !String(value || '').trim()) continue;
      if (key.startsWith('team_p')) continue;

      const id = `settings:${targetKey}`;
      items.push({ id, text: value });
      updates.push({ kind: 'setting', id, targetKey });
    }

    for (const [table, pairs] of Object.entries(TABLE_PAIRS)) {
      const rows = (await client.query(`SELECT * FROM ${table} ORDER BY id`)).rows;
      backup.tables[table] = rows.map((row) => {
        const selected = { id: row.id };
        for (const [, target] of pairs) selected[target] = row[target];
        return selected;
      });

      for (const row of rows) {
        for (const [source, target] of pairs) {
          const value = row[source];
          if (!String(value || '').trim()) continue;
          const id = `${table}:${row.id}:${target}`;
          items.push({ id, text: value });
          updates.push({ kind: 'table', id, table, rowId: row.id, target });
        }
      }
    }

    const translated = new Map();
    for (const [index, batch] of chunks(items, 30).entries()) {
      console.log(`Translating batch ${index + 1}/${Math.ceil(items.length / 30)}...`);
      const result = await translateBatch(batch, process.env.GEMINI_API_KEY);
      for (const [id, text] of result) translated.set(id, text);
    }

    const missing = items.filter((item) => !translated.has(item.id));
    if (missing.length) {
      throw new Error(`Translation response omitted ${missing.length} field(s).`);
    }

    await client.query('BEGIN');
    try {
      await client.query(`
        CREATE TABLE IF NOT EXISTS language_conversion_backups (
          id BIGSERIAL PRIMARY KEY,
          created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
          source_language TEXT NOT NULL,
          target_language TEXT NOT NULL,
          payload JSONB NOT NULL
        )
      `);
      await client.query(
        `INSERT INTO language_conversion_backups
          (source_language, target_language, payload)
         VALUES ('ht', 'fr', $1::jsonb)`,
        [JSON.stringify(backup)],
      );

      for (const update of updates) {
        const value = translated.get(update.id);
        if (update.kind === 'setting') {
          await client.query(
            `INSERT INTO settings (key, value) VALUES ($1, $2)
             ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value`,
            [update.targetKey, value],
          );
        } else {
          await client.query(
            `UPDATE ${update.table} SET ${update.target} = $1 WHERE id = $2`,
            [value, update.rowId],
          );
        }
      }

      const teamSettings = {
        team_title_en: 'Executive Committee',
        team_title_ht: 'Comité exécutif',
        team_members_json: JSON.stringify(TEAM_MEMBERS),
        team_p1_name: TEAM_MEMBERS[0].name,
        team_p1_role_en: TEAM_MEMBERS[0].role_en,
        team_p1_role_ht: TEAM_MEMBERS[0].role_ht,
        team_p1_bio_en: TEAM_MEMBERS[0].bio_en,
        team_p1_bio_ht: TEAM_MEMBERS[0].bio_ht,
        team_p1_image_url: TEAM_MEMBERS[0].image_url,
        team_p1_email: TEAM_MEMBERS[0].email,
        team_p2_name: TEAM_MEMBERS[1].name,
        team_p2_role_en: TEAM_MEMBERS[1].role_en,
        team_p2_role_ht: TEAM_MEMBERS[1].role_ht,
        team_p2_bio_en: TEAM_MEMBERS[1].bio_en,
        team_p2_bio_ht: TEAM_MEMBERS[1].bio_ht,
        team_p2_image_url: TEAM_MEMBERS[1].image_url,
        team_p2_email: TEAM_MEMBERS[1].email,
        site_primary_language: 'fr',
      };

      for (const [key, value] of Object.entries(teamSettings)) {
        await client.query(
          `INSERT INTO settings (key, value) VALUES ($1, $2)
           ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value`,
          [key, value],
        );
      }

      await client.query('COMMIT');
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    }

    console.log(
      `Converted ${updates.length} stored fields to French and installed ${TEAM_MEMBERS.length} executive committee members.`,
    );
  } finally {
    await client.end();
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
