const fs = require('fs');
const path = require('path');

// Load environment variables manually
const envPath = path.resolve(__dirname, '../.env.local');
const envContent = fs.readFileSync(envPath, 'utf8');
let apiKey = '';
envContent.split('\n').forEach(line => {
  if (line.startsWith('GEMINI_API_KEY=')) {
    apiKey = line.split('=')[1].trim();
  }
});

if (!apiKey) {
  console.error('Error: GEMINI_API_KEY not found in .env.local!');
  process.exit(1);
}

console.log('Using Gemini API Key:', apiKey.substring(0, 8) + '...');

async function testGeminiTheme(theme) {
  console.log(`\n======================================================`);
  console.log(`TESTING GEMINI DEVOTIONAL FOR THEME: "${theme}"`);
  console.log(`======================================================`);

  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`;

  const prompt = `You are a pastor preparing a bilingual daily devotional (in English and Haitian Creole) for Parousia Baptist Ministries.
Generate a spiritual daily devotional aligned with the theme: "${theme}".

Select an appropriate, encouraging scripture reference and verse from the Bible that perfectly aligns with this theme.
Provide the content in both English and Haitian Creole.

Return a JSON object conforming to this exact structure:
{
  "verse_ref_english": "The scripture reference in English, e.g. John 3:16",
  "verse_ref_kreyol": "The scripture reference in Haitian Creole, e.g. Jan 3:16",
  "verse_text_english": "The exact bible verse text in English",
  "verse_text_kreyol": "The exact bible verse text in Haitian Creole",
  "lesson_english": "A short, rich pastoral reflection and spiritual lesson in English (2-4 sentences)",
  "lesson_kreyol": "An equivalent short, rich pastoral reflection and spiritual lesson in Haitian Creole (2-4 sentences)"
}`;

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents: [
          {
            parts: [
              {
                text: prompt
              }
            ]
          }
        ],
        generationConfig: {
          responseMimeType: 'application/json',
          responseSchema: {
            type: 'OBJECT',
            properties: {
              verse_ref_english: { type: 'STRING' },
              verse_ref_kreyol: { type: 'STRING' },
              verse_text_english: { type: 'STRING' },
              verse_text_kreyol: { type: 'STRING' },
              lesson_english: { type: 'STRING' },
              lesson_kreyol: { type: 'STRING' }
            },
            required: [
              'verse_ref_english',
              'verse_ref_kreyol',
              'verse_text_english',
              'verse_text_kreyol',
              'lesson_english',
              'lesson_kreyol'
            ]
          }
        }
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Gemini API call failed:', response.status, errorText);
      return;
    }

    const data = await response.json();
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!text) {
      console.error('Empty response text from Gemini');
      return;
    }

    const parsed = JSON.parse(text);
    console.log('SUCCESSFUL RESPONSE FROM GEMINI:');
    console.log(JSON.stringify(parsed, null, 2));
  } catch (error) {
    console.error('Error fetching devotional from Gemini:', error);
  }
}

async function run() {
  await testGeminiTheme('Forgiveness');
  await testGeminiTheme('Easter');
}

run();
