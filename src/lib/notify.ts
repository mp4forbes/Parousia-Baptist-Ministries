import { sanitizeEmailRecipient } from './admin-email';

interface SendEmailOptions {
  to: string[];
  subject: string;
  text: string;
  html?: string;
  fromEmail?: string;
  fromName?: string;
  /** OTP and other one-to-one system mail. */
  transactional?: boolean;
}

type EmailProvider = 'resend' | 'sendgrid';

/** In dev, only fake OTP success when no email provider is configured (unless DEV_OTP_FALLBACK=true). */
export function shouldUseDevOtpFallback(): boolean {
  if (process.env.NODE_ENV === 'production') return false;
  if (process.env.DEV_OTP_FALLBACK === 'true') return true;
  return !process.env.RESEND_API_KEY?.trim() && !process.env.SENDGRID_API_KEY?.trim();
}

function getEmailFromName(): string {
  return (
    process.env.RESEND_FROM_NAME?.trim() ||
    process.env.SENDGRID_FROM_NAME?.trim() ||
    'Parousia Baptist Ministries'
  );
}

export function getAdminOtpFromEmail(): string {
  const configured =
    process.env.ADMIN_OTP_FROM_EMAIL?.trim() ||
    process.env.RESEND_FROM_EMAIL?.trim() ||
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

function resolveFromAddress(options: SendEmailOptions): { email: string; name: string } {
  const email =
    options.fromEmail ||
    process.env.RESEND_FROM_EMAIL?.trim() ||
    process.env.SENDGRID_FROM_EMAIL?.trim() ||
    'contact@parousiabaptistchurch.org';
  const name = options.fromName || getEmailFromName();
  return { email, name };
}

function formatResendFrom(email: string, name: string): string {
  const safeName = name.replace(/[<>]/g, '').trim() || 'Parousia Baptist Ministries';
  return `${safeName} <${email}>`;
}

function resolveEmailProvider(): EmailProvider | null {
  if (process.env.RESEND_API_KEY?.trim()) {
    return 'resend';
  }
  if (process.env.SENDGRID_API_KEY?.trim()) {
    return 'sendgrid';
  }
  return null;
}

function parseSendGridError(body: string, status: number): string {
  try {
    const parsed = JSON.parse(body) as { errors?: Array<{ message?: string }> };
    const messages = (parsed.errors || [])
      .map((entry) => entry.message?.trim())
      .filter((message): message is string => Boolean(message));
    if (messages.length > 0) {
      return messages.join('; ');
    }
  } catch {
    // Ignore JSON parse failures.
  }
  return `SendGrid responded with ${status}`;
}

function parseResendError(body: string, status: number): string {
  try {
    const parsed = JSON.parse(body) as { message?: string };
    if (parsed.message?.trim()) {
      return parsed.message.trim();
    }
  } catch {
    // Ignore JSON parse failures.
  }
  return `Resend responded with ${status}`;
}

async function sendViaResend(
  options: SendEmailOptions,
  recipients: string[],
  from: { email: string; name: string }
): Promise<{ success: boolean; error?: string; messageId?: string }> {
  const apiKey = process.env.RESEND_API_KEY?.trim();
  if (!apiKey) {
    return { success: false, error: 'Resend API key not configured' };
  }

  const payload: Record<string, unknown> = {
    from: formatResendFrom(from.email, from.name),
    to: recipients,
    subject: options.subject,
    html: options.html || options.text.replace(/\n/g, '<br>'),
    text: options.text,
    reply_to: from.email,
  };

  if (options.transactional) {
    payload.tags = [{ name: 'category', value: 'transactional' }];
  }

  const response = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  });

  const body = await response.text();
  if (!response.ok) {
    console.error('[email] Resend error:', { status: response.status, body, to: recipients, subject: options.subject });
    return { success: false, error: parseResendError(body, response.status) };
  }

  let messageId: string | undefined;
  try {
    const parsed = JSON.parse(body) as { id?: string };
    messageId = parsed.id;
  } catch {
    // Ignore parse failures.
  }

  return { success: true, messageId };
}

async function sendViaSendGrid(
  options: SendEmailOptions,
  recipients: string[],
  from: { email: string; name: string }
): Promise<{ success: boolean; error?: string; messageId?: string }> {
  const apiKey = process.env.SENDGRID_API_KEY?.trim();
  if (!apiKey) {
    return { success: false, error: 'SendGrid API key not configured' };
  }

  const payload: Record<string, unknown> = {
    personalizations: [{ to: recipients.map((email) => ({ email })) }],
    from: { email: from.email, name: from.name },
    reply_to: { email: from.email, name: from.name },
    subject: options.subject,
    content: [
      { type: 'text/plain', value: options.text },
      { type: 'text/html', value: options.html || options.text.replace(/\n/g, '<br>') },
    ],
  };

  if (options.transactional) {
    payload.categories = ['transactional', 'otp'];
    payload.mail_settings = {
      bypass_list_management: { enable: true },
      bypass_unsubscribe_management: { enable: true },
    };
    payload.tracking_settings = {
      click_tracking: { enable: false, enable_text: false },
      open_tracking: { enable: false },
      subscription_tracking: { enable: false },
    };
    payload.headers = {
      'X-Priority': '1',
      Importance: 'high',
      'X-Auto-Response-Suppress': 'All',
    };
  }

  const response = await fetch('https://api.sendgrid.com/v3/mail/send', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  });

  const messageId = response.headers.get('x-message-id') || undefined;

  if (!response.ok) {
    const body = await response.text();
    console.error('[email] SendGrid error:', { status: response.status, body, to: recipients, subject: options.subject });
    return { success: false, error: parseSendGridError(body, response.status) };
  }

  return { success: true, messageId };
}

