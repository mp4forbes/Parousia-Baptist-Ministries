import fs from 'node:fs';
import path from 'node:path';
import { execSync } from 'node:child_process';

const docsDir = path.join(process.cwd(), 'docs');
const publicDir = path.join(process.cwd(), 'public/admin-guide');
const screenshotsSource = path.join(docsDir, 'screenshots');
const screenshotsTarget = path.join(publicDir, 'screenshots');
const CHURCH_LOGO_PUBLIC_PATH = '/admin-guide/church-logo.png';
const CHURCH_LOGO_SOURCE_CANDIDATES = [
  path.join(process.cwd(), 'data/assets/logo_1779287428274.png'),
  path.join(process.cwd(), 'data/assets/logo_1785327385228.png'),
];
const SLH_LOGO_SOURCE = path.join(process.cwd(), 'docs/assets/straight-line-holdings-logo.png');
const SLH_LOGO_PUBLIC_PATH = '/admin-guide/straight-line-holdings-logo.png';

function syncStraightLineLogo() {
  const targetPath = path.join(publicDir, 'straight-line-holdings-logo.png');
  if (!fs.existsSync(SLH_LOGO_SOURCE)) {
    console.warn('Straight-Line Holdings logo source not found.');
    return SLH_LOGO_PUBLIC_PATH;
  }

  fs.copyFileSync(SLH_LOGO_SOURCE, targetPath);
  console.log(`Synced Straight-Line Holdings logo to ${targetPath}`);
  return SLH_LOGO_PUBLIC_PATH;
}

function syncChurchLogo() {
  const targetPath = path.join(publicDir, 'church-logo.png');
  const sourcePath = CHURCH_LOGO_SOURCE_CANDIDATES.find((candidate) => fs.existsSync(candidate));

  if (!sourcePath) {
    console.warn('Church logo source not found; admin guide will reference a missing image.');
    return CHURCH_LOGO_PUBLIC_PATH;
  }

  fs.copyFileSync(sourcePath, targetPath);
  console.log(`Synced church logo from ${sourcePath} to ${targetPath}`);
  return CHURCH_LOGO_PUBLIC_PATH;
}

const bilingualDocuments = [
  {
    id: 'admin-guide',
    inputEn: 'Parousia-Admin-Guide-en.md',
    inputFr: 'Parousia-Admin-Guide-ht.md',
    output: 'Parousia-Admin-Guide.html',
    titleEn: 'Parousia Baptist Ministries — Administration Guide',
    titleFr: 'Parousia Baptist Ministries — Guide d’administration',
    kind: 'guide',
  },
  {
    id: 'completion-letter',
    inputEn: 'Parousia-Completion-Letter-en.md',
    inputFr: 'Parousia-Completion-Letter-ht.md',
    output: 'Parousia-Completion-Letter.html',
    titleEn: 'Parousia Baptist Ministries — Project Completion Letter',
    titleFr: 'Parousia Baptist Ministries — Lettre d’achèvement du projet',
    kind: 'letter',
  },
];

fs.mkdirSync(publicDir, { recursive: true });
fs.mkdirSync(screenshotsTarget, { recursive: true });

const churchLogoPath = syncChurchLogo();
syncStraightLineLogo();

if (fs.existsSync(screenshotsSource)) {
  for (const file of fs.readdirSync(screenshotsSource)) {
    if (/\.(png|jpe?g|webp)$/i.test(file)) {
      fs.copyFileSync(path.join(screenshotsSource, file), path.join(screenshotsTarget, file));
    }
  }
}

function stripTableOfContents(mdPath) {
  const strippedPath = path.join(publicDir, `.tmp-${path.basename(mdPath)}`);
  execSync(`sed '/^## Table of Contents$/,/^---$/d' "${mdPath}" > "${strippedPath}"`);
  return strippedPath;
}

function pandocFragment(mdPath) {
  const strippedPath = stripTableOfContents(mdPath);
  try {
    return execSync(
      `pandoc "${strippedPath}" -t html5 --resource-path="${docsDir}:${publicDir}"`,
      { encoding: 'utf8' }
    );
  } finally {
    fs.rmSync(strippedPath, { force: true });
  }
}

