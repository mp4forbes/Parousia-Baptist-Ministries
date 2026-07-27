const fs = require('fs');

const html = fs.readFileSync('scratch/page.html', 'utf-8');
let jsonStr = '';
const startStr = 'ytInitialData = ';
const startIndex = html.indexOf(startStr);
if (startIndex !== -1) {
  const remaining = html.substring(startIndex + startStr.length);
  let braceCount = 0;
  let inString = false;
  let escape = false;
  let firstBrace = remaining.indexOf('{');
  if (firstBrace !== -1) {
    for (let i = firstBrace; i < remaining.length; i++) {
      const char = remaining[i];
      if (escape) { escape = false; continue; }
      if (char === '\\') { escape = true; continue; }
      if (char === '"') { inString = !inString; continue; }
      if (!inString) {
        if (char === '{') braceCount++;
        else if (char === '}') {
          braceCount--;
          if (braceCount === 0) {
            jsonStr = remaining.substring(firstBrace, i + 1);
            break;
          }
        }
      }
    }
  }
}

if (jsonStr) {
  const parsed = JSON.parse(jsonStr);
  let found = [];
  const findDateKeys = (obj, path = '') => {
    if (!obj || typeof obj !== 'object') return;
    for (const key of Object.keys(obj)) {
      const val = obj[key];
      if (typeof val === 'string' && (val.includes('2021') || val.includes('2022') || val.includes('2023') || val.includes('2024') || val.includes('2025') || val.includes('2026'))) {
        found.push({ path: `${path}.${key}`, val });
      }
      if (val && typeof val === 'object') {
        findDateKeys(val, path ? `${path}.${key}` : key);
      }
    }
  };
  findDateKeys(parsed);
  console.log('Found occurrences of years:', found.length);
  for (let i = 0; i < Math.min(20, found.length); i++) {
    console.log(found[i]);
  }
}
