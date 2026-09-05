'use client';

import React, { useState } from 'react';
import { useLanguage } from '@/lib/LanguageContext';
import { DailyDevotional } from '@/lib/db';
import { FALLBACK_DEVOTIONAL } from '@/lib/devotional-presets';
import { composeDevotionalBody, devotionalInterpretation } from '@/lib/devotional-format';
import { 
  Sparkles, 
  ArrowLeft, 
  Globe2,
  Calendar,
  HeartHandshake,
  Copy,
  Check
} from 'lucide-react';
import CoordinatorContentManagerButton from '@/components/CoordinatorContentManagerButton';

interface DevotionalViewClientProps {
  devotional: DailyDevotional | null;
  settings: Record<string, string>;
}

export default function DevotionalViewClient({ devotional, settings }: DevotionalViewClientProps) {
  const { language, setLanguage, t } = useLanguage();

  const themePrimary = settings.theme_primary || '#f59e0b';
  const themeHover = settings.theme_hover || '#d97706';
  const themeAccent = settings.theme_accent || '#3b82f6';
  const themeMode = settings.theme_mode || 'dark';
  const isLight = themeMode === 'light';

  // State to track presentation language of the devotional itself (French, English, or bilingual side-by-side)
  const [devotionalLang, setDevotionalLang] = useState<'kreyol' | 'english' | 'bilingual'>('bilingual');

  const [copied, setCopied] = useState(false);

  // Sync state initially or on language toggle
  React.useEffect(() => {
    setDevotionalLang(language === 'fr_ht' ? 'kreyol' : 'english');
  }, [language]);

  // Styles
  const bgMain = isLight ? 'bg-slate-50 text-slate-900' : 'bg-slate-950 text-slate-100';
  const bgCard = isLight ? 'bg-white border border-slate-200 shadow-xl' : 'bg-slate-900/50 border border-slate-800 shadow-2xl';
  const textTitle = isLight ? 'text-slate-900' : 'text-white';
  const textBody = isLight ? 'text-slate-700' : 'text-slate-300';
  const borderMain = isLight ? 'border-slate-200' : 'border-slate-900';

  // Fallback / Cornerstone values (1 Thessalonians 4:16-17)
  const fallbackDevotional: Omit<DailyDevotional, 'id' | 'status'> = {
    date: new Date().toLocaleDateString('sv'),
    verse_ref_english: FALLBACK_DEVOTIONAL.refEn,
    verse_ref_kreyol: FALLBACK_DEVOTIONAL.refHt,
    verse_text_english: FALLBACK_DEVOTIONAL.textEn,
    verse_text_kreyol: FALLBACK_DEVOTIONAL.textHt,
    lesson_english: FALLBACK_DEVOTIONAL.lessonEn,
    lesson_kreyol: FALLBACK_DEVOTIONAL.lessonHt,
  };

  const activeDevotional = devotional || fallbackDevotional;

  // Format Date for Display
  const formatDevotionalDate = (dateStr: string) => {
    try {
      const [year, month, day] = dateStr.split('-').map(Number);
      const date = new Date(year, month - 1, day);
      return date.toLocaleDateString(language === 'fr_ht' ? 'fr-FR' : 'en-US', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
    } catch (e) {
      return dateStr;
    }
  };

  const toggleLanguage = () => {
    setLanguage(language === 'fr_ht' ? 'en' : 'fr_ht');
  };

  const copyLessonForChat = async () => {
    const pieces: string[] = [];
    if (devotionalLang === 'kreyol' || devotionalLang === 'bilingual') {
      pieces.push(
        composeDevotionalBody(
          activeDevotional.verse_ref_kreyol,
          activeDevotional.verse_text_kreyol,
          activeDevotional.lesson_kreyol,
          'fr'
        )
      );
    }
    if (devotionalLang === 'english' || devotionalLang === 'bilingual') {
      pieces.push(
        composeDevotionalBody(
          activeDevotional.verse_ref_english,
          activeDevotional.verse_text_english,
          activeDevotional.lesson_english,
          'en'
        )
      );
    }
    try {
      await navigator.clipboard.writeText(pieces.join('\n\n———\n\n'));
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopied(false);
    }
  };

  const renderDevotionalSection = (
    ref: string,
    text: string,
    lesson: string,
    lang: 'en' | 'fr',
    label: string
  ) => {
    const scriptureLabel = lang === 'fr' ? 'Écriture' : 'Scripture';
    const interpretation = devotionalInterpretation(ref, text, lesson);

    return (
      <div className="space-y-5">
        {label ? (
          <span className="text-[10px] font-black uppercase tracking-widest text-blue-500">
            {label}
          </span>
        ) : null}

        <div className={`rounded-2xl border p-5 md:p-6 space-y-3 ${
          isLight ? 'bg-slate-50 border-slate-200' : 'bg-slate-950/40 border-slate-800'
        }`}>
          <p className={`text-sm font-bold uppercase tracking-wide ${isLight ? 'text-slate-600' : 'text-slate-300'}`}>
            {scriptureLabel}: {ref}
          </p>
          <blockquote className={`text-lg md:text-xl font-serif leading-relaxed italic ${
            isLight ? 'text-slate-800' : 'text-slate-100'
          }`}>
            &ldquo;{text}&rdquo;
          </blockquote>
        </div>

        <p className={`text-base md:text-lg leading-8 ${textBody} whitespace-pre-line`}>
          {interpretation}
        </p>
      </div>
    );
  };

  return (
    <div className={`flex flex-col min-h-screen ${bgMain} font-sans selection:bg-amber-500 selection:text-slate-950`}>
      <style dangerouslySetInnerHTML={{ __html: `
        :root {
          --primary-color: ${themePrimary};
          --primary-hover: ${themeHover};
          --accent-color: ${themeAccent};
          --background: ${isLight ? '#f8fafc' : '#090d16'};
          --foreground: ${isLight ? '#0f172a' : '#f8fafc'};
        }
      `}} />

      {/* Top Header Navigation */}
      <header className={`border-b ${borderMain} py-4 px-6 md:px-12 flex justify-between items-center bg-slate-900/10 backdrop-blur-md sticky top-0 z-50`}>
        <a 
          href="/"
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all duration-300 cursor-pointer ${
            isLight ? 'hover:bg-slate-100 text-slate-700' : 'hover:bg-slate-900 text-slate-300'
          }`}
        >
          <ArrowLeft className="w-4 h-4" />
          <span>{language === 'fr_ht' ? "Retour à l'accueil" : 'Back to Home'}</span>
        </a>

        <div className="flex items-center gap-2">
          <CoordinatorContentManagerButton kind="devotional" isLight={isLight} />
          <button 
            onClick={toggleLanguage}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl border text-sm font-bold transition-all duration-300 cursor-pointer hover:scale-105 ${
              isLight ? 'bg-slate-100 hover:bg-slate-200 border-slate-200 text-slate-700' : 'bg-slate-900 hover:bg-slate-800 border-slate-800 text-amber-400'
            }`}
          >
            <Globe2 className="w-4 h-4" />
            <span>{t.btnToggleLanguage}</span>
          </button>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col items-center py-12 px-4 md:px-8 relative overflow-hidden">
        {/* Ambient background decoration */}
        <div className={`absolute -top-40 -left-40 w-96 h-96 rounded-full blur-3xl pointer-events-none ${isLight ? 'bg-amber-500/5' : 'bg-amber-500/10'}`} />
        <div className={`absolute -bottom-40 -right-40 w-96 h-96 rounded-full blur-3xl pointer-events-none ${isLight ? 'bg-blue-500/5' : 'bg-blue-500/10'}`} />

        <div className="max-w-4xl w-full flex flex-col gap-6 relative z-10">
          
          {/* Header section */}
          <div className="text-center md:text-left flex flex-col md:flex-row md:justify-between md:items-end gap-4 pb-6 border-b border-slate-200/20">
            <div>
              <div className="flex items-center justify-center md:justify-start gap-2 text-amber-500 font-extrabold text-xs uppercase tracking-wider mb-2">
                <Sparkles className="w-4 h-4 animate-pulse" />
                <span>{language === 'fr_ht' ? 'Méditation du jour' : 'Daily Devotional'}</span>
              </div>
              <h1 className={`text-3xl md:text-4xl font-extrabold font-serif ${textTitle} tracking-tight`}>
                {language === 'fr_ht' ? 'Verset du jour' : 'Daily Scripture Verse'}
              </h1>
            </div>
            
            <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl border ${
              isLight ? 'bg-slate-100/80 border-slate-200 text-slate-700' : 'bg-slate-950/40 border-slate-800 text-slate-300'
            } text-xs font-semibold`}>
              <Calendar className="w-4 h-4 text-amber-500" />
              <span>{formatDevotionalDate(activeDevotional.date)}</span>
            </div>
          </div>

          {/* Devotional Language View Toggle Bar */}
          <div className="flex justify-center md:justify-start gap-1 p-1 bg-slate-900/30 rounded-xl border border-slate-200/10 self-center md:self-start">
            <button
              onClick={() => setDevotionalLang('kreyol')}
              className={`px-4 py-2 rounded-lg text-xs font-bold transition-all duration-200 cursor-pointer ${
                devotionalLang === 'kreyol'
                  ? 'bg-amber-500 text-slate-950 shadow-md'
                  : 'text-slate-400 hover:text-white hover:bg-white/5'
              }`}
            >
              Français
            </button>
            <button
              onClick={() => setDevotionalLang('english')}
              className={`px-4 py-2 rounded-lg text-xs font-bold transition-all duration-200 cursor-pointer ${
                devotionalLang === 'english'
                  ? 'bg-amber-500 text-slate-950 shadow-md'
                  : 'text-slate-400 hover:text-white hover:bg-white/5'
              }`}
            >
              English
            </button>
            <button
              onClick={() => setDevotionalLang('bilingual')}
              className={`px-4 py-2 rounded-lg text-xs font-bold transition-all duration-200 cursor-pointer ${
                devotionalLang === 'bilingual'
                  ? 'bg-amber-500 text-slate-950 shadow-md'
                  : 'text-slate-400 hover:text-white hover:bg-white/5'
              }`}
            >
              {language === 'fr_ht' ? 'Les deux (bilingue)' : 'Bilingual'}
            </button>
          </div>

          {/* Morning group-chat body */}
          <div className={`w-full rounded-3xl ${bgCard} overflow-hidden relative`}>
            <div className="w-full h-1.5 bg-gradient-to-r from-amber-500 via-blue-500 to-amber-600" />
            <div className="absolute top-0 left-0 w-2 h-full bg-gradient-to-b from-amber-500 to-blue-600" />
            <HeartHandshake className={`absolute right-10 bottom-10 w-28 h-24 ${isLight ? 'text-slate-200/20' : 'text-slate-800/5'} select-none pointer-events-none`} />

            <div className="p-8 md:p-12 relative z-10 flex flex-col gap-6">
              <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
                <div className="border-l-4 border-amber-500 pl-4 py-1">
                  <h3 className={`text-lg md:text-xl font-bold font-serif ${textTitle}`}>
                    {language === 'fr_ht' ? 'Méditation du matin' : 'Morning Devotional'}
                  </h3>
                  <p className="text-xs text-slate-400">
                    {language === 'fr_ht'
                      ? 'Format groupe : à copier pour WhatsApp, Discord ou Slack'
                      : 'Group-chat format — copy for WhatsApp, Discord, or Slack'}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={copyLessonForChat}
                  className={`inline-flex items-center gap-2 self-start px-3 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                    isLight
                      ? 'bg-slate-100 hover:bg-slate-200 border border-slate-200 text-slate-700'
                      : 'bg-slate-950/60 hover:bg-slate-900 border border-slate-800 text-slate-300'
                  }`}
                >
                  {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>
                    {copied
                      ? language === 'fr_ht' ? 'Copié' : 'Copied'
                      : language === 'fr_ht' ? 'Copier pour le groupe' : 'Copy for group chat'}
                  </span>
                </button>
              </div>

              {(devotionalLang === 'kreyol' || devotionalLang === 'bilingual') && (
                <div className="notranslate" translate="no">
                  {renderDevotionalSection(
                    activeDevotional.verse_ref_kreyol,
                    activeDevotional.verse_text_kreyol,
                    activeDevotional.lesson_kreyol,
                    'fr',
                    devotionalLang === 'bilingual' ? 'Français' : ''
                  )}
                </div>
              )}

              {devotionalLang === 'bilingual' && (
                <hr className="border-dashed border-slate-200/20" />
              )}

              {(devotionalLang === 'english' || devotionalLang === 'bilingual') && (
                <div>
                  {renderDevotionalSection(
                    activeDevotional.verse_ref_english,
                    activeDevotional.verse_text_english,
                    activeDevotional.lesson_english,
                    'en',
                    devotionalLang === 'bilingual' ? 'English' : ''
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Signature/Warm Outro */}
          <div className="text-center py-6">
            <p className="text-xs text-slate-500 italic font-serif">
              {language === 'fr_ht' 
                ? '« Ainsi, nous serons toujours avec le Seigneur. » — Église Baptiste de la Parousie'
                : '“And so we will always be with the Lord.” — Parousia Baptist Church'}
            </p>
          </div>

        </div>
      </main>
    </div>
  );
}
