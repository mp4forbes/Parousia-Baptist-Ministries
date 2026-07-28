'use server';

import { revalidatePath } from 'next/cache';
import { db, ServiceSchedule, HaitiMission, LocalOutreach, EventRecord, Registration, Sermon, KnowledgeBaseItem, Lead, DailyDevotional, AdminRecord, AdminDevice, PrayerRequest, ContactSubmission, BlogPost, Ministry } from './db';
import { cookies } from 'next/headers';
import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';
import crypto from 'crypto';
import { getAssetDir, getBackupDir } from './paths';

// HELPERS TO GET DATA (Server Components will call these directly)

export async function getServiceSchedules(): Promise<ServiceSchedule[]> {
  try {
    return await db.prepare('SELECT * FROM service_schedules ORDER BY id ASC').all() as ServiceSchedule[];
  } catch (error) {
    console.error('Error fetching service schedules:', error);
    return [];
  }
}

export async function getMinistries(): Promise<Ministry[]> {
  try {
    return await db.prepare('SELECT * FROM ministries').all() as Ministry[];
  } catch (error) {
    console.error('Error fetching ministries:', error);
    return [];
  }
}

export async function saveMinistry(
  slug: string,
  data: Partial<Ministry>
): Promise<{ success: boolean; error?: string }> {
  const isAuthed = await checkAdminAuth();
  if (!isAuthed) return { success: false, error: 'Unauthorized' };

  try {
    const fields = Object.keys(data) as (keyof Ministry)[];
    if (fields.length === 0) return { success: true };

    const sets = fields.map(f => `${f} = ?`).join(', ');
    const params = fields.map(f => data[f]);
    params.push(slug);

    const query = `UPDATE ministries SET ${sets} WHERE slug = ?`;
    await db.prepare(query).run(...params);

    revalidatePath('/');
    revalidatePath('/admin/dashboard');
    return { success: true };
  } catch (error: any) {
    console.error(`Error saving ministry ${slug}:`, error);
    return { success: false, error: error.message };
  }
}

export async function getHaitiMissions(): Promise<HaitiMission[]> {
  try {
    return await db.prepare('SELECT * FROM haiti_missions ORDER BY id ASC').all() as HaitiMission[];
  } catch (error) {
    console.error('Error fetching Haiti missions:', error);
    return [];
  }
}

export async function getLocalOutreaches(): Promise<LocalOutreach[]> {
  try {
    return await db.prepare('SELECT * FROM local_outreach ORDER BY id ASC').all() as LocalOutreach[];
  } catch (error) {
    console.error('Error fetching local outreaches:', error);
    return [];
  }
}

export async function getEvents(): Promise<EventRecord[]> {
  try {
    return await db.prepare('SELECT * FROM events ORDER BY date ASC').all() as EventRecord[];
  } catch (error) {
    console.error('Error fetching events:', error);
    return [];
  }
}

export async function getSettings(): Promise<Record<string, string>> {
  try {
    const rows = await db.prepare('SELECT key, value FROM settings').all() as { key: string; value: string }[];
    const settingsMap: Record<string, string> = {};
    rows.forEach(row => {
      settingsMap[row.key] = row.value;
    });
    return settingsMap;
  } catch (error) {
    console.error('Error fetching settings:', error);
    return {};
  }
}

export async function getKnowledgeBaseItems(): Promise<KnowledgeBaseItem[]> {
  try {
    return await db.prepare('SELECT * FROM knowledge_base ORDER BY id DESC').all() as KnowledgeBaseItem[];
  } catch (error) {
    console.error('Error fetching knowledge base items:', error);
    return [];
  }
}

export async function addKnowledgeBaseItem(
  title: string,
  type: string,
  url: string
): Promise<{ success: boolean; error?: string }> {
  const isAuthed = await checkAdminAuth();
  if (!isAuthed) return { success: false, error: 'Unauthorized' };

  try {
    const createdAt = new Date().toISOString().split('T')[0];
    const insert = await db.prepare(`
      INSERT INTO knowledge_base (title, type, url, created_at)
      VALUES (?, ?, ?, ?)
    `);
    await insert.run(title, type, url, createdAt);
    
    // Automatically trigger site backup on schema modifications/data changes
    await backupWebsite();
    
    revalidatePath('/admin/dashboard');
    return { success: true };
  } catch (error: any) {
    console.error('Error adding knowledge base item:', error);
    return { success: false, error: error.message };
  }
}

export async function deleteKnowledgeBaseItem(id: number): Promise<{ success: boolean; error?: string }> {
  const isAuthed = await checkAdminAuth();
  if (!isAuthed) return { success: false, error: 'Unauthorized' };

  try {
    // Optionally delete from disk if it was an uploaded PDF file
    const item = await db.prepare('SELECT url FROM knowledge_base WHERE id = ?').get(id) as { url: string } | undefined;
    if (item && item.url.startsWith('/api/assets/')) {
      const fileName = item.url.replace('/api/assets/', '');
      const filePath = path.join('/Users/mpforbes/GoogleCloud/Straight-Line-Churches/Parousie/assets', fileName);
      if (fs.existsSync(filePath)) {
        try {
          fs.unlinkSync(filePath);
        } catch (unlinkErr) {
          console.warn('Could not delete physical knowledge base asset file:', unlinkErr);
        }
      }
    }

    await db.prepare('DELETE FROM knowledge_base WHERE id = ?').run(id);
    
    await backupWebsite();
    
    revalidatePath('/admin/dashboard');
    return { success: true };
  } catch (error: any) {
    console.error('Error deleting knowledge base item:', error);
    return { success: false, error: error.message };
  }
}

// PUBLIC MUTATION ACTIONS

export async function registerForEvent(
  eventId: number,
  name: string,
  email: string,
  phone: string,
  notes: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const insert = await db.prepare(`
      INSERT INTO registrations (event_id, name, email, phone, notes)
      VALUES (?, ?, ?, ?, ?)
    `);
    await insert.run(eventId, name, email, phone, notes);
    revalidatePath('/');
    revalidatePath('/admin/dashboard');
    return { success: true };
  } catch (error: any) {
    console.error('Error registering for event:', error);
    return { success: false, error: error.message || 'Unknown database error' };
  }
}

export async function simulateOffering(
  amount: number,
  fund: string,
  frequency: string,
  cardName: string
): Promise<{ success: boolean; txId?: string; error?: string }> {
  try {
    // In a real production application, you would connect to Stripe/PayPal here.
    // We simulate a successful transaction and log/update funds raised if the fund is Haiti Missions.
    const txId = 'TX-' + Math.random().toString(36).substr(2, 9).toUpperCase();
    
    if (fund === 'Haiti Missions' || fund === 'missions') {
      // Find the first Haiti mission and add some funds as a simulation
      const firstMission = await db.prepare('SELECT id, funds_raised FROM haiti_missions LIMIT 1').get() as { id: number; funds_raised: number } | undefined;
      if (firstMission) {
        const update = await db.prepare('UPDATE haiti_missions SET funds_raised = funds_raised + ? WHERE id = ?');
        await update.run(amount, firstMission.id);
      }
    }
    
    revalidatePath('/');
    return { success: true, txId };
  } catch (error: any) {
    console.error('Error simulating donation:', error);
    return { success: false, error: error.message };
  }
}

// ADMIN AUTHENTICATION

export async function verifyAdminPassword(password: string): Promise<{ success: boolean }> {
  try {
    const stored = await db.prepare('SELECT value FROM settings WHERE key = ?').get('admin_password') as { value: string } | undefined;
    if (stored && stored.value === password) {
      const cookieStore = await cookies();
      cookieStore.set('admin_auth', 'authenticated', {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        maxAge: 60 * 60 * 2, // 1 hour session
        path: '/'
      });
      return { success: true };
    }
    return { success: false };
  } catch (error) {
    console.error('Error verifying password:', error);
    return { success: false };
  }
}

const getSessionSecret = () => {
  return process.env.SESSION_SECRET || 'parousie_session_super_secret_key_2026_default_fallback_32';
};

