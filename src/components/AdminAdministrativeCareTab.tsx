'use client';

import React, { useEffect, useState } from 'react';
import { FileSpreadsheet, HeartHandshake, RefreshCw, Save, Trash2, UploadCloud } from 'lucide-react';
import type { AdministrativeCareCategory, AdministrativeCareSubmission } from '@/lib/db';
import {
  deleteAdministrativeCareSubmission,
  exportAdministrativeCareSpreadsheet,
  getAdministrativeCareCategories,
  getAdministrativeCareSubmissions,
  saveAdministrativeCareCategory,
} from '@/lib/actions';
import {
  ADMINISTRATIVE_CARE_BASE_FIELDS,
  ADMINISTRATIVE_CARE_FIELDS,
  formatAdministrativeCareFieldValue,
} from '@/lib/administrative-care-fields';
import { ADMINISTRATIVE_CARE_SLUGS, type AdministrativeCareSlug } from '@/lib/site-nav';
import { parseEventImages, serializeEventImages } from '@/lib/event-images';
import AdminSectionContactExport from '@/components/AdminSectionContactExport';
import { AdministrativeCareDefaultArt } from '@/components/AdministrativeCareIcon';

interface AdminAdministrativeCareTabProps {
  language: 'en' | 'fr_ht';
}

const emptyForm = {
  title_english: '',
  title_kreyol: '',
  description_english: '',
  description_kreyol: '',
  contact_name: '',
  contact_email: '',
  contact_phone: '',
  notification_emails: '',
};

async function uploadDataUrl(fileName: string, dataUrl: string): Promise<{ success: boolean; url?: string; error?: string }> {
  try {
    const response = await fetch(dataUrl);
    const blob = await response.blob();
    const file = new File([blob], fileName, { type: blob.type });
    const formData = new FormData();
    formData.append('file', file);
    const res = await fetch('/api/upload', { method: 'POST', body: formData });
    if (!res.ok) {
      const errData = await res.json().catch(() => ({}));
      return { success: false, error: errData.error || `Server responded with ${res.status}` };
    }
    return await res.json();
  } catch (error: any) {
    return { success: false, error: error.message || 'Upload failed' };
  }
}

