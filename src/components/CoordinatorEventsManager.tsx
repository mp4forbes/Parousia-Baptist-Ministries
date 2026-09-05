'use client';

import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Calendar, Edit, Plus, Save, Trash2, UploadCloud } from 'lucide-react';
import { useLanguage } from '@/lib/LanguageContext';
import { EventRecord } from '@/lib/db';
import { deleteEvent, getEvents, saveEvent, translateAdminTextsAction } from '@/lib/actions';
import AdminBilingualTranslateBar from '@/components/AdminBilingualTranslateBar';
import CoordinatorContentPanel from '@/components/CoordinatorContentPanel';
import {
  EVENT_REGISTRATION_TYPE_LABELS,
  EVENT_REGISTRATION_TYPES,
} from '@/lib/event-registration-fields';
import { normalizeEventEndDate } from '@/lib/event-dates';
import { parseEventImages, serializeEventImages } from '@/lib/event-images';
import {
  applyTranslatedFields,
  collectTextsForTranslation,
  type BilingualTextField,
  type TranslateDirection,
} from '@/lib/admin-translate';

async function clientUploadAsset(fileName: string, dataOrFile: string | File): Promise<{ success: boolean; url?: string; error?: string }> {
  try {
    let file: File;
    if (dataOrFile instanceof File) {
      file = dataOrFile;
    } else {
      const response = await fetch(dataOrFile);
      const blob = await response.blob();
      file = new File([blob], fileName, { type: blob.type });
    }

    const formData = new FormData();
    formData.append('file', file);

    const res = await fetch('/api/upload', { method: 'POST', body: formData });
    if (!res.ok) {
      const errData = await res.json().catch(() => ({}));
      return { success: false, error: errData.error || `Server responded with ${res.status}` };
    }

    return await res.json();
  } catch (err: any) {
    return { success: false, error: err.message || 'Network error occurred' };
  }
}

interface CoordinatorEventsManagerProps {
  open: boolean;
  isLight: boolean;
  onClose: () => void;
}

