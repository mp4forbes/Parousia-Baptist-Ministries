'use client';

import React, { useEffect, useState } from 'react';
import { AdminSectionConfig } from '@/lib/db';
import { AdminExportSlug, AdminSectionSlug } from '@/lib/admin-sections';
import { exportAdminSectionSpreadsheet, getAdminSectionConfig, saveAdminSectionConfig } from '@/lib/actions';
import { FileSpreadsheet, RefreshCw, Save } from 'lucide-react';

interface AdminSectionContactExportProps {
  section: AdminSectionSlug;
  exportSlug: AdminExportSlug;
  language: 'en' | 'fr_ht';
  listTitle: string;
  listDescription: string;
  recordCount: number;
  emptyMessage: string;
  showContactConfig?: boolean;
  onSaved?: () => void;
}

const emptyConfig = {
  contact_name: '',
  contact_email: '',
  contact_phone: '',
  notification_emails: '',
};

export default function AdminSectionContactExport({
  section,
  exportSlug,
  language,
  listTitle,
  listDescription,
  recordCount,
  emptyMessage,
  showContactConfig = true,
  onSaved,
}: AdminSectionContactExportProps) {
  const [config, setConfig] = useState<AdminSectionConfig>({ section_slug: section, ...emptyConfig });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const loadConfig = async () => {
    setLoading(true);
    try {
      const data = await getAdminSectionConfig(section);
      setConfig(data);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadConfig();
  }, [section]);

  const handleSave = async () => {
    setSaving(true);
    setMessage(null);
    try {
      const res = await saveAdminSectionConfig(section, config);
      if (!res.success) {
        setMessage({ type: 'error', text: res.error || 'Failed to save settings' });
        return;
      }
      setMessage({
        type: 'success',
        text: language === 'en' ? 'Contact settings saved.' : 'Paramètres de contact enregistrés.',
      });
      onSaved?.();
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
      const res = await exportAdminSectionSpreadsheet(exportSlug);
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
      link.download = res.filename || `${exportSlug}.xlsx`;
      link.click();
      URL.revokeObjectURL(url);
      setMessage({
        type: 'success',
        text:
          language === 'en'
            ? 'Spreadsheet downloaded. Open it in Excel or Google Sheets.'
            : 'Fichier téléchargé. Vous pouvez l’ouvrir dans Excel ou Google Sheets.',
      });
    } catch (error: any) {
      setMessage({ type: 'error', text: error.message || 'Error occurred' });
    } finally {
      setExporting(false);
    }
  };

  return (
    <div className="space-y-4">
      {showContactConfig && (
        <div className="p-5 rounded-2xl bg-slate-950/30 border border-slate-850 space-y-4">
          <h4 className="text-sm font-bold text-white">
            {language === 'en' ? 'Committee Contact & Notifications' : 'Contact du comité et notifications'}
          </h4>

          {loading ? (
            <p className="text-xs text-slate-400">
              {language === 'en' ? 'Loading contact settings...' : 'Chargement des paramètres de contact...'}
            </p>
          ) : (
            <>
              <div className="grid md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-[10px] font-bold uppercase text-slate-400 mb-1">
                    {language === 'en' ? 'Contact Name' : 'Nom du contact'}
                  </label>
                  <input
                    type="text"
                    value={config.contact_name || ''}
                    onChange={(e) => setConfig((prev) => ({ ...prev, contact_name: e.target.value }))}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-500"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold uppercase text-slate-400 mb-1">
                    {language === 'en' ? 'Contact Email' : 'Adresse courriel du contact'}
                  </label>
                  <input
                    type="email"
                    value={config.contact_email || ''}
                    onChange={(e) => setConfig((prev) => ({ ...prev, contact_email: e.target.value }))}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-500"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold uppercase text-slate-400 mb-1">
                    {language === 'en' ? 'Contact Phone' : 'Téléphone du contact'}
                  </label>
                  <input
                    type="text"
                    value={config.contact_phone || ''}
                    onChange={(e) => setConfig((prev) => ({ ...prev, contact_phone: e.target.value }))}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-bold uppercase text-slate-400 mb-1">
                  {language === 'en' ? 'Notification Recipients' : 'Destinataires des notifications'}
                </label>
                <textarea
                  rows={3}
                  value={config.notification_emails || ''}
                  onChange={(e) => setConfig((prev) => ({ ...prev, notification_emails: e.target.value }))}
                  placeholder={language === 'en' ? 'leader@church.org, committee@church.org' : 'responsable@eglise.org, comite@eglise.org'}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-500 font-mono"
                />
                <p className="text-[10px] text-slate-500 mt-1">
                  {language === 'en'
                    ? 'Comma or line-separated emails notified on each new submission.'
                    : 'Adresses courriel séparées par des virgules ou des sauts de ligne, avisées à chaque nouvelle soumission.'}
                </p>
              </div>

              <div className="flex justify-end">
                <button
                  type="button"
                  disabled={saving}
                  onClick={handleSave}
                  className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 disabled:opacity-60 text-slate-950 text-xs font-bold inline-flex items-center gap-1.5 cursor-pointer"
                >
                  <Save className="w-3.5 h-3.5" />
                  <span>{language === 'en' ? 'Save Contact Settings' : 'Enregistrer les paramètres de contact'}</span>
                </button>
              </div>
            </>
          )}
        </div>
      )}

      <div className="p-5 rounded-2xl bg-slate-950/30 border border-slate-850 space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div>
            <h4 className="text-sm font-bold text-white flex items-center gap-2">
              <FileSpreadsheet className="w-4 h-4 text-amber-500" />
              <span>{listTitle}</span>
            </h4>
            <p className="text-[10px] text-slate-500 mt-1">{listDescription}</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={loadConfig}
              className="px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 hover:border-amber-500/50 text-xs font-bold text-slate-200 inline-flex items-center gap-1.5 cursor-pointer"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
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

        {message && (
          <p className={`text-xs ${message.type === 'success' ? 'text-emerald-400' : 'text-rose-400'}`}>
            {message.text}
          </p>
        )}

        {recordCount === 0 ? (
          <p className="text-xs text-slate-500">{emptyMessage}</p>
        ) : (
          <p className="text-xs text-slate-400">
            {language === 'en'
              ? `${recordCount} record${recordCount === 1 ? '' : 's'} available for export.`
              : `${recordCount} dossier${recordCount === 1 ? '' : 's'} disponible${recordCount === 1 ? '' : 's'} pour l’exportation.`}
          </p>
        )}
      </div>
    </div>
  );
}
