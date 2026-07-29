interface SendEmailOptions {
  to: string[];
  subject: string;
  text: string;
  html?: string;
  fromEmail?: string;
  fromName?: string;
}

export function getAdminOtpFromEmail(): string {
  const configured =
    process.env.ADMIN_OTP_FROM_EMAIL?.trim() ||
    process.env.SENDGRID_FROM_EMAIL?.trim() ||
    'contact@parousiabaptistchurch.org';

  const allowed = new Set([
    'contact@parousiabaptistchurch.org',
    'info@parousiabaptistchurch.org',
  ]);

  return allowed.has(configured.toLowerCase())
    ? configured.toLowerCase()
    : 'contact@parousiabaptistchurch.org';
}

export async function sendAdminOtpEmail(
  to: string,
  code: string,
  expiresAt: string
): Promise<{ success: boolean; error?: string; fromEmail?: string }> {
  const fromEmail = getAdminOtpFromEmail();
  const expiresText = new Date(expiresAt).toLocaleString('en-US', {
    dateStyle: 'medium',
    timeStyle: 'short',
  });

  const result = await sendEmail({
    to: [to],
    fromEmail,
    fromName: process.env.SENDGRID_FROM_NAME || 'Parousia Baptist Ministries',
    subject: 'Your Administrator Login Verification Code',
    text: [
      'Parousia Baptist Ministries — Admin Login',
      '',
      `Your verification code is: ${code}`,
      '',
      `This code expires at ${expiresText}.`,
      '',
      'If you did not request this code, you can safely ignore this email.',
    ].join('\n'),
    html: `
      <div style="font-family:Arial,sans-serif;line-height:1.6;color:#1e293b;max-width:520px;">
        <h2 style="margin:0 0 12px;color:#1e3a5f;">Parousia Baptist Ministries</h2>
        <p style="margin:0 0 16px;">Your administrator login verification code is:</p>
        <p style="margin:0 0 20px;font-size:28px;font-weight:bold;letter-spacing:6px;color:#1d4ed8;">${code}</p>
        <p style="margin:0 0 8px;">This code expires at <strong>${expiresText}</strong>.</p>
        <p style="margin:0;color:#64748b;font-size:14px;">If you did not request this code, you can safely ignore this email.</p>
      </div>
    `,
  });

  return { ...result, fromEmail };
}

export async function sendEmail(options: SendEmailOptions): Promise<{ success: boolean; error?: string }> {
  const apiKey = process.env.SENDGRID_API_KEY;
  if (!apiKey) {
    console.warn('[email] SENDGRID_API_KEY is not configured; skipping notification.');
    return { success: false, error: 'Email service not configured' };
  }

  const fromEmail = options.fromEmail || process.env.SENDGRID_FROM_EMAIL || 'contact@parousiabaptistchurch.org';
  const fromName = options.fromName || process.env.SENDGRID_FROM_NAME || 'Parousia Baptist Ministries';

  try {
    const response = await fetch('https://api.sendgrid.com/v3/mail/send', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        personalizations: [{ to: options.to.map((email) => ({ email })) }],
        from: { email: fromEmail, name: fromName },
        subject: options.subject,
        content: [
          { type: 'text/plain', value: options.text },
          { type: 'text/html', value: options.html || options.text.replace(/\n/g, '<br>') },
        ],
      }),
    });

    if (!response.ok) {
      const body = await response.text();
      console.error('[email] SendGrid error:', body);
      return { success: false, error: `SendGrid responded with ${response.status}` };
    }

    return { success: true };
  } catch (error: any) {
    console.error('[email] Failed to send notification:', error);
    return { success: false, error: error.message };
  }
}