export default function AdminAdministrativeCareTab({ language }: AdminAdministrativeCareTabProps) {
  const [categories, setCategories] = useState<AdministrativeCareCategory[]>([]);
  const [selectedSlug, setSelectedSlug] = useState<AdministrativeCareSlug>('weddings');
  const [form, setForm] = useState(emptyForm);
  const [images, setImages] = useState<string[]>([]);
  const [imagesUploading, setImagesUploading] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [submissions, setSubmissions] = useState<AdministrativeCareSubmission[]>([]);
  const [loadingSubmissions, setLoadingSubmissions] = useState(false);
  const [saving, setSaving] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const loadCategories = async () => {
    const rows = await getAdministrativeCareCategories();
    setCategories(rows);
    const current = rows.find((item) => item.slug === selectedSlug) || rows[0];
    if (current) {
      applyCategory(current);
    }
  };

  const applyCategory = (current: AdministrativeCareCategory) => {
    setSelectedSlug(current.slug as AdministrativeCareSlug);
    setForm({
      title_english: current.title_english || '',
      title_kreyol: current.title_kreyol || '',
      description_english: current.description_english || '',
      description_kreyol: current.description_kreyol || '',
      contact_name: current.contact_name || '',
      contact_email: current.contact_email || '',
      contact_phone: current.contact_phone || '',
      notification_emails: current.notification_emails || '',
    });
    setImages(parseEventImages(current.images_json));
  };

  const loadSubmissions = async (slug: string) => {
    setLoadingSubmissions(true);
    try {
      const rows = await getAdministrativeCareSubmissions(slug);
      setSubmissions(rows);
    } finally {
      setLoadingSubmissions(false);
    }
  };

  useEffect(() => {
    loadCategories();
  }, []);

  useEffect(() => {
    const current = categories.find((item) => item.slug === selectedSlug);
    if (current) applyCategory(current);
  }, [selectedSlug, categories]);

  useEffect(() => {
    loadSubmissions(selectedSlug);
  }, [selectedSlug]);

  const handleImageFiles = (files: FileList | File[] | null) => {
    if (!files?.length) return;
    const fileArray = Array.from(files).filter(
      (file) => file.type.startsWith('image/') || /\.(jpe?g|png|gif|webp|bmp)$/i.test(file.name)
    );
    if (!fileArray.length) return;
    setImagesUploading(true);
    let loaded = 0;
    fileArray.forEach((file) => {
      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target?.result) {
          setImages((prev) => [...prev, event.target!.result as string]);
        }
        loaded += 1;
        if (loaded === fileArray.length) setImagesUploading(false);
      };
      reader.readAsDataURL(file);
    });
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setMessage(null);
    try {
      const finalImages: string[] = [];
      for (const image of images) {
        if (image.startsWith('data:')) {
          const uploadRes = await uploadDataUrl(`care_${selectedSlug}_${Date.now()}_${Math.random().toString(36).slice(2, 8)}.jpg`, image);
          if (!uploadRes.success || !uploadRes.url) {
            setMessage({ type: 'error', text: uploadRes.error || 'Image upload failed.' });
            setSaving(false);
            return;
          }
          finalImages.push(uploadRes.url);
        } else {
          finalImages.push(image);
        }
      }

      const res = await saveAdministrativeCareCategory(selectedSlug, {
        ...form,
        images_json: serializeEventImages(finalImages),
      });
      if (!res.success) {
        setMessage({ type: 'error', text: res.error || 'Failed to save.' });
        return;
      }
      setImages(finalImages);
      setMessage({
        type: 'success',
        text: language === 'en' ? 'Administrative Care category saved.' : 'Catégorie de soins pastoraux enregistrée.',
      });
      await loadCategories();
    } catch (error: any) {
      setMessage({ type: 'error', text: error.message || 'Error occurred' });
    } finally {
      setSaving(false);
    }
  };

  const handleExport = async () => {
    setExporting(true);
    setMessage(null);
    try {
      const res = await exportAdministrativeCareSpreadsheet(selectedSlug);
      if (!res.success || !res.data) {
        setMessage({ type: 'error', text: res.error || 'Failed to export spreadsheet' });
        return;
      }
      const bytes = Uint8Array.from(atob(res.data), (char) => char.charCodeAt(0));
      const blob = new Blob([bytes], {
        type: res.mimeType || 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = res.filename || `${selectedSlug}-requests.xlsx`;
      link.click();
      URL.revokeObjectURL(url);
    } catch (error: any) {
      setMessage({ type: 'error', text: error.message || 'Error occurred' });
    } finally {
      setExporting(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm(language === 'en' ? 'Delete this submission?' : 'Supprimer cette demande ?')) return;
    const res = await deleteAdministrativeCareSubmission(id);
    if (res.success) {
      setSubmissions((prev) => prev.filter((item) => item.id !== id));
    } else {
      setMessage({ type: 'error', text: res.error || 'Failed to delete' });
    }
  };

  const categoryFields = ADMINISTRATIVE_CARE_FIELDS[selectedSlug] || [];
  const slugLabel = (slug: AdministrativeCareSlug) => {
    const row = categories.find((item) => item.slug === slug);
    if (!row) return slug;
    return language === 'en' ? row.title_english : row.title_kreyol;
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="p-5 rounded-2xl bg-slate-950/40 border border-slate-850">
        <h3 className="text-base font-bold text-white flex items-center gap-2">
          <HeartHandshake className="w-5 h-5 text-amber-500" />
          <span>{language === 'en' ? 'Administrative Care' : 'Soins pastoraux'}</span>
        </h3>
        <p className="text-xs text-slate-400 mt-1">
          {language === 'en'
            ? 'Edit bilingual descriptions, gallery images, notification routing, and review submissions for each care category.'
            : 'Modifiez les descriptions bilingues, les images, le routage des notifications et consultez les demandes de chaque catégorie.'}
        </p>
      </div>

      <div className="flex flex-wrap gap-2 border-b border-slate-850 pb-px">
        {ADMINISTRATIVE_CARE_SLUGS.map((slug) => (
          <button
            key={slug}
            type="button"
            onClick={() => setSelectedSlug(slug)}
            className={`px-4 py-2.5 text-xs font-bold border-b-2 transition-all cursor-pointer ${
              selectedSlug === slug
                ? 'border-amber-500 text-amber-400 bg-slate-950/20'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            {slugLabel(slug)}
          </button>
        ))}
      </div>

      <form id="admin-active-form" onSubmit={handleSave} className="p-5 rounded-2xl bg-slate-950/30 border border-slate-850 space-y-4">
        <div className="grid md:grid-cols-2 gap-4">
          <div>
            <label className="block text-[10px] font-bold uppercase text-slate-400 mb-1">
              {language === 'en' ? 'Title (French)' : 'Titre (français)'}
            </label>
            <input
              type="text"
              required
              value={form.title_kreyol}
              onChange={(e) => setForm((prev) => ({ ...prev, title_kreyol: e.target.value }))}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-500 font-semibold"
            />
          </div>
          <div>
            <label className="block text-[10px] font-bold uppercase text-slate-400 mb-1">
              {language === 'en' ? 'Title (English)' : 'Titre (anglais)'}
            </label>
            <input
              type="text"
              required
              value={form.title_english}
              onChange={(e) => setForm((prev) => ({ ...prev, title_english: e.target.value }))}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-500 font-semibold"
            />
          </div>
        </div>

        <div className="grid md:grid-cols-2 gap-4">
          <div>
            <label className="block text-[10px] font-bold uppercase text-slate-400 mb-1">
              {language === 'en' ? 'Description (French)' : 'Description (français)'}
            </label>
            <textarea
              rows={7}
              required
              value={form.description_kreyol}
              onChange={(e) => setForm((prev) => ({ ...prev, description_kreyol: e.target.value }))}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-500 leading-relaxed font-serif"
            />
          </div>
          <div>
            <label className="block text-[10px] font-bold uppercase text-slate-400 mb-1">
              {language === 'en' ? 'Description (English)' : 'Description (anglais)'}
            </label>
            <textarea
              rows={7}
              required
              value={form.description_english}
              onChange={(e) => setForm((prev) => ({ ...prev, description_english: e.target.value }))}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-500 leading-relaxed font-serif"
            />
          </div>
        </div>

        <div>
          <label className="block text-[10px] font-bold uppercase text-slate-400 mb-1.5">
            {language === 'en' ? 'Photo gallery' : 'Galerie photos'}
          </label>
          <div
            tabIndex={0}
            role="button"
            onClick={() => document.getElementById('care-images-input')?.click()}
            onPaste={(e) => {
              const imageFiles: File[] = [];
              for (let i = 0; i < e.clipboardData.items.length; i++) {
                const item = e.clipboardData.items[i];
                if (item.type.startsWith('image/')) {
                  const file = item.getAsFile();
                  if (file) imageFiles.push(file);
                }
              }
              if (imageFiles.length) {
                e.preventDefault();
                handleImageFiles(imageFiles);
              }
            }}
            onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
            onDragLeave={() => setIsDragging(false)}
            onDrop={(e) => {
              e.preventDefault();
              setIsDragging(false);
              handleImageFiles(e.dataTransfer.files);
            }}
            className={`border-2 border-dashed rounded-xl p-5 flex flex-col items-center justify-center gap-2 cursor-pointer transition-all ${
              isDragging ? 'border-amber-500 bg-amber-500/10' : 'border-slate-800 hover:border-amber-500/50 bg-slate-950/40'
            }`}
          >
            <input
              type="file"
              id="care-images-input"
              accept="image/*"
              multiple
              className="hidden"
              onChange={(e) => {
                handleImageFiles(e.target.files);
                e.target.value = '';
              }}
            />
            <UploadCloud className="w-7 h-7 text-slate-500" />
            <span className="text-xs font-bold text-slate-300 text-center">
              {language === 'en' ? 'Choose, drag, or paste photos' : 'Choisir, glisser ou coller des photos'}
            </span>
            {imagesUploading && (
              <span className="text-[10px] text-amber-400 font-semibold">
                {language === 'en' ? 'Loading...' : 'Chargement...'}
              </span>
            )}
          </div>
          {images.length > 0 ? (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-4">
              {images.map((image, index) => (
                <div key={`${image.slice(0, 24)}-${index}`} className="relative rounded-lg overflow-hidden border border-slate-800 bg-slate-900 flex items-center justify-center min-h-28">
                  <img src={image} alt="" className="w-full max-h-40 object-contain" />
                  <button
                    type="button"
                    onClick={() => setImages((prev) => prev.filter((_, i) => i !== index))}
                    className="absolute top-2 right-2 p-1 rounded bg-slate-950/80 text-rose-400 hover:text-rose-300 cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>
          ) : (
            <div className="mt-4 rounded-xl overflow-hidden border border-slate-800">
              <AdministrativeCareDefaultArt
                slug={selectedSlug}
                isLight={false}
                className="h-28"
                iconClassName="w-12 h-12"
              />
              <p className="px-3 py-2 text-[10px] text-slate-400 bg-slate-950/60">
                {language === 'en'
                  ? 'Default icon shown until photos are uploaded.'
                  : 'Icône par défaut affichée jusqu’au téléversement de photos.'}
              </p>
            </div>
          )}
        </div>

        <div className="pt-2 border-t border-slate-850">
          <h4 className="text-sm font-bold text-white mb-3">
            {language === 'en' ? 'Committee Contact & Notifications' : 'Contact du comité et notifications'}
          </h4>
          <div className="grid md:grid-cols-3 gap-4">
            <div>
              <label className="block text-[10px] font-bold uppercase text-slate-400 mb-1">
                {language === 'en' ? 'Contact Name' : 'Nom du contact'}
              </label>
              <input
                type="text"
                value={form.contact_name}
                onChange={(e) => setForm((prev) => ({ ...prev, contact_name: e.target.value }))}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-500"
              />
            </div>
            <div>
              <label className="block text-[10px] font-bold uppercase text-slate-400 mb-1">
                {language === 'en' ? 'Contact Email' : 'Adresse courriel du contact'}
              </label>
              <input
                type="email"
                value={form.contact_email}
                onChange={(e) => setForm((prev) => ({ ...prev, contact_email: e.target.value }))}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-500"
              />
            </div>
            <div>
              <label className="block text-[10px] font-bold uppercase text-slate-400 mb-1">
                {language === 'en' ? 'Contact Phone' : 'Téléphone du contact'}
              </label>
              <input
                type="text"
                value={form.contact_phone}
                onChange={(e) => setForm((prev) => ({ ...prev, contact_phone: e.target.value }))}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-500"
              />
            </div>
          </div>
          <div className="mt-4">
            <label className="block text-[10px] font-bold uppercase text-slate-400 mb-1">
              {language === 'en' ? 'Notification Recipients' : 'Destinataires des notifications'}
            </label>
            <textarea
              rows={3}
              value={form.notification_emails}
              onChange={(e) => setForm((prev) => ({ ...prev, notification_emails: e.target.value }))}
              placeholder={language === 'en' ? 'secretary@church.org, pastoralcare@church.org' : 'secretariat@eglise.org, soins@eglise.org'}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-500 font-mono"
            />
            <p className="text-[10px] text-slate-500 mt-1">
              {language === 'en'
                ? 'Suggested defaults: Secretary for weddings, baptisms, and dedications; pastoral care or Public Relations for funerals and hospice. Configure here rather than hard-coding.'
                : 'Suggestion : secrétariat pour les mariages, baptêmes et présentations ; soins pastoraux ou relations publiques pour les funérailles et les visites. Configurable ici.'}
            </p>
          </div>
        </div>

        {message && (
          <p className={`text-xs ${message.type === 'success' ? 'text-emerald-400' : 'text-rose-400'}`}>{message.text}</p>
        )}

        <div className="flex justify-end">
          <button
            type="submit"
            disabled={saving}
            className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 disabled:opacity-60 text-slate-950 text-xs font-bold inline-flex items-center gap-1.5 cursor-pointer"
          >
            <Save className="w-3.5 h-3.5" />
            <span>{saving ? (language === 'en' ? 'Saving...' : 'Enregistrement...') : language === 'en' ? 'Save category' : 'Enregistrer la catégorie'}</span>
          </button>
        </div>
      </form>

      <div className="p-5 rounded-2xl bg-slate-950/30 border border-slate-850 space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div>
            <h4 className="text-sm font-bold text-white">
              {language === 'en' ? 'Submissions inbox' : 'Boîte de réception des demandes'}
            </h4>
            <p className="text-[10px] text-slate-500 mt-1">
              {language === 'en'
                ? 'Requests submitted from the public Administrative Care form.'
                : 'Demandes envoyées depuis le formulaire public de soins pastoraux.'}
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => loadSubmissions(selectedSlug)}
              className="px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 hover:border-amber-500/50 text-xs font-bold text-slate-200 inline-flex items-center gap-1.5 cursor-pointer"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loadingSubmissions ? 'animate-spin' : ''}`} />
              <span>{language === 'en' ? 'Refresh' : 'Actualiser'}</span>
            </button>
            <button
              type="button"
              disabled={exporting}
              onClick={handleExport}
              className="px-3 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-xs font-bold text-white inline-flex items-center gap-1.5 cursor-pointer disabled:opacity-60"
            >
              <FileSpreadsheet className="w-3.5 h-3.5" />
              <span>{language === 'en' ? 'Download Spreadsheet (.xlsx)' : 'Télécharger la feuille de calcul (.xlsx)'}</span>
            </button>
          </div>
        </div>

        {loadingSubmissions ? (
          <p className="text-xs text-slate-400">{language === 'en' ? 'Loading submissions...' : 'Chargement des demandes...'}</p>
        ) : submissions.length === 0 ? (
          <p className="text-xs text-slate-500">{language === 'en' ? 'No submissions yet for this category.' : 'Aucune demande pour cette catégorie.'}</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="text-slate-400 border-b border-slate-850">
                  <th className="py-2 pr-3 font-bold uppercase">{language === 'en' ? 'Date' : 'Date'}</th>
                  <th className="py-2 pr-3 font-bold uppercase">{language === 'en' ? 'Name' : 'Nom'}</th>
                  <th className="py-2 pr-3 font-bold uppercase">{language === 'en' ? 'Email' : 'Adresse courriel'}</th>
                  <th className="py-2 pr-3 font-bold uppercase">{language === 'en' ? 'Phone' : 'Téléphone'}</th>
                  {[...ADMINISTRATIVE_CARE_BASE_FIELDS.slice(3), ...categoryFields].map((field) => (
                    <th key={field.key} className="py-2 pr-3 font-bold uppercase">{language === 'en' ? field.label_en : field.label_ht}</th>
                  ))}
                  <th className="py-2 font-bold uppercase">{language === 'en' ? 'Actions' : 'Actions'}</th>
                </tr>
              </thead>
              <tbody>
                {submissions.map((item) => {
                  let responses: Record<string, string> = {};
                  try {
                    responses = JSON.parse(item.responses || '{}');
                  } catch {
                    responses = {};
                  }
                  return (
                    <tr key={item.id} className="border-b border-slate-900/80 text-slate-200">
                      <td className="py-2 pr-3 whitespace-nowrap">{item.created_at ? new Date(item.created_at).toLocaleString() : '—'}</td>
                      <td className="py-2 pr-3">{item.name}</td>
                      <td className="py-2 pr-3">{item.email}</td>
                      <td className="py-2 pr-3">{item.phone || '—'}</td>
                      {[...ADMINISTRATIVE_CARE_BASE_FIELDS.slice(3), ...categoryFields].map((field) => (
                        <td key={field.key} className="py-2 pr-3 max-w-[180px] truncate" title={formatAdministrativeCareFieldValue(field, responses[field.key], language)}>
                          {formatAdministrativeCareFieldValue(field, responses[field.key], language) || '—'}
                        </td>
                      ))}
                      <td className="py-2">
                        <button
                          type="button"
                          onClick={() => handleDelete(item.id)}
                          className="p-1.5 rounded-lg bg-slate-950 border border-slate-850 hover:bg-rose-950 hover:border-rose-900 text-slate-400 hover:text-rose-400 transition-colors cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <AdminSectionContactExport
        section="administrative_care"
        exportSlug="administrative_care_submissions"
        language={language}
        listTitle={language === 'en' ? 'All Administrative Care submissions' : 'Toutes les demandes de soins pastoraux'}
        listDescription={language === 'en'
          ? 'Combined export of every category. Per-category notification emails are saved on the form above.'
          : 'Export combiné de toutes les catégories. Les courriels de notification par catégorie sont enregistrés dans le formulaire ci-dessus.'}
        recordCount={submissions.length}
        emptyMessage={language === 'en' ? 'No combined records to preview for this category.' : 'Aucun dossier combiné à afficher pour cette catégorie.'}
        showContactConfig={false}
      />
    </div>
  );
}
