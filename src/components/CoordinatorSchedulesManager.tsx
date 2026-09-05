'use client';

import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Edit, Plus, Save, Trash2, UploadCloud } from 'lucide-react';
import { useLanguage } from '@/lib/LanguageContext';
import { ServiceSchedule } from '@/lib/db';
import { deleteServiceSchedule, getServiceSchedules, saveServiceSchedule, translateAdminTextsAction } from '@/lib/actions';
import AdminBilingualTranslateBar from '@/components/AdminBilingualTranslateBar';
import CoordinatorContentPanel from '@/components/CoordinatorContentPanel';
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

interface CoordinatorSchedulesManagerProps {
  open: boolean;
  isLight: boolean;
  onClose: () => void;
}

export default function CoordinatorSchedulesManager({ open, isLight, onClose }: CoordinatorSchedulesManagerProps) {
  const { language, t } = useLanguage();
  const isHt = language === 'fr_ht';

  const [schedules, setSchedules] = useState<ServiceSchedule[]>([]);
  const [loading, setLoading] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [direction, setDirection] = useState<TranslateDirection>('auto');
  const [isTranslating, setIsTranslating] = useState(false);
  const [isDraggingImage, setIsDraggingImage] = useState(false);
  const [imageUploading, setImageUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [form, setForm] = useState({
    day_kreyol: '',
    day_english: '',
    time: '',
    title_kreyol: '',
    title_english: '',
    description_kreyol: '',
    description_english: '',
    image_url: '',
    is_livestreamed: false,
  });

  const fieldClass = `w-full rounded-xl border px-3 py-2 text-xs focus:outline-none focus:border-amber-500 ${
    isLight ? 'bg-white border-slate-200 text-slate-900' : 'bg-slate-950 border-slate-800 text-white'
  }`;

  const load = useCallback(async () => {
    setLoading(true);
    try {
      setSchedules(await getServiceSchedules());
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
    setForm({
      day_kreyol: '',
      day_english: '',
      time: '',
      title_kreyol: '',
      title_english: '',
      description_kreyol: '',
      description_english: '',
      image_url: '',
      is_livestreamed: false,
    });
  };

  const startEdit = (sched: ServiceSchedule) => {
    setEditingId(sched.id);
    setForm({
      day_kreyol: sched.day_kreyol,
      day_english: sched.day_english,
      time: sched.time,
      title_kreyol: sched.title_kreyol,
      title_english: sched.title_english,
      description_kreyol: sched.description_kreyol,
      description_english: sched.description_english,
      image_url: sched.image_url || '',
      is_livestreamed: sched.is_livestreamed === 1,
    });
  };

  const handleScheduleImageFile = useCallback((file: File | undefined) => {
    if (!file) return;
    if (!file.type.startsWith('image/') && !/\.(jpe?g|png|gif|webp|bmp)$/i.test(file.name)) return;

    setImageUploading(true);
    const reader = new FileReader();
    reader.onload = (loadEvent) => {
      if (loadEvent.target?.result) {
        setForm((prev) => ({ ...prev, image_url: loadEvent.target!.result as string }));
      }
      setImageUploading(false);
    };
    reader.onerror = () => setImageUploading(false);
    reader.readAsDataURL(file);
  }, []);

  useEffect(() => {
    if (!open || editingId === null) return;

    const onPaste = (e: ClipboardEvent) => {
      for (const item of e.clipboardData?.items ?? []) {
        if (item.type.startsWith('image/')) {
          const file = item.getAsFile();
          if (file) {
            e.preventDefault();
            handleScheduleImageFile(file);
          }
          break;
        }
      }
    };

    window.addEventListener('paste', onPaste);
    return () => window.removeEventListener('paste', onPaste);
  }, [open, editingId, handleScheduleImageFile]);

  const handlePasteImage = (e: React.ClipboardEvent) => {
    for (let i = 0; i < e.clipboardData.items.length; i++) {
      const item = e.clipboardData.items[i];
      if (item.type.startsWith('image/')) {
        const file = item.getAsFile();
        if (file) {
          e.preventDefault();
          e.stopPropagation();
          handleScheduleImageFile(file);
        }
        break;
      }
    }
  };

  const handleDropImage = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDraggingImage(false);
    if (e.dataTransfer.files?.length) {
      handleScheduleImageFile(e.dataTransfer.files[0]);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage(null);

    let finalImageUrl = form.image_url;
    if (finalImageUrl?.startsWith('data:')) {
      const uploadRes = await clientUploadAsset(`schedule_${Date.now()}.jpg`, finalImageUrl);
      if (!uploadRes.success || !uploadRes.url) {
        setMessage({ type: 'error', text: uploadRes.error || (isHt ? 'Échec du téléversement.' : 'Image upload failed.') });
        return;
      }
      finalImageUrl = uploadRes.url;
    }

    const res = await saveServiceSchedule(editingId === 0 ? null : editingId, {
      ...form,
      image_url: finalImageUrl || undefined,
      is_livestreamed: form.is_livestreamed ? 1 : 0,
    });
    if (!res.success) {
      setMessage({ type: 'error', text: res.error || t.coordinatorSaveError });
      return;
    }
    setMessage({ type: 'success', text: isHt ? 'Horaire enregistré.' : 'Schedule saved.' });
    setEditingId(null);
    await load();
  };

  const handleDelete = async (id: number) => {
    if (!confirm(isHt ? 'Supprimer cet horaire ?' : 'Delete this schedule?')) return;
    const res = await deleteServiceSchedule(id);
    if (!res.success) {
      setMessage({ type: 'error', text: res.error || t.coordinatorDeleteError });
      return;
    }
    if (editingId === id) setEditingId(null);
    await load();
  };

  const handleTranslate = async () => {
    const fields: BilingualTextField[] = [
      { id: 'day', kreyol: form.day_kreyol, english: form.day_english },
      { id: 'title', kreyol: form.title_kreyol, english: form.title_english },
      { id: 'description', kreyol: form.description_kreyol, english: form.description_english },
    ];
    const payload = collectTextsForTranslation(fields, direction, language);
    if (!payload) {
      setMessage({ type: 'error', text: isHt ? 'Saisissez du texte source.' : 'Enter source-language text.' });
      return;
    }
    setIsTranslating(true);
    try {
      const res = await translateAdminTextsAction(payload.items, payload.fromLang, 'service schedule', 'schedules');
      if (!res.success || !res.translations) {
        setMessage({ type: 'error', text: res.error || (isHt ? 'Échec de la traduction.' : 'Translation failed.') });
        return;
      }
      const updated = applyTranslatedFields(fields, res.translations, payload.fromLang);
      const byId = Object.fromEntries(updated.map((f) => [f.id, f]));
      setForm((prev) => ({
        ...prev,
        day_kreyol: byId.day?.kreyol ?? prev.day_kreyol,
        day_english: byId.day?.english ?? prev.day_english,
        title_kreyol: byId.title?.kreyol ?? prev.title_kreyol,
        title_english: byId.title?.english ?? prev.title_english,
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
      title={t.coordinatorManageSchedules}
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
                {editingId === 0 ? (isHt ? 'Nouvel horaire' : 'New schedule') : (isHt ? 'Modifier l’horaire' : 'Edit schedule')}
              </h3>
              <button type="button" onClick={() => setEditingId(null)} className="text-xs font-bold text-slate-500 cursor-pointer">{t.btnCancel}</button>
            </div>

            <AdminBilingualTranslateBar language={language} direction={direction} onDirectionChange={setDirection} onTranslate={handleTranslate} isTranslating={isTranslating} />

            <div className="grid md:grid-cols-3 gap-3">
              <div>
                <label className="block text-[10px] font-bold uppercase text-slate-500 mb-1">{isHt ? 'Jour (français)' : 'Day (French)'}</label>
                <input type="text" value={form.day_kreyol} onChange={(e) => setForm((p) => ({ ...p, day_kreyol: e.target.value }))} className={fieldClass} required />
              </div>
              <div>
                <label className="block text-[10px] font-bold uppercase text-slate-500 mb-1">{isHt ? 'Jour (anglais)' : 'Day (English)'}</label>
                <input type="text" value={form.day_english} onChange={(e) => setForm((p) => ({ ...p, day_english: e.target.value }))} className={fieldClass} required />
              </div>
              <div>
                <label className="block text-[10px] font-bold uppercase text-slate-500 mb-1">{isHt ? 'Heure' : 'Time'}</label>
                <input type="text" value={form.time} onChange={(e) => setForm((p) => ({ ...p, time: e.target.value }))} className={fieldClass} required />
              </div>
            </div>

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

            <div className="grid md:grid-cols-2 gap-3">
              <div>
                <label className="block text-[10px] font-bold uppercase text-slate-500 mb-1">{isHt ? 'Description (français)' : 'Description (French)'}</label>
                <textarea rows={3} value={form.description_kreyol} onChange={(e) => setForm((p) => ({ ...p, description_kreyol: e.target.value }))} className={fieldClass} required />
              </div>
              <div>
                <label className="block text-[10px] font-bold uppercase text-slate-500 mb-1">{isHt ? 'Description (anglais)' : 'Description (English)'}</label>
                <textarea rows={3} value={form.description_english} onChange={(e) => setForm((p) => ({ ...p, description_english: e.target.value }))} className={fieldClass} required />
              </div>
            </div>

            <div className="space-y-2">
              <label className="block text-[10px] font-bold uppercase text-slate-500">
                {isHt ? 'Image de l’horaire des cultes (facultative)' : 'Service Schedule Image (Optional)'}
              </label>

              <label
                tabIndex={0}
                onPaste={handlePasteImage}
                onDragOver={(e) => { e.preventDefault(); setIsDraggingImage(true); }}
                onDragLeave={() => setIsDraggingImage(false)}
                onDrop={handleDropImage}
                className={`relative border-2 border-dashed rounded-xl p-4 flex flex-col items-center justify-center gap-2 cursor-pointer transition-all min-h-[120px] overflow-hidden outline-none focus:border-amber-500/70 ${
                  isDraggingImage
                    ? 'border-amber-500 bg-amber-500/10 scale-[1.01]'
                    : isLight
                      ? 'border-slate-300 hover:border-amber-500/50 bg-slate-50'
                      : 'border-slate-800 hover:border-amber-500/50 bg-slate-900/50'
                }`}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  tabIndex={-1}
                  className="sr-only"
                  onChange={(e) => {
                    handleScheduleImageFile(e.target.files?.[0]);
                    e.target.value = '';
                  }}
                  onClick={(e) => e.stopPropagation()}
                />

                {form.image_url ? (
                  <div className="flex items-center gap-4 w-full">
                    <div className={`w-16 h-16 rounded-lg border overflow-hidden shrink-0 ${isLight ? 'bg-white border-slate-200' : 'bg-slate-950 border-slate-800'}`}>
                      <img src={form.image_url} alt="" className="w-full h-full object-cover" />
                    </div>
                    <div className="flex-1 text-left min-w-0">
                      <span className={`text-xs font-bold block truncate ${isLight ? 'text-slate-700' : 'text-slate-200'}`}>
                        {isHt ? 'Image active' : 'Active image'}
                      </span>
                      <span className={`text-[10px] mt-1 block ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
                        {isHt
                          ? 'Cliquez pour modifier, glissez ou collez une autre image'
                          : 'Click to change, drag another image, or paste here'}
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        setForm((p) => ({ ...p, image_url: '' }));
                      }}
                      className={`p-1.5 rounded-lg border shrink-0 cursor-pointer ${isLight ? 'border-slate-200 hover:border-rose-300 text-slate-500 hover:text-rose-500' : 'border-slate-800 hover:border-rose-900 text-slate-400 hover:text-rose-400'}`}
                      aria-label={isHt ? 'Supprimer l’image' : 'Remove image'}
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ) : (
                  <div className="flex flex-col items-center gap-1.5">
                    <UploadCloud className={`w-7 h-7 ${isLight ? 'text-slate-400' : 'text-slate-500'}`} />
                    <span className={`text-xs font-bold text-center ${isLight ? 'text-slate-600' : 'text-slate-300'}`}>
                      {isHt ? 'Choisir, glisser ou coller une image' : 'Browse, Drag, or Paste an Image'}
                    </span>
                    <span className={`text-[10px] text-center ${isLight ? 'text-slate-500' : 'text-slate-500'}`}>
                      {isHt ? 'Formats PNG et JPG acceptés' : 'Supports PNG, JPG (Will be auto-compressed)'}
                    </span>
                    {imageUploading && (
                      <span className="text-[10px] text-amber-500 font-semibold">
                        {isHt ? 'Chargement…' : 'Loading…'}
                      </span>
                    )}
                  </div>
                )}
              </label>

              <div>
                <label className="block text-[9px] font-bold uppercase text-slate-500 mb-1">
                  {isHt ? 'URL directe de l’image (facultative)' : 'Direct URL Input (Optional)'}
                </label>
                <input
                  type="text"
                  value={form.image_url}
                  onChange={(e) => setForm((p) => ({ ...p, image_url: e.target.value }))}
                  className={`${fieldClass} font-mono text-[10px]`}
                  placeholder={isHt ? 'Ou collez l’URL d’une image ici…' : 'Or paste any image URL here…'}
                />
              </div>
            </div>

            <label className="flex items-center gap-2 text-xs font-semibold cursor-pointer">
              <input type="checkbox" checked={form.is_livestreamed} onChange={(e) => setForm((p) => ({ ...p, is_livestreamed: e.target.checked }))} className="rounded border-slate-600 text-amber-500" />
              {isHt ? 'Diffusion en direct' : 'Live stream'}
            </label>

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
            {schedules.length === 0 ? (
              <p className="text-sm text-slate-500 text-center py-8">{isHt ? 'Aucun horaire.' : 'No schedules yet.'}</p>
            ) : schedules.map((sched) => (
              <div key={sched.id} className={`p-4 rounded-2xl border flex justify-between gap-3 ${isLight ? 'border-slate-200 bg-white' : 'border-slate-800 bg-slate-900/40'}`}>
                <div>
                  <p className="text-xs font-bold text-amber-600">{sched.day_english} · {sched.time}</p>
                  <p className="text-sm font-semibold mt-1">{isHt ? sched.title_kreyol : sched.title_english}</p>
                </div>
                <div className="flex gap-1 shrink-0">
                  <button type="button" onClick={() => startEdit(sched)} className="p-1.5 text-amber-600 cursor-pointer"><Edit className="w-3.5 h-3.5" /></button>
                  <button type="button" onClick={() => handleDelete(sched.id)} className="p-1.5 text-rose-500 cursor-pointer"><Trash2 className="w-3.5 h-3.5" /></button>
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
