'use client';

import React, { useState, useTransition, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useLanguage } from '@/lib/LanguageContext';
import { submitLead } from '@/lib/actions';
import { downloadAssetFile } from '@/lib/client-download';
import { 
  BookOpen, 
  Sparkles, 
  Download, 
  RefreshCw, 
  FileText, 
  CheckCircle2, 
  ArrowLeft, 
  Globe2 
} from 'lucide-react';

interface DevotionalDownloadClientProps {
  settings: Record<string, string>;
}

export default function DevotionalDownloadClient({ settings }: DevotionalDownloadClientProps) {
  const router = useRouter();
  const { language, setLanguage, t } = useLanguage();

  // Form states
  const [leadName, setLeadName] = useState('');
  const [leadEmail, setLeadEmail] = useState('');
  const [leadPhone, setLeadPhone] = useState('');
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [downloadError, setDownloadError] = useState('');
  const [countdown, setCountdown] = useState(5);

  const themePrimary = settings.theme_primary || '#f59e0b';
  const themeHover = settings.theme_hover || '#d97706';
  const themeAccent = settings.theme_accent || '#3b82f6';
  const themeMode = settings.theme_mode || 'dark';
  const isLight = themeMode === 'light';

  // Styles
  const bgMain = isLight ? 'bg-slate-50 text-slate-900' : 'bg-slate-950 text-slate-100';
  const bgCard = isLight ? 'bg-white border border-slate-200 shadow-xl' : 'bg-slate-900 border border-slate-800 shadow-2xl';
  const bgInput = isLight ? 'bg-slate-50 border border-slate-250 text-slate-900 focus:bg-white focus:ring-2 focus:ring-amber-500/10' : 'bg-slate-950 border border-slate-800 text-slate-100 focus:ring-2 focus:ring-blue-500/10';
  const textTitle = isLight ? 'text-slate-900' : 'text-white';
  const textBody = isLight ? 'text-slate-700' : 'text-slate-300';
  const borderMain = isLight ? 'border-slate-200' : 'border-slate-900';

  const giftTitle = language === 'fr_ht' 
    ? (settings.free_gift_title_kreyol || 'Méditations Parousie 2026')
    : (settings.free_gift_title_english || 'Parousie Devotional 2026');

  const giftDesc = language === 'fr_ht'
    ? (settings.free_gift_desc_kreyol || 'Recevez gratuitement ce recueil de méditations et de versets pour nourrir votre foi au quotidien.')
    : (settings.free_gift_desc_english || t.leadSectionSubtitle);

  const fileUrl = settings.free_gift_file_url || '/devotional_parousie_2026.txt';
  const fallbackFileUrl = '/devotional_parousie_2026.txt';

  const toggleLanguage = () => {
    setLanguage(language === 'fr_ht' ? 'en' : 'fr_ht');
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!leadName || !leadEmail || !leadPhone) {
      setError(language === 'fr_ht' ? 'Veuillez remplir tous les champs.' : 'Please fill out all fields.');
      return;
    }

    setError('');
    startTransition(async () => {
      try {
        const res = await submitLead(leadName, leadEmail, leadPhone);
        if (res.success) {
          setSubmitted(true);
          setDownloadError('');

          const downloadRes = await downloadAssetFile(fileUrl, fallbackFileUrl);
          if (!downloadRes.success) {
            setDownloadError(
              language === 'fr_ht'
                ? 'Votre inscription a réussi, mais le fichier de dévotion n’est pas disponible pour le moment. Veuillez contacter l’église.'
                : downloadRes.error || 'Your signup succeeded, but the devotional file is unavailable right now. Please contact the church office.'
            );
          }
        } else {
          setError(res.error || (language === 'fr_ht' ? 'Une erreur est survenue. Veuillez réessayer.' : 'An error occurred. Please try again.'));
        }
      } catch (err: any) {
        setError(err.message || (language === 'fr_ht' ? 'Une erreur est survenue. Veuillez réessayer.' : 'An error occurred. Please try again.'));
      }
    });
  };

  // Handle countdown and auto-redirection on success
  useEffect(() => {
    if (!submitted) return;

    const interval = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          router.push('/');
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [submitted, router]);

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

      {/* Top Premium Bar with Language Toggle & Home link */}
      <header className={`border-b ${borderMain} py-4 px-6 md:px-12 flex justify-between items-center`}>
        <Link 
          href="/"
          className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-semibold transition-all duration-300 cursor-pointer ${
            isLight ? 'hover:bg-slate-100 text-slate-700' : 'hover:bg-slate-900 text-slate-300'
          }`}
        >
          <ArrowLeft className="w-4 h-4" />
          <span>{language === 'fr_ht' ? "Retour à l'accueil" : 'Back to Home'}</span>
        </Link>

        <button 
          onClick={toggleLanguage}
          className={`flex items-center gap-2 px-3 py-2 rounded-lg border text-sm font-semibold transition-all duration-300 cursor-pointer hover:scale-105 ${
            isLight ? 'bg-slate-100 hover:bg-slate-200 border-slate-200 text-slate-700' : 'bg-slate-900 hover:bg-slate-800 border-slate-800 text-amber-400'
          }`}
        >
          <Globe2 className="w-4 h-4" />
          <span>{language === 'fr_ht' ? 'English' : 'Français'}</span>
        </button>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 flex items-center justify-center p-4 md:p-12 relative overflow-hidden">
        {/* Decorative background blobs */}
        <div className={`absolute -top-40 -left-40 w-96 h-96 rounded-full blur-3xl pointer-events-none ${isLight ? 'bg-amber-500/5' : 'bg-amber-500/10'}`} />
        <div className={`absolute -bottom-40 -right-40 w-96 h-96 rounded-full blur-3xl pointer-events-none ${isLight ? 'bg-blue-500/5' : 'bg-blue-500/10'}`} />

        <div className={`max-w-4xl w-full rounded-3xl ${bgCard} p-6 md:p-12 relative overflow-hidden z-10`}>
          {/* Accent line top */}
          <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-amber-500 via-blue-500 to-amber-600" />

          <div className="grid md:grid-cols-5 gap-8 md:gap-12 items-center">
            
            {/* Left side: Premium Devotional Showcase */}
            <div className="md:col-span-2 flex flex-col items-center text-center md:text-left md:items-start">
              <div className={`relative w-44 h-60 rounded-2xl shadow-2xl overflow-hidden flex flex-col justify-between p-6 ${
                isLight 
                  ? 'bg-gradient-to-b from-amber-50 to-slate-100 border border-slate-200' 
                  : 'bg-gradient-to-b from-slate-900 to-slate-950 border border-slate-800'
              } group hover:scale-105 transition-all duration-300`}>
                {/* Book spine */}
                <div className="absolute left-0 top-0 h-full w-3 bg-gradient-to-r from-amber-600 to-amber-500/50 rounded-l-2xl" />

                <div className="flex justify-between items-start pl-2">
                  <Sparkles className="w-5 h-5 text-amber-500 animate-pulse" />
                  <span className="text-[10px] font-bold tracking-widest text-amber-500 uppercase">{language === 'fr_ht' ? 'Gratuit' : 'Free'}</span>
                </div>

                <div className="pl-2 my-auto">
                  <BookOpen className="w-12 h-12 text-blue-500 mb-3" />
                  <h5 className={`font-serif font-extrabold text-sm leading-tight ${textTitle}`}>
                    {giftTitle}
                  </h5>
                  <p className={`text-[10px] mt-1 ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
                    {language === 'fr_ht' ? 'Méditations et versets' : 'Meditations & Verses'}
                  </p>
                </div>

                <div className="pl-2 flex justify-between items-center text-[8px] font-semibold border-t border-slate-200/20 pt-2">
                  <span className={isLight ? 'text-slate-500' : 'text-slate-400'}>Église Parousie</span>
                </div>
              </div>

              <h2 className={`text-2xl md:text-3xl font-extrabold font-serif ${textTitle} mt-6 mb-3`}>
                {giftTitle}
              </h2>
              <p className={`text-sm ${textBody} leading-relaxed`}>
                {giftDesc}
              </p>
            </div>

            {/* Right side: Interactive Form or Success View */}
            <div className="md:col-span-3">
              {!submitted ? (
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="border-l-4 border-amber-500 pl-4 py-1 mb-2">
                    <h3 className={`text-lg font-bold ${textTitle}`}>
                      {language === 'fr_ht' ? 'Inscrivez-vous pour télécharger' : 'Subscribe to Download'}
                    </h3>
                    <p className="text-xs text-slate-400">
                      {language === 'fr_ht' ? 'Ce cadeau vous est offert gratuitement' : 'This gift is completely free for you'}
                    </p>
                  </div>

                  {error && (
                    <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-500 text-xs font-semibold">
                      {error}
                    </div>
                  )}

                  <div>
                    <label className={`block text-xs font-bold uppercase tracking-wider mb-2 ${isLight ? 'text-slate-700' : 'text-slate-300'}`}>
                      {t.leadFieldName}
                    </label>
                    <input 
                      type="text" 
                      required
                      value={leadName}
                      onChange={(e) => setLeadName(e.target.value)}
                      placeholder="Jean-Claude Pierre"
                      className={`w-full px-4 py-3 rounded-xl text-sm ${bgInput} focus:outline-none focus:border-amber-500 transition-all`}
                    />
                  </div>

                  <div>
                    <label className={`block text-xs font-bold uppercase tracking-wider mb-2 ${isLight ? 'text-slate-700' : 'text-slate-300'}`}>
                      {t.leadFieldEmail}
                    </label>
                    <input 
                      type="email" 
                      required
                      value={leadEmail}
                      onChange={(e) => setLeadEmail(e.target.value)}
                      placeholder="jean@example.com"
                      className={`w-full px-4 py-3 rounded-xl text-sm ${bgInput} focus:outline-none focus:border-amber-500 transition-all`}
                    />
                  </div>

                  <div>
                    <label className={`block text-xs font-bold uppercase tracking-wider mb-2 ${isLight ? 'text-slate-700' : 'text-slate-300'}`}>
                      {t.leadFieldPhone}
                    </label>
                    <input 
                      type="tel" 
                      required
                      value={leadPhone}
                      onChange={(e) => setLeadPhone(e.target.value)}
                      placeholder="954-555-1234"
                      className={`w-full px-4 py-3 rounded-xl text-sm ${bgInput} focus:outline-none focus:border-amber-500 transition-all`}
                    />
                  </div>

                  <button 
                    type="submit"
                    disabled={isPending}
                    className="w-full py-4 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-slate-950 font-extrabold text-sm shadow-lg shadow-amber-500/20 hover:shadow-amber-500/40 hover:scale-[1.01] active:scale-[0.99] transition-all cursor-pointer flex items-center justify-center gap-2"
                  >
                    {isPending ? (
                      <>
                        <RefreshCw className="w-4 h-4 animate-spin" />
                        <span>{t.btnLoading}</span>
                      </>
                    ) : (
                      <>
                        <Download className="w-4 h-4" />
                        <span>{t.leadBtnSubmit}</span>
                      </>
                    )}
                  </button>
                </form>
              ) : (
                <div className="text-center py-6 flex flex-col items-center">
                  <div className="w-16 h-16 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center mb-6 animate-bounce">
                    <CheckCircle2 className="w-8 h-8" />
                  </div>
                  <h3 className={`text-2xl font-extrabold ${textTitle} mb-3`}>
                    {t.leadSuccessTitle}
                  </h3>
                  <p className={`text-sm ${textBody} leading-relaxed max-w-md mb-8`}>
                    {language === 'fr_ht'
                      ? downloadError
                        ? "Merci pour votre inscription. Le téléchargement automatique n'a pas pu démarrer."
                        : "Merci ! Votre téléchargement a démarré automatiquement. Vous serez bientôt redirigé vers la page d'accueil."
                      : downloadError
                        ? 'Thank you for signing up. The automatic download could not start.'
                        : 'Thank you! Your download has started automatically. You will be returned to the home page shortly.'}
                  </p>

                  {downloadError && (
                    <div className="w-full max-w-md mb-6 p-4 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-500 text-xs font-semibold">
                      {downloadError}
                    </div>
                  )}

                  <div className="flex flex-col items-center gap-4 w-full">
                    {/* Progress Indicator */}
                    <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden max-w-xs">
                      <div 
                        className="bg-amber-500 h-full transition-all duration-1000 ease-linear"
                        style={{ width: `${(countdown / 5) * 100}%` }}
                      />
                    </div>
                    
                    <span className="text-xs text-slate-400 font-medium">
                      {language === 'fr_ht' 
                        ? `Retour à la page d'accueil dans ${countdown} secondes...`
                        : `Returning to home page in ${countdown} seconds...`}
                    </span>

                    <button 
                      onClick={() => router.push('/')}
                      className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs shadow-lg active:scale-95 transition-all mt-4"
                    >
                      <ArrowLeft className="w-4 h-4" />
                      <span>{language === 'fr_ht' ? 'Retourner maintenant' : 'Return Now'}</span>
                    </button>
                  </div>
                </div>
              )}
            </div>

          </div>
        </div>
      </main>
    </div>
  );
}
