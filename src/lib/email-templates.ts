const CHURCH_FROM_EMAIL = 'contact@parousiabaptistchurch.org';
const DEFAULT_SITE_ORIGIN = 'https://parousiabaptistchurch.org';

export function getChurchFromEmail(): string {
  return CHURCH_FROM_EMAIL;
}

export function getPublicSiteOrigin(): string {
  const configured = process.env.NEXT_PUBLIC_SITE_URL?.trim() || process.env.SITE_URL?.trim();
  if (!configured) return DEFAULT_SITE_ORIGIN;
  return configured.replace(/\/$/, '');
}

export function toAbsoluteSiteUrl(pathOrUrl: string | undefined | null): string {
  const value = (pathOrUrl || '').trim();
  if (!value) return `${getPublicSiteOrigin()}/logo.png`;
  if (/^https?:\/\//i.test(value) || value.startsWith('data:')) return value;
  if (value.startsWith('//')) return `https:${value}`;
  return `${getPublicSiteOrigin()}${value.startsWith('/') ? value : `/${value}`}`;
}

export function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

export function textToHtmlParagraphs(text: string): string {
  return text
    .split(/\n{2,}/)
    .map((block) => `<p style="margin:0 0 16px;line-height:1.6;">${escapeHtml(block).replace(/\n/g, '<br>')}</p>`)
    .join('');
}

interface ChurchEmailOptions {
  title: string;
  bodyHtml: string;
  logoUrl?: string;
  churchName?: string;
  address?: string;
  contactEmail?: string;
}

export function buildChurchEmailHtml(options: ChurchEmailOptions): string {
  const churchName = options.churchName || 'Parousia Baptist Ministries';
  const logoUrl = toAbsoluteSiteUrl(options.logoUrl || '/logo.png');
  const address = options.address || '';
  const contactEmail = options.contactEmail || CHURCH_FROM_EMAIL;

  return `<!DOCTYPE html>
<html lang="en">
  <body style="margin:0;padding:0;background:#f1f5f9;font-family:Arial,Helvetica,sans-serif;color:#1e293b;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f1f5f9;padding:24px 12px;">
      <tr>
        <td align="center">
          <table role="presentation" width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;background:#ffffff;border-radius:16px;overflow:hidden;border:1px solid #e2e8f0;">
            <tr>
              <td style="background:#0f172a;padding:28px 32px;text-align:center;">
                <img src="${escapeHtml(logoUrl)}" alt="${escapeHtml(churchName)}" width="88" style="display:block;margin:0 auto 12px;max-width:88px;height:auto;border:0;" />
                <h1 style="margin:0;font-size:20px;line-height:1.4;color:#f8fafc;font-weight:700;">${escapeHtml(churchName)}</h1>
              </td>
            </tr>
            <tr>
              <td style="padding:32px;">
                <h2 style="margin:0 0 16px;font-size:22px;line-height:1.35;color:#0f172a;">${escapeHtml(options.title)}</h2>
                ${options.bodyHtml}
              </td>
            </tr>
            <tr>
              <td style="background:#f8fafc;padding:24px 32px;border-top:1px solid #e2e8f0;text-align:center;color:#64748b;font-size:13px;line-height:1.6;">
                <p style="margin:0 0 6px;font-weight:700;color:#1e293b;">${escapeHtml(churchName)}</p>
                ${address ? `<p style="margin:0 0 6px;">${escapeHtml(address)}</p>` : ''}
                <p style="margin:0;"><a href="mailto:${escapeHtml(contactEmail)}" style="color:#b45309;text-decoration:none;">${escapeHtml(contactEmail)}</a></p>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>`;
}
