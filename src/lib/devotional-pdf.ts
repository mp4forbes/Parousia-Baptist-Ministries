import { PDFDocument, StandardFonts, rgb, type PDFFont, type PDFImage, type PDFPage } from 'pdf-lib';
import { getDevotionalBooklet } from './devotional-booklet';
import type { ChurchContact } from './church-contact';
import { prepareImageForPdf } from './image-for-pdf';
import type { SiteImageData } from './site-image';

const PAGE_WIDTH = 612;
const PAGE_HEIGHT = 792;
const MARGIN = 54;
const CONTENT_WIDTH = PAGE_WIDTH - MARGIN * 2;
const LOGO_MAX_HEIGHT = 96;
const LOGO_MAX_WIDTH = 180;

const COLORS = {
  title: rgb(0.1, 0.15, 0.25),
  accent: rgb(0.85, 0.55, 0.1),
  body: rgb(0.2, 0.22, 0.28),
  muted: rgb(0.45, 0.48, 0.55),
  line: rgb(0.88, 0.9, 0.93),
};

function wrapText(text: string, font: PDFFont, size: number, maxWidth: number): string[] {
  const words = text.split(/\s+/);
  const lines: string[] = [];
  let current = '';

  for (const word of words) {
    const candidate = current ? `${current} ${word}` : word;
    if (font.widthOfTextAtSize(candidate, size) <= maxWidth) {
      current = candidate;
      continue;
    }
    if (current) lines.push(current);
    current = word;
  }
  if (current) lines.push(current);
  return lines;
}

function drawWrappedText(
  page: PDFPage,
  text: string,
  x: number,
  y: number,
  font: PDFFont,
  size: number,
  color: ReturnType<typeof rgb>,
  maxWidth: number,
  lineHeight: number
): number {
  const lines = wrapText(text, font, size, maxWidth);
  let cursorY = y;
  for (const line of lines) {
    page.drawText(line, { x, y: cursorY, size, font, color });
    cursorY -= lineHeight;
  }
  return cursorY;
}

async function embedLogoBytes(
  pdfDoc: PDFDocument,
  imageData: SiteImageData
): Promise<PDFImage | null> {
  try {
    const prepared = await prepareImageForPdf(imageData);
    return prepared.format === 'png'
      ? pdfDoc.embedPng(prepared.bytes)
      : pdfDoc.embedJpg(prepared.bytes);
  } catch (error) {
    console.error('Failed to embed church logo in devotional PDF:', error);
    return null;
  }
}

function drawLogo(
  page: PDFPage,
  logoImage: PDFImage,
  topY: number
): number {
  const dims = logoImage.scale(1);
  const scale = Math.min(LOGO_MAX_WIDTH / dims.width, LOGO_MAX_HEIGHT / dims.height, 1);
  const width = dims.width * scale;
  const height = dims.height * scale;
  const x = (PAGE_WIDTH - width) / 2;

  page.drawImage(logoImage, {
    x,
    y: topY - height,
    width,
    height,
  });

  return topY - height - 18;
}

