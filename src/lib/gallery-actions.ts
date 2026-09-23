'use server';

import fs from 'fs';
import path from 'path';
import { db, type GalleryPhoto } from './db';
import { canManageGallery, getLoggedInViewerEmail } from './coordinator-session';
import {
  GALLERY_CAPTION_MAX,
  GALLERY_EVENT_TAG_MAX,
  GALLERY_IMAGE_EXTENSIONS,
  normalizeEventTag,
} from './gallery';
import { getAssetDir } from './paths';

type GalleryLanguage = 'en' | 'fr_ht';

export type GalleryMutationResult = {
  success: boolean;
  photo?: GalleryPhoto;
  error?: string;
};

function message(language: GalleryLanguage, en: string, fr: string): string {
  return language === 'fr_ht' ? fr : en;
}

async function ensureGallerySchema(): Promise<void> {
  await db.prepare(`
    CREATE TABLE IF NOT EXISTS gallery_photos (
      id SERIAL PRIMARY KEY,
      image_url TEXT NOT NULL,
      event_tag TEXT NOT NULL DEFAULT '',
      caption TEXT NOT NULL DEFAULT '',
      created_at TEXT NOT NULL,
      uploaded_by TEXT NOT NULL DEFAULT ''
    )
  `).run();
}

function galleryAssetPath(imageUrl: string): string | null {
  if (!imageUrl.startsWith('/api/assets/')) return null;
  let filename = imageUrl.slice('/api/assets/'.length).split('?')[0];
  try {
    filename = decodeURIComponent(filename);
  } catch {
    return null;
  }
  if (!filename || filename.includes('/') || filename.includes('\\') || filename.includes('\0')) return null;
  const ext = path.extname(filename).toLowerCase();
  if (!(GALLERY_IMAGE_EXTENSIONS as readonly string[]).includes(ext)) return null;
  const assetDir = getAssetDir();
  const filePath = path.join(assetDir, filename);
  const relative = path.relative(assetDir, filePath);
  if (relative.startsWith('..') || path.isAbsolute(relative)) return null;
  return filePath;
}

function normalizePhoto(row: GalleryPhoto): GalleryPhoto {
  return {
    id: Number(row.id),
    image_url: row.image_url,
    event_tag: row.event_tag || '',
    caption: row.caption || '',
    created_at: row.created_at,
    uploaded_by: row.uploaded_by || '',
  };
}

function cleanCaption(value: string): string {
  return value.replace(/\s+/g, ' ').trim().slice(0, GALLERY_CAPTION_MAX);
}

function cleanEventTag(value: string, language: GalleryLanguage): { tag: string; error?: string } {
  const tag = normalizeEventTag(value).slice(0, GALLERY_EVENT_TAG_MAX);
  if (!tag) {
    return {
      tag: '',
      error: message(
        language,
        'Enter the event name, date, or title.',
        'Indiquez le nom, la date ou le titre de l’événement.'
      ),
    };
  }
  return { tag };
}

export async function listGalleryPhotos(): Promise<GalleryPhoto[]> {
  await ensureGallerySchema();
  const rows = await db.prepare(
    'SELECT id, image_url, event_tag, caption, created_at, uploaded_by FROM gallery_photos ORDER BY created_at DESC, id DESC'
  ).all<GalleryPhoto>();
  return rows.map(normalizePhoto);
}

export async function createGalleryPhoto(
  input: { imageUrl: string; eventTag: string; caption?: string },
  language: GalleryLanguage = 'en'
): Promise<GalleryMutationResult> {
  if (!(await canManageGallery())) {
    return {
      success: false,
      error: message(
        language,
        'Only assigned gallery coordinators can add photos.',
        'Seuls les coordinateurs de la galerie désignés peuvent ajouter des photos.'
      ),
    };
  }

  const { tag, error } = cleanEventTag(input.eventTag, language);
  if (error) return { success: false, error };

  const filePath = galleryAssetPath(input.imageUrl || '');
  if (!filePath || !fs.existsSync(filePath)) {
    return {
      success: false,
      error: message(language, 'That photo could not be saved.', 'Cette photo n’a pas pu être enregistrée.'),
    };
  }

  await ensureGallerySchema();
  const uploadedBy = (await getLoggedInViewerEmail()) || '';
  const photo = await db.prepare(`
    INSERT INTO gallery_photos (image_url, event_tag, caption, created_at, uploaded_by)
    VALUES (?, ?, ?, ?, ?)
    RETURNING id, image_url, event_tag, caption, created_at, uploaded_by
  `).get<GalleryPhoto>(input.imageUrl, tag, cleanCaption(input.caption || ''), new Date().toISOString(), uploadedBy);

  if (!photo) {
    return {
      success: false,
      error: message(language, 'That photo could not be saved.', 'Cette photo n’a pas pu être enregistrée.'),
    };
  }
  return { success: true, photo: normalizePhoto(photo) };
}

export async function updateGalleryPhoto(
  id: number,
  input: { eventTag: string; caption?: string },
  language: GalleryLanguage = 'en'
): Promise<GalleryMutationResult> {
  if (!(await canManageGallery())) {
    return {
      success: false,
      error: message(
        language,
        'Only assigned gallery coordinators can edit photos.',
        'Seuls les coordinateurs de la galerie désignés peuvent modifier des photos.'
      ),
    };
  }

  const { tag, error } = cleanEventTag(input.eventTag, language);
  if (error) return { success: false, error };

  await ensureGallerySchema();
  const photo = await db.prepare(`
    UPDATE gallery_photos
    SET event_tag = ?, caption = ?
    WHERE id = ?
    RETURNING id, image_url, event_tag, caption, created_at, uploaded_by
  `).get<GalleryPhoto>(tag, cleanCaption(input.caption || ''), id);

  if (!photo) {
    return {
      success: false,
      error: message(language, 'That photo could not be found.', 'Cette photo est introuvable.'),
    };
  }
  return { success: true, photo: normalizePhoto(photo) };
}

export async function deleteGalleryPhoto(
  id: number,
  language: GalleryLanguage = 'en'
): Promise<GalleryMutationResult> {
  if (!(await canManageGallery())) {
    return {
      success: false,
      error: message(
        language,
        'Only assigned gallery coordinators can remove photos.',
        'Seuls les coordinateurs de la galerie désignés peuvent retirer des photos.'
      ),
    };
  }

  await ensureGallerySchema();
  const existing = await db.prepare(
    'DELETE FROM gallery_photos WHERE id = ? RETURNING image_url'
  ).get<{ image_url: string }>(id);

  if (!existing) {
    return {
      success: false,
      error: message(language, 'That photo could not be found.', 'Cette photo est introuvable.'),
    };
  }

  const filePath = galleryAssetPath(existing.image_url);
  if (filePath && fs.existsSync(filePath)) {
    try {
      fs.unlinkSync(filePath);
    } catch (error) {
      console.error('Error deleting gallery asset:', error);
    }
  }

  return { success: true };
}
