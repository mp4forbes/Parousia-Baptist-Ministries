'use client';

import React, { useCallback, useEffect, useState } from 'react';
import { BookOpen, Check, Edit, Trash2, Wand2 } from 'lucide-react';
import { useLanguage } from '@/lib/LanguageContext';
import { DailyDevotional } from '@/lib/db';
import {
  approveDailyDevotional,
  deleteDailyDevotional,
  generateDevotionalAction,
  getDevotionals,
  getSettings,
  saveDailyDevotional,
  translateAdminTextsAction,
  updateDevotionalCoordinatorSettings,
} from '@/lib/actions';
import AdminBilingualTranslateBar from '@/components/AdminBilingualTranslateBar';
import CoordinatorContentPanel from '@/components/CoordinatorContentPanel';
import {
  applyTranslatedFields,
  collectTextsForTranslation,
  type BilingualTextField,
  type TranslateDirection,
} from '@/lib/admin-translate';

interface CoordinatorDevotionalManagerProps {
  open: boolean;
  isLight: boolean;
  onClose: () => void;
}

export default function CoordinatorDevotionalManager({ open, isLight, onClose }: CoordinatorDevotionalManagerProps) {
  const { language, t } = useLanguage();
  const isHt = language === 'fr_ht';

  const [list, setList] = useState<DailyDevotional[]>([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [editingId, setEditingId] = useState<number | null>(null);
  const [autoPublish, setAutoPublish] = useState('false');
  const [themeEnabled, setThemeEnabled] = useState(false);
  const [themePrompt, setThemePrompt] = useState('');
  const [bilingualTranslateDirection, setBilingualTranslateDirection] = useState<TranslateDirection>('auto');
  const [isTranslating, setIsTranslating] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [form, setForm] = useState({
    verse_ref_english: '',
    verse_ref_kreyol: '',
    verse_text_english: '',
    verse_text_kreyol: '',
    lesson_english: '',
    lesson_kreyol: '',
    status: 'pending' as 'pending' | 'approved',
  });

  const fieldClass = `w-full rounded-xl border px-3 py-2 text-xs focus:outline-none focus:border-amber-500 ${
    isLight ? 'bg-white border-slate-200 text-slate-900' : 'bg-slate-950 border-slate-800 text-white'
  }`;

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [devotionals, settings] = await Promise.all([getDevotionals(), getSettings()]);
      setList(devotionals);
      setAutoPublish(settings.devotional_auto_publish || 'false');
      setThemeEnabled(settings.devotional_theme_enabled === 'true');
      setThemePrompt(settings.devotional_theme && settings.devotional_theme !== 'none' ? settings.devotional_theme : '');
    } catch {
      setMessage({ type: 'error', text: t.coordinatorLoadError });
    } finally {
      setLoading(false);
    }
  }, [t.coordinatorLoadError]);

  useEffect(() => {
    if (open) {
      loadData();
      setEditingId(null);
      setMessage(null);
    }
  }, [open, loadData]);

  const startEdit = (devotional: DailyDevotional) => {
    setEditingId(devotional.id);
    setForm({
      verse_ref_english: devotional.verse_ref_english,
      verse_ref_kreyol: devotional.verse_ref_kreyol,
      verse_text_english: devotional.verse_text_english,
      verse_text_kreyol: devotional.verse_text_kreyol,
      lesson_english: devotional.lesson_english,
      lesson_kreyol: devotional.lesson_kreyol,
      status: devotional.status,
    });
  };

  const handleToggleAutoPublish = async (checked: boolean) => {
    const val = checked ? 'true' : 'false';
    setAutoPublish(val);
    const res = await updateDevotionalCoordinatorSettings({ devotional_auto_publish: val });
    if (!res.success) {
      setMessage({ type: 'error', text: res.error || t.coordinatorSaveError });
      setAutoPublish(checked ? 'false' : 'true');
    }
  };

  const handleGenerate = async () => {
    if (themeEnabled && !themePrompt.trim()) {
      setMessage({ type: 'error', text: t.devotionalThemeWarning });
      return;
    }

    const today = new Date();
    const dateStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
    const trimmedPrompt = themePrompt.trim();

    setGenerating(true);
    setMessage(null);
    try {
      await updateDevotionalCoordinatorSettings({
        devotional_theme_enabled: themeEnabled ? 'true' : 'false',
        devotional_theme: themeEnabled ? trimmedPrompt : 'none',
      });
      const res = await generateDevotionalAction(dateStr, {
        useTheme: themeEnabled,
        themePrompt: themeEnabled ? trimmedPrompt : undefined,
      });
      if (!res.success || !res.devotional) {
        setMessage({ type: 'error', text: res.error || (isHt ? 'Échec de la génération.' : 'Generation failed.') });
        return;
      }
      setList((prev) => [res.devotional!, ...prev.filter((d) => d.date !== dateStr)]);
      setMessage({ type: 'success', text: isHt ? 'Nouvelle dévotion générée.' : 'New devotional generated.' });
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message || (isHt ? 'Erreur de génération.' : 'Generation error.') });
    } finally {
      setGenerating(false);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (editingId === null) return;
    setMessage(null);
    const res = await saveDailyDevotional(
      editingId,
      form.verse_ref_english,
      form.verse_ref_kreyol,
      form.verse_text_english,
      form.verse_text_kreyol,
      form.lesson_english,
      form.lesson_kreyol,
      form.status
    );
    if (!res.success) {
      setMessage({ type: 'error', text: res.error || t.coordinatorSaveError });
      return;
    }
    setList((prev) => prev.map((d) => (d.id === editingId ? { ...d, ...form } : d)));
    setEditingId(null);
    setMessage({ type: 'success', text: isHt ? 'Dévotion enregistrée.' : 'Devotional saved.' });
  };

  const handleApprove = async (id: number) => {
    const res = await approveDailyDevotional(id);
    if (!res.success) {
      setMessage({ type: 'error', text: res.error || t.coordinatorSaveError });
      return;
    }
    setList((prev) => prev.map((d) => (d.id === id ? { ...d, status: 'approved' } : d)));
  };

  const handleDelete = async (id: number) => {
    if (!confirm(isHt ? 'Supprimer cette dévotion ?' : 'Delete this devotional?')) return;
    const res = await deleteDailyDevotional(id);
    if (!res.success) {
      setMessage({ type: 'error', text: res.error || t.coordinatorDeleteError });
      return;
    }
    setList((prev) => prev.filter((d) => d.id !== id));
    if (editingId === id) setEditingId(null);
  };

  const handleTranslate = async () => {
    const fields: BilingualTextField[] = [
      { id: 'verse_ref', kreyol: form.verse_ref_kreyol, english: form.verse_ref_english },
      { id: 'verse_text', kreyol: form.verse_text_kreyol, english: form.verse_text_english },
      { id: 'lesson', kreyol: form.lesson_kreyol, english: form.lesson_english },
    ];
    const payload = collectTextsForTranslation(fields, bilingualTranslateDirection, language);
    if (!payload) {
      setMessage({
        type: 'error',
        text: isHt ? 'Veuillez saisir du texte dans la langue source.' : 'Please enter source-language text.',
      });
      return;
    }

    setIsTranslating(true);
    try {
      const res = await translateAdminTextsAction(payload.items, payload.fromLang, 'daily devotional', 'devotional');
      if (!res.success || !res.translations) {
        setMessage({ type: 'error', text: res.error || (isHt ? 'Échec de la traduction.' : 'Translation failed.') });
        return;
      }
      const updated = applyTranslatedFields(fields, res.translations, payload.fromLang);
      const byId = Object.fromEntries(updated.map((field) => [field.id, field]));
      setForm((prev) => ({
        ...prev,
        verse_ref_kreyol: byId.verse_ref?.kreyol ?? prev.verse_ref_kreyol,
        verse_ref_english: byId.verse_ref?.english ?? prev.verse_ref_english,
        verse_text_kreyol: byId.verse_text?.kreyol ?? prev.verse_text_kreyol,
        verse_text_english: byId.verse_text?.english ?? prev.verse_text_english,
        lesson_kreyol: byId.lesson?.kreyol ?? prev.lesson_kreyol,
        lesson_english: byId.lesson?.english ?? prev.lesson_english,
      }));
      setMessage({ type: 'success', text: isHt ? 'Traduction terminée.' : 'Translation completed.' });
    } finally {
      setIsTranslating(false);
    }
  };

  const filtered = list.filter((d) => {
    const term = search.toLowerCase();
    return (
      (d.date || '').toLowerCase().includes(term)
      || (d.verse_ref_english || '').toLowerCase().includes(term)
      || (d.verse_ref_kreyol || '').toLowerCase().includes(term)
    );
  });

  return (
    <CoordinatorContentPanel
      open={open}
      title={t.coordinatorManageDevotional}
      subtitle={t.coordinatorContentModalHint}
      isLight={isLight}
      onClose={onClose}
    >
      <div className="space-y-4">
        <div className={`p-4 rounded-2xl border space-y-3 ${isLight ? 'bg-slate-50 border-slate-200' : 'bg-slate-900/50 border-slate-800'}`}>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <label className="flex items-center gap-2 cursor-pointer text-xs font-semibold">
              <input
                type="checkbox"
                checked={autoPublish === 'true'}
                onChange={(e) => handleToggleAutoPublish(e.target.checked)}
                className="rounded border-slate-600 text-amber-500"
              />
              {t.devotionalAutoPublish}
            </label>
            <button
              type="button"
              disabled={generating}
              onClick={handleGenerate}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 disabled:opacity-60 text-slate-950 text-xs font-bold cursor-pointer"
            >
              <Wand2 className="w-3.5 h-3.5" />
              {generating ? t.coordinatorLoading : t.devotionalBtnGenerate}
            </button>
          </div>

          <div className="flex flex-col lg:flex-row lg:items-end gap-3">
            <label className="flex items-center gap-2 cursor-pointer text-xs font-semibold shrink-0">
              <input
                type="checkbox"
                checked={themeEnabled}
                onChange={(e) => setThemeEnabled(e.target.checked)}
                className="rounded border-slate-600 text-amber-500"
              />
              {t.devotionalThemeUse}
            </label>
            <div className="flex-1">
              <input
                type="text"
                value={themePrompt}
                onChange={(e) => setThemePrompt(e.target.value)}
                disabled={!themeEnabled}
                placeholder={t.devotionalThemePlaceholder}
                className={`${fieldClass} ${!themeEnabled ? 'opacity-60' : ''}`}
              />
            </div>
          </div>
        </div>

        {editingId !== null && (
          <form onSubmit={handleSave} className={`p-4 rounded-2xl border space-y-4 ${isLight ? 'bg-slate-50 border-slate-200' : 'bg-slate-900/50 border-slate-800'}`}>
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold flex items-center gap-2">
                <Edit className="w-4 h-4 text-amber-500" />
                {isHt ? 'Modifier la dévotion' : 'Edit devotional'}
              </h3>
              <button type="button" onClick={() => setEditingId(null)} className="text-xs font-bold text-slate-500 cursor-pointer">
                {t.btnCancel}
              </button>
            </div>

            <AdminBilingualTranslateBar
              language={language}
              direction={bilingualTranslateDirection}
              onDirectionChange={setBilingualTranslateDirection}
              onTranslate={handleTranslate}
              isTranslating={isTranslating}
            />

            <div className="grid md:grid-cols-2 gap-3">
              <div>
                <label className="block text-[10px] font-bold uppercase text-slate-500 mb-1">{t.devotionalVerseRefHt}</label>
                <input type="text" value={form.verse_ref_kreyol} onChange={(e) => setForm((p) => ({ ...p, verse_ref_kreyol: e.target.value }))} className={fieldClass} required />
              </div>
              <div>
                <label className="block text-[10px] font-bold uppercase text-slate-500 mb-1">{t.devotionalVerseRefEn}</label>
                <input type="text" value={form.verse_ref_english} onChange={(e) => setForm((p) => ({ ...p, verse_ref_english: e.target.value }))} className={fieldClass} required />
              </div>
              <div>
                <label className="block text-[10px] font-bold uppercase text-slate-500 mb-1">{t.devotionalVerseTextHt}</label>
                <textarea rows={3} value={form.verse_text_kreyol} onChange={(e) => setForm((p) => ({ ...p, verse_text_kreyol: e.target.value }))} className={fieldClass} required />
              </div>
              <div>
                <label className="block text-[10px] font-bold uppercase text-slate-500 mb-1">{t.devotionalVerseTextEn}</label>
                <textarea rows={3} value={form.verse_text_english} onChange={(e) => setForm((p) => ({ ...p, verse_text_english: e.target.value }))} className={fieldClass} required />
              </div>
              <div>
                <label className="block text-[10px] font-bold uppercase text-slate-500 mb-1">{t.devotionalLessonHt}</label>
                <textarea rows={10} value={form.lesson_kreyol} onChange={(e) => setForm((p) => ({ ...p, lesson_kreyol: e.target.value }))} className={`${fieldClass} whitespace-pre-line`} required />
              </div>
              <div>
                <label className="block text-[10px] font-bold uppercase text-slate-500 mb-1">{t.devotionalLessonEn}</label>
                <textarea rows={10} value={form.lesson_english} onChange={(e) => setForm((p) => ({ ...p, lesson_english: e.target.value }))} className={`${fieldClass} whitespace-pre-line`} required />
              </div>
              <div className="md:col-span-2">
                <label className="block text-[10px] font-bold uppercase text-slate-500 mb-1">{t.devotionalStatus}</label>
                <select value={form.status} onChange={(e) => setForm((p) => ({ ...p, status: e.target.value as 'pending' | 'approved' }))} className={fieldClass}>
                  <option value="pending">{t.devotionalPending}</option>
                  <option value="approved">{t.devotionalApproved}</option>
                </select>
              </div>
            </div>

            <div className="flex justify-end">
              <button type="submit" className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 text-xs font-bold cursor-pointer">
                {t.btnSave}
              </button>
            </div>
          </form>
        )}

        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder={isHt ? 'Rechercher par date ou référence…' : 'Search by date or reference…'}
          className={fieldClass}
        />

        {loading ? (
          <p className="text-sm text-slate-500">{t.coordinatorLoading}</p>
        ) : filtered.length === 0 ? (
          <p className="text-sm text-slate-500 text-center py-8">{isHt ? 'Aucune dévotion trouvée.' : 'No devotionals found.'}</p>
        ) : (
          <div className="space-y-3">
            {filtered.map((d) => (
              <div
                key={d.id}
                className={`p-4 rounded-2xl border ${isLight ? 'border-slate-200 bg-white' : 'border-slate-800 bg-slate-900/40'} ${
                  d.status === 'approved' ? '' : 'border-amber-500/30'
                }`}
              >
                <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs font-bold px-2 py-1 rounded-lg bg-slate-900/10">{d.date}</span>
                    <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full ${
                      d.status === 'approved' ? 'text-emerald-500' : 'text-amber-500'
                    }`}>
                      {d.status === 'approved' ? t.devotionalApproved : t.devotionalPending}
                    </span>
                  </div>
                  <div className="flex items-center gap-1">
                    {d.status === 'pending' && (
                      <button type="button" onClick={() => handleApprove(d.id)} className="px-2 py-1 rounded-lg bg-emerald-500 text-slate-950 text-[10px] font-bold cursor-pointer">
                        <Check className="w-3 h-3 inline" /> {isHt ? 'Approuver' : 'Approve'}
                      </button>
                    )}
                    <button type="button" onClick={() => startEdit(d)} className="p-1.5 rounded-lg text-amber-600 cursor-pointer">
                      <Edit className="w-3.5 h-3.5" />
                    </button>
                    <button type="button" onClick={() => handleDelete(d.id)} className="p-1.5 rounded-lg text-rose-500 cursor-pointer">
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
                <p className="text-xs font-bold text-amber-600">{d.verse_ref_english}</p>
                <p className={`text-xs mt-1 line-clamp-3 ${isLight ? 'text-slate-600' : 'text-slate-400'}`}>{d.lesson_english}</p>
              </div>
            ))}
          </div>
        )}

        {message && (
          <p className={`text-xs ${message.type === 'success' ? 'text-emerald-500' : 'text-rose-500'}`}>{message.text}</p>
        )}
      </div>
    </CoordinatorContentPanel>
  );
}