export default function CoordinatorEventsManager({ open, isLight, onClose }: CoordinatorEventsManagerProps) {
  const { language, t } = useLanguage();
  const isHt = language === 'fr_ht';

  const [events, setEvents] = useState<EventRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [direction, setDirection] = useState<TranslateDirection>('auto');
  const [isTranslating, setIsTranslating] = useState(false);
  const [images, setImages] = useState<string[]>([]);
  const [imagesUploading, setImagesUploading] = useState(false);
  const [isDraggingImages, setIsDraggingImages] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [form, setForm] = useState({
    title_kreyol: '',
    title_english: '',
    date: '',
    end_date: '',
    time: '',
    location_kreyol: '',
    location_english: '',
    description_kreyol: '',
    description_english: '',
    registration_type: 'general',
    notification_emails: '',
  });

  const fieldClass = `w-full rounded-xl border px-3 py-2 text-xs focus:outline-none focus:border-amber-500 ${
    isLight ? 'bg-white border-slate-200 text-slate-900' : 'bg-slate-950 border-slate-800 text-white'
  }`;

  const load = useCallback(async () => {
    setLoading(true);
    try {
      setEvents(await getEvents());
    } catch {
      setMessage({ type: 'error', text: t.coordinatorLoadError });
    } finally {
      setLoading(false);
    }
  }, [t.coordinatorLoadError]);

  useEffect(() => {
    if (open) {
      load();
      setEditingId(null);
      setMessage(null);
    }
  }, [open, load]);

  const startCreate = () => {
    setEditingId(0);
    setImages([]);
    setForm({
      title_kreyol: '',
      title_english: '',
      date: new Date().toISOString().split('T')[0],
      end_date: '',
      time: '',
      location_kreyol: '',
      location_english: '',
      description_kreyol: '',
      description_english: '',
      registration_type: 'general',
      notification_emails: '',
    });
  };

  const startEdit = (event: EventRecord) => {
    setEditingId(event.id);
    setImages(parseEventImages(event.images_json));
    setForm({
      title_kreyol: event.title_kreyol,
      title_english: event.title_english,
      date: event.date,
      end_date: event.end_date || '',
      time: event.time,
      location_kreyol: event.location_kreyol,
      location_english: event.location_english,
      description_kreyol: event.description_kreyol,
      description_english: event.description_english,
      registration_type: event.registration_type || 'general',
      notification_emails: event.notification_emails || '',
    });
  };

  const handleImageFiles = useCallback((files: FileList | File[] | null) => {
    if (!files?.length) return;

    const fileArray = Array.from(files).filter(
      (file) => file.type.startsWith('image/') || /\.(jpe?g|png|gif|webp|bmp)$/i.test(file.name)
    );
    if (!fileArray.length) return;

    setImagesUploading(true);
    let loaded = 0;

    fileArray.forEach((file) => {
      const reader = new FileReader();
      reader.onload = (loadEvent) => {
        if (loadEvent.target?.result) {
          setImages((prev) => [...prev, loadEvent.target!.result as string]);
        }
        loaded += 1;
        if (loaded === fileArray.length) {
          setImagesUploading(false);
        }
      };
      reader.readAsDataURL(file);
    });
  }, []);

  useEffect(() => {
    if (!open || editingId === null) return;

    const onPaste = (e: ClipboardEvent) => {
      const imageFiles: File[] = [];
      for (const item of e.clipboardData?.items ?? []) {
        if (item.type.startsWith('image/')) {
          const file = item.getAsFile();
          if (file) imageFiles.push(file);
        }
      }
      if (imageFiles.length === 0) return;

      e.preventDefault();
      handleImageFiles(imageFiles);
    };

    window.addEventListener('paste', onPaste);
    return () => window.removeEventListener('paste', onPaste);
  }, [open, editingId, handleImageFiles]);

  const handlePasteImages = (e: React.ClipboardEvent) => {
    const imageFiles: File[] = [];
    for (let i = 0; i < e.clipboardData.items.length; i++) {
      const item = e.clipboardData.items[i];
      if (item.type.startsWith('image/')) {
        const file = item.getAsFile();
        if (file) imageFiles.push(file);
      }
    }
    if (imageFiles.length > 0) {
      e.preventDefault();
      e.stopPropagation();
      handleImageFiles(imageFiles);
    }
  };

  const handleDropImages = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDraggingImages(false);
    if (e.dataTransfer.files?.length) {
      handleImageFiles(e.dataTransfer.files);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage(null);

    const normalizedEndDate = normalizeEventEndDate(form.date, form.end_date);
    if (form.end_date.trim() && !normalizedEndDate) {
      setMessage({
        type: 'error',
        text: isHt ? 'La date de fin doit être postérieure à la date de début.' : 'End date must be after the start date.',
      });
      return;
    }

    const finalImages: string[] = [];
    for (const image of images) {
      if (image.startsWith('data:')) {
        const uploadRes = await clientUploadAsset(`event_${Date.now()}_${Math.random().toString(36).slice(2, 8)}.jpg`, image);
        if (!uploadRes.success || !uploadRes.url) {
          setMessage({ type: 'error', text: uploadRes.error || (isHt ? 'Échec du téléversement.' : 'Image upload failed.') });
          return;
        }
        finalImages.push(uploadRes.url);
      } else {
        finalImages.push(image);
      }
    }

    const res = await saveEvent(editingId === 0 ? null : editingId, {
      ...form,
      end_date: normalizedEndDate,
      images_json: serializeEventImages(finalImages),
    });
    if (!res.success) {
      setMessage({ type: 'error', text: res.error || t.coordinatorSaveError });
      return;
    }
    setMessage({ type: 'success', text: isHt ? 'Événement enregistré.' : 'Event saved.' });
    setEditingId(null);
    await load();
  };

  const handleDelete = async (id: number) => {
    if (!confirm(isHt ? 'Supprimer cet événement ?' : 'Delete this event?')) return;
    const res = await deleteEvent(id);
    if (!res.success) {
      setMessage({ type: 'error', text: res.error || t.coordinatorDeleteError });
      return;
    }
    if (editingId === id) setEditingId(null);
    await load();
  };

  const handleTranslate = async () => {
    const fields: BilingualTextField[] = [
      { id: 'title', kreyol: form.title_kreyol, english: form.title_english },
      { id: 'location', kreyol: form.location_kreyol, english: form.location_english },
      { id: 'description', kreyol: form.description_kreyol, english: form.description_english },
    ];
    const payload = collectTextsForTranslation(fields, direction, language);
    if (!payload) {
      setMessage({ type: 'error', text: isHt ? 'Saisissez du texte source.' : 'Enter source-language text.' });
      return;
    }
    setIsTranslating(true);
    try {
      const res = await translateAdminTextsAction(payload.items, payload.fromLang, 'church event', 'events');
      if (!res.success || !res.translations) {
        setMessage({ type: 'error', text: res.error || (isHt ? 'Échec de la traduction.' : 'Translation failed.') });
        return;
      }
      const updated = applyTranslatedFields(fields, res.translations, payload.fromLang);
      const byId = Object.fromEntries(updated.map((f) => [f.id, f]));
      setForm((prev) => ({
        ...prev,
        title_kreyol: byId.title?.kreyol ?? prev.title_kreyol,
        title_english: byId.title?.english ?? prev.title_english,
        location_kreyol: byId.location?.kreyol ?? prev.location_kreyol,
        location_english: byId.location?.english ?? prev.location_english,
        description_kreyol: byId.description?.kreyol ?? prev.description_kreyol,
        description_english: byId.description?.english ?? prev.description_english,
      }));
    } finally {
      setIsTranslating(false);
    }
  };

  return (
    <CoordinatorContentPanel
      open={open}
      title={t.coordinatorManageEvents}
      subtitle={t.coordinatorContentModalHint}
      isLight={isLight}
      onClose={onClose}
    >
      <div className="space-y-4">
        {editingId === null ? (
          <div className="flex justify-end">
            <button type="button" onClick={startCreate} className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 text-xs font-bold cursor-pointer">
              <Plus className="w-4 h-4" />
              {t.btnAddNew}
            </button>
          </div>
        ) : (
          <form onSubmit={handleSave} className={`p-4 rounded-2xl border space-y-4 ${isLight ? 'bg-slate-50 border-slate-200' : 'bg-slate-900/50 border-slate-800'}`}>
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold flex items-center gap-2">
                <Edit className="w-4 h-4 text-amber-500" />
                {editingId === 0 ? (isHt ? 'Nouvel événement' : 'New event') : (isHt ? 'Modifier l’événement' : 'Edit event')}
              </h3>
              <button type="button" onClick={() => setEditingId(null)} className="text-xs font-bold text-slate-500 cursor-pointer">{t.btnCancel}</button>
            </div>

            <AdminBilingualTranslateBar language={language} direction={direction} onDirectionChange={setDirection} onTranslate={handleTranslate} isTranslating={isTranslating} />

            <div className="grid md:grid-cols-2 gap-3">
              <div>
                <label className="block text-[10px] font-bold uppercase text-slate-500 mb-1">{isHt ? 'Titre (français)' : 'Title (French)'}</label>
                <input type="text" value={form.title_kreyol} onChange={(e) => setForm((p) => ({ ...p, title_kreyol: e.target.value }))} className={fieldClass} required />
              </div>
              <div>
                <label className="block text-[10px] font-bold uppercase text-slate-500 mb-1">{isHt ? 'Titre (anglais)' : 'Title (English)'}</label>
                <input type="text" value={form.title_english} onChange={(e) => setForm((p) => ({ ...p, title_english: e.target.value }))} className={fieldClass} required />
              </div>
            </div>

            <div className="grid md:grid-cols-3 gap-3">
              <div>
                <label className="block text-[10px] font-bold uppercase text-slate-500 mb-1">{isHt ? 'Date de début' : 'Start date'}</label>
                <input type="date" value={form.date} onChange={(e) => setForm((p) => ({ ...p, date: e.target.value }))} className={fieldClass} required />
              </div>
              <div>
                <label className="block text-[10px] font-bold uppercase text-slate-500 mb-1">{isHt ? 'Date de fin' : 'End date'}</label>
                <input type="date" value={form.end_date} min={form.date || undefined} onChange={(e) => setForm((p) => ({ ...p, end_date: e.target.value }))} className={fieldClass} />
              </div>
              <div>
                <label className="block text-[10px] font-bold uppercase text-slate-500 mb-1">{isHt ? 'Heure' : 'Time'}</label>
                <input type="text" value={form.time} onChange={(e) => setForm((p) => ({ ...p, time: e.target.value }))} className={fieldClass} required />
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-3">
              <div>
                <label className="block text-[10px] font-bold uppercase text-slate-500 mb-1">{isHt ? 'Lieu (français)' : 'Location (French)'}</label>
                <input type="text" value={form.location_kreyol} onChange={(e) => setForm((p) => ({ ...p, location_kreyol: e.target.value }))} className={fieldClass} required />
              </div>
              <div>
                <label className="block text-[10px] font-bold uppercase text-slate-500 mb-1">{isHt ? 'Lieu (anglais)' : 'Location (English)'}</label>
                <input type="text" value={form.location_english} onChange={(e) => setForm((p) => ({ ...p, location_english: e.target.value }))} className={fieldClass} required />
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-3">
              <div>
                <label className="block text-[10px] font-bold uppercase text-slate-500 mb-1">{isHt ? 'Description (français)' : 'Description (French)'}</label>
                <textarea rows={4} value={form.description_kreyol} onChange={(e) => setForm((p) => ({ ...p, description_kreyol: e.target.value }))} className={fieldClass} required />
              </div>
              <div>
                <label className="block text-[10px] font-bold uppercase text-slate-500 mb-1">{isHt ? 'Description (anglais)' : 'Description (English)'}</label>
                <textarea rows={4} value={form.description_english} onChange={(e) => setForm((p) => ({ ...p, description_english: e.target.value }))} className={fieldClass} required />
              </div>
            </div>

            <div>
              <label className="block text-[10px] font-bold uppercase text-slate-500 mb-1">{isHt ? 'Type d’inscription' : 'Registration form type'}</label>
              <select value={form.registration_type} onChange={(e) => setForm((p) => ({ ...p, registration_type: e.target.value }))} className={fieldClass}>
                {EVENT_REGISTRATION_TYPES.map((type) => {
                  const labels = EVENT_REGISTRATION_TYPE_LABELS[type];
                  return (
                    <option key={type} value={type}>
                      {isHt ? labels.ht : labels.en}
                    </option>
                  );
                })}
              </select>
            </div>

            <div>
              <label className="block text-[10px] font-bold uppercase text-slate-500 mb-1">{isHt ? 'Coordinateurs de la liste d’inscrits' : 'Signup list coordinators'}</label>
              <textarea
                rows={2}
                value={form.notification_emails}
                onChange={(e) => setForm((p) => ({ ...p, notification_emails: e.target.value }))}
                className={`${fieldClass} font-mono`}
                placeholder={isHt ? 'coordinateur@eglise.org' : 'coordinator@church.org'}
              />
              <p className="text-[10px] text-slate-500 mt-1">{t.coordinatorRecipientHint}</p>
            </div>

            <div>
              <label className="block text-[10px] font-bold uppercase text-slate-500 mb-1.5">
                {isHt ? 'Photos de l’événement' : 'Event Photos'}
              </label>
              <p className="text-[10px] text-slate-500 mb-3">
                {isHt
                  ? 'Ajoutez une ou plusieurs images (JPG/PNG). Elles s’afficheront sur la carte de l’événement.'
                  : 'Add one or more images (JPG/PNG). They will appear on the event card.'}
              </p>

              <label
                tabIndex={0}
                onPaste={handlePasteImages}
                onDragOver={(e) => { e.preventDefault(); setIsDraggingImages(true); }}
                onDragLeave={() => setIsDraggingImages(false)}
                onDrop={handleDropImages}
                className={`border-2 border-dashed rounded-xl p-5 flex flex-col items-center justify-center gap-2 cursor-pointer transition-all outline-none focus:border-amber-500/70 ${
                  isDraggingImages
                    ? 'border-amber-500 bg-amber-500/10 scale-[1.01]'
                    : isLight
                      ? 'border-slate-300 hover:border-amber-500/50 bg-slate-50'
                      : 'border-slate-800 hover:border-amber-500/50 bg-slate-950/40'
                }`}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  multiple
                  tabIndex={-1}
                  className="sr-only"
                  onChange={(e) => {
                    handleImageFiles(e.target.files);
                    e.target.value = '';
                  }}
                  onClick={(e) => e.stopPropagation()}
                />
                <UploadCloud className={`w-7 h-7 ${isLight ? 'text-slate-400' : 'text-slate-500'}`} />
                <span className={`text-xs font-bold text-center ${isLight ? 'text-slate-600' : 'text-slate-300'}`}>
                  {isHt ? 'Choisir, glisser ou coller des photos' : 'Choose, drag, or paste event photos'}
                </span>
                {imagesUploading && (
                  <span className="text-[10px] text-amber-500 font-semibold">
                    {isHt ? 'Chargement…' : 'Uploading…'}
                  </span>
                )}
              </label>

              {images.length > 0 && (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-4">
                  {images.map((image, index) => (
                    <div key={`${image.slice(0, 24)}-${index}`} className={`relative rounded-lg overflow-hidden border ${isLight ? 'border-slate-200 bg-white' : 'border-slate-800 bg-slate-900'}`}>
                      <img src={image} alt="" className="w-full h-28 object-cover" />
                      <button
                        type="button"
                        onClick={() => setImages((prev) => prev.filter((_, i) => i !== index))}
                        className="absolute top-2 right-2 p-1 rounded bg-slate-950/80 text-rose-400 hover:text-rose-300 cursor-pointer"
                        aria-label={isHt ? 'Supprimer la photo' : 'Remove photo'}
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="flex justify-end">
              <button type="submit" className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 text-xs font-bold cursor-pointer">
                <Save className="w-4 h-4" />
                {t.btnSave}
              </button>
            </div>
          </form>
        )}

        {loading ? (
          <p className="text-sm text-slate-500">{t.coordinatorLoading}</p>
        ) : editingId === null ? (
          <div className="space-y-2">
            {events.length === 0 ? (
              <p className="text-sm text-slate-500 text-center py-8">{isHt ? 'Aucun événement.' : 'No events yet.'}</p>
            ) : events.map((event) => (
              <div key={event.id} className={`p-4 rounded-2xl border flex justify-between gap-3 ${isLight ? 'border-slate-200 bg-white' : 'border-slate-800 bg-slate-900/40'}`}>
                <div>
                  <p className="text-xs font-bold text-amber-600 flex items-center gap-1"><Calendar className="w-3.5 h-3.5" /> {event.date}{event.end_date ? ` – ${event.end_date}` : ''} · {event.time}</p>
                  <p className="text-sm font-semibold mt-1">{isHt ? event.title_kreyol : event.title_english}</p>
                </div>
                <div className="flex gap-1 shrink-0">
                  <button type="button" onClick={() => startEdit(event)} className="p-1.5 text-amber-600 cursor-pointer"><Edit className="w-3.5 h-3.5" /></button>
                  <button type="button" onClick={() => handleDelete(event.id)} className="p-1.5 text-rose-500 cursor-pointer"><Trash2 className="w-3.5 h-3.5" /></button>
                </div>
              </div>
            ))}
          </div>
        ) : null}

        {message && <p className={`text-xs ${message.type === 'success' ? 'text-emerald-500' : 'text-rose-500'}`}>{message.text}</p>}
      </div>
    </CoordinatorContentPanel>
  );
}