function renderDocActions(isLetter) {
  const outlookButton = isLetter
    ? `<button type="button" class="doc-action" id="outlook-btn" aria-label="Open in Outlook">
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
        <rect width="20" height="16" x="2" y="4" rx="2"></rect>
        <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"></path>
      </svg>
      <span id="outlook-btn-label">Outlook</span>
    </button>`
    : '';

  return `<div class="doc-header__actions">
    <button type="button" class="doc-action" id="print-btn" aria-label="Print document">
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
        <polyline points="6 9 6 2 18 2 18 9"></polyline>
        <path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"></path>
        <rect width="12" height="8" x="6" y="14" rx="1"></rect>
      </svg>
      <span id="print-btn-label">Print</span>
    </button>
    ${outlookButton}
    <button type="button" class="lang-toggle" id="lang-toggle" aria-label="Switch language">
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
        <circle cx="12" cy="12" r="10"></circle>
        <path d="M12 2a14.5 14.5 0 0 0 0 20 14.5 14.5 0 0 0 0-20"></path>
        <path d="M2 12h20"></path>
      </svg>
      <span id="lang-toggle-label">Français</span>
    </button>
  </div>`;
}

function wrapBilingualDocument({ titleEn, titleFr, enBody, frBody, logoPath, kind = 'guide' }) {
  const escapeAttr = (value) =>
    value.replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;');

  const isLetter = kind === 'letter';
  const headerHtml = isLetter
    ? `<header class="doc-header doc-header--letter">
    <div class="doc-header__spacer" aria-hidden="true"></div>
    <div class="doc-header__spacer" aria-hidden="true"></div>
    ${renderDocActions(true)}
  </header>`
    : `<header class="doc-header">
    <div class="doc-header__spacer" aria-hidden="true"></div>
    <div class="doc-header__logo">
      <a href="/" title="Parousia Baptist Ministries">
        <img src="${logoPath}" alt="Église Baptiste de la Parousie" />
      </a>
    </div>
    ${renderDocActions(false)}
  </header>`;

  const letterStyles = isLetter
    ? `
    .doc-header--letter {
      grid-template-columns: 1fr auto;
    }
    .doc-lang .letter-title-row,
    .doc-lang .letter-signature {
      display: flex;
      align-items: center;
      gap: 1.25rem;
      margin: 0 0 1.5rem;
    }
    .doc-lang .letter-title-row h1 {
      margin: 0;
      font-size: 1.75rem;
      line-height: 1.2;
    }
    .doc-lang .letter-brand-logo {
      width: 88px;
      height: auto;
      flex-shrink: 0;
      border: none;
      border-radius: 0;
      margin: 0;
    }
    .doc-lang .letter-signature {
      margin-top: 1.5rem;
      align-items: flex-start;
    }
    .doc-lang .letter-signature-contact {
      font-family: system-ui, -apple-system, sans-serif;
      font-size: 0.95rem;
      line-height: 1.55;
      color: var(--text);
    }
    .doc-lang .letter-signature-contact strong {
      font-size: 1rem;
    }
    @media (max-width: 640px) {
      .doc-lang .letter-title-row,
      .doc-lang .letter-signature {
        flex-direction: column;
        align-items: flex-start;
      }
      .doc-lang .letter-title-row h1 {
        font-size: 1.4rem;
      }
    }`
    : '';

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>${escapeAttr(titleEn)}</title>
  <style>
    :root {
      color-scheme: light;
      --text: #1e293b;
      --muted: #475569;
      --border: #e2e8f0;
      --accent: #d97706;
      --accent-hover: #b45309;
      --surface: #f8fafc;
    }
    * { box-sizing: border-box; }
    body {
      margin: 0;
      font-family: Georgia, "Times New Roman", serif;
      color: var(--text);
      background: #fff;
      line-height: 1.6;
    }
    .doc-header {
      position: sticky;
      top: 0;
      z-index: 20;
      display: grid;
      grid-template-columns: 1fr auto 1fr;
      align-items: center;
      gap: 1rem;
      padding: 0.75rem 1.25rem;
      border-bottom: 1px solid var(--border);
      background: rgba(255, 255, 255, 0.96);
      backdrop-filter: blur(8px);
    }
    .doc-header__spacer { min-width: 0; }
    .doc-header__logo {
      display: flex;
      justify-content: center;
      align-items: center;
    }
    .doc-header__logo img {
      height: 64px;
      width: auto;
      max-width: min(360px, 72vw);
      object-fit: contain;
    }
    .doc-header__actions {
      justify-self: end;
      display: flex;
      align-items: center;
      gap: 0.5rem;
      flex-wrap: wrap;
    }
    .doc-action,
    .lang-toggle {
      display: inline-flex;
      align-items: center;
      gap: 0.5rem;
      padding: 0.5rem 0.75rem;
      border: 1px solid var(--border);
      border-radius: 0.5rem;
      background: var(--surface);
      color: var(--accent);
      font-family: system-ui, -apple-system, sans-serif;
      font-size: 0.875rem;
      font-weight: 600;
      cursor: pointer;
      transition: background 0.2s, transform 0.2s;
    }
    .doc-action:hover,
    .lang-toggle:hover {
      background: #f1f5f9;
      transform: scale(1.03);
    }
    .doc-action svg,
    .lang-toggle svg {
      width: 1rem;
      height: 1rem;
      flex-shrink: 0;
    }
    .doc-content {
      max-width: 820px;
      margin: 0 auto;
      padding: 2rem 1.25rem 4rem;
    }
    .doc-lang { display: none; }
    .doc-lang.is-active { display: block; }
    .doc-lang h1, .doc-lang h2, .doc-lang h3, .doc-lang h4 {
      font-family: Georgia, "Times New Roman", serif;
      line-height: 1.25;
    }
    .doc-lang img {
      max-width: 100%;
      height: auto;
      border: 1px solid var(--border);
      border-radius: 0.5rem;
      margin: 1rem 0;
    }
    .doc-lang a { color: #2563eb; }
    .doc-lang code {
      font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
      font-size: 0.9em;
      background: #f1f5f9;
      padding: 0.1em 0.35em;
      border-radius: 0.25rem;
    }
    .doc-lang pre {
      overflow-x: auto;
      background: #0f172a;
      color: #e2e8f0;
      padding: 1rem;
      border-radius: 0.5rem;
    }
    .doc-lang table {
      width: 100%;
      border-collapse: collapse;
      margin: 1rem 0;
      font-size: 0.95rem;
    }
    .doc-lang th, .doc-lang td {
      border: 1px solid var(--border);
      padding: 0.5rem 0.75rem;
      text-align: left;
      vertical-align: top;
    }
    .doc-lang th { background: var(--surface); }${letterStyles}
    @media print {
      .doc-header { display: none !important; }
      body { background: #fff; }
      .doc-content {
        max-width: none;
        margin: 0;
        padding: 0;
      }
      .doc-lang { display: none !important; }
      .doc-lang.is-active { display: block !important; }
      .doc-lang img {
        max-width: 100%;
        break-inside: avoid;
        page-break-inside: avoid;
      }
      .doc-lang table, .doc-lang tr, .doc-lang td, .doc-lang th {
        break-inside: avoid;
        page-break-inside: avoid;
      }
      a { color: inherit; text-decoration: none; }
    }
    @media (max-width: 640px) {
      .doc-header {
        grid-template-columns: 1fr auto;
        grid-template-areas:
          "logo actions"
          "logo actions";
      }
      .doc-header__spacer { display: none; }
      .doc-header__logo { grid-area: logo; justify-content: flex-start; }
      .doc-header__actions { grid-area: actions; justify-self: end; }
      .doc-header__logo img { height: 44px; }
      .doc-action span,
      .lang-toggle span { display: none; }
    }
  </style>
</head>
<body>
  ${headerHtml}

  <main class="doc-content">
    <article class="doc-lang is-active" id="doc-en" lang="en" data-title="${escapeAttr(titleEn)}">
      ${enBody}
    </article>
    <article class="doc-lang" id="doc-fr" lang="fr" data-title="${escapeAttr(titleFr)}">
      ${frBody}
    </article>
  </main>

  <script>
    (function () {
      var STORAGE_KEY = 'church_lang';
      var IS_LETTER = ${isLetter ? 'true' : 'false'};
      var OUTLOOK = {
        to: 'franckyvan@gmail.com',
        from: 'mp4forbes@straightlineholdings.com',
        subjectEn: 'Formal Notice of Project Completion — Parousia Baptist Ministries Website',
        subjectFr: 'Avis officiel d’achèvement du projet — Site Web de Parousia Baptist Ministries'
      };
      var toggle = document.getElementById('lang-toggle');
      var label = document.getElementById('lang-toggle-label');
      var printBtn = document.getElementById('print-btn');
      var printLabel = document.getElementById('print-btn-label');
      var outlookBtn = document.getElementById('outlook-btn');
      var outlookLabel = document.getElementById('outlook-btn-label');
      var en = document.getElementById('doc-en');
      var fr = document.getElementById('doc-fr');

      function normalizeLang(value) {
        return value === 'fr' || value === 'fr_ht' || value === 'ht' ? 'fr' : 'en';
      }

      function readLang() {
        try {
          return normalizeLang(localStorage.getItem(STORAGE_KEY) || 'en');
        } catch (e) {
          return 'en';
        }
      }

      function writeLang(lang) {
        try {
          localStorage.setItem(STORAGE_KEY, lang === 'fr' ? 'fr_ht' : 'en');
        } catch (e) {}
      }

      function updateActionLabels(isFr) {
        label.textContent = isFr ? 'English' : 'Français';
        toggle.setAttribute('aria-label', isFr ? 'Passer à l’anglais' : 'Switch to French');
        if (printLabel) printLabel.textContent = isFr ? 'Imprimer' : 'Print';
        if (printBtn) printBtn.setAttribute('aria-label', isFr ? 'Imprimer le document' : 'Print document');
        if (outlookLabel) outlookLabel.textContent = 'Outlook';
        if (outlookBtn) outlookBtn.setAttribute('aria-label', isFr ? 'Ouvrir dans Outlook' : 'Open in Outlook');
      }

      function applyLang(lang) {
        var isFr = lang === 'fr';
        en.classList.toggle('is-active', !isFr);
        fr.classList.toggle('is-active', isFr);
        document.documentElement.lang = isFr ? 'fr' : 'en';
        document.title = isFr ? fr.getAttribute('data-title') : en.getAttribute('data-title');
        updateActionLabels(isFr);
      }

      function getActiveArticle() {
        return fr.classList.contains('is-active') ? fr : en;
      }

      function absolutizeHtml(html) {
        var origin = window.location.origin;
        return html
          .replace(/src="\\/admin-guide\\//g, 'src="' + origin + '/admin-guide/')
          .replace(/src="\\/logo/g, 'src="' + origin + '/logo')
          .replace(/href="\\/admin-guide\\//g, 'href="' + origin + '/admin-guide/');
      }

      function buildEml(isFr) {
        var subject = isFr ? OUTLOOK.subjectFr : OUTLOOK.subjectEn;
        var bodyHtml = absolutizeHtml(getActiveArticle().innerHTML);
        var htmlDoc = '<!DOCTYPE html><html><head><meta charset="UTF-8"><style>body{font-family:Georgia,serif;color:#1e293b;line-height:1.6;} img{max-width:100%;} table{border-collapse:collapse;width:100%;} td,th{border:1px solid #e2e8f0;padding:8px;}</style></head><body>' + bodyHtml + '</body></html>';
        var lines = [
          'From: ' + OUTLOOK.from,
          'To: ' + OUTLOOK.to,
          'Subject: ' + subject,
          'MIME-Version: 1.0',
          'Content-Type: text/html; charset=UTF-8',
          'Content-Transfer-Encoding: 8bit',
          'X-Unsent: 1',
          '',
          htmlDoc
        ];
        return lines.join('\\r\\n');
      }

      function openInOutlook() {
        var isFr = fr.classList.contains('is-active');
        var blob = new Blob([buildEml(isFr)], { type: 'message/rfc822' });
        var url = URL.createObjectURL(blob);
        var link = document.createElement('a');
        link.href = url;
        link.download = isFr ? 'Parousia-Completion-Letter-fr.eml' : 'Parousia-Completion-Letter-en.eml';
        document.body.appendChild(link);
        link.click();
        link.remove();
        setTimeout(function () { URL.revokeObjectURL(url); }, 1000);
        window.alert(isFr
          ? 'Le fichier Outlook a été téléchargé. Ouvrez-le pour relire et envoyer la lettre.'
          : 'Outlook file downloaded. Open it to review and send the letter.');
      }

      applyLang(readLang());

      toggle.addEventListener('click', function () {
        var next = en.classList.contains('is-active') ? 'fr' : 'en';
        writeLang(next);
        applyLang(next);
      });

      if (printBtn) {
        printBtn.addEventListener('click', function () {
          window.print();
        });
      }

      if (outlookBtn) {
        outlookBtn.addEventListener('click', openInOutlook);
      }

      var params = new URLSearchParams(window.location.search);
      if (params.get('print') === '1') {
        setTimeout(function () { window.print(); }, 300);
      }
      if (IS_LETTER && params.get('outlook') === '1') {
        setTimeout(openInOutlook, 300);
      }
    })();
  </script>
</body>
</html>
`;
}

for (const doc of bilingualDocuments) {
  const enPath = path.join(docsDir, doc.inputEn);
  const frPath = path.join(docsDir, doc.inputFr);
  const outputPath = path.join(publicDir, doc.output);

  if (!fs.existsSync(enPath) || !fs.existsSync(frPath)) {
    console.warn(`Skipping ${doc.output}: missing source file(s)`);
    continue;
  }

  const html = wrapBilingualDocument({
    titleEn: doc.titleEn,
    titleFr: doc.titleFr,
    enBody: pandocFragment(enPath),
    frBody: pandocFragment(frPath),
    logoPath: churchLogoPath,
    kind: doc.kind || 'guide',
  });

  fs.writeFileSync(outputPath, html, 'utf8');
  console.log(`Built ${outputPath}`);
}

const indexHtml = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>Parousia Baptist Ministries — Admin Documents</title>
  <style>
    body { font-family: Georgia, serif; max-width: 720px; margin: 40px auto; padding: 0 20px; line-height: 1.6; color: #1e293b; }
    h1 { font-size: 1.75rem; margin-bottom: 0.25rem; }
    p { color: #475569; }
    ul { padding-left: 1.25rem; }
    a { color: #2563eb; text-decoration: none; font-weight: 600; }
    a:hover { text-decoration: underline; }
    .section { margin-top: 2rem; }
    .logo { display: block; margin: 0 auto 1.5rem; height: 80px; width: auto; max-width: min(360px, 90vw); }
  </style>
</head>
<body>
  <img class="logo" src="${churchLogoPath}" alt="Église Baptiste de la Parousie" />
  <h1>Parousia Baptist Ministries</h1>
  <p>Official administration documents — English &amp; Français (toggle inside each document)</p>
  <div class="section">
    <h2>Administration Guide</h2>
    <ul>
      <li><a href="/admin-guide/Parousia-Admin-Guide.html">Website Administration Guide / Guide d’administration</a></li>
    </ul>
  </div>
  <div class="section">
    <h2>Project Letter</h2>
    <ul>
      <li><a href="/admin-guide/Parousia-Completion-Letter.html">Project Completion Letter / Lettre d’achèvement du projet</a></li>
    </ul>
  </div>
</body>
</html>
`;

fs.writeFileSync(path.join(publicDir, 'index.html'), indexHtml, 'utf8');
console.log(`Built ${path.join(publicDir, 'index.html')}`);

// Remove legacy single-language HTML files if present
for (const legacy of [
  'Parousia-Admin-Guide-en.html',
  'Parousia-Admin-Guide-ht.html',
  'Parousia-Completion-Letter-en.html',
  'Parousia-Completion-Letter-ht.html',
]) {
  const legacyPath = path.join(publicDir, legacy);
  if (fs.existsSync(legacyPath)) {
    fs.rmSync(legacyPath);
    console.log(`Removed legacy ${legacyPath}`);
  }
}
