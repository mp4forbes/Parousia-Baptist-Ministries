import { NextRequest, NextResponse } from 'next/server';
import { getChurchContact } from '@/lib/church-contact';
import { resolveChurchLogo } from '@/lib/church-logo';
import { devotionalPdfFilename, generateDevotionalPdf } from '@/lib/devotional-pdf';

export const runtime = 'nodejs';

export async function GET(request: NextRequest) {
  const langParam = request.nextUrl.searchParams.get('lang');
  const lang = langParam === 'fr' ? 'fr' : 'en';
  const download = request.nextUrl.searchParams.get('download') === '1';

  try {
    const [logo, contact] = await Promise.all([resolveChurchLogo(request), getChurchContact()]);
    const pdfBytes = await generateDevotionalPdf(lang, { logo, contact });
    const filename = devotionalPdfFilename(lang);

    return new NextResponse(Buffer.from(pdfBytes), {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Length': String(pdfBytes.length),
        'Cache-Control': 'private, no-cache, no-store, must-revalidate',
        ...(download
          ? { 'Content-Disposition': `attachment; filename="${filename}"` }
          : { 'Content-Disposition': `inline; filename="${filename}"` }),
      },
    });
  } catch (error) {
    console.error('Failed to generate devotional PDF:', error);
    return NextResponse.json({ error: 'Failed to generate devotional PDF' }, { status: 500 });
  }
}
