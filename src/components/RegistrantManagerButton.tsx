'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { FileSpreadsheet, Plus, Save, Trash2, X } from 'lucide-react';
import { useCoordinatorSession } from '@/lib/CoordinatorSessionContext';
import { useLanguage } from '@/lib/LanguageContext';
import {
  deleteRegistrant,
  exportRegistrantsSpreadsheet,
  listRegistrants,
  saveRegistrant,
} from '@/lib/registrant-actions';
import {
  scopeIsAllowed,
  type RegistrantColumn,
  type RegistrantRow,
  type RegistrantScope,
} from '@/lib/registrant-scope';

interface RegistrantManagerButtonProps {
  scope: RegistrantScope;
  isLight: boolean;
  label?: string;
}

function emptyRow(columns: RegistrantColumn[]): RegistrantRow {
  return {
    id: 0,
    values: Object.fromEntries(columns.map((column) => [
      column.key,
      column.key === 'payment_status' ? 'not_paid' : column.key === 'follow_up_status' ? 'new' : '',
    ])),
  };
}

function downloadWorkbook(data: string, filename: string, mimeType: string) {
  const bytes = Uint8Array.from(atob(data), (char) => char.charCodeAt(0));
  const blob = new Blob([bytes], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}

function CellInput({
  column,
  value,
  isLight,
  onChange,
}: {
  column: RegistrantColumn;
  value: string;
  isLight: boolean;
  onChange: (value: string) => void;
}) {
  const fieldClass = `w-full min-w-[9rem] px-2 py-1.5 rounded-lg border text-xs ${
    isLight ? 'bg-white border-slate-200 text-slate-900' : 'bg-slate-950 border-slate-800 text-white'
  } focus:outline-none focus:border-amber-500`;

  if (column.type === 'readonly') {
    return <span className="text-xs text-slate-500 whitespace-nowrap">{value ? new Date(value).toLocaleString() : '—'}</span>;
  }
  if (column.type === 'select') {
    return (
      <select value={value} onChange={(e) => onChange(e.target.value)} className={fieldClass}>
        <option value=""></option>
        {(column.options || []).map((option) => (
          <option key={option.value} value={option.value}>{option.label}</option>
        ))}
      </select>
    );
  }
  if (column.type === 'textarea') {
    return (
      <textarea
        rows={2}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className={`${fieldClass} min-w-[14rem] resize-y`}
      />
    );
  }
  return (
    <input
      type={column.type === 'number' ? 'number' : column.key === 'email' ? 'email' : 'text'}
      value={value}
      required={column.required}
      onChange={(e) => onChange(e.target.value)}
      className={fieldClass}
    />
  );
}

export default function RegistrantManagerButton({ scope, isLight, label }: RegistrantManagerButtonProps) {
  const { language, t } = useLanguage();
  const { access } = useCoordinatorSession();
  const allowed = scopeIsAllowed(scope, access);
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState('');
  const [columns, setColumns] = useState<RegistrantColumn[]>([]);
  const [rows, setRows] = useState<RegistrantRow[]>([]);
  const [draft, setDraft] = useState<RegistrantRow | null>(null);
  const [editingId, setEditingId] = useState<number | 'new' | null>(null);
  const [loading, setLoading] = useState(false);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const load = async () => {
    setLoading(true);
    setMessage(null);
    const res = await listRegistrants(scope, language);
    setLoading(false);
    if (!res.success || !res.columns || !res.rows) {
      setMessage({ type: 'error', text: res.error || t.coordinatorLoadError });
      return;
    }
    setTitle(res.title || t.coordinatorManageList);
    setColumns(res.columns);
    setRows(res.rows);
  };

  useEffect(() => {
    if (open) void load();
  }, [open, language]);

  const visible = allowed;
  const heading = useMemo(() => title || t.coordinatorManageList, [title, t.coordinatorManageList]);

  if (!visible) return null;

  const startAdd = () => {
    setEditingId('new');
    setDraft(emptyRow(columns));
    setMessage(null);
  };

  const startEdit = (row: RegistrantRow) => {
    setEditingId(row.id);
    setDraft({ id: row.id, values: { ...row.values } });
    setMessage(null);
  };

  const cancelEdit = () => {
    setEditingId(null);
    setDraft(null);
  };

  const saveRow = async () => {
    if (!draft) return;
    setBusy(true);
    setMessage(null);
    const res = await saveRegistrant(scope, editingId === 'new' ? null : draft.id, draft.values);
    setBusy(false);
    if (!res.success) {
      setMessage({ type: 'error', text: res.error || t.coordinatorSaveError });
      return;
    }
    setMessage({ type: 'success', text: t.coordinatorSaved });
    setEditingId(null);
    setDraft(null);
    await load();
  };

  const removeRow = async (id: number) => {
    if (!confirm(t.coordinatorDeleteConfirm)) return;
    setBusy(true);
    const res = await deleteRegistrant(scope, id);
    setBusy(false);
    if (!res.success) {
      setMessage({ type: 'error', text: res.error || t.coordinatorDeleteError });
      return;
    }
    if (editingId === id) cancelEdit();
    await load();
  };

  const exportList = async () => {
    setBusy(true);
    const res = await exportRegistrantsSpreadsheet(scope, language);
    setBusy(false);
    if (!res.success || !res.data) {
      setMessage({ type: 'error', text: res.error || t.coordinatorExportError });
      return;
    }
    downloadWorkbook(res.data, res.filename || 'registrations.xlsx', res.mimeType || 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    setMessage({ type: 'success', text: t.coordinatorExported });
  };

  const panel = isLight ? 'bg-white border-slate-200 text-slate-900' : 'bg-slate-950 border-slate-800 text-white';

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold shadow-md shadow-amber-500/20 transition-all cursor-pointer"
      >
        <FileSpreadsheet className="w-4 h-4" />
        {label || t.coordinatorManageList}
      </button>

      {open && (
        <div className="fixed inset-0 z-[80] flex items-center justify-center p-3 sm:p-6 bg-slate-950/70 backdrop-blur-sm">
          <div className={`w-full max-w-6xl max-h-[90vh] rounded-3xl border shadow-2xl ${panel} flex flex-col overflow-hidden`}>
            <div className={`flex items-start justify-between gap-3 px-5 py-4 border-b ${isLight ? 'border-slate-200' : 'border-slate-800'}`}>
              <div>
                <h2 className="text-lg font-bold font-serif">{heading}</h2>
                <p className={`text-xs mt-1 ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>{t.coordinatorModalHint}</p>
              </div>
              <button
                type="button"
                onClick={() => { setOpen(false); cancelEdit(); }}
                className={`p-1 rounded-lg ${isLight ? 'hover:bg-slate-100 text-slate-500' : 'hover:bg-slate-900 text-slate-400'} cursor-pointer`}
                aria-label={t.coordinatorClose}
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className={`flex flex-wrap gap-2 px-5 py-3 border-b ${isLight ? 'border-slate-200 bg-slate-50' : 'border-slate-800 bg-slate-900/60'}`}>
              <button
                type="button"
                onClick={startAdd}
                className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-amber-500 hover:bg-amber-600 text-slate-950 text-xs font-bold cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                {t.coordinatorAdd}
              </button>
              <button
                type="button"
                onClick={exportList}
                disabled={busy}
                className={`inline-flex items-center gap-1.5 px-3 py-2 rounded-lg border text-xs font-bold cursor-pointer ${
                  isLight ? 'border-slate-200 hover:border-amber-500' : 'border-slate-700 hover:border-amber-500'
                }`}
              >
                <FileSpreadsheet className="w-3.5 h-3.5" />
                {t.coordinatorExport}
              </button>
            </div>

            <div className="flex-1 overflow-auto px-5 py-4">
              {loading ? (
                <p className="text-sm text-slate-500">{t.coordinatorLoading}</p>
              ) : rows.length === 0 && editingId !== 'new' ? (
                <p className="text-sm text-slate-500">{t.coordinatorEmpty}</p>
              ) : (
                <table className="min-w-full text-left border-separate border-spacing-y-2">
                  <thead>
                    <tr>
                      {columns.map((column) => (
                        <th key={column.key} className="text-[10px] uppercase tracking-wider text-slate-500 font-bold px-2 py-1 whitespace-nowrap">
                          {column.label}
                        </th>
                      ))}
                      <th className="text-[10px] uppercase tracking-wider text-slate-500 font-bold px-2 py-1">{t.coordinatorActions}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {editingId === 'new' && draft && (
                      <tr className={isLight ? 'bg-amber-50' : 'bg-amber-500/10'}>
                        {columns.map((column) => (
                          <td key={column.key} className="px-2 py-1 align-top">
                            <CellInput
                              column={column}
                              value={draft.values[column.key] || ''}
                              isLight={isLight}
                              onChange={(value) => setDraft((prev) => prev ? { ...prev, values: { ...prev.values, [column.key]: value } } : prev)}
                            />
                          </td>
                        ))}
                        <td className="px-2 py-1 align-top whitespace-nowrap">
                          <button type="button" onClick={saveRow} disabled={busy} className="inline-flex items-center gap-1 px-2 py-1 rounded-lg bg-amber-500 text-slate-950 text-[11px] font-bold mr-1 cursor-pointer">
                            <Save className="w-3 h-3" />
                            {t.coordinatorSave}
                          </button>
                          <button type="button" onClick={cancelEdit} className="text-[11px] font-bold text-slate-500 cursor-pointer">
                            {t.btnCancel}
                          </button>
                        </td>
                      </tr>
                    )}
                    {rows.map((row) => {
                      const editing = editingId === row.id && draft;
                      return (
                        <tr key={row.id} className={isLight ? 'bg-slate-50' : 'bg-slate-900/50'}>
                          {columns.map((column) => (
                            <td key={column.key} className="px-2 py-1 align-top">
                              {editing ? (
                                <CellInput
                                  column={column}
                                  value={draft.values[column.key] || ''}
                                  isLight={isLight}
                                  onChange={(value) => setDraft((prev) => prev ? { ...prev, values: { ...prev.values, [column.key]: value } } : prev)}
                                />
                              ) : (
                                <span className="text-xs whitespace-pre-wrap">{column.type === 'readonly' && row.values[column.key] ? new Date(row.values[column.key]).toLocaleString() : (row.values[column.key] || '—')}</span>
                              )}
                            </td>
                          ))}
                          <td className="px-2 py-1 align-top whitespace-nowrap">
                            {editing ? (
                              <>
                                <button type="button" onClick={saveRow} disabled={busy} className="inline-flex items-center gap-1 px-2 py-1 rounded-lg bg-amber-500 text-slate-950 text-[11px] font-bold mr-1 cursor-pointer">
                                  <Save className="w-3 h-3" />
                                  {t.coordinatorSave}
                                </button>
                                <button type="button" onClick={cancelEdit} className="text-[11px] font-bold text-slate-500 cursor-pointer">
                                  {t.btnCancel}
                                </button>
                              </>
                            ) : (
                              <>
                                <button type="button" onClick={() => startEdit(row)} className="text-[11px] font-bold text-amber-600 mr-2 cursor-pointer">
                                  {t.coordinatorEdit}
                                </button>
                                <button type="button" onClick={() => removeRow(row.id)} className="inline-flex items-center gap-1 text-[11px] font-bold text-rose-500 cursor-pointer">
                                  <Trash2 className="w-3 h-3" />
                                  {t.coordinatorDelete}
                                </button>
                              </>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              )}
              {message && (
                <p className={`text-xs mt-3 ${message.type === 'success' ? 'text-emerald-500' : 'text-rose-500'}`}>
                  {message.text}
                </p>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