export async function sendAdminOtpEmail(
  to: string,
  code: string,
  expiresAt: string
): Promise<{ success: boolean; error?: string; fromEmail?: string; messageId?: string }> {
  const fromEmail = getAdminOtpFromEmail();
  const recipient = sanitizeEmailRecipient(to);
  const expiresText = new Date(expiresAt).toLocaleString('en-US', {
    dateStyle: 'medium',
    timeStyle: 'short',
  });

  const result = await sendEmail({
    to: [recipient],
    fromEmail,
    fromName: getEmailFromName(),
    subject: 'Parousia Baptist Ministries — Admin sign-in code',
    transactional: true,
    text: [
      'Parousia Baptist Ministries — Admin Login',
      '',
      `Your sign-in code is: ${code}`,
      '',
      `This code expires at ${expiresText}.`,
      '',
      'If you did not request this code, you can safely ignore this email.',
    ].join('\n'),
    html: `
      <div style="font-family:Arial,sans-serif;line-height:1.6;color:#1e293b;max-width:520px;">
        <h2 style="margin:0 0 12px;color:#1e3a5f;">Parousia Baptist Ministries</h2>
        <p style="margin:0 0 16px;">Your administrator sign-in code is:</p>
        <p style="margin:0 0 20px;font-size:28px;font-weight:bold;letter-spacing:6px;color:#1d4ed8;">${code}</p>
        <p style="margin:0 0 8px;">This code expires at <strong>${expiresText}</strong>.</p>
        <p style="margin:0;color:#64748b;font-size:14px;">If you did not request this code, you can safely ignore this email.</p>
      </div>
    `,
  });

  return { ...result, fromEmail };
}

export async function sendRecipientOtpEmail(
  to: string,
  code: string,
  expiresAt: string
): Promise<{ success: boolean; error?: string; fromEmail?: string; messageId?: string }> {
  const fromEmail = getAdminOtpFromEmail();
  const recipient = sanitizeEmailRecipient(to);
  const expiresText = new Date(expiresAt).toLocaleString('en-US', {
    dateStyle: 'medium',
    timeStyle: 'short',
  });

  const result = await sendEmail({
    to: [recipient],
    fromEmail,
    fromName: getEmailFromName(),
    subject: 'Parousia Baptist Ministries — Coordinator sign-in code',
    transactional: true,
    text: [
      'Parousia Baptist Ministries — Coordinator sign-in',
      '',
      `Your sign-in code is: ${code}`,
      '',
      `This code expires at ${expiresText}.`,
      '',
      'If you did not request this code, you can safely ignore this email.',
    ].join('\n'),
    html: `
      <div style="font-family:Arial,sans-serif;line-height:1.6;color:#1e293b;max-width:520px;">
        <h2 style="margin:0 0 12px;color:#1e3a5f;">Parousia Baptist Ministries</h2>
        <p style="margin:0 0 16px;">Your coordinator sign-in code is:</p>
        <p style="margin:0 0 20px;font-size:28px;font-weight:bold;letter-spacing:6px;color:#1d4ed8;">${code}</p>
        <p style="margin:0 0 8px;">This code expires at <strong>${expiresText}</strong>.</p>
        <p style="margin:0;color:#64748b;font-size:14px;">If you did not request this code, you can safely ignore this email.</p>
      </div>
    `,
  });

  return { ...result, fromEmail };
}

export async function sendEmail(
  options: SendEmailOptions
): Promise<{ success: boolean; error?: string; messageId?: string }> {
  const provider = resolveEmailProvider();
  if (!provider) {
    console.warn('[email] No email provider configured (set RESEND_API_KEY or SENDGRID_API_KEY).');
    return { success: false, error: 'Email service not configured' };
  }

  const from = resolveFromAddress(options);
  const recipients = options.to.map((email) => sanitizeEmailRecipient(email)).filter(Boolean);

  if (recipients.length === 0) {
    return { success: false, error: 'No valid recipient email address' };
  }

  try {
    const result =
      provider === 'resend'
        ? await sendViaResend(options, recipients, from)
        : await sendViaSendGrid(options, recipients, from);

    if (result.success) {
      const recipientDomains = recipients.map((email) => email.split('@')[1] || 'unknown');
      console.log('[email] sent', {
        provider,
        toDomains: recipientDomains,
        subject: options.subject,
        transactional: Boolean(options.transactional),
        messageId: result.messageId,
      });
    }

    return result;
  } catch (error: any) {
    console.error('[email] Failed to send notification:', error);
    return { success: false, error: error.message };
  }
}