export async function generateDevotionalPdf(
  lang: 'en' | 'fr',
  options?: { logo?: SiteImageData | null; contact?: ChurchContact }
): Promise<Uint8Array> {
  const booklet = getDevotionalBooklet(lang);
  const contact = options?.contact;
  const pdfDoc = await PDFDocument.create();
  const regular = await pdfDoc.embedFont(StandardFonts.TimesRoman);
  const bold = await pdfDoc.embedFont(StandardFonts.TimesRomanBold);
  const italic = await pdfDoc.embedFont(StandardFonts.TimesRomanItalic);
  const logoImage = options?.logo ? await embedLogoBytes(pdfDoc, options.logo) : null;

  const labels =
    lang === 'fr'
      ? {
          scripture: 'Verset à méditer',
          meditation: 'Méditation',
          prayer: 'Prière',
        }
      : {
          scripture: 'Scripture',
          meditation: 'Meditation',
          prayer: 'Prayer',
        };

  let page = pdfDoc.addPage([PAGE_WIDTH, PAGE_HEIGHT]);
  let y = PAGE_HEIGHT - MARGIN;

  if (logoImage) {
    y = drawLogo(page, logoImage, y);
  }

  page.drawRectangle({
    x: MARGIN,
    y: y - 6,
    width: CONTENT_WIDTH,
    height: 6,
    color: COLORS.accent,
  });
  y -= 20;

  y = drawWrappedText(page, booklet.churchName, MARGIN, y, bold, 18, COLORS.title, CONTENT_WIDTH, 24);
  y -= 4;
  y = drawWrappedText(page, booklet.subtitle, MARGIN, y, italic, 13, COLORS.muted, CONTENT_WIDTH, 18);
  y -= 24;

  y = drawWrappedText(page, booklet.greeting, MARGIN, y, bold, 12, COLORS.body, CONTENT_WIDTH, 17);
  y -= 8;
  y = drawWrappedText(page, booklet.intro, MARGIN, y, regular, 11.5, COLORS.body, CONTENT_WIDTH, 16);
  y -= 16;

  page.drawLine({
    start: { x: MARGIN, y },
    end: { x: PAGE_WIDTH - MARGIN, y },
    thickness: 1,
    color: COLORS.line,
  });
  y -= 18;

  y = drawWrappedText(page, `"${booklet.closingQuote}"`, MARGIN, y, italic, 11, COLORS.body, CONTENT_WIDTH, 15);
  y -= 2;
  page.drawText(`— ${booklet.closingQuoteRef}`, { x: MARGIN, y, size: 10, font: regular, color: COLORS.muted });
  y -= 28;

  for (const day of booklet.days) {
    if (y < MARGIN + 180) {
      page = pdfDoc.addPage([PAGE_WIDTH, PAGE_HEIGHT]);
      y = PAGE_HEIGHT - MARGIN;
    }

    page.drawRectangle({
      x: MARGIN,
      y: y - 2,
      width: 4,
      height: 22,
      color: COLORS.accent,
    });
    y = drawWrappedText(page, day.title, MARGIN + 12, y, bold, 14, COLORS.title, CONTENT_WIDTH - 12, 18);
    y -= 10;

    page.drawText(labels.scripture.toUpperCase(), {
      x: MARGIN,
      y,
      size: 9,
      font: bold,
      color: COLORS.accent,
    });
    y -= 14;
    page.drawText(day.scriptureRef, { x: MARGIN, y, size: 11, font: bold, color: COLORS.body });
    y -= 16;
    y = drawWrappedText(page, `"${day.scriptureText}"`, MARGIN, y, italic, 11, COLORS.body, CONTENT_WIDTH, 15);
    y -= 12;

    page.drawText(labels.meditation.toUpperCase(), {
      x: MARGIN,
      y,
      size: 9,
      font: bold,
      color: COLORS.accent,
    });
    y -= 14;
    y = drawWrappedText(page, day.meditation, MARGIN, y, regular, 11, COLORS.body, CONTENT_WIDTH, 15);
    y -= 12;

    page.drawText(labels.prayer.toUpperCase(), {
      x: MARGIN,
      y,
      size: 9,
      font: bold,
      color: COLORS.accent,
    });
    y -= 14;
    y = drawWrappedText(page, day.prayer, MARGIN, y, italic, 11, COLORS.body, CONTENT_WIDTH, 15);
    y -= 20;

    page.drawLine({
      start: { x: MARGIN, y },
      end: { x: PAGE_WIDTH - MARGIN, y },
      thickness: 0.5,
      color: COLORS.line,
    });
    y -= 18;
  }

  if (y < MARGIN + 110) {
    page = pdfDoc.addPage([PAGE_WIDTH, PAGE_HEIGHT]);
    y = PAGE_HEIGHT - MARGIN;
  }

  page.drawRectangle({
    x: MARGIN,
    y: y - 4,
    width: CONTENT_WIDTH,
    height: 1,
    color: COLORS.line,
  });
  y -= 18;
  y = drawWrappedText(page, booklet.contactTitle, MARGIN, y, bold, 12, COLORS.title, CONTENT_WIDTH, 16);
  y -= 8;

  if (contact) {
    const phoneLabel = lang === 'fr' ? 'Téléphone' : 'Phone';
    const emailLabel = lang === 'fr' ? 'Courriel' : 'Email';
    const addressLabel = lang === 'fr' ? 'Adresse' : 'Address';

    page.drawText(`${phoneLabel}: ${contact.phone}`, {
      x: MARGIN,
      y,
      size: 10.5,
      font: regular,
      color: COLORS.body,
    });
    y -= 14;
    page.drawText(`${emailLabel}: ${contact.email}`, {
      x: MARGIN,
      y,
      size: 10.5,
      font: regular,
      color: COLORS.body,
    });
    y -= 14;
    y = drawWrappedText(
      page,
      `${addressLabel}: ${contact.address}`,
      MARGIN,
      y,
      regular,
      10.5,
      COLORS.body,
      CONTENT_WIDTH,
      14
    );
  }

  return pdfDoc.save();
}

export function devotionalPdfFilename(lang: 'en' | 'fr'): string {
  return lang === 'fr'
    ? 'Parousia-Baptist-Church-Devotional-2026-French.pdf'
    : 'Parousia-Baptist-Church-Devotional-2026-English.pdf';
}
