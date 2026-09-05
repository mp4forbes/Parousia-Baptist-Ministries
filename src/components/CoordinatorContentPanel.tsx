'use client';

import React from 'react';
import { X } from 'lucide-react';
import { useLanguage } from '@/lib/LanguageContext';

interface CoordinatorContentPanelProps {
  open: boolean;
  title: string;
  subtitle?: string;
  isLight: boolean;
  onClose: () => void;
  children: React.ReactNode;
}

export default function CoordinatorContentPanel({
  open,
  title,
  subtitle,
  isLight,
  onClose,
  children,
}: CoordinatorContentPanelProps) {
  const { t } = useLanguage();

  if (!open) return null;

  const panel = isLight
    ? 'bg-white border-slate-200 text-slate-900'
    : 'bg-slate-950 border-slate-800 text-white';

  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center p-3 sm:p-6 bg-slate-950/70 backdrop-blur-sm">
      <div className={`w-full max-w-6xl max-h-[92vh] rounded-3xl border shadow-2xl ${panel} flex flex-col overflow-hidden`}>
        <div className={`flex items-start justify-between gap-3 px-5 py-4 border-b ${isLight ? 'border-slate-200' : 'border-slate-800'}`}>
          <div className="min-w-0">
            <h2 className="text-lg font-bold font-serif">{title}</h2>
            {subtitle && (
              <p className={`text-xs mt-1 ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>{subtitle}</p>
            )}
          </div>
          <button
            type="button"
            onClick={onClose}
            className={`p-1.5 rounded-lg shrink-0 ${isLight ? 'hover:bg-slate-100 text-slate-500' : 'hover:bg-slate-900 text-slate-400'} cursor-pointer`}
            aria-label={t.coordinatorClose}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 overflow-auto px-5 py-4">{children}</div>

        <div className={`px-5 py-3 border-t flex justify-end ${isLight ? 'border-slate-200 bg-slate-50' : 'border-slate-800 bg-slate-900/60'}`}>
          <button
            type="button"
            onClick={onClose}
            className={`px-4 py-2 rounded-xl text-xs font-bold cursor-pointer ${
              isLight
                ? 'bg-slate-200 hover:bg-slate-300 text-slate-800'
                : 'bg-slate-800 hover:bg-slate-700 text-slate-200'
            }`}
          >
            {t.coordinatorExitClose}
          </button>
        </div>
      </div>
    </div>
  );
}
