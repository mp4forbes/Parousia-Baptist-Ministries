'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useLanguage } from '@/lib/LanguageContext';
import { DailyDevotional } from '@/lib/db';
import { 
  BookOpen, 
  Sparkles, 
  ArrowLeft, 
  Globe2,
  Calendar,
  HeartHandshake
} from 'lucide-react';

interface DevotionalViewClientProps {
  devotional: DailyDevotional | null;
  settings: Record<string, string>;
}

export default function DevotionalViewClient({ devotional, settings }: DevotionalViewClientProps) {
  const router = useRouter();
  const { language, setLanguage, t } = useLanguage();

  const themePrimary = settings.theme_primary || '#f59e0b';
  const themeHover = settings.theme_hover || '#d97706';
  const themeAccent = settings.theme_accent || '#3b82f6';
  const themeMode = settings.theme_mode || 'dark';
  const isLight = themeMode === 'light';

  // State to track presentation language of the devotional itself (French, English, or bilingual side-by-side)
  const [devotionalLang, setDevotionalLang] = useState<'kreyol' | 'english' | 'bilingual'>('bilingual');

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
    verse_ref_english: "1 Thessalonians 4:16-17",
    verse_ref_kreyol: "1 Thessaloniciens 4:16-17",
    verse_text_english: "For the Lord himself will descend from heaven with a cry of command, with the voice of an archangel, and with the sound of the trumpet of God. And the dead in Christ will rise first. Then we who are alive, who are left, will be caught up together with them in the clouds to meet the Lord in the air, and so we will always be with the Lord.",
    verse_text_kreyol: "Car le Seigneur lui-même, à un signal donné, à la voix d'un archange et au son de la trompette de Dieu, descendra du ciel. Les morts en Christ ressusciteront d'abord. Ensuite, nous les vivants qui serons restés, nous serons tous ensemble enlevés avec eux sur des nuées, à la rencontre du Seigneur dans les airs, et ainsi nous serons toujours avec le Seigneur.",
    lesson_english: "This powerful passage reminds us of our ultimate hope and the glorious reunion that awaits all believers. Even in times of temporary parting or earthly struggles, we are comforted by the promise of Christ's return and eternal fellowship. Let this assurance fill your heart with peace, strengthen your faith, and encourage you to serve the Lord with joyful anticipation today.",
    lesson_kreyol: "Ce passage puissant nous rappelle notre espérance suprême et les glorieuses retrouvailles qui attendent tous les croyants. Même dans les moments de séparation ou les épreuves terrestres, la promesse du retour du Christ et de la communion éternelle nous réconforte. Que cette assurance remplisse votre cœur de paix, fortifie votre foi et vous encourage à servir le Seigneur aujourd'hui dans la joie et l'attente."
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

        <button 
          onClick={toggleLanguage}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl border text-sm font-bold transition-all duration-300 cursor-pointer hover:scale-105 ${
            isLight ? 'bg-slate-100 hover:bg-slate-200 border-slate-200 text-slate-700' : 'bg-slate-900 hover:bg-slate-800 border-slate-800 text-amber-400'
          }`}
        >
          <Globe2 className="w-4 h-4" />
          <span>{t.btnToggleLanguage}</span>
        </button>
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

          {/* SCRIPTURE CARD */}
          <div className={`w-full rounded-3xl ${bgCard} overflow-hidden group`}>
            {/* Visual Header accent */}
            <div className="w-full h-1.5 bg-gradient-to-r from-amber-500 via-blue-500 to-amber-600" />
            
            <div className="p-8 md:p-12 relative">
              <BookOpen className={`absolute right-10 bottom-10 w-40 h-40 ${isLight ? 'text-slate-200/20' : 'text-slate-800/5'} -rotate-12 select-none pointer-events-none`} />

              {/* Render Selected Presentation Layout */}
              <div className="space-y-8 relative z-10">
                
                {/* 1. French Presentation */}
                {(devotionalLang === 'kreyol' || devotionalLang === 'bilingual') && (
                  <div className="space-y-6 notranslate" translate="no">
                    {devotionalLang === 'bilingual' && (
                      <span className="text-[10px] font-black uppercase tracking-widest text-blue-500 border border-blue-500/20 px-2 py-0.5 rounded">
                        Français
                      </span>
                    )}
                    <blockquote className={`text-xl md:text-2xl font-serif leading-relaxed italic ${isLight ? 'text-slate-800' : 'text-slate-100'}`}>
                      &ldquo;{activeDevotional.verse_text_kreyol}&rdquo;
                    </blockquote>
                    <div className="flex justify-end">
                      <span className="px-4 py-1.5 rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-400 text-xs font-bold uppercase tracking-wider">
                        {activeDevotional.verse_ref_kreyol}
                      </span>
                    </div>
                  </div>
                )}

                {/* Divider for bilingual side-by-side */}
                {devotionalLang === 'bilingual' && (
                  <hr className="border-dashed border-slate-200/10 my-8" />
                )}

                {/* 2. English Presentation */}
                {(devotionalLang === 'english' || devotionalLang === 'bilingual') && (
                  <div className="space-y-6">
                    {devotionalLang === 'bilingual' && (
                      <span className="text-[10px] font-black uppercase tracking-widest text-amber-500 border border-amber-500/20 px-2 py-0.5 rounded">
                        English
                      </span>
                    )}
                    <blockquote className={`text-xl md:text-2xl font-serif leading-relaxed italic ${isLight ? 'text-slate-800' : 'text-slate-100'}`}>
                      &ldquo;{activeDevotional.verse_text_english}&rdquo;
                    </blockquote>
                    <div className="flex justify-end">
                      <span className="px-4 py-1.5 rounded-lg bg-blue-500/10 border border-blue-500/20 text-blue-400 text-xs font-bold uppercase tracking-wider">
                        {activeDevotional.verse_ref_english}
                      </span>
                    </div>
                  </div>
                )}

              </div>
            </div>
          </div>

          {/* PASTORAL REFLECTION LESSON */}
          <div className={`w-full rounded-3xl ${bgCard} p-8 md:p-12 relative overflow-hidden`}>
            <div className="absolute top-0 left-0 w-2 h-full bg-gradient-to-b from-amber-500 to-blue-600" />
            <HeartHandshake className={`absolute right-10 bottom-10 w-28 h-24 ${isLight ? 'text-slate-200/20' : 'text-slate-800/5'} select-none pointer-events-none`} />

            <div className="relative z-10 flex flex-col gap-6">
              <div className="border-l-4 border-amber-500 pl-4 py-1">
                <h3 className={`text-lg md:text-xl font-bold font-serif ${textTitle}`}>
                  {language === 'fr_ht' ? 'Méditation et enseignement pastoral' : 'Pastoral Meditation & Lesson'}
                </h3>
                <p className="text-xs text-slate-400">
                  {language === 'fr_ht' ? 'Des paroles encourageantes pour grandir dans la foi' : 'Encouraging application words for spiritual growth'}
                </p>
              </div>

              <div className="grid md:grid-cols-1 gap-6 mt-2">
                
                {/* 1. French Reflection */}
                {(devotionalLang === 'kreyol' || devotionalLang === 'bilingual') && (
                  <div className="space-y-2 notranslate" translate="no">
                    {devotionalLang === 'bilingual' && (
                      <span className="text-[10px] font-bold text-blue-500">
                        Français :
                      </span>
                    )}
                    <p className={`text-sm md:text-base leading-relaxed ${textBody} font-serif whitespace-pre-line`}>
                      {activeDevotional.lesson_kreyol}
                    </p>
                  </div>
                )}

                {/* Divider for bilingual side-by-side */}
                {devotionalLang === 'bilingual' && (
                  <hr className="border-dashed border-slate-200/10 my-4" />
                )}

                {/* 2. English Reflection */}
                {(devotionalLang === 'english' || devotionalLang === 'bilingual') && (
                  <div className="space-y-2">
                    {devotionalLang === 'bilingual' && (
                      <span className="text-[10px] font-bold text-amber-500">
                        English:
                      </span>
                    )}
                    <p className={`text-sm md:text-base leading-relaxed ${textBody} font-serif whitespace-pre-line`}>
                      {activeDevotional.lesson_english}
                    </p>
                  </div>
                )}

              </div>
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
