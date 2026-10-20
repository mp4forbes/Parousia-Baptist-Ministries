'use client';

import React, { useCallback, useEffect, useState } from 'react';
import { Edit, Languages, RefreshCw, Save, Trash2, Video } from 'lucide-react';
import { useLanguage } from '@/lib/LanguageContext';
import { EventRecord, Sermon } from '@/lib/db';
import {
  deleteSermon,
  getEvents,
  getSettings,
  getSermons,
  saveSermon,
  bulkTranslateSermonArchivesAction,
  syncSermonsFromYoutube,
  translateAdminTextsAction,
  updateLiveArchivesSettings,
} from '@/lib/actions';
import AdminBilingualTranslateBar from '@/components/AdminBilingualTranslateBar';
import CoordinatorContentPanel from '@/components/CoordinatorContentPanel';
import {
  applyTranslatedFields,
  bilingualItemsForApi,
  prepareBilingualTranslation,
  type BilingualTextField,
  type TranslateDirection,
} from '@/lib/admin-translate';
import { getYouTubeThumbnailUrl } from '@/lib/youtube';

interface CoordinatorLiveArchivesManagerProps {
  open: boolean;
  isLight: boolean;
  onClose: () => void;
}

export default function CoordinatorLiveArchivesManager({
  open,
  isLight,
  onClose,
}: CoordinatorLiveArchivesManagerProps) {
  const { language, t } = useLanguage();
  const isHt = language === 'fr_ht';

  const [sermons, setSermons] = useState<Sermon[]>([]);
  const [events, setEvents] = useState<EventRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [isBulkTranslating, setIsBulkTranslating] = useState(false);
  const [isSavingLive, setIsSavingLive] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [direction, setDirection] = useState<TranslateDirection>('auto');
  const [isTranslating, setIsTranslating] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const [liveActive, setLiveActive] = useState('false');
  const [liveUrl, setLiveUrl] = useState('');
  const [ytChannelUrl, setYtChannelUrl] = useState('');
  const [liveStreamEventId, setLiveStreamEventId] = useState('default');
  const [customThumbUrl, setCustomThumbUrl] = useState('');

  const [sermTitleHt, setSermTitleHt] = useState('');
  const [sermTitleEn, setSermTitleEn] = useState('');
  const [sermDate, setSermDate] = useState('');
  const [sermSpeaker, setSermSpeaker] = useState('');
  const [sermYoutubeId, setSermYoutubeId] = useState('');
  const [sermDescHt, setSermDescHt] = useState('');
  const [sermDescEn, setSermDescEn] = useState('');

  const fieldClass = `w-full rounded-xl border px-3 py-2 text-xs focus:outline-none focus:border-amber-500 ${
    isLight ? 'bg-white border-slate-200 text-slate-900' : 'bg-slate-950 border-slate-800 text-white'
  }`;

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [sermonRows, eventRows, settings] = await Promise.all([getSermons(), getEvents(), getSettings()]);
      setSermons(sermonRows);
      setEvents(eventRows);
      setLiveActive(settings.live_stream_active || 'false');
      setLiveUrl(settings.live_stream_url || '');
      setYtChannelUrl(settings.youtube_channel_url || '');
      setLiveStreamEventId(settings.live_stream_event_id || 'default');
      setCustomThumbUrl(settings.custom_live_event_thumbnail_url || '');
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

  const resetSermonForm = () => {
    setEditingId(null);
    setSermTitleHt('');
    setSermTitleEn('');
    setSermDate('');
    setSermSpeaker('');
    setSermYoutubeId('');
    setSermDescHt('');
    setSermDescEn('');
  };

  const startEdit = (sermon: Sermon) => {
    setEditingId(sermon.id);
    setSermTitleHt(sermon.title_kreyol);
    setSermTitleEn(sermon.title_english);
    setSermDate(sermon.date);
    setSermSpeaker(sermon.speaker);
    setSermYoutubeId(sermon.youtube_id);
    setSermDescHt(sermon.description_kreyol || '');
    setSermDescEn(sermon.description_english || '');
  };

  const handleSaveLiveSettings = async () => {
    setIsSavingLive(true);
    setMessage(null);
    try {
      const res = await updateLiveArchivesSettings({
        live_stream_active: liveActive,
        live_stream_url: liveUrl,
        youtube_channel_url: ytChannelUrl,
        live_stream_event_id: liveStreamEventId,
        custom_live_event_thumbnail_url: customThumbUrl,
      });
      if (!res.success) {
        setMessage({ type: 'error', text: res.error || t.coordinatorSaveError });
        return;
      }
      setMessage({ type: 'success', text: t.coordinatorSaved });
    } finally {
      setIsSavingLive(false);
    }
  };

  const handleBulkTranslate = async () => {
    const confirmMessage = isHt
      ? 'Traduire automatiquement tous les titres (et descriptions si nécessaire) de l’anglais vers le français pour les vidéos archivées ? Cette opération peut prendre une minute.'
      : 'Automatically translate all archive video titles (and descriptions where needed) from English to French? This may take a minute.';
    if (!confirm(confirmMessage)) return;

    setIsBulkTranslating(true);
    setMessage(null);
    try {
      const result = await bulkTranslateSermonArchivesAction();
      if (!result.success) {
        setMessage({ type: 'error', text: result.error || t.coordinatorSaveError });
        return;
      }
      setSermons(await getSermons());
      setMessage({
        type: 'success',
        text: isHt
          ? `Traduction terminée : ${result.translated} vidéo(s) mise(s) à jour, ${result.skipped} déjà à jour.`
          : `Translation complete: ${result.translated} video(s) updated, ${result.skipped} already up to date.`,
      });
    } finally {
      setIsBulkTranslating(false);
    }
  };

  const handleSync = async () => {
    if (!ytChannelUrl.trim()) {
      setMessage({
        type: 'error',
        text: isHt ? 'Veuillez saisir l’URL de la page Streams YouTube.' : 'Enter the YouTube Streams page URL first.',
      });
      return;
    }
    setIsSyncing(true);
    setMessage(null);
    try {
      const result = await syncSermonsFromYoutube(ytChannelUrl.trim());
      if (!result.success) {
        setMessage({ type: 'error', text: result.error || t.coordinatorSaveError });
        return;
      }
      setSermons(await getSermons());
      setMessage({
        type: 'success',
        text: isHt
          ? `Synchronisation terminée (${result.count} nouvelle(s) vidéo(s)).`
          : `Sync complete (${result.count} new video(s)).`,
      });
    } finally {
      setIsSyncing(false);
    }
  };

  const handleSaveSermon = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage(null);
    const res = await saveSermon(editingId && editingId > 0 ? editingId : null, {
      title_kreyol: sermTitleHt,
      title_english: sermTitleEn,
      date: sermDate,
      speaker: sermSpeaker,
      youtube_id: sermYoutubeId,
      description_kreyol: sermDescHt,
      description_english: sermDescEn,
    });
    if (!res.success) {
      setMessage({ type: 'error', text: res.error || t.coordinatorSaveError });
      return;
    }
    setSermons(await getSermons());
    resetSermonForm();
    setMessage({ type: 'success', text: t.coordinatorSaved });
  };

  const handleDelete = async (id: number) => {
    if (!confirm(t.coordinatorDeleteConfirm)) return;
    const res = await deleteSermon(id);
    if (!res.success) {
      setMessage({ type: 'error', text: res.error || t.coordinatorDeleteError });
      return;
    }
    setSermons(await getSermons());
    if (editingId === id) resetSermonForm();
    setMessage({ type: 'success', text: t.coordinatorSaved });
  };

  const handleTranslate = async () => {
    const fields: BilingualTextField[] = [
      { id: 'title', kreyol: sermTitleHt, english: sermTitleEn },
      { id: 'description', kreyol: sermDescHt, english: sermDescEn },
    ];
    const prepared = prepareBilingualTranslation(fields, direction, language);
    if (!prepared.payload && !prepared.clearedOnly) {
      setMessage({
        type: 'error',
        text: isHt ? 'Saisissez du texte source.' : 'Enter source-language text.',
      });
      return;
    }
    if (!prepared.payload && prepared.clearedOnly) {
      const byId = Object.fromEntries(prepared.fields.map((f) => [f.id, f]));
      if (byId.title) {
        setSermTitleHt(byId.title.kreyol);
        setSermTitleEn(byId.title.english);
      }
      if (byId.description) {
        setSermDescHt(byId.description.kreyol);
        setSermDescEn(byId.description.english);
      }
      setMessage({ type: 'success', text: isHt ? 'Champs cible effacés.' : 'Target language fields cleared.' });
      return;
    }
    const payload = prepared.payload!;
    setIsTranslating(true);
    try {
      const res = await translateAdminTextsAction(
        bilingualItemsForApi(payload.items),
        payload.fromLang,
        'sermon archive entry',
        'live_archives'
      );
      if (!res.success || !res.translations) {
        setMessage({ type: 'error', text: res.error || (isHt ? 'Échec de la traduction.' : 'Translation failed.') });
        return;
      }
      const updated = applyTranslatedFields(
        prepared.fields,
        res.translations,
        payload.fromLang,
        payload.items
      );
      const byId = Object.fromEntries(updated.map((f) => [f.id, f]));
      if (byId.title) {
        setSermTitleHt(byId.title.kreyol);
        setSermTitleEn(byId.title.english);
      }
      if (byId.description) {
        setSermDescHt(byId.description.kreyol);
        setSermDescEn(byId.description.english);
      }
      setMessage({ type: 'success', text: isHt ? 'Traduction terminée.' : 'Translation completed.' });
    } finally {
      setIsTranslating(false);
    }
  };

  return (
    <CoordinatorContentPanel
      open={open}
      title={t.coordinatorManageLiveArchives}
      subtitle={t.coordinatorContentModalHint}
      isLight={isLight}
      onClose={onClose}
    >
      {message && (
        <p
          className={`text-xs font-semibold mb-4 ${message.type === 'success' ? 'text-emerald-500' : 'text-rose-400'}`}
        >
          {message.text}
        </p>
      )}

      {loading ? (
        <p className={`text-sm ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>{t.coordinatorLoading}</p>
      ) : (
        <div className="space-y-8">
          <section className="space-y-4">
            <h3 className={`text-sm font-bold flex items-center gap-2 ${isLight ? 'text-slate-900' : 'text-white'}`}>
              <Video className="w-4 h-4 text-amber-500" />
              {isHt ? 'Diffusion en direct' : 'Live stream'}
            </h3>
            <div className="grid md:grid-cols-2 gap-3">
              <div>
                <label className="block text-[10px] font-bold uppercase opacity-60 mb-1">
                  {isHt ? 'Statut' : 'Status'}
                </label>
                <select value={liveActive} onChange={(e) => setLiveActive(e.target.value)} className={fieldClass}>
                  <option value="true">{isHt ? 'En direct' : 'Live'}</option>
                  <option value="false">{isHt ? 'Hors ligne' : 'Offline'}</option>
                </select>
              </div>
              <div>
                <label className="block text-[10px] font-bold uppercase opacity-60 mb-1">YouTube Video ID</label>
                <input value={liveUrl} onChange={(e) => setLiveUrl(e.target.value)} className={fieldClass} />
              </div>
              <div className="md:col-span-2">
                <label className="block text-[10px] font-bold uppercase opacity-60 mb-1">
                  {isHt ? 'Événement affiché' : 'Streamed event'}
                </label>
                <select
                  value={liveStreamEventId}
                  onChange={(e) => setLiveStreamEventId(e.target.value)}
                  className={fieldClass}
                >
                  <option value="default">
                    {isHt ? 'Par défaut : cultes du dimanche' : 'Default: Sunday services'}
                  </option>
                  {events.map((evt) => (
                    <option key={evt.id} value={String(evt.id)}>
                      {evt.date} — {isHt ? evt.title_kreyol : evt.title_english}
                    </option>
                  ))}
                </select>
              </div>
              <div className="md:col-span-2">
                <label className="block text-[10px] font-bold uppercase opacity-60 mb-1">
                  {isHt ? 'URL miniature personnalisée (facultatif)' : 'Custom thumbnail URL (optional)'}
                </label>
                <input value={customThumbUrl} onChange={(e) => setCustomThumbUrl(e.target.value)} className={fieldClass} />
              </div>
            </div>
            <button
              type="button"
              onClick={handleSaveLiveSettings}
              disabled={isSavingLive}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-amber-500 text-slate-950 text-xs font-bold cursor-pointer disabled:opacity-50"
            >
              <Save className="w-3.5 h-3.5" />
              {isHt ? 'Enregistrer la diffusion' : 'Save live settings'}
            </button>
          </section>

          <section className="space-y-3 p-4 rounded-2xl border border-slate-800/80">
            <h3 className={`text-sm font-bold ${isLight ? 'text-slate-900' : 'text-white'}`}>
              {isHt ? 'Synchronisation YouTube' : 'YouTube sync'}
            </h3>
            <input
              value={ytChannelUrl}
              onChange={(e) => setYtChannelUrl(e.target.value)}
              className={fieldClass}
              placeholder="https://www.youtube.com/@channel/streams"
            />
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={handleSync}
                disabled={isSyncing || isBulkTranslating}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-blue-600 text-white text-xs font-bold cursor-pointer disabled:opacity-50"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin' : ''}`} />
                {isHt ? 'Synchroniser les diffusions' : 'Sync streams'}
              </button>
              <button
                type="button"
                onClick={handleBulkTranslate}
                disabled={isSyncing || isBulkTranslating}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-violet-600 text-white text-xs font-bold cursor-pointer disabled:opacity-50"
              >
                <Languages className={`w-3.5 h-3.5 ${isBulkTranslating ? 'animate-pulse' : ''}`} />
                {isBulkTranslating
                  ? isHt
                    ? 'Traduction en cours…'
                    : 'Translating all…'
                  : isHt
                    ? 'Traduire toutes les archives (EN → FR)'
                    : 'Translate all archives (EN → FR)'}
              </button>
            </div>
          </section>

          <section>
            <form onSubmit={handleSaveSermon} className="space-y-4">
              <h3 className={`text-sm font-bold ${isLight ? 'text-slate-900' : 'text-white'}`}>
                {editingId ? (isHt ? 'Modifier une vidéo' : 'Edit video') : isHt ? 'Ajouter une vidéo' : 'Add video'}
              </h3>
              <AdminBilingualTranslateBar
                language={language}
                direction={direction}
                onDirectionChange={setDirection}
                onTranslate={handleTranslate}
                isTranslating={isTranslating}
                compact
              />
              <div className="grid md:grid-cols-2 gap-3">
                <input
                  required
                  value={sermTitleHt}
                  onChange={(e) => setSermTitleHt(e.target.value)}
                  placeholder={isHt ? 'Titre (français)' : 'Title (French)'}
                  className={fieldClass}
                />
                <input
                  required
                  value={sermTitleEn}
                  onChange={(e) => setSermTitleEn(e.target.value)}
                  placeholder={isHt ? 'Titre (anglais)' : 'Title (English)'}
                  className={fieldClass}
                />
              </div>
              <div className="grid md:grid-cols-3 gap-3">
                <input
                  type="date"
                  required
                  value={sermDate}
                  onChange={(e) => setSermDate(e.target.value)}
                  className={fieldClass}
                />
                <input
                  required
                  value={sermSpeaker}
                  onChange={(e) => setSermSpeaker(e.target.value)}
                  placeholder={t.sermonSpeaker}
                  className={fieldClass}
                />
                <input
                  required
                  value={sermYoutubeId}
                  onChange={(e) => setSermYoutubeId(e.target.value)}
                  placeholder="YouTube ID"
                  className={`${fieldClass} font-mono`}
                />
              </div>
              <div className="grid md:grid-cols-2 gap-3">
                <textarea
                  rows={2}
                  value={sermDescHt}
                  onChange={(e) => setSermDescHt(e.target.value)}
                  placeholder={isHt ? 'Description (français)' : 'Description (French)'}
                  className={`${fieldClass} resize-none`}
                />
                <textarea
                  rows={2}
                  value={sermDescEn}
                  onChange={(e) => setSermDescEn(e.target.value)}
                  placeholder={isHt ? 'Description (anglais)' : 'Description (English)'}
                  className={`${fieldClass} resize-none`}
                />
              </div>
              <div className="flex gap-2 justify-end">
                {editingId && (
                  <button type="button" onClick={resetSermonForm} className="px-3 py-2 text-xs font-bold opacity-70">
                    {t.btnCancel}
                  </button>
                )}
                <button type="submit" className="px-4 py-2 rounded-xl bg-amber-500 text-slate-950 text-xs font-bold">
                  {t.coordinatorSave}
                </button>
              </div>
            </form>
          </section>

          <section className="space-y-2 max-h-64 overflow-y-auto">
            {sermons.length === 0 ? (
              <p className={`text-sm ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>{t.coordinatorEmpty}</p>
            ) : (
              sermons.map((sermon) => (
                <div
                  key={sermon.id}
                  className={`flex items-center justify-between gap-3 p-3 rounded-xl border ${
                    isLight ? 'border-slate-200 bg-slate-50' : 'border-slate-800 bg-slate-950/40'
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <img
                      src={getYouTubeThumbnailUrl(sermon.youtube_id)}
                      alt=""
                      className="w-16 h-10 object-cover rounded shrink-0"
                    />
                    <div className="min-w-0">
                      <p className={`text-xs font-bold truncate ${isLight ? 'text-slate-900' : 'text-white'}`}>
                        {isHt ? sermon.title_kreyol : sermon.title_english}
                      </p>
                      <p className="text-[10px] opacity-60">{sermon.date}</p>
                    </div>
                  </div>
                  <div className="flex gap-1 shrink-0">
                    <button
                      type="button"
                      onClick={() => startEdit(sermon)}
                      className="p-1.5 rounded hover:bg-amber-500/20 cursor-pointer"
                      aria-label={t.coordinatorEdit}
                    >
                      <Edit className="w-4 h-4 text-amber-500" />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDelete(sermon.id)}
                      className="p-1.5 rounded hover:bg-rose-500/20 cursor-pointer"
                      aria-label={t.coordinatorDelete}
                    >
                      <Trash2 className="w-4 h-4 text-rose-400" />
                    </button>
                  </div>
                </div>
              ))
            )}
          </section>
        </div>
      )}
    </CoordinatorContentPanel>
  );
}