function encryptSession(text: string): string {
  const key = crypto.createHash('sha256').update(getSessionSecret()).digest(); // always 32 bytes
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv('aes-256-cbc', key, iv);
  let encrypted = cipher.update(text, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  return iv.toString('hex') + ':' + encrypted;
}

function decryptSession(text: string): string | null {
  try {
    const parts = text.split(':');
    if (parts.length !== 2) return null;
    const iv = Buffer.from(parts[0], 'hex');
    const encryptedText = parts[1]; // Keep as hex string to match crypto typings
    const key = crypto.createHash('sha256').update(getSessionSecret()).digest();
    const decipher = crypto.createDecipheriv('aes-256-cbc', key, iv);
    let decrypted = decipher.update(encryptedText, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    return decrypted;
  } catch (error) {
    console.error('Session decryption failed:', error);
    return null;
  }
}

export async function getLoggedInAdminEmail(): Promise<string | null> {
  try {
    const cookieStore = await cookies();
    const auth = cookieStore.get('admin_auth');
    if (!auth?.value) return null;
    
    // Support legacy plaintext authenticated sessions if any, fallback to super-admin
    if (auth.value === 'authenticated') {
      return (process.env.SUPER_ADMIN_EMAIL || 'straightlineaffiliate@gmail.com').toLowerCase().trim();
    }
    
    const decrypted = decryptSession(auth.value);
    if (!decrypted) return null;
    const session = JSON.parse(decrypted);
    if (new Date().getTime() > session.exp) {
      return null; // Expired
    }
    return session.email;
  } catch (e) {
    console.error('Error getting logged in admin email:', e);
    return null;
  }
}

export async function checkAdminAuth(): Promise<boolean> {
  const email = await getLoggedInAdminEmail();
  return !!email;
}

export async function logoutAdmin(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete('admin_auth');
}

// ADMINISTRATIVE CRUD OPERATIONS

export async function updateGlobalSettings(settingsMap: Record<string, string>): Promise<{ success: boolean; error?: string }> {
  const isAuthed = await checkAdminAuth();
  if (!isAuthed) return { success: false, error: 'Unauthorized' };

  try {
    // Check if the user is attempting to modify the admin_password
    if ('admin_password' in settingsMap && settingsMap.admin_password && settingsMap.admin_password.trim() !== '') {
      const loggedInEmail = await getLoggedInAdminEmail();
      const superAdminEmail = (process.env.SUPER_ADMIN_EMAIL || 'straightlineaffiliate@gmail.com').toLowerCase().trim();
      if (loggedInEmail?.toLowerCase().trim() !== superAdminEmail) {
        return { success: false, error: 'Only the Super-Administrator (straightlineaffiliate@gmail.com) can modify the master administrator access code.' };
      }
    }

    const update = db.prepare('INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)');
    for (const [key, value] of Object.entries(settingsMap)) {
      if (key === 'admin_password') {
        if (!value || value.trim() === '') {
          continue;
        }
        const hashed = crypto.createHash('sha256').update(value).digest('hex');
        await update.run(key, hashed);
      } else {
        await update.run(key, value);
      }
    }

    revalidatePath('/');
    revalidatePath('/admin/dashboard');
    return { success: true };
  } catch (error: any) {
    console.error('Error updating settings:', error);
    return { success: false, error: error.message };
  }
}

// Service schedules mutations
export async function saveServiceSchedule(id: number | null, data: Partial<ServiceSchedule>): Promise<{ success: boolean; error?: string }> {
  const isAuthed = await checkAdminAuth();
  if (!isAuthed) return { success: false, error: 'Unauthorized' };

  try {
    const isLiveVal = data.is_livestreamed ? 1 : 0;
    if (id) {
      const update = db.prepare(`
        UPDATE service_schedules
        SET day_kreyol = ?, day_english = ?, time = ?, title_kreyol = ?, title_english = ?, description_kreyol = ?, description_english = ?, image_url = ?, is_livestreamed = ?
        WHERE id = ?
      `);
      await update.run(data.day_kreyol, data.day_english, data.time, data.title_kreyol, data.title_english, data.description_kreyol, data.description_english, data.image_url || null, isLiveVal, id);
    } else {
      const insert = db.prepare(`
        INSERT INTO service_schedules (day_kreyol, day_english, time, title_kreyol, title_english, description_kreyol, description_english, image_url, is_livestreamed)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      `);
      await insert.run(data.day_kreyol, data.day_english, data.time, data.title_kreyol, data.title_english, data.description_kreyol, data.description_english, data.image_url || null, isLiveVal);
    }
    revalidatePath('/');
    return { success: true };
  } catch (error: any) {
    console.error('Error saving service schedule:', error);
    return { success: false, error: error.message };
  }
}

export async function deleteServiceSchedule(id: number): Promise<{ success: boolean; error?: string }> {
  const isAuthed = await checkAdminAuth();
  if (!isAuthed) return { success: false, error: 'Unauthorized' };

  try {
    await db.prepare('DELETE FROM service_schedules WHERE id = ?').run(id);
    revalidatePath('/');
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

// Haiti missions mutations
export async function saveHaitiMission(id: number | null, data: Partial<HaitiMission>): Promise<{ success: boolean; error?: string }> {
  const isAuthed = await checkAdminAuth();
  if (!isAuthed) return { success: false, error: 'Unauthorized' };

  try {
    if (id) {
      const update = db.prepare(`
        UPDATE haiti_missions
        SET title_kreyol = ?, title_english = ?, date = ?, description_kreyol = ?, description_english = ?, image_url = ?, funds_raised = ?, funds_goal = ?
        WHERE id = ?
      `);
      await update.run(data.title_kreyol, data.title_english, data.date, data.description_kreyol, data.description_english, data.image_url, data.funds_raised || 0, data.funds_goal || 0, id);
    } else {
      const insert = db.prepare(`
        INSERT INTO haiti_missions (title_kreyol, title_english, date, description_kreyol, description_english, image_url, funds_raised, funds_goal)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `);
      await insert.run(data.title_kreyol, data.title_english, data.date || new Date().toISOString().split('T')[0], data.description_kreyol, data.description_english, data.image_url, data.funds_raised || 0, data.funds_goal || 0);
    }
    revalidatePath('/');
    return { success: true };
  } catch (error: any) {
    console.error('Error saving Haiti mission:', error);
    return { success: false, error: error.message };
  }
}

export async function deleteHaitiMission(id: number): Promise<{ success: boolean; error?: string }> {
  const isAuthed = await checkAdminAuth();
  if (!isAuthed) return { success: false, error: 'Unauthorized' };

  try {
    await db.prepare('DELETE FROM haiti_missions WHERE id = ?').run(id);
    revalidatePath('/');
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

// Local outreach mutations
export async function saveLocalOutreach(id: number | null, data: Partial<LocalOutreach>): Promise<{ success: boolean; error?: string }> {
  const isAuthed = await checkAdminAuth();
  if (!isAuthed) return { success: false, error: 'Unauthorized' };

  try {
    if (id) {
      const update = db.prepare(`
        UPDATE local_outreach
        SET title_kreyol = ?, title_english = ?, description_kreyol = ?, description_english = ?, schedule_kreyol = ?, schedule_english = ?
        WHERE id = ?
      `);
      await update.run(data.title_kreyol, data.title_english, data.description_kreyol, data.description_english, data.schedule_kreyol, data.schedule_english, id);
    } else {
      const insert = db.prepare(`
        INSERT INTO local_outreach (title_kreyol, title_english, description_kreyol, description_english, schedule_kreyol, schedule_english)
        VALUES (?, ?, ?, ?, ?, ?)
      `);
      await insert.run(data.title_kreyol, data.title_english, data.description_kreyol, data.description_english, data.schedule_kreyol, data.schedule_english);
    }
    revalidatePath('/');
    return { success: true };
  } catch (error: any) {
    console.error('Error saving local outreach:', error);
    return { success: false, error: error.message };
  }
}

export async function deleteLocalOutreach(id: number): Promise<{ success: boolean; error?: string }> {
  const isAuthed = await checkAdminAuth();
  if (!isAuthed) return { success: false, error: 'Unauthorized' };

  try {
    await db.prepare('DELETE FROM local_outreach WHERE id = ?').run(id);
    revalidatePath('/');
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

// Events mutations
export async function saveEvent(id: number | null, data: Partial<EventRecord>): Promise<{ success: boolean; error?: string }> {
  const isAuthed = await checkAdminAuth();
  if (!isAuthed) return { success: false, error: 'Unauthorized' };

  try {
    if (id) {
      const update = db.prepare(`
        UPDATE events
        SET title_kreyol = ?, title_english = ?, date = ?, time = ?, location_kreyol = ?, location_english = ?, description_kreyol = ?, description_english = ?
        WHERE id = ?
      `);
      await update.run(data.title_kreyol, data.title_english, data.date, data.time, data.location_kreyol, data.location_english, data.description_kreyol, data.description_english, id);
    } else {
      const insert = db.prepare(`
        INSERT INTO events (title_kreyol, title_english, date, time, location_kreyol, location_english, description_kreyol, description_english)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `);
      await insert.run(data.title_kreyol, data.title_english, data.date, data.time, data.location_kreyol, data.location_english, data.description_kreyol, data.description_english);
    }
    revalidatePath('/');
    revalidatePath('/admin/dashboard');
    return { success: true };
  } catch (error: any) {
    console.error('Error saving event:', error);
    return { success: false, error: error.message };
  }
}

export async function deleteEvent(id: number): Promise<{ success: boolean; error?: string }> {
  const isAuthed = await checkAdminAuth();
  if (!isAuthed) return { success: false, error: 'Unauthorized' };

  try {
    await db.prepare('DELETE FROM events WHERE id = ?').run(id);
    revalidatePath('/');
    revalidatePath('/admin/dashboard');
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

// Registrations retrieval
export async function getRegistrations(): Promise<Registration[]> {
  const isAuthed = await checkAdminAuth();
  if (!isAuthed) return [];

  try {
    return await db.prepare(`
      SELECT r.*, e.title_kreyol as event_title_kreyol, e.title_english as event_title_english
      FROM registrations r
      JOIN events e ON r.event_id = e.id
      ORDER BY r.id DESC
    `).all() as Registration[];
  } catch (error) {
    console.error('Error fetching registrations:', error);
    return [];
  }
}

export async function deleteRegistration(id: number): Promise<{ success: boolean; error?: string }> {
  const isAuthed = await checkAdminAuth();
  if (!isAuthed) return { success: false, error: 'Unauthorized' };

  try {
    await db.prepare('DELETE FROM registrations WHERE id = ?').run(id);
    revalidatePath('/admin/dashboard');
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

// LEADS ACTIONS
export async function submitLead(
  name: string,
  email: string,
  phone: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const createdAt = new Date().toISOString();
    const insert = await db.prepare(`
      INSERT INTO leads (name, email, phone, created_at)
      VALUES (?, ?, ?, ?)
    `);
    await insert.run(name, email, phone, createdAt);
    revalidatePath('/');
    revalidatePath('/admin/dashboard');
    return { success: true };
  } catch (error: any) {
    console.error('Error submitting lead:', error);
    return { success: false, error: error.message || 'Unknown database error' };
  }
}

export async function getLeads(): Promise<Lead[]> {
  const isAuthed = await checkAdminAuth();
  if (!isAuthed) return [];

  try {
    return await db.prepare('SELECT * FROM leads ORDER BY id DESC').all() as Lead[];
  } catch (error) {
    console.error('Error fetching leads:', error);
    return [];
  }
}

export async function deleteLead(id: number): Promise<{ success: boolean; error?: string }> {
  const isAuthed = await checkAdminAuth();
  if (!isAuthed) return { success: false, error: 'Unauthorized' };

  try {
    await db.prepare('DELETE FROM leads WHERE id = ?').run(id);
    revalidatePath('/admin/dashboard');
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

// Sermons actions
export async function getSermons(): Promise<Sermon[]> {
  try {
    return await db.prepare('SELECT * FROM sermons ORDER BY date DESC').all() as Sermon[];
  } catch (error) {
    console.error('Error fetching sermons:', error);
    return [];
  }
}

export async function saveSermon(id: number | null, data: Partial<Sermon>): Promise<{ success: boolean; error?: string }> {
  const isAuthed = await checkAdminAuth();
  if (!isAuthed) return { success: false, error: 'Unauthorized' };

  try {
    if (id) {
      const update = await db.prepare(`
        UPDATE sermons
        SET title_kreyol = ?, title_english = ?, date = ?, speaker = ?, youtube_id = ?, description_kreyol = ?, description_english = ?
        WHERE id = ?
      `);
      await update.run(data.title_kreyol, data.title_english, data.date, data.speaker, data.youtube_id, data.description_kreyol, data.description_english, id);
    } else {
      const insert = db.prepare(`
        INSERT INTO sermons (title_kreyol, title_english, date, speaker, youtube_id, description_kreyol, description_english)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `);
      await insert.run(data.title_kreyol, data.title_english, data.date || new Date().toISOString().split('T')[0], data.speaker, data.youtube_id, data.description_kreyol, data.description_english);
    }
    revalidatePath('/');
    revalidatePath('/admin/dashboard');
    return { success: true };
  } catch (error: any) {
    console.error('Error saving sermon:', error);
    return { success: false, error: error.message };
  }
}

export async function deleteSermon(id: number): Promise<{ success: boolean; error?: string }> {
  const isAuthed = await checkAdminAuth();
  if (!isAuthed) return { success: false, error: 'Unauthorized' };

  try {
    await db.prepare('DELETE FROM sermons WHERE id = ?').run(id);
    revalidatePath('/');
    revalidatePath('/admin/dashboard');
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

// REMOTELY MOUNTED FILE ASSETS & BACKUP OPERATIONS

export async function uploadAsset(fileName: string, base64Data: string): Promise<{ success: boolean; url?: string; error?: string }> {
  const isAuthed = await checkAdminAuth();
  if (!isAuthed) return { success: false, error: 'Unauthorized' };

  try {
    const assetDir = getAssetDir();
    if (!fs.existsSync(assetDir)) {
      fs.mkdirSync(assetDir, { recursive: true });
    }

    // Generate a secure unique name using date and clean extension
    const ext = path.extname(fileName) || '.png';
    const base = path.basename(fileName, ext).replace(/[^a-zA-Z0-9_]/g, '_');
    const cleanName = `${base}_${Date.now()}${ext}`;
    const filePath = path.join(assetDir, cleanName);

    // Decode base64 contents
    const base64Content = base64Data.split(';base64,').pop();
    if (!base64Content) {
      return { success: false, error: 'Invalid file data format' };
    }

    fs.writeFileSync(filePath, Buffer.from(base64Content, 'base64'));
    
    // Return relative API path that Next.js will stream
    return { success: true, url: `/api/assets/${cleanName}` };
  } catch (error: any) {
    console.error('Error saving asset to remote mount:', error);
    return { success: false, error: error.message };
  }
}

export async function backupWebsite(): Promise<{ success: boolean; error?: string; timestamp?: string }> {
  const isAuthed = await checkAdminAuth();
  if (!isAuthed) return { success: false, error: 'Unauthorized' };

  try {
    const backupBaseDir = getBackupDir();
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const backupDir = path.join(backupBaseDir, `backup_${timestamp}`);

    if (!fs.existsSync(backupDir)) {
      fs.mkdirSync(backupDir, { recursive: true });
    }

    // Database is managed by Cloud SQL PostgreSQL in production.

    // Copy source code recursively (skipping heavy build/dependency folders)
    const backupSourceDir = path.join(backupDir, 'source-code');
    fs.mkdirSync(backupSourceDir, { recursive: true });

    const copyRecursiveSync = (src: string, dest: string) => {
      const exists = fs.existsSync(src);
      const stats = exists && fs.statSync(src);
      const isDirectory = exists && stats && stats.isDirectory();
      if (isDirectory) {
        fs.mkdirSync(dest, { recursive: true });
        fs.readdirSync(src).forEach((childItemName) => {
          const childSrc = path.join(src, childItemName);
          const childDest = path.join(dest, childItemName);
          
          if (
            childItemName !== 'node_modules' && 
            childItemName !== '.next' && 
            childItemName !== '.git'
          ) {
            copyRecursiveSync(childSrc, childDest);
          }
        });
      } else {
        fs.copyFileSync(src, dest);
      }
    };

    copyRecursiveSync(process.cwd(), backupSourceDir);

    return { success: true, timestamp };
  } catch (error: any) {
    console.error('Error backing up site to remote mount:', error);
    return { success: false, error: error.message };
  }
}

// Parse YouTube published time text (e.g. "Streamed 4 days ago") into an approximate ISO date string (YYYY-MM-DD)
function parsePublishedTime(timeText: string): string {
  if (!timeText) return new Date().toISOString().split('T')[0];
  
  const now = new Date();
  const clean = timeText.toLowerCase().trim();
  
  if (clean.includes('yesterday')) {
    now.setDate(now.getDate() - 1);
    return now.toISOString().split('T')[0];
  }
  
  if ((clean.includes('today') || clean.includes('now') || clean.includes('live')) && !clean.includes('ago') && !clean.match(/\d/)) {
    return now.toISOString().split('T')[0];
  }
  
  const numMatch = clean.match(/(\d+)/);
  if (!numMatch) return now.toISOString().split('T')[0];
  
  const amount = parseInt(numMatch[1], 10);
  
  if (clean.includes('day')) {
    now.setDate(now.getDate() - amount);
  } else if (clean.includes('week')) {
    now.setDate(now.getDate() - amount * 7);
  } else if (clean.includes('month')) {
    now.setMonth(now.getMonth() - amount);
  } else if (clean.includes('year')) {
    now.setFullYear(now.getFullYear() - amount);
  } else if (clean.includes('hour')) {
    now.setHours(now.getHours() - amount);
  } else if (clean.includes('minute')) {
    now.setMinutes(now.getMinutes() - amount);
  }
  
  return now.toISOString().split('T')[0];
}

// Helper to translate Creole titles or common terms to English for bilingual alignment
function translateTitleToEnglish(title: string): string {
  let english = title;
  
  const replacements: Array<[RegExp, string]> = [
    [/Sèvis an Dirèk/gi, 'Live Service'],
    [/Sèvis Dimanch/gi, 'Sunday Service'],
    [/Adorasyon ak Louwanj/gi, 'Worship and Praise'],
    [/Etid Biblik/gi, 'Bible Study'],
    [/Lekòl Dimanch/gi, 'Sunday School'],
    [/Priyè/gi, 'Prayer'],
    [/Kilt Adorasyon/gi, 'Worship Service'],
    [/Mesaj/gi, 'Sermon'],
    [/Lendi/gi, 'Monday'],
    [/Madi/gi, 'Tuesday'],
    [/Mèkredi/gi, 'Wednesday'],
    [/Jedi/gi, 'Thursday'],
    [/Vandredi/gi, 'Friday'],
    [/Samdi/gi, 'Saturday'],
    [/Dimanch/gi, 'Sunday'],
    [/Janvye/gi, 'January'],
    [/Fevriye/gi, 'February'],
    [/Mas/gi, 'March'],
    [/Avril/gi, 'April'],
    [/Me/gi, 'May'],
    [/Jen/gi, 'June'],
    [/Jiyè/gi, 'July'],
    [/Out/gi, 'August'],
    [/Septanm/gi, 'September'],
    [/Oktòb/gi, 'October'],
    [/Novanm/gi, 'November'],
    [/Desanm/gi, 'December'],
  ];

  for (const [regex, replacement] of replacements) {
    english = english.replace(regex, replacement);
  }
  
  return english;
}

// Unescape unicode entities and HTML entities from YouTube source HTML
function unescapeHtmlAndUnicode(str: string): string {
  return str
    .replace(/\\u([0-9a-fA-F]{4})/g, (_, hex) => String.fromCharCode(parseInt(hex, 16)))
    .replace(/\\"/g, '"')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'");
}

// Robust brace balancer to extract complete JSON objects out of dirty script blocks
function extractBalancedJson(text: string): string {
  const firstBrace = text.indexOf('{');
  if (firstBrace === -1) return '';
  
  let braceCount = 0;
  let inString = false;
  let escape = false;
  
  for (let i = firstBrace; i < text.length; i++) {
    const char = text[i];
    
    if (escape) {
      escape = false;
      continue;
    }
    
    if (char === '\\') {
      escape = true;
      continue;
    }
    
    if (char === '"') {
      inString = !inString;
      continue;
    }
    
    if (!inString) {
      if (char === '{') {
        braceCount++;
      } else if (char === '}') {
        braceCount--;
        if (braceCount === 0) {
          return text.substring(firstBrace, i + 1);
        }
      }
    }
  }
  return '';
}

export async function syncSermonsFromYoutube(channelUrl: string): Promise<{ success: boolean; count: number; error?: string }> {
  const isAuthed = await checkAdminAuth();
  if (!isAuthed) return { success: false, count: 0, error: 'Unauthorized' };

  if (!channelUrl) {
    return { success: false, count: 0, error: 'Channel URL is required' };
  }

  try {
    // Fetch dynamic pastor_name from database settings
    const pastorNameRow = await db.prepare("SELECT value FROM settings WHERE key = 'pastor_name'").get() as { value: string } | undefined;
    const pastorName = pastorNameRow ? pastorNameRow.value : 'Pasteur Jean-Claude';

    // Standardize URL to always point to streams if not specified
    let targetUrl = channelUrl.trim();
    if (targetUrl.includes('youtube.com/') && !targetUrl.endsWith('/streams')) {
      if (targetUrl.endsWith('/')) {
        targetUrl += 'streams';
      } else if (!targetUrl.includes('/streams')) {
        targetUrl = targetUrl.replace(/\/$/, '') + '/streams';
      }
    }

    const response = await fetch(targetUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/115.0.0.0 Safari/537.36',
        'Accept-Language': 'en-US,en;q=0.9',
      }
    });

    if (!response.ok) {
      return { success: false, count: 0, error: `Failed to fetch YouTube page (Status: ${response.status})` };
    }

    const html = await response.text();
    
    // Find ytInitialData object block
    let jsonStr = '';
    const startStr = 'ytInitialData = ';
    const startIndex = html.indexOf(startStr);
    if (startIndex !== -1) {
      const remaining = html.substring(startIndex + startStr.length);
      jsonStr = extractBalancedJson(remaining);
    }

    const results: Array<{ videoId: string; title: string; publishedTime?: string; description?: string }> = [];

    if (jsonStr) {
      try {
        const parsed = JSON.parse(jsonStr);
        
        // Recursive helper to scan for video elements (supporting both modern lockupViewModel and legacy renderers)
        const extract = (obj: any) => {
          if (!obj || typeof obj !== 'object') return;
          
          // 1. Support modern lockupViewModel
          if (obj.lockupViewModel) {
            const vm = obj.lockupViewModel;
            const videoId = vm.contentId;
            if (videoId && typeof videoId === 'string' && videoId.length === 11) {
              let title = '';
              if (vm.metadata && vm.metadata.lockupMetadataViewModel && vm.metadata.lockupMetadataViewModel.title) {
                title = vm.metadata.lockupMetadataViewModel.title.content || '';
              }
              
              let publishedTime = '';
              if (vm.metadata && vm.metadata.lockupMetadataViewModel && vm.metadata.lockupMetadataViewModel.metadata && vm.metadata.lockupMetadataViewModel.metadata.contentMetadataViewModel) {
                const rows = vm.metadata.lockupMetadataViewModel.metadata.contentMetadataViewModel.metadataRows || [];
                for (const row of rows) {
                  const parts = row.metadataParts || [];
                  for (const part of parts) {
                    const text = part.text ? part.text.content : '';
                    if (text) {
                      const lower = text.toLowerCase();
                      if (lower.includes('ago') || lower.includes('yesterday') || lower.includes('live') || lower.includes('today')) {
                        publishedTime = text;
                      }
                    }
                  }
                }
              }

              let description = '';
              if (vm.metadata && vm.metadata.lockupMetadataViewModel && vm.metadata.lockupMetadataViewModel.description) {
                description = vm.metadata.lockupMetadataViewModel.description.content || '';
              }
              
              if (title) {
                if (!results.some(v => v.videoId === videoId)) {
                  results.push({
                    videoId,
                    title: unescapeHtmlAndUnicode(title),
                    publishedTime: unescapeHtmlAndUnicode(publishedTime),
                    description: unescapeHtmlAndUnicode(description) || 'Sèvis an dirèk achive sou YouTube.'
                  });
                }
              }
            }
          }
          
          // 2. Support legacy videoRenderers / gridVideoRenderers
          if (obj.videoId && typeof obj.videoId === 'string' && obj.videoId.length === 11) {
            let title = '';
            if (obj.title) {
              if (typeof obj.title === 'string') {
                title = obj.title;
              } else if (obj.title.simpleText) {
                title = obj.title.simpleText;
              } else if (Array.isArray(obj.title.runs) && obj.title.runs[0]) {
                title = obj.title.runs.map((r: any) => r.text || '').join('');
              }
            }
            
            let publishedTime = '';
            if (obj.publishedTimeText) {
              if (typeof obj.publishedTimeText.simpleText === 'string') {
                publishedTime = obj.publishedTimeText.simpleText;
              } else if (Array.isArray(obj.publishedTimeText.runs) && obj.publishedTimeText.runs[0]) {
                publishedTime = obj.publishedTimeText.runs.map((r: any) => r.text || '').join('');
              }
            } else if (obj.publishedTime) {
              publishedTime = typeof obj.publishedTime === 'string' ? obj.publishedTime : '';
            } else if (obj.publishDate) {
              publishedTime = typeof obj.publishDate === 'string' ? obj.publishDate : '';
            } else if (obj.dateText) {
              if (typeof obj.dateText.simpleText === 'string') {
                publishedTime = obj.dateText.simpleText;
              } else if (Array.isArray(obj.dateText.runs) && obj.dateText.runs[0]) {
                publishedTime = obj.dateText.runs.map((r: any) => r.text || '').join('');
              }
            }

            let description = '';
            if (obj.descriptionSnippet && Array.isArray(obj.descriptionSnippet.runs)) {
              description = obj.descriptionSnippet.runs.map((r: any) => r.text || '').join('');
            }

            if (title) {
              if (!results.some(v => v.videoId === obj.videoId)) {
                results.push({
                  videoId: obj.videoId,
                  title: unescapeHtmlAndUnicode(title),
                  publishedTime: unescapeHtmlAndUnicode(publishedTime),
                  description: unescapeHtmlAndUnicode(description)
                });
              }
            }
          }

          for (const key of Object.keys(obj)) {
            const val = obj[key];
            if (val && typeof val === 'object') {
              extract(val);
            }
          }
        };

        extract(parsed);
      } catch (jsonErr) {
        console.warn('Failed to parse ytInitialData JSON:', jsonErr);
      }
    }

    // Fallback simple regex parsing with centered window proximity scanner to capture title and published time
    if (results.length === 0) {
      const videoRegex = /"(?:videoId|contentId)"\s*:\s*"([a-zA-Z0-9_-]{11})"/g;
      let match;
      while ((match = videoRegex.exec(html)) !== null) {
        const vId = match[1];
        if (!results.some(v => v.videoId === vId)) {
          const windowStart = Math.max(0, match.index - 1500);
          const windowEnd = Math.min(html.length, match.index + 1500);
          const chunk = html.substring(windowStart, windowEnd);
          
          // Proximity extract title
          let title = '';
          const titleRunsMatch = chunk.match(/"title"\s*:\s*\{\s*"runs"\s*:\s*\[\s*\{\s*"text"\s*:\s*"([^"]+)"/);
          const titleSimpleMatch = chunk.match(/"title"\s*:\s*\{\s*"simpleText"\s*:\s*"([^"]+)"/);
          const titleContentMatch = chunk.match(/"title"\s*:\s*\{\s*"content"\s*:\s*"([^"]+)"/);
          
          if (titleRunsMatch) {
            title = titleRunsMatch[1];
          } else if (titleSimpleMatch) {
            title = titleSimpleMatch[1];
          } else if (titleContentMatch) {
            title = titleContentMatch[1];
          }
          
          // Proximity extract published time text (preventing false matches on Sunday/Monday days by targeting specific keywords)
          let publishedTime = '';
          const pubMatch = chunk.match(/"publishedTimeText"\s*:\s*\{\s*"simpleText"\s*:\s*"([^"]+)"/);
          const contentMatchAll = chunk.match(/"text"\s*:\s*\{\s*"content"\s*:\s*"([^"]*(?:ago|yesterday|live|today)[^"]*)"/i);
          
          if (pubMatch) {
            publishedTime = pubMatch[1];
          } else if (contentMatchAll) {
            publishedTime = contentMatchAll[1];
          }

          if (!title) {
            title = `Sèvis an Dirèk (${vId})`;
          }

          results.push({
            videoId: vId,
            title: unescapeHtmlAndUnicode(title),
            publishedTime: unescapeHtmlAndUnicode(publishedTime)
          });
        }
      }
    }

    if (results.length === 0) {
      return { success: false, count: 0, error: 'Could not find any videos on the provided YouTube page. Verify that it is a public channel Streams URL.' };
    }

    // Fetch and parse exact dates for each sermon in parallel to avoid using today's date placeholder
    const resultsWithExactDates = await Promise.all(results.map(async (video) => {
      try {
        const watchUrl = `https://www.youtube.com/watch?v=${video.videoId}`;
        const watchResponse = await fetch(watchUrl, {
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/115.0.0.0 Safari/537.36',
            'Accept-Language': 'en-US,en;q=0.9',
          }
        });
        if (watchResponse.ok) {
          const watchHtml = await watchResponse.text();
          const dateMatch = watchHtml.match(/"uploadDate"\s*:\s*"([^"]+)"/) || watchHtml.match(/meta\s+itemprop="uploadDate"\s+content="([^"]+)"/i);
          if (dateMatch) {
            return { ...video, exactDate: dateMatch[1].split('T')[0] };
          }
        }
      } catch (e) {
        console.warn(`Error fetching watch page for ${video.videoId}:`, e);
      }
      return video;
    }));

    // Insert or update videos in the database
    let importCount = 0;
    const checkExist = db.prepare('SELECT id FROM sermons WHERE youtube_id = ?');
    const insertSermon = db.prepare(`
      INSERT INTO sermons (title_kreyol, title_english, date, speaker, youtube_id, description_kreyol, description_english)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `);
    const updateSermon = db.prepare(`
      UPDATE sermons
      SET speaker = ?, date = ?, title_kreyol = ?, title_english = ?
      WHERE youtube_id = ?
    `);

    for (const video of resultsWithExactDates) {
      const exist = await checkExist.get(video.videoId);
      const parsedDate = (video as any).exactDate || parsePublishedTime(video.publishedTime || '');
      const desc = video.description || 'Sèvis an dirèk achive sou YouTube.';
      const englishTitle = translateTitleToEnglish(video.title);

      if (!exist) {
        await insertSermon.run(
          video.title,
          englishTitle,
          parsedDate,
          pastorName,
          video.videoId,
          desc,
          desc
        );
        importCount++;
      } else {
        await updateSermon.run(
          pastorName,
          parsedDate,
          video.title,
          englishTitle,
          video.videoId
        );
        importCount++;
      }
    }

    revalidatePath('/');
    revalidatePath('/admin/dashboard');

    return { success: true, count: importCount };
  } catch (err: any) {
    console.error('Error syncing from YouTube stream:', err);
    return { success: false, count: 0, error: err.message };
  }
}

// AUTOMATED PDF CONTENT EXTRACTION AND WEBSITE UPDATE VIA GEMINI
export async function automateWebsiteContentFromPdf(
  pdfUrl: string
): Promise<{ success: boolean; message?: string; error?: string }> {
  const isAuthed = await checkAdminAuth();
  if (!isAuthed) return { success: false, error: 'Unauthorized' };

  try {
    const fileName = pdfUrl.replace('/api/assets/', '');
    const filePath = path.join('/Users/mpforbes/GoogleCloud/Straight-Line-Churches/Parousie/assets', fileName);

    if (!fs.existsSync(filePath)) {
      return { success: false, error: 'PDF physical file not found at: ' + filePath };
    }

    // 1. Extract text using pdftotext
    let pdfText = '';
    let sendDirectPdf = false;
    try {
      pdfText = execSync(`/opt/homebrew/bin/pdftotext "${filePath}" -`, { encoding: 'utf-8' });
      if (!pdfText.trim()) {
        console.warn('Extracted PDF text is empty via pdftotext. Falling back to direct multimodal PDF upload to Gemini.');
        sendDirectPdf = true;
      }
    } catch (err: any) {
      console.warn('Could not extract text via pdftotext, falling back to direct multimodal PDF upload:', err.message);
      sendDirectPdf = true;
    }

    let base64Pdf = '';
    if (sendDirectPdf) {
      try {
        const fileBuffer = fs.readFileSync(filePath);
        base64Pdf = fileBuffer.toString('base64');
      } catch (fileErr: any) {
        return { success: false, error: 'Could not read PDF file for multimodal extraction: ' + fileErr.message };
      }
    }

    // 2. Resolve Gemini API Key strictly from environment variables
    const apiKey = process.env.GEMINI_API_KEY || process.env.GEMINI_KEY || '';

    if (!apiKey) {
      return { 
        success: false, 
        error: 'Gemini API Key is missing. Please configure GEMINI_API_KEY as an environment variable in your .env.local file.' 
      };
    }

    // 3. Prompt and call Gemini API (Direct REST call to avoid dependency issues)
    const systemInstruction = `You are a helpful bilingual assistant for "Eglise Baptiste de la Parousie" church.
Your job is to extract scheduling and church program information from the provided text (which is extracted from a weekly schedule or bulletin PDF) and format it as structured JSON matching the provided schema.

Ensure high-quality Haitian Creole (Kreyòl) translations for Kreyòl fields and English translations for English fields.
For service schedules, make sure to extract each individual time block as a separate schedule entry. Translate days:
SUNDAY -> Dimanch
SATURDAY -> Samdi
MONDAY -> Lendi
TUESDAY -> Madi
WEDNESDAY -> Mèkredi
THURSDAY -> Jedi
FRIDAY -> Vandredi

Be extremely thorough and accurate. Only include fields that are explicitly found or can be accurately translated/inferred.`;

    const schema = {
      type: "OBJECT",
      properties: {
        service_schedules: {
          type: "ARRAY",
          items: {
            type: "OBJECT",
            properties: {
              day_kreyol: { type: "STRING", description: "Day in Creole, e.g. Dimanch, Samdi, Lendi, etc." },
              day_english: { type: "STRING", description: "Day in English, e.g. Sunday, Saturday, Monday, etc." },
              time: { type: "STRING", description: "Time range, e.g. 6:00 AM - 7:00 AM, 7:00 PM - 9:00 PM" },
              title_kreyol: { type: "STRING", description: "Service title in Creole, e.g. Premye Sèvis, Lekòl Dimanch, Dezyèm Sèvis" },
              title_english: { type: "STRING", description: "Service title in English, e.g. 1st Service, Sunday School, 2nd Service" },
              description_kreyol: { type: "STRING" },
              description_english: { type: "STRING" }
            },
            required: ["day_kreyol", "day_english", "time", "title_kreyol", "title_english"]
          }
        },
        pastor_name: { type: "STRING" },
        church_phone: { type: "STRING" },
        church_email: { type: "STRING" },
        church_address: { type: "STRING" },
        local_outreaches: {
          type: "ARRAY",
          items: {
            type: "OBJECT",
            properties: {
              title_kreyol: { type: "STRING" },
              title_english: { type: "STRING" },
              description_kreyol: { type: "STRING" },
              description_english: { type: "STRING" },
              schedule_kreyol: { type: "STRING" },
              schedule_english: { type: "STRING" }
            },
            required: ["title_kreyol", "title_english", "description_kreyol", "description_english"]
          }
        },
        events: {
          type: "ARRAY",
          items: {
            type: "OBJECT",
            properties: {
              title_kreyol: { type: "STRING" },
              title_english: { type: "STRING" },
              date: { type: "STRING", description: "Date in YYYY-MM-DD format" },
              time: { type: "STRING" },
              location_kreyol: { type: "STRING" },
              location_english: { type: "STRING" },
              description_kreyol: { type: "STRING" },
              description_english: { type: "STRING" }
            },
            required: ["title_kreyol", "title_english", "date"]
          }
        }
      }
    };

    const parts: any[] = [];
    if (sendDirectPdf) {
      parts.push({
        inlineData: {
          mimeType: "application/pdf",
          data: base64Pdf
        }
      });
      parts.push({
        text: `${systemInstruction}\n\nPlease analyze the attached weekly schedule / church bulletin PDF (which is a scanned image) and extract the required parameters according to the schema.`
      });
    } else {
      parts.push({
        text: `${systemInstruction}\n\nPDF TEXT:\n${pdfText}`
      });
    }

    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`;
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents: [{
          parts: parts
        }],
        generationConfig: {
          responseMimeType: "application/json",
          responseSchema: schema
        }
      })
    });

    if (!response.ok) {
      const errBody = await response.text();
      console.error('Gemini API Error:', errBody);
      return { success: false, error: `Gemini API responded with ${response.status}: ${errBody}` };
    }

    const data = await response.json();
    const resultText = data.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!resultText) {
      return { success: false, error: 'Gemini did not return any structured content.' };
    }

    const extracted = JSON.parse(resultText);

    // 4. Update the database
    let changesMade: string[] = [];

    if (extracted.service_schedules && Array.isArray(extracted.service_schedules) && extracted.service_schedules.length > 0) {
      await db.prepare('DELETE FROM service_schedules').run();
      const insertSched = db.prepare(`
        INSERT INTO service_schedules (day_kreyol, day_english, time, title_kreyol, title_english, description_kreyol, description_english)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `);
      for (const s of extracted.service_schedules) {
        await insertSched.run(
          s.day_kreyol,
          s.day_english,
          s.time,
          s.title_kreyol,
          s.title_english,
          s.description_kreyol || '',
          s.description_english || ''
        );
      }
      changesMade.push(`${extracted.service_schedules.length} sèvis (service schedules)`);
    }

    if (extracted.local_outreaches && Array.isArray(extracted.local_outreaches) && extracted.local_outreaches.length > 0) {
      await db.prepare('DELETE FROM local_outreach').run();
      const insertOutreach = db.prepare(`
        INSERT INTO local_outreach (title_kreyol, title_english, description_kreyol, description_english, schedule_kreyol, schedule_english)
        VALUES (?, ?, ?, ?, ?, ?)
      `);
      for (const o of extracted.local_outreaches) {
        await insertOutreach.run(
          o.title_kreyol,
          o.title_english,
          o.description_kreyol,
          o.description_english,
          o.schedule_kreyol || '',
          o.schedule_english || ''
        );
      }
      changesMade.push(`${extracted.local_outreaches.length} pwojè kominote (outreach projects)`);
    }

    if (extracted.events && Array.isArray(extracted.events) && extracted.events.length > 0) {
      await db.prepare('DELETE FROM events').run();
      const insertEvent = db.prepare(`
        INSERT INTO events (title_kreyol, title_english, date, time, location_kreyol, location_english, description_kreyol, description_english)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `);
      for (const e of extracted.events) {
        await insertEvent.run(
          e.title_kreyol,
          e.title_english,
          e.date,
          e.time || '',
          e.location_kreyol || '',
          e.location_english || '',
          e.description_kreyol || '',
          e.description_english || ''
        );
      }
      changesMade.push(`${extracted.events.length} evènman (events)`);
    }

    const settingsToUpdate: Record<string, string> = {};
    if (extracted.pastor_name) {
      settingsToUpdate.pastor_name = extracted.pastor_name;
    }
    if (extracted.church_phone) {
      settingsToUpdate.church_phone = extracted.church_phone;
    }
    if (extracted.church_email) {
      settingsToUpdate.church_email = extracted.church_email;
    }
    if (extracted.church_address) {
      settingsToUpdate.church_address = extracted.church_address;
    }

    const updateSetting = db.prepare('INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)');
    for (const [k, v] of Object.entries(settingsToUpdate)) {
      await updateSetting.run(k, v);
    }

    const keys = Object.keys(settingsToUpdate);
    if (keys.length > 0) {
      changesMade.push(`${keys.length} paramèt global: ${keys.join(', ')}`);
    }

    // 5. Trigger backup
    await backupWebsite();

    revalidatePath('/');
    revalidatePath('/admin/dashboard');

    const summaryMsg = changesMade.length > 0 
      ? `Website content successfully updated! Extracted: ${changesMade.join(', ')}.`
      : 'Processed PDF but found no matching schedules, events, or contact settings to update.';

    return { 
      success: true, 
      message: summaryMsg
    };

  } catch (error: any) {
    console.error('Error automating website content:', error);
    return { success: false, error: 'Internal processing error: ' + error.message };
  }
}

// DAILY DEVOTIONALS ACTIONS

const DEVOTIONAL_PRESETS = [
  {
    theme: "strength",
    refEn: "Galatians 6:9",
    refHt: "Galat 6:9",
    textEn: "And let us not grow weary of doing good, for in due season we will reap, if we do not give up.",
    textHt: "Annou pa janm bouke fè sa ki byen. Paske, si nou pa dekouraje, n'a rekòlte lè lè a va rive.",
    lessonEn: "Dear family, serving others and doing good can sometimes feel exhausting, especially when we are far from home. But the Apostle Paul reminds us that our labor in the Lord is never in vain and a bountiful harvest of blessings is coming. Let us stand united today, strengthening one another's hands to keep shining Christ's light in our community.",
    lessonHt: "Frè m ak sè m yo, fè sa ki byen kapab fatigan pafwa, sitou lè nou lwen peyi nou. Men, Apòt Pòl fè nou chonje ke travay nou pou Seyè a pa janm anven e yon bèl rekòt benediksyon ap vini. Annou rete ini jodi a, pou nou ankouraje yonn lòt pou n kontinye klere limyè Kris la nan mitan kominote nou an."
  },
  {
    theme: "strength",
    refEn: "Joshua 1:9",
    refHt: "Jozye 1:9",
    textEn: "Have I not commanded you? Be strong and courageous. Do not be frightened, and do not be dismayed, for the Lord your God is with you wherever you go.",
    textHt: "Chonje lòd mwen te ba ou! Se pou ou gaya, se pou ou gen kouraj! Pa tranble, pa pè, paske Seyè a, Bondye ou la, kanpe la avèk ou kote ou pase.",
    lessonEn: "Taking bold steps of faith in a new land requires immense courage, but we never walk this journey alone. Our Heavenly Father goes before us, breaking barriers and opening doors that no man can shut. Be strong and lift up your head today, knowing that His protective presence is your constant shield.",
    lessonHt: "Fè gwo pa lafwa nan yon nouvo peyi mande anpil kouraj, men nou pa janm mache pou kont nou nan vwayaj sa a. Papa nou ki nan Syèl la mache devan nou, l ap kraze baryè ak louvri pòt okenn moun pa kapab fèmen. Se pou nou gaya epi leve tèt nou jodi a, paske prezans pwoteksyon li se plak pwotèj nou tout tan."
  },
  {
    theme: "strength",
    refEn: "Philippians 4:13",
    refHt: "Filipyen 4:13",
    textEn: "I can do all things through him who strengthens me.",
    textHt: "Mwen kapab fè tout bagay gras ak Kris la ki ban mwen fòs la.",
    lessonEn: "No challenge is too great and no mountain is too high when our lives are anchored in Christ's infinite power. When your own strength feels depleted, lift your eyes and surrender your worries to the One who renews our energy. Today, step forward with confidence, for His divine grace is more than sufficient to carry you through.",
    lessonHt: "Pa gen okenn defi ki twò gwo e pa gen okenn mòn ki twò wo lè lavi nou ankre nan pouvwa enfini Kris la. Lè pwòp fòs pa ou santi l fini, leve je ou epi remèt tout tèt chaje ou yo bay Sa a ki renouvle enèji nou an. Jodi a, mache devan ak konfyans, paske gras divin li an plis pase ase pou l pote ou."
  },
  {
    theme: "love",
    refEn: "Romans 8:28",
    refHt: "Women 8:28",
    textEn: "And we know that for those who love God all things work together for good, for those who are called according to his purpose.",
    textHt: "Epitou, nou konnen tout bagay travay ansanm pou byen moun ki renmen Bondye, moun li rele selon plan li a.",
    lessonEn: "Even in the midst of trials and unforeseen transitions, God is masterfully weaving every detail of your life for a beautiful purpose. Your current struggles are not dead ends, but rather stepping stones leading to His glorious destiny for you. Trust His perfect timing and remain steadfast, knowing that His love surrounds you in every season.",
    lessonHt: "Menm nan mitan eprèv ak chanjman nou pa t atann yo, Bondye ap travay chak detay nan lavi nou pou yon bèl objektif. Pwoblèm ou yo jodi a se pa yon bout chemen yo ye, men se pito machpye k ap mennen ou nan destinasyon glorye li prepare pou ou a. Mete konfyans ou nan lè ki pafè pou li a epi rete fèm, paske renmen l lan antoure ou nan tout sezon."
  },
  {
    theme: "hope",
    refEn: "Isaiah 40:31",
    refHt: "Ezayi 40:31",
    textEn: "But they who wait for the Lord shall renew their strength; they shall mount up with wings like eagles; they shall run and not be weary; they shall walk and not faint.",
    textHt: "Men, moun ki mete konfyans yo nan Seyè a va jwenn nouvo fòs. Y'ap vole byen wo nan syèl la tankou belye. Y'ap kouri san yo pa janm bouke. Y'ap mache san yo pa janm febli.",
    lessonEn: "Waiting on God is never wasted time, but a holy season of preparation and renewal. He is building in you a spiritual stamina that will allow you to rise above the storms of life with grace and power. Rest in His promise today, and prepare to soar to new heights as He breathes fresh life into your spirit.",
    lessonHt: "Tann Seyè a se pa janm tan gaspiye, se yon sezon sen pou preparasyon ak renouvèlman. L ap bati nan ou yon lafòs espirityèl k ap pèmèt ou monte pi wo pase tanpèt lavi yo avèk gras ak pouvwa. Repoze nan pwomès li jodi a, epi pare pou vole nan nouvo wotè pandan l ap soufle yon nouvo lavi nan nanm ou."
  },
  {
    theme: "faith",
    refEn: "Hebrews 11:1",
    refHt: "Ebre 11:1",
    textEn: "Now faith is the assurance of things hoped for, the conviction of things not seen.",
    textHt: "Lafwa se yon jan pou nou sèten sa nou espere a gen pou rive. Se yon jan pou nou rekonèt sa nou pa ka wè ak je nou.",
    lessonEn: "Faith is the bridge between our current reality and God's supernatural promises. It enables us to stand firm when the world is shaking and to believe in the path He has laid out for us. Let us nurture a resilient faith that acts as a beacon of light for our families and our church community.",
    lessonHt: "Lafwa se pon ki konekte reyalite n ap viv la ak pwomès sipènati Bondye yo. Li pèmèt nou kanpe fèm lè mond lan ap tranble e pou n kwè nan chemen li trase pou nou an. Ann nou devlope yon lafwa solid k ap sèvi kòm limyè pou fanmi nou yo ak kominote legliz la."
  },
  {
    theme: "peace",
    refEn: "John 14:27",
    refHt: "Jan 14:27",
    textEn: "Peace I leave with you; my peace I give to you. Not as the world gives do I give to you. Let not your hearts be troubled, neither let them be afraid.",
    textHt: "Mwen kite kè poze pou nou. Me bay nou pwòp kè poze pa m. Se pa menm jan ak kè poze lèmonn bay m ap ban nou li. Pa kite kè nou boulvèse, pa kite l pè.",
    lessonEn: "In a world filled with chaos and uncertainty, Jesus offers us a peace that transcends human understanding. This peace is not the absence of trouble, but the comforting presence of our Savior in the midst of it. Rest your heart in His sovereign hands today, letting go of all fear.",
    lessonHt: "Nan yon mond ranpli ak dezòd ak ensètitid, Jezi ofri nou yon kè poze ki depase konpreyansyon lèzòm. Kè poze sa a se pa paske pwoblèm yo pa la, men se prezans rekonfòtan Sovè nou an nan mitan yo. Repoze kè ou nan men souveren li yo jodi a, epi chase tout laperèz."
  },
  {
    theme: "grace",
    refEn: "Ephesians 2:8",
    refHt: "Efezyen 2:8",
    textEn: "For by grace you have been saved through faith. And this is not your own doing; it is the gift of God.",
    textHt: "Paske se gras Bondye nou sove, daprè konfyans nou gen nan li. Sa pa soti nan nou menm, se yon kado Bondye ban nou.",
    lessonEn: "God's grace is an undeserved, beautiful gift that covers our past, sustains our present, and guarantees our future. We do not have to earn His love or strive to be worthy; we simply receive it with a humble heart. Let this marvelous grace inspire us to show kindness and mercy to everyone we meet today.",
    lessonHt: "Gras Bondye a se yon bèl kado nou pa t merite, ki kouvri tan pase nou, ki soutni nou nan prezan, e ki garanti demen nou. Nou pa bezwen peye pou nou jwenn renmen li a, nou sèlman resevwa li ak yon kè enb. Se pou bèl gras sa a enspire nou pou nou montre jantiyès ak mizèrikòd bay tout moun n ap rankontre jodi a."
  },
  {
    theme: "love",
    refEn: "1 Corinthians 13:4-5",
    refHt: "1 Korentyen 13:4-5",
    textEn: "Love is patient and kind; love does not envy or boast; it is not arrogant or rude. It does not insist on its own way; it is not irritable or resentful.",
    textHt: "Moun ki gen renmen nan kè li gen pasyans, li gen bon kè. Li pa gen jalouzi, li pa bofre, li pa gen lògèy. Li pa fè anyen ki pou fè moun wont, li pa chache avantaj pa li, li pa fè kòlè, li pa kenbe moun nan kè.",
    lessonEn: "Spiritual love is active, selfless, and durable. It is the core bond that binds our church together as Parousia Baptist Ministries. Today, let us make a conscious effort to love one another with a pure and patient heart, reflecting the unconditional love that Christ has poured out upon us.",
    lessonHt: "Renmen espirityèl la se yon bagay ki aktif, san enterè pèsonèl, epi ki dirab. Se lyen solid ki mare legliz nou an ansanm antanke Parousia Baptist Ministries. Jodi a, ann fè yon efò konsyan pou nou renmen yonn lòt ak yon kè pi e pasyan, pou n reflete renmen san kondisyon Kris la vide sou nou an."
  },
  {
    theme: "hope",
    refEn: "Jeremiah 29:11",
    refHt: "Jeremi 29:11",
    textEn: "For I know the plans I have for you, declares the Lord, plans for welfare and not for evil, to give you a future and a hope.",
    textHt: "Paske mwen konnen sa m gen nan tèt mwen pou nou. Se Seyè a menm k ap pale. Se byen nou mwen vle, se pa malè nou. Mwen vle ban nou yon demen ak yon espwa.",
    lessonEn: "No matter how dark or uncertain the road ahead may seem, God has a sovereign, beautiful blueprint for your life. He is not surprised by your challenges; He has already prepared a future of peace, restoration, and vibrant hope for you. Step forward in expectation of His goodness today.",
    lessonHt: "Kèlkeswa jan chemen ki devan an ta sanble fènwa oswa ensèten, Bondye gen yon bèl plan ki pafè pou lavi ou. Li pa etone devan defi w ap jwenn yo; li te deja prepare yon demen ki gen kè poze, restorasyon, ak yon bèl espwa pou ou. Mache devan ak gwo atant pou wè bonte li jodi a."
  }
];

export async function getDailyDevotional(dateStr: string): Promise<DailyDevotional | null> {
  try {
    const row = await db.prepare('SELECT * FROM daily_devotionals WHERE date = ?').get(dateStr) as DailyDevotional | undefined;
    if (row) return row;

    // Auto-generate if missing for that date (no revalidatePath — called during render)
    return await generateDailyDevotionalRecord(dateStr);
  } catch (error) {
    console.error('Error fetching daily devotional:', error);
    return null;
  }
}

export async function getDevotionals(): Promise<DailyDevotional[]> {
  try {
    return await db.prepare('SELECT * FROM daily_devotionals ORDER BY date DESC').all() as DailyDevotional[];
  } catch (error) {
    console.error('Error fetching devotionals list:', error);
    return [];
  }
}

export async function saveDailyDevotional(
  id: number,
  refEn: string,
  refHt: string,
  textEn: string,
  textHt: string,
  lessonEn: string,
  lessonHt: string,
  status: 'pending' | 'approved'
): Promise<{ success: boolean; error?: string }> {
  const isAuthed = await checkAdminAuth();
  if (!isAuthed) return { success: false, error: 'Unauthorized' };

  try {
    await db.prepare(`
      UPDATE daily_devotionals
      SET verse_ref_english = ?,
          verse_ref_kreyol = ?,
          verse_text_english = ?,
          verse_text_kreyol = ?,
          lesson_english = ?,
          lesson_kreyol = ?,
          status = ?
      WHERE id = ?
    `).run(refEn, refHt, textEn, textHt, lessonEn, lessonHt, status, id);

    revalidatePath('/');
    revalidatePath('/admin/dashboard');
    return { success: true };
  } catch (error: any) {
    console.error('Error saving daily devotional:', error);
    return { success: false, error: error.message };
  }
}

export async function approveDailyDevotional(id: number): Promise<{ success: boolean; error?: string }> {
  const isAuthed = await checkAdminAuth();
  if (!isAuthed) return { success: false, error: 'Unauthorized' };

  try {
    await db.prepare("UPDATE daily_devotionals SET status = 'approved' WHERE id = ?").run(id);
    revalidatePath('/');
    revalidatePath('/admin/dashboard');
    return { success: true };
  } catch (error: any) {
    console.error('Error approving daily devotional:', error);
    return { success: false, error: error.message };
  }
}

export async function deleteDailyDevotional(id: number): Promise<{ success: boolean; error?: string }> {
  const isAuthed = await checkAdminAuth();
  if (!isAuthed) return { success: false, error: 'Unauthorized' };

  try {
    await db.prepare("DELETE FROM daily_devotionals WHERE id = ?").run(id);
    revalidatePath('/');
    revalidatePath('/admin/dashboard');
    return { success: true };
  } catch (error: any) {
    console.error('Error deleting daily devotional:', error);
    return { success: false, error: error.message };
  }
}

interface GeminiResponse {
  verse_ref_english: string;
  verse_ref_kreyol: string;
  verse_text_english: string;
  verse_text_kreyol: string;
  lesson_english: string;
  lesson_kreyol: string;
}

async function fetchDevotionalFromGemini(theme: string): Promise<GeminiResponse | null> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    console.warn('GEMINI_API_KEY is not defined in environment variables. Falling back.');
    return null;
  }

  try {
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
      console.error('Gemini API call failed:', errorText);
      return null;
    }

    const data = await response.json();
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!text) {
      console.error('Empty response text from Gemini');
      return null;
    }

    const parsed = JSON.parse(text) as GeminiResponse;
    return parsed;
  } catch (error) {
    console.error('Error fetching devotional from Gemini:', error);
    return null;
  }
}

async function generateDailyDevotionalRecord(dateStr: string): Promise<DailyDevotional | null> {
  // 1. Fetch devotional_theme from settings
  const themeRow = await db.prepare("SELECT value FROM settings WHERE key = 'devotional_theme'").get() as { value: string } | undefined;
  const currentTheme = (themeRow?.value || 'none').toLowerCase().trim();

  let preset: any = null;

  // Try AI generation first if there is a theme and we have an API key
  if (currentTheme !== 'none' && process.env.GEMINI_API_KEY) {
    console.log(`Generating devotional for theme "${currentTheme}" using Gemini...`);
    const aiDevotional = await fetchDevotionalFromGemini(currentTheme);
    if (aiDevotional) {
      preset = {
        refEn: aiDevotional.verse_ref_english,
        refHt: aiDevotional.verse_ref_kreyol,
        textEn: aiDevotional.verse_text_english,
        textHt: aiDevotional.verse_text_kreyol,
        lessonEn: aiDevotional.lesson_english,
        lessonHt: aiDevotional.lesson_kreyol
      };
    }
  }

  // 2. Fallback to local presets if no theme, or if Gemini fails / is missing
  if (!preset) {
    let pool = DEVOTIONAL_PRESETS;
    if (currentTheme !== 'none') {
      const filtered = DEVOTIONAL_PRESETS.filter(p => p.theme === currentTheme);
      if (filtered.length > 0) {
        pool = filtered;
      }
    }
    const p = pool[Math.floor(Math.random() * pool.length)];
    preset = {
      refEn: p.refEn,
      refHt: p.refHt,
      textEn: p.textEn,
      textHt: p.textHt,
      lessonEn: p.lessonEn,
      lessonHt: p.lessonHt
    };
  }

  // Check if auto-publish is active
  const autoPublishRow = await db.prepare("SELECT value FROM settings WHERE key = 'devotional_auto_publish'").get() as { value: string } | undefined;
  const isAutoPublish = autoPublishRow?.value === 'true';
  const status = isAutoPublish ? 'approved' : 'pending';

  const insert = await db.prepare(`
    INSERT OR REPLACE INTO daily_devotionals 
    (date, verse_ref_english, verse_ref_kreyol, verse_text_english, verse_text_kreyol, lesson_english, lesson_kreyol, status)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `);

  await insert.run(
    dateStr,
    preset.refEn,
    preset.refHt,
    preset.textEn,
    preset.textHt,
    preset.lessonEn,
    preset.lessonHt,
    status
  );

  return await db.prepare('SELECT * FROM daily_devotionals WHERE date = ?').get(dateStr) as DailyDevotional;
}

export async function generateDevotionalAction(dateStr: string): Promise<{ success: boolean; devotional?: DailyDevotional; error?: string }> {
  try {
    const created = await generateDailyDevotionalRecord(dateStr);
    if (!created) {
      return { success: false, error: 'Failed to generate devotional' };
    }

    revalidatePath('/');
    revalidatePath('/admin/dashboard');
    return { success: true, devotional: created };
  } catch (error: any) {
    console.error('Error generating daily devotional:', error);
    return { success: false, error: error.message };
  }
}

export async function getActiveDevotional(dateStr: string): Promise<DailyDevotional | null> {
  try {
    // 1. Try to get today's devotional
    const row = await db.prepare('SELECT * FROM daily_devotionals WHERE date = ?').get(dateStr) as DailyDevotional | undefined;
    if (row && row.status === 'approved') {
      return row;
    }
    
    // 2. If not approved or not found, find the most recent approved devotional
    const latestApproved = await db.prepare("SELECT * FROM daily_devotionals WHERE status = 'approved' AND date <= ? ORDER BY date DESC LIMIT 1").get(dateStr) as DailyDevotional | undefined;
    if (latestApproved) {
      return latestApproved;
    }
    
    return null;
  } catch (error) {
    console.error('Error fetching active devotional:', error);
    return null;
  }
}

// TWO-STEP OTP AUTH ACTIONS

export async function requestAdminOtp(
  email: string,
  accessCode: string,
  deviceHash: string
): Promise<{ success: boolean; otpRequired?: boolean; error?: string }> {
  try {
    // 1. Verify access code (matches stored admin_password hash or env fallback)
    const stored = await db.prepare("SELECT value FROM settings WHERE key = 'admin_password'").get() as { value: string } | undefined;
    const inputHash = crypto.createHash('sha256').update(accessCode).digest('hex');
    
    const envCode = process.env.ADMIN_ACCESS_CODE || 'parousie2026';
    const envHash = crypto.createHash('sha256').update(envCode).digest('hex');

    let isAccessCodeValid = false;
    if (stored && (stored.value === inputHash || stored.value === accessCode)) {
      isAccessCodeValid = true;
      // Proactively migrate plain-text stored passwords to SHA-256
      if (stored.value === accessCode && !/^[a-f0-9]{64}$/i.test(accessCode)) {
        await db.prepare("INSERT OR REPLACE INTO settings (key, value) VALUES ('admin_password', ?)").run(inputHash);
      }
    } else if (inputHash === envHash || accessCode === envCode) {
      isAccessCodeValid = true;
    }

    if (!isAccessCodeValid) {
      return { success: false, error: 'Incorrect administrator access code' };
    }

    // 2. Verify email exists in admins table or is the super-admin
    const normalizedEmail = email.toLowerCase().trim();
    const isSuperAdmin = normalizedEmail === (process.env.SUPER_ADMIN_EMAIL || 'straightlineaffiliate@gmail.com').toLowerCase().trim();
    
    let adminExists = null;
    if (isSuperAdmin) {
      adminExists = { email: normalizedEmail, created_at: new Date().toISOString() };
    } else {
      adminExists = await db.prepare('SELECT * FROM admins WHERE LOWER(email) = ?').get(normalizedEmail) as AdminRecord | undefined;
    }

    if (!adminExists) {
      return { success: false, error: 'This email is not registered as an authorized administrator' };
    }

    // 3. Check if this device is already verified
    const device = await db.prepare('SELECT * FROM admin_devices WHERE LOWER(email) = ? AND device_hash = ?').get(normalizedEmail, deviceHash) as AdminDevice | undefined;
    if (device && device.verified === 1) {
      // Set authenticated session cookie directly
      const cookieStore = await cookies();
      const sessionPayload = JSON.stringify({
        email: normalizedEmail,
        exp: Date.now() + 2 * 60 * 60 * 1000 // 2 hours
      });
      cookieStore.set('admin_auth', encryptSession(sessionPayload), {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        maxAge: 60 * 60 * 2, // 2 hours
        path: '/'
      });
      return { success: true, otpRequired: false };
    }

    // 4. Generate 6-digit OTP
    const otpCode = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000).toISOString(); // 10 mins expiry

    // Save OTP to DB
    await db.prepare('INSERT OR REPLACE INTO admin_otps (email, code, expires_at) VALUES (?, ?, ?)').run(normalizedEmail, otpCode, expiresAt);

    // Write to terminal
    console.log(`\n======================================================`);
    console.log(`[DEV OTP] One-Time Password generated for ${normalizedEmail}`);
    console.log(`CODE: ${otpCode}`);
    console.log(`Expires At: ${expiresAt}`);
    console.log(`======================================================\n`);

    // Write to local scratch file: scratch/dev_last_otp.json
    try {
      const scratchDir = path.resolve(process.cwd(), 'scratch');
      if (!fs.existsSync(scratchDir)) {
        fs.mkdirSync(scratchDir, { recursive: true });
      }
      fs.writeFileSync(
        path.resolve(scratchDir, 'dev_last_otp.json'),
        JSON.stringify({ email: normalizedEmail, code: otpCode, expiresAt }, null, 2),
        'utf8'
      );
    } catch (fsErr) {
      console.error('Failed to write scratch/dev_last_otp.json:', fsErr);
    }

    return { success: true, otpRequired: true };
  } catch (error: any) {
    console.error('Error requesting admin OTP:', error);
    return { success: false, error: error.message };
  }
}

export async function verifyAdminOtp(
  email: string,
  otpCode: string,
  deviceHash: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const normalizedEmail = email.toLowerCase().trim();
    const cleanCode = otpCode.trim();

    // Fetch OTP record
    const otpRecord = await db.prepare('SELECT * FROM admin_otps WHERE LOWER(email) = ?').get(normalizedEmail) as { email: string; code: string; expires_at: string } | undefined;
    if (!otpRecord) {
      return { success: false, error: 'No active OTP request found for this email' };
    }

    // Check expiration
    if (new Date() > new Date(otpRecord.expires_at)) {
      return { success: false, error: 'This verification code has expired. Please request a new one.' };
    }

    // Verify code
    if (otpRecord.code !== cleanCode) {
      return { success: false, error: 'Invalid verification code' };
    }

    // Consume OTP (delete so it cannot be reused)
    await db.prepare('DELETE FROM admin_otps WHERE LOWER(email) = ?').run(normalizedEmail);

    // Record verified device
    await db.prepare(`
      INSERT INTO admin_devices (email, device_hash, verified, created_at)
      VALUES (?, ?, 1, ?)
      ON CONFLICT(email, device_hash) DO UPDATE SET verified = 1
    `).run(normalizedEmail, deviceHash, new Date().toISOString());

    // Set authenticated session cookie
    const cookieStore = await cookies();
    const sessionPayload = JSON.stringify({
      email: normalizedEmail,
      exp: Date.now() + 2 * 60 * 60 * 1000 // 2 hours
    });
    cookieStore.set('admin_auth', encryptSession(sessionPayload), {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      maxAge: 60 * 60 * 2, // 2 hours
      path: '/'
    });

    return { success: true };
  } catch (error: any) {
    console.error('Error verifying admin OTP:', error);
    return { success: false, error: error.message };
  }
}

// ADMINS SECURITY CRUD

export async function getAdmins(): Promise<AdminRecord[]> {
  const isAuthed = await checkAdminAuth();
  if (!isAuthed) return [];

  // Restrict to super-admin only
  const loggedInEmail = await getLoggedInAdminEmail();
  const superAdminEmail = (process.env.SUPER_ADMIN_EMAIL || 'straightlineaffiliate@gmail.com').toLowerCase().trim();
  if (loggedInEmail?.toLowerCase().trim() !== superAdminEmail) {
    return [];
  }

  try {
    return await db.prepare('SELECT * FROM admins ORDER BY id ASC').all() as AdminRecord[];
  } catch (error) {
    console.error('Error getting admins list:', error);
    return [];
  }
}

export async function addAdminEmail(email: string): Promise<{ success: boolean; error?: string }> {
  const isAuthed = await checkAdminAuth();
  if (!isAuthed) return { success: false, error: 'Unauthorized' };

  // Restrict to super-admin only
  const loggedInEmail = await getLoggedInAdminEmail();
  const superAdminEmail = (process.env.SUPER_ADMIN_EMAIL || 'straightlineaffiliate@gmail.com').toLowerCase().trim();
  if (loggedInEmail?.toLowerCase().trim() !== superAdminEmail) {
    return { success: false, error: 'Only the Super-Administrator (straightlineaffiliate@gmail.com) can add other administrators.' };
  }

  try {
    const normalizedEmail = email.toLowerCase().trim();
    if (!normalizedEmail) {
      return { success: false, error: 'Email cannot be empty' };
    }

    await db.prepare('INSERT INTO admins (email, created_at) VALUES (?, ?)').run(normalizedEmail, new Date().toISOString().split('T')[0]);
    revalidatePath('/admin/dashboard');
    return { success: true };
  } catch (error: any) {
    console.error('Error adding admin email:', error);
    if (error.message.includes('UNIQUE')) {
      return { success: false, error: 'This email is already registered as an administrator' };
    }
    return { success: false, error: error.message };
  }
}

export async function deleteAdminEmail(id: number): Promise<{ success: boolean; error?: string }> {
  const isAuthed = await checkAdminAuth();
  if (!isAuthed) return { success: false, error: 'Unauthorized' };

  // Restrict to super-admin only
  const loggedInEmail = await getLoggedInAdminEmail();
  const superAdminEmail = (process.env.SUPER_ADMIN_EMAIL || 'straightlineaffiliate@gmail.com').toLowerCase().trim();
  if (loggedInEmail?.toLowerCase().trim() !== superAdminEmail) {
    return { success: false, error: 'Only the Super-Administrator (straightlineaffiliate@gmail.com) can revoke administrator access.' };
  }

  try {
    // Prevent removing the super administrator
    const adminToDelete = await db.prepare('SELECT email FROM admins WHERE id = ?').get(id) as { email: string } | undefined;
    if (adminToDelete) {
      const emailToDelete = adminToDelete.email.toLowerCase().trim();
      if (emailToDelete === superAdminEmail) {
        return { success: false, error: 'Cannot delete the super-administrator (straightlineaffiliate@gmail.com).' };
      }
    }

    // Prevent removing the last admin
    const countRow = await db.prepare('SELECT COUNT(*) as count FROM admins').get() as { count: number };
    if (countRow.count <= 1) {
      return { success: false, error: 'Cannot delete the last remaining administrator.' };
    }

    await db.prepare('DELETE FROM admins WHERE id = ?').run(id);
    revalidatePath('/admin/dashboard');
    return { success: true };
  } catch (error: any) {
    console.error('Error deleting admin email:', error);
    return { success: false, error: error.message };
  }
}

// PUBLIC CONTACT FORM SUBMISSIONS

export async function getContactSubmissions(): Promise<ContactSubmission[]> {
  const isAuthed = await checkAdminAuth();
  if (!isAuthed) return [];
  try {
    return await db.prepare('SELECT * FROM contact_submissions ORDER BY id DESC').all() as ContactSubmission[];
  } catch (error) {
    console.error('Error getting contact submissions:', error);
    return [];
  }
}

export async function submitContactForm(
  name: string,
  email: string,
  phone: string | null,
  message: string
): Promise<{ success: boolean; error?: string }> {
  try {
    if (!name.trim() || !email.trim() || !message.trim()) {
      return { success: false, error: 'Name, email, and message are required fields.' };
    }

    await db.prepare(`
      INSERT INTO contact_submissions (name, email, phone, message, created_at)
      VALUES (?, ?, ?, ?, ?)
    `).run(name.trim(), email.toLowerCase().trim(), phone ? phone.trim() : null, message.trim(), new Date().toISOString());

    revalidatePath('/admin/dashboard');
    return { success: true };
  } catch (error: any) {
    console.error('Error submitting contact form:', error);
    return { success: false, error: error.message };
  }
}

export async function deleteContactSubmission(id: number): Promise<{ success: boolean; error?: string }> {
  const isAuthed = await checkAdminAuth();
  if (!isAuthed) return { success: false, error: 'Unauthorized' };

  try {
    await db.prepare('DELETE FROM contact_submissions WHERE id = ?').run(id);
    revalidatePath('/admin/dashboard');
    return { success: true };
  } catch (error: any) {
    console.error('Error deleting contact submission:', error);
    return { success: false, error: error.message };
  }
}

// PUBLIC PRAYER WALL ACTIONS

export async function getPrayerRequests(): Promise<PrayerRequest[]> {
  try {
    return await db.prepare('SELECT * FROM prayer_requests ORDER BY id DESC').all() as PrayerRequest[];
  } catch (error) {
    console.error('Error getting prayer requests:', error);
    return [];
  }
}

export async function submitPrayerRequest(
  requesterName: string | null,
  requestText: string,
  isAnonymous: boolean
): Promise<{ success: boolean; error?: string }> {
  try {
    if (!requestText.trim()) {
      return { success: false, error: 'Prayer request content cannot be empty.' };
    }

    const anonymousInt = isAnonymous ? 1 : 0;
    const cleanName = isAnonymous ? null : (requesterName ? requesterName.trim() : null);

    await db.prepare(`
      INSERT INTO prayer_requests (requester_name, request_text, is_anonymous, created_at)
      VALUES (?, ?, ?, ?)
    `).run(cleanName, requestText.trim(), anonymousInt, new Date().toISOString().split('T')[0]);

    revalidatePath('/');
    revalidatePath('/admin/dashboard');
    return { success: true };
  } catch (error: any) {
    console.error('Error submitting prayer request:', error);
    return { success: false, error: error.message };
  }
}

export async function deletePrayerRequest(id: number): Promise<{ success: boolean; error?: string }> {
  const isAuthed = await checkAdminAuth();
  if (!isAuthed) return { success: false, error: 'Unauthorized' };

  try {
    await db.prepare('DELETE FROM prayer_requests WHERE id = ?').run(id);
    revalidatePath('/');
    revalidatePath('/admin/dashboard');
    return { success: true };
  } catch (error: any) {
    console.error('Error deleting prayer request:', error);
    return { success: false, error: error.message };
  }
}

// BLOG POSTS CRUD

export async function getBlogPosts(): Promise<BlogPost[]> {
  try {
    return await db.prepare('SELECT * FROM blog_posts ORDER BY date DESC, id DESC').all() as BlogPost[];
  } catch (error) {
    console.error('Error getting blog posts:', error);
    return [];
  }
}

export async function saveBlogPost(
  id: number | null,
  titleKreyol: string,
  titleEnglish: string,
  contentKreyol: string,
  contentEnglish: string,
  date: string
): Promise<{ success: boolean; error?: string }> {
  const isAuthed = await checkAdminAuth();
  if (!isAuthed) return { success: false, error: 'Unauthorized' };

  try {
    if (!titleKreyol.trim() || !titleEnglish.trim() || !contentKreyol.trim() || !contentEnglish.trim() || !date.trim()) {
      return { success: false, error: 'All fields are required' };
    }

    const today = new Date().toISOString().split('T')[0];

    if (id === null || id === undefined || id === 0) {
      await db.prepare(`
        INSERT INTO blog_posts (title_kreyol, title_english, content_kreyol, content_english, date, created_at)
        VALUES (?, ?, ?, ?, ?, ?)
      `).run(titleKreyol.trim(), titleEnglish.trim(), contentKreyol.trim(), contentEnglish.trim(), date.trim(), today);
    } else {
      await db.prepare(`
        UPDATE blog_posts
        SET title_kreyol = ?,
            title_english = ?,
            content_kreyol = ?,
            content_english = ?,
            date = ?
        WHERE id = ?
      `).run(titleKreyol.trim(), titleEnglish.trim(), contentKreyol.trim(), contentEnglish.trim(), date.trim(), id);
    }

    revalidatePath('/');
    revalidatePath('/admin/dashboard');
    return { success: true };
  } catch (error: any) {
    console.error('Error saving blog post:', error);
    return { success: false, error: error.message };
  }
}

export async function deleteBlogPost(id: number): Promise<{ success: boolean; error?: string }> {
  const isAuthed = await checkAdminAuth();
  if (!isAuthed) return { success: false, error: 'Unauthorized' };

  try {
    await db.prepare('DELETE FROM blog_posts WHERE id = ?').run(id);
    revalidatePath('/');
    revalidatePath('/admin/dashboard');
    return { success: true };
  } catch (error: any) {
    console.error('Error deleting blog post:', error);
    return { success: false, error: error.message };
  }
}

export async function translateBlogContentAction(
  title: string,
  content: string,
  fromLang: 'en' | 'fr_ht'
): Promise<{ success: boolean; translatedTitle?: string; translatedContent?: string; error?: string }> {
  const isAuthed = await checkAdminAuth();
  if (!isAuthed) return { success: false, error: 'Unauthorized' };

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return { success: false, error: 'GEMINI_API_KEY is not defined in environment variables' };
  }

  try {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`;
    
    const sourceLangName = fromLang === 'en' ? 'English' : 'Haitian Creole';
    const targetLangName = fromLang === 'en' ? 'Haitian Creole' : 'English';

    const prompt = `You are a professional Christian translator translating a pastor's blog post from ${sourceLangName} to ${targetLangName} for Parousia Baptist Ministries.
Please translate the following blog post title and body content. Keep the markdown formatting of the content completely intact (e.g. headers, bold, list items, paragraphs, etc.).

Source Title: "${title}"
Source Content:
${content}

Return a JSON object conforming to this exact structure:
{
  "translated_title": "The translated title in ${targetLangName}",
  "translated_content": "The translated body content in ${targetLangName} preserving all markdown syntax"
}`;

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
              translated_title: { type: 'STRING' },
              translated_content: { type: 'STRING' }
            },
            required: ['translated_title', 'translated_content']
          }
        }
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      return { success: false, error: `Gemini API call failed: ${errorText}` };
    }

    const data = await response.json();
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!text) {
      return { success: false, error: 'Empty response text from Gemini' };
    }

    const parsed = JSON.parse(text);
    return { 
      success: true, 
      translatedTitle: parsed.translated_title, 
      translatedContent: parsed.translated_content 
    };
  } catch (error: any) {
    console.error('Error in translateBlogContentAction:', error);
    return { success: false, error: error.message };
  }
}

