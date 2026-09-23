'use client';

import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { ChevronLeft, ChevronRight, ImagePlus, Trash2, Upload, X } from 'lucide-react';
import type { GalleryPhoto } from '@/lib/db';
import { createGalleryPhoto, deleteGalleryPhoto, updateGalleryPhoto } from '@/lib/gallery-actions';
import {
  GALLERY_CAPTION_MAX,
  GALLERY_EVENT_TAG_MAX,
  GALLERY_MAX_BATCH,
  GALLERY_MAX_BYTES,
  eventTagMatches,
  isGalleryImageFile,
  normalizeEventTag,
} from '@/lib/gallery';
import { useLanguage } from '@/lib/LanguageContext';
import { siteShellClass } from '@/lib/site-layout';
import { getSiteTheme } from '@/lib/site-theme';

type DraftPhoto = {
  id: string;
  file: File;
  previewUrl: string;
  caption: string;
};

interface GalleryClientProps {
  settings: Record<string, string>;
  initialPhotos: GalleryPhoto[];
  canPost: boolean;
}

export default function GalleryClient({ settings, initialPhotos, canPost }: GalleryClientProps) {
  const { language, t } = useLanguage();
  const router = useRouter();
  const searchParams = useSearchParams();
  const theme = getSiteTheme(settings);
  const managing = canPost && searchParams.get('manage') === '1';
  const fileInputRef = useRef<HTMLInputElement>(null);
  const draftsRef = useRef<DraftPhoto[]>([]);
  const [photos, setPhotos] = useState(initialPhotos);
  const [query, setQuery] = useState('');
  const [eventTag, setEventTag] = useState('');
  const [drafts, setDrafts] = useState<DraftPhoto[]>([]);
  const [dragging, setDragging] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [activeId, setActiveId] = useState<number | null>(null);
  const [editTag, setEditTag] = useState('');
  const [editCaption, setEditCaption] = useState('');
  const [savingPhoto, setSavingPhoto] = useState(false);

  const lang = language === 'fr_ht' ? 'fr_ht' : 'en';

  useEffect(() => {
    const event = new URLSearchParams(window.location.search).get('event');
    if (event) setQuery(event);
  }, []);

  useEffect(() => {
    draftsRef.current = drafts;
  }, [drafts]);

  useEffect(() => {
    return () => {
      draftsRef.current.forEach((draft) => URL.revokeObjectURL(draft.previewUrl));
    };
  }, []);

  const eventTags = useMemo(() => {
    const tags = new Set<string>();
    for (const photo of photos) {
      const tag = normalizeEventTag(photo.event_tag);
      if (tag) tags.add(tag);
    }
    return [...tags].sort((a, b) => a.localeCompare(b, lang === 'fr_ht' ? 'fr' : 'en'));
  }, [photos, lang]);

  const filtered = useMemo(
    () => photos.filter((photo) => eventTagMatches(photo.event_tag, query)),
    [photos, query]
  );

  const activeIndex = filtered.findIndex((photo) => photo.id === activeId);
  const activePhoto = activeIndex >= 0 ? filtered[activeIndex] : null;

  useEffect(() => {
    if (!activePhoto) return;
    setEditTag(activePhoto.event_tag);
    setEditCaption(activePhoto.caption);
  }, [activePhoto]);

  const setFilter = (value: string) => {
    setQuery(value);
    setActiveId(null);
    const url = new URL(window.location.href);
    const trimmed = value.trim();
    if (trimmed) url.searchParams.set('event', trimmed);
    else url.searchParams.delete('event');
    window.history.replaceState(null, '', `${url.pathname}${url.search}`);
  };

  const addFiles = (fileList: FileList | File[]) => {
    const incoming = Array.from(fileList);
    if (incoming.length === 0) return;

    const accepted: DraftPhoto[] = [];
    let rejectedType = false;
    let rejectedSize = false;
    for (const file of incoming) {
      if (!isGalleryImageFile(file)) {
        rejectedType = true;
        continue;
      }
      if (file.size > GALLERY_MAX_BYTES) {
        rejectedSize = true;
        continue;
      }
      accepted.push({
        id: crypto.randomUUID(),
        file,
        previewUrl: URL.createObjectURL(file),
        caption: '',
      });
    }

    let trimmed = false;
    setDrafts((prev) => {
      const room = Math.max(GALLERY_MAX_BATCH - prev.length, 0);
      const next = accepted.slice(0, room);
      if (accepted.length > next.length) trimmed = true;
      accepted.slice(next.length).forEach((draft) => URL.revokeObjectURL(draft.previewUrl));
      return [...prev, ...next];
    });

    if (rejectedType) {
      setMessage({ type: 'error', text: t.galleryInvalidImage });
    } else if (rejectedSize) {
      setMessage({ type: 'error', text: t.galleryTooLarge });
    } else if (trimmed) {
      setMessage({
        type: 'error',
        text: lang === 'fr_ht'
          ? `Vous pouvez ajouter ${GALLERY_MAX_BATCH} photos à la fois.`
          : `You can add ${GALLERY_MAX_BATCH} photos at a time.`,
      });
    } else if (accepted.length > 0) {
      setMessage(null);
    }
  };

  const addFilesRef = useRef(addFiles);
  addFilesRef.current = addFiles;

  const removeDraft = (id: string) => {
    setDrafts((prev) => {
      const draft = prev.find((item) => item.id === id);
      if (draft) URL.revokeObjectURL(draft.previewUrl);
      return prev.filter((item) => item.id !== id);
    });
  };

  const setManaging = (open: boolean) => {
    const url = new URL(window.location.href);
    if (open) url.searchParams.set('manage', '1');
    else url.searchParams.delete('manage');
    const next = `${url.pathname}${url.search}`;
    router.replace(next, { scroll: false });
  };

  useEffect(() => {
    if (!managing) return;

    const onPaste = (event: ClipboardEvent) => {
      const target = event.target as HTMLElement | null;
      if (target && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable)) {
        return;
      }
      const imageFiles: File[] = [];
      for (const item of event.clipboardData?.items ?? []) {
        if (!item.type.startsWith('image/')) continue;
        const file = item.getAsFile();
        if (file) imageFiles.push(file);
      }
      if (imageFiles.length === 0) return;
      event.preventDefault();
      addFilesRef.current(imageFiles);
    };

    window.addEventListener('paste', onPaste);
    return () => window.removeEventListener('paste', onPaste);
  }, [managing]);

  const publish = async () => {
    const tag = normalizeEventTag(eventTag);
    if (!tag) {
      setMessage({ type: 'error', text: t.galleryEventRequired });
      return;
    }
    if (drafts.length === 0) {
      setMessage({ type: 'error', text: t.galleryNeedPhotos });
      return;
    }

    setPublishing(true);
    setMessage(null);
    const pending = [...drafts];
    const published: GalleryPhoto[] = [];

    for (const draft of drafts) {
      try {
        const formData = new FormData();
        formData.append('file', draft.file);
        const uploadRes = await fetch('/api/upload', { method: 'POST', body: formData });
        const uploadBody = await uploadRes.json() as { success?: boolean; url?: string; error?: string };
        if (!uploadRes.ok || !uploadBody.success || !uploadBody.url) {
          throw new Error(uploadBody.error || t.galleryUploadError);
        }
        const saved = await createGalleryPhoto(
          { imageUrl: uploadBody.url, eventTag: tag, caption: draft.caption },
          lang
        );
        if (!saved.success || !saved.photo) {
          throw new Error(saved.error || t.galleryUploadError);
        }
        published.push(saved.photo);
        URL.revokeObjectURL(draft.previewUrl);
        const index = pending.findIndex((item) => item.id === draft.id);
        if (index >= 0) pending.splice(index, 1);
      } catch (error) {
        setDrafts(pending);
        setPhotos((prev) => [...published, ...prev]);
        setMessage({
          type: 'error',
          text: error instanceof Error ? error.message : t.galleryUploadError,
        });
        setPublishing(false);
        return;
      }
    }

    setDrafts([]);
    setPhotos((prev) => [...published, ...prev]);
    setEventTag('');
    setMessage({ type: 'success', text: t.galleryPublished });
    setPublishing(false);
  };

  const saveActivePhoto = async () => {
    if (!activePhoto) return;
    setSavingPhoto(true);
    setMessage(null);
    const result = await updateGalleryPhoto(
      activePhoto.id,
      { eventTag: editTag, caption: editCaption },
      lang
    );
    setSavingPhoto(false);
    if (!result.success || !result.photo) {
      setMessage({ type: 'error', text: result.error || t.galleryUploadError });
      return;
    }
    setPhotos((prev) => prev.map((photo) => (photo.id === result.photo!.id ? result.photo! : photo)));
    setMessage({ type: 'success', text: t.gallerySaved });
  };

  const removeActivePhoto = async () => {
    if (!activePhoto) return;
    if (!window.confirm(t.galleryDeleteConfirm)) return;
    setSavingPhoto(true);
    const result = await deleteGalleryPhoto(activePhoto.id, lang);
    setSavingPhoto(false);
    if (!result.success) {
      setMessage({ type: 'error', text: result.error || t.galleryUploadError });
      return;
    }
    const nextFiltered = filtered.filter((photo) => photo.id !== activePhoto.id);
    setPhotos((prev) => prev.filter((photo) => photo.id !== activePhoto.id));
    const next = nextFiltered[Math.min(activeIndex, nextFiltered.length - 1)];
    setActiveId(next ? next.id : null);
    setMessage({ type: 'success', text: t.galleryDeleted });
  };

  useEffect(() => {
    if (activeId === null) return;
    const onKey = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null;
      const typing = target && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA');
      if (event.key === 'Escape') setActiveId(null);
      if (typing) return;
      if (event.key === 'ArrowLeft' && activeIndex > 0) setActiveId(filtered[activeIndex - 1].id);
      if (event.key === 'ArrowRight' && activeIndex < filtered.length - 1) setActiveId(filtered[activeIndex + 1].id);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [activeId, activeIndex, filtered]);

  const inputClass = `w-full rounded-xl px-3 py-2 text-sm ${theme.bgInput}`;
  const selectedTag = normalizeEventTag(query).toLocaleLowerCase();

  return (
    <div className={`${siteShellClass} py-12 md:py-16`}>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div className="max-w-3xl">
          <h1 className={`font-serif text-3xl md:text-4xl font-bold ${theme.textTitle}`}>{t.galleryTitle}</h1>
          <p className={`mt-3 text-base leading-relaxed ${theme.textBody}`}>{t.gallerySubtitle}</p>
        </div>
        {canPost && !managing && (
          <button
            type="button"
            onClick={() => setManaging(true)}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 text-sm font-bold cursor-pointer"
          >
            <ImagePlus className="w-4 h-4" />
            {t.coordinatorManageGallery}
          </button>
        )}
      </div>

      {managing && (
        <section className={`mt-8 rounded-3xl p-5 md:p-6 ${theme.bgCard}`} aria-labelledby="gallery-composer-title">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-start gap-3">
              <ImagePlus className="w-5 h-5 text-amber-500 mt-0.5 shrink-0" />
              <div>
                <h2 id="gallery-composer-title" className={`text-lg font-bold ${theme.textTitle}`}>{t.galleryAddTitle}</h2>
                <p className={`text-sm mt-1 ${theme.textMuted}`}>{t.galleryCoordinatorNote}</p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setManaging(false)}
              disabled={publishing}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-bold cursor-pointer shrink-0 ${
                theme.isLight ? 'border-slate-300 text-slate-700 hover:border-amber-500' : 'border-slate-700 text-slate-200 hover:border-amber-500'
              }`}
            >
              <X className="w-3.5 h-3.5" />
              {t.galleryCloseManagement}
            </button>
          </div>

          <div className="mt-5 space-y-4">
            <div>
              <label htmlFor="gallery-event-tag" className={`block text-xs font-bold uppercase tracking-wide mb-1 ${theme.textMuted}`}>
                {t.galleryEventTag}
              </label>
              <input
                id="gallery-event-tag"
                list="gallery-event-tags"
                value={eventTag}
                maxLength={GALLERY_EVENT_TAG_MAX}
                onChange={(event) => setEventTag(event.target.value)}
                placeholder={t.galleryFilterPlaceholder}
                className={inputClass}
              />
              <p className={`text-xs mt-1 ${theme.textMuted}`}>{t.galleryEventTagHint}</p>
              <datalist id="gallery-event-tags">
                {eventTags.map((tag) => <option key={tag} value={tag} />)}
              </datalist>
            </div>

            <div
              onDragEnter={(event) => {
                event.preventDefault();
                setDragging(true);
              }}
              onDragOver={(event) => {
                event.preventDefault();
                setDragging(true);
              }}
              onDragLeave={() => setDragging(false)}
              onDrop={(event) => {
                event.preventDefault();
                setDragging(false);
                if (event.dataTransfer.files?.length) addFiles(event.dataTransfer.files);
              }}
              className={`rounded-2xl border-2 border-dashed px-4 py-8 text-center transition-colors ${
                dragging ? 'border-amber-500 bg-amber-500/10' : theme.isLight ? 'border-slate-300' : 'border-slate-700'
              }`}
            >
              <Upload className="w-6 h-6 mx-auto text-amber-500" />
              <p className={`mt-3 text-sm ${theme.textBody}`}>{t.galleryDropHint}</p>
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="mt-4 inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 text-sm font-bold cursor-pointer"
              >
                {t.galleryBrowse}
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp,image/gif"
                multiple
                className="hidden"
                onChange={(event) => {
                  if (event.target.files?.length) addFiles(event.target.files);
                  event.target.value = '';
                }}
              />
            </div>

            {drafts.length > 0 && (
              <ul className="grid sm:grid-cols-2 gap-3">
                {drafts.map((draft) => (
                  <li key={draft.id} className={`rounded-2xl overflow-hidden border ${theme.isLight ? 'border-slate-200' : 'border-slate-800'}`}>
                    <div className="relative aspect-[4/3] bg-slate-900">
                      <img src={draft.previewUrl} alt="" className="w-full h-full object-cover" />
                      <button
                        type="button"
                        onClick={() => removeDraft(draft.id)}
                        className="absolute top-2 right-2 p-1.5 rounded-full bg-slate-950/80 text-white cursor-pointer"
                        aria-label={t.galleryRemoveDraft}
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                    <label className="block p-3">
                      <span className={`block text-[10px] font-bold uppercase tracking-wide mb-1 ${theme.textMuted}`}>
                        {t.galleryCaptionOptional}
                      </span>
                      <input
                        value={draft.caption}
                        maxLength={GALLERY_CAPTION_MAX}
                        onChange={(event) => {
                          const caption = event.target.value;
                          setDrafts((prev) => prev.map((item) => (item.id === draft.id ? { ...item, caption } : item)));
                        }}
                        className={inputClass}
                      />
                    </label>
                  </li>
                ))}
              </ul>
            )}

            <div className="flex justify-end">
              <button
                type="button"
                disabled={publishing}
                onClick={() => void publish()}
                className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 disabled:opacity-60 text-slate-950 text-sm font-bold cursor-pointer"
              >
                {publishing ? t.galleryPublishing : t.galleryPublish}
              </button>
            </div>
          </div>
        </section>
      )}

      {message && (
        <p className={`mt-4 text-sm font-semibold ${message.type === 'error' ? 'text-rose-500' : 'text-emerald-500'}`} role="status">
          {message.text}
        </p>
      )}

      <div className="mt-10">
        <label htmlFor="gallery-filter" className={`block text-xs font-bold uppercase tracking-wide mb-2 ${theme.textMuted}`}>
          {t.galleryFilterLabel}
        </label>
        <input
          id="gallery-filter"
          value={query}
          onChange={(event) => setFilter(event.target.value)}
          placeholder={t.galleryFilterPlaceholder}
          className={`${inputClass} max-w-xl`}
        />
        <div className="mt-3 flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => setFilter('')}
            className={`px-3 py-1.5 rounded-full text-xs font-bold cursor-pointer border ${
              !query.trim()
                ? 'bg-amber-500 border-amber-500 text-slate-950'
                : theme.isLight
                  ? 'border-slate-300 text-slate-700'
                  : 'border-slate-700 text-slate-200'
            }`}
          >
            {t.galleryAll}
          </button>
          {eventTags.map((tag) => {
            const active = selectedTag === tag.toLocaleLowerCase();
            return (
              <button
                key={tag}
                type="button"
                onClick={() => setFilter(tag)}
                className={`px-3 py-1.5 rounded-full text-xs font-bold cursor-pointer border ${
                  active
                    ? 'bg-amber-500 border-amber-500 text-slate-950'
                    : theme.isLight
                      ? 'border-slate-300 text-slate-700'
                      : 'border-slate-700 text-slate-200'
                }`}
              >
                {tag}
              </button>
            );
          })}
        </div>
      </div>

      {photos.length === 0 ? (
        <p className={`mt-10 text-sm ${theme.textMuted}`}>{t.galleryEmpty}</p>
      ) : filtered.length === 0 ? (
        <p className={`mt-10 text-sm ${theme.textMuted}`}>{t.galleryNoMatch}</p>
      ) : (
        <ul className="mt-8 grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filtered.map((photo) => (
            <li key={photo.id}>
              <button
                type="button"
                onClick={() => setActiveId(photo.id)}
                className="w-full text-left cursor-pointer group"
              >
                <div className={`aspect-[4/3] overflow-hidden rounded-2xl ${theme.isLight ? 'bg-slate-200' : 'bg-slate-900'}`}>
                  <img
                    src={photo.image_url}
                    alt={photo.caption || photo.event_tag}
                    className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                  />
                </div>
                <p className="mt-2 text-[11px] font-bold uppercase tracking-wide text-amber-500">{photo.event_tag}</p>
                {photo.caption ? (
                  <p className={`text-sm mt-0.5 line-clamp-2 ${theme.textBody}`}>{photo.caption}</p>
                ) : null}
              </button>
            </li>
          ))}
        </ul>
      )}

      {activePhoto && (
        <div
          className="fixed inset-0 z-50 bg-slate-950/80 flex items-center justify-center p-4"
          role="dialog"
          aria-modal="true"
          aria-label={activePhoto.event_tag}
          onClick={() => setActiveId(null)}
        >
          <div
            className={`relative w-full max-w-4xl max-h-[90vh] overflow-y-auto rounded-3xl ${theme.isLight ? 'bg-white' : 'bg-slate-900'}`}
            onClick={(event) => event.stopPropagation()}
          >
            <button
              type="button"
              onClick={() => setActiveId(null)}
              className="absolute top-3 right-3 z-10 p-2 rounded-full bg-slate-950/70 text-white cursor-pointer"
              aria-label={t.galleryClose}
            >
              <X className="w-4 h-4" />
            </button>
            {activeIndex > 0 && (
              <button
                type="button"
                onClick={() => setActiveId(filtered[activeIndex - 1].id)}
                className="absolute left-3 top-1/3 z-10 p-2 rounded-full bg-slate-950/70 text-white cursor-pointer"
                aria-label={t.galleryPrevious}
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
            )}
            {activeIndex < filtered.length - 1 && (
              <button
                type="button"
                onClick={() => setActiveId(filtered[activeIndex + 1].id)}
                className="absolute right-3 top-1/3 z-10 p-2 rounded-full bg-slate-950/70 text-white cursor-pointer"
                aria-label={t.galleryNext}
              >
                <ChevronRight className="w-5 h-5" />
              </button>
            )}
            <img
              src={activePhoto.image_url}
              alt={activePhoto.caption || activePhoto.event_tag}
              className="w-full max-h-[60vh] object-contain bg-slate-950"
            />
            <div className="p-5 space-y-3">
              {managing ? (
                <>
                  <label className="block">
                    <span className={`block text-[10px] font-bold uppercase tracking-wide mb-1 ${theme.textMuted}`}>{t.galleryEventTag}</span>
                    <input
                      value={editTag}
                      maxLength={GALLERY_EVENT_TAG_MAX}
                      onChange={(event) => setEditTag(event.target.value)}
                      className={inputClass}
                    />
                  </label>
                  <label className="block">
                    <span className={`block text-[10px] font-bold uppercase tracking-wide mb-1 ${theme.textMuted}`}>{t.galleryCaptionOptional}</span>
                    <textarea
                      rows={3}
                      value={editCaption}
                      maxLength={GALLERY_CAPTION_MAX}
                      onChange={(event) => setEditCaption(event.target.value)}
                      className={inputClass}
                    />
                  </label>
                  <div className="flex flex-wrap justify-between gap-2">
                    <button
                      type="button"
                      disabled={savingPhoto}
                      onClick={() => void removeActivePhoto()}
                      className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl border border-rose-500 text-rose-500 text-xs font-bold cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      {t.galleryDeletePhoto}
                    </button>
                    <button
                      type="button"
                      disabled={savingPhoto}
                      onClick={() => void saveActivePhoto()}
                      className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 disabled:opacity-60 text-slate-950 text-xs font-bold cursor-pointer"
                    >
                      {t.gallerySaveDetails}
                    </button>
                  </div>
                </>
              ) : (
                <>
                  <p className="text-xs font-bold uppercase tracking-wide text-amber-500">{activePhoto.event_tag}</p>
                  {activePhoto.caption ? <p className={`text-sm ${theme.textBody}`}>{activePhoto.caption}</p> : null}
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
