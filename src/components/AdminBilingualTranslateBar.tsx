'use client';

import React from 'react';
import { Wand2 } from 'lucide-react';
import { TranslateDirection } from '@/lib/admin-translate';

interface AdminBilingualTranslateBarProps {
  language: 'en' | 'fr_ht';
  direction: TranslateDirection;
  onDirectionChange: (direction: TranslateDirection) => void;
  onTranslate: () => void;
  isTranslating?: boolean;
  className?: string;
}

export default function AdminBilingualTranslateBar({
  language,
  direction,
  onDirectionChange,
  onTranslate,
  isTranslating = false,
  className = '',
}: AdminBilingualTranslateBarProps) {
  const isHt = language === 'fr_ht';

  return (
    <div className={`rounded-2xl border border-amber-500/20 bg-amber-500/5 p-4 space-y-3 ${className}`}>
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3">
        <div>
          <p className="text-xs font-bold text-amber-400 uppercase tracking-wider">
            {isHt ? 'Traduction automatique' : 'Auto-Translation'}
          </p>
          <p className="text-[11px] text-slate-400 mt-1 leading-relaxed max-w-2xl">
            {isHt
              ? 'Vous pouvez écrire dans une langue et remplir automatiquement l’autre. Vérifiez toujours la traduction avant de l’enregistrer.'
              : 'Write in one language and fill the other automatically. Always review the translation before saving.'}
          </p>
        </div>

        <button
          type="button"
          onClick={onTranslate}
          disabled={isTranslating}
          className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 disabled:opacity-50 text-slate-950 text-xs font-bold transition-all inline-flex items-center justify-center gap-2 cursor-pointer shrink-0"
        >
          <Wand2 className={`w-3.5 h-3.5 ${isTranslating ? 'animate-spin' : ''}`} />
          <span>
            {isTranslating
              ? isHt
                ? 'Traduction en cours...'
                : 'Translating...'
              : isHt
                ? 'Traduire maintenant'
                : 'Translate Now'}
          </span>
        </button>
      </div>

      <div className="flex flex-wrap gap-2">
        {([
          { value: 'auto' as const, labelHt: 'Automatique (remplir la langue vide)', labelEn: 'Auto (fill empty language)' },
          { value: 'fr_ht_to_en' as const, labelHt: 'Français → Anglais', labelEn: 'French → English' },
          { value: 'en_to_fr_ht' as const, labelHt: 'Anglais → Français', labelEn: 'English → French' },
        ]).map((option) => (
          <button
            key={option.value}
            type="button"
            onClick={() => onDirectionChange(option.value)}
            className={`px-3 py-1.5 rounded-lg text-[11px] font-bold border transition-all cursor-pointer ${
              direction === option.value
                ? 'bg-amber-500 border-amber-500 text-slate-950'
                : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-white hover:border-slate-700'
            }`}
          >
            {isHt ? option.labelHt : option.labelEn}
          </button>
        ))}
      </div>
    </div>
  );
}
