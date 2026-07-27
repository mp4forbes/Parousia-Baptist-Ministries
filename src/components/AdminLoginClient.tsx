'use client';

import React, { useState, useTransition, useEffect } from 'react';
import { useLanguage } from '@/lib/LanguageContext';
import { requestAdminOtp, verifyAdminOtp } from '@/lib/actions';
import { useRouter } from 'next/navigation';
import { Lock, Eye, EyeOff, Sparkles, Church, Globe2, Clock, Mail, Key, ArrowLeft } from 'lucide-react';

interface AdminLoginClientProps {
  logoUrl?: string;
  themePrimary?: string;
  themeHover?: string;
  themeAccent?: string;
}

export default function AdminLoginClient({ 
  logoUrl = '/logo.png', 
  themePrimary = '#f59e0b', 
  themeHover = '#d97706', 
  themeAccent = '#3b82f6' 
}: AdminLoginClientProps) {
  const { language, setLanguage, t } = useLanguage();
  const router = useRouter();
  
  // Multi-step authentication states
  const [step, setStep] = useState<1 | 2>(1);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [otpCode, setOtpCode] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [deviceHash, setDeviceHash] = useState('');
  
  // Error & UI states
  const [error, setError] = useState('');
  const [isPending, startTransition] = useTransition();
  const [timer, setTimer] = useState(600); // 10 mins

  // Retrieve or generate persistent device identifier in client browser
  useEffect(() => {
    let hash = localStorage.getItem('parousia_device_hash');
    if (!hash) {
      hash = 'dev_device_' + Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
      localStorage.setItem('parousia_device_hash', hash);
    }
    setDeviceHash(hash);
  }, []);

  // Timer countdown for Step 2
  useEffect(() => {
    if (step !== 2 || timer <= 0) return;
    const interval = setInterval(() => {
      setTimer(prev => prev - 1);
    }, 1000);
    return () => clearInterval(interval);
  }, [step, timer]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // Step 1: Submit email + access code
  const handleRequestOtp = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !password.trim()) {
      setError(language === 'fr_ht' ? 'Tanpri ranpli tout jaden yo.' : 'Please fill out all fields.');
      return;
    }
    setError('');

    startTransition(async () => {
      const res = await requestAdminOtp(email, password, deviceHash);
      if (res.success) {
        if (res.otpRequired) {
          setTimer(600); // reset timer
          setStep(2);
        } else {
          // Device already verified, log in immediately
          router.push('/admin/dashboard');
          router.refresh();
        }
      } else {
        setError(res.error || t.adminErrorMsg);
      }
    });
  };

  // Step 2: Submit 6-digit OTP code
  const handleVerifyOtp = (e: React.FormEvent) => {
    e.preventDefault();
    if (!otpCode.trim() || otpCode.trim().length !== 6) {
      setError(language === 'fr_ht' ? 'Tanpri antre yon kòd 6 chif ki valid.' : 'Please enter a valid 6-digit code.');
      return;
    }
    if (timer <= 0) {
      setError(language === 'fr_ht' ? 'Kòd la ekspire. Tanpri tounen dèyè epi mande yon lòt.' : 'Verification code expired. Please go back and request a new one.');
      return;
    }
    setError('');

    startTransition(async () => {
      const res = await verifyAdminOtp(email, otpCode, deviceHash);
      if (res.success) {
        router.push('/admin/dashboard');
        router.refresh();
      } else {
        setError(res.error || (language === 'fr_ht' ? 'Kòd la pa korèk.' : 'Invalid code.'));
      }
    });
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-950 text-slate-100 px-4 relative overflow-hidden font-sans">
      <style dangerouslySetInnerHTML={{ __html: `
        :root {
          --primary-color: ${themePrimary};
          --primary-hover: ${themeHover};
          --accent-color: ${themeAccent};
        }
      `}} />

      {/* Background glow effects */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-blue-600/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />

      {/* Floating Language Toggler on top right */}
      <div className="absolute top-6 right-6 z-10">
        <button 
          onClick={() => setLanguage(language === 'fr_ht' ? 'en' : 'fr_ht')}
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-900 border border-slate-800 text-sm font-semibold hover:border-amber-500 text-amber-400 cursor-pointer transition-all hover:scale-105"
        >
          <Globe2 className="w-4 h-4" />
          <span>{language === 'fr_ht' ? 'English' : 'Kreyòl'}</span>
        </button>
      </div>

      <div className="w-full max-w-md relative z-10">
        
        {/* Header Branding */}
        <div className="flex flex-col items-center mb-8 text-center">
          <div className="relative flex items-center justify-center w-16 h-16 rounded-2xl bg-white border border-slate-800 overflow-hidden shadow-2xl mb-4 p-0.5">
            <img src={logoUrl} alt="Parousia Baptist Ministries Logo" className="w-full h-full object-contain" />
          </div>
          <h2 className="text-2xl md:text-3xl font-extrabold font-serif text-white tracking-tight leading-tight">{t.churchName}</h2>
          <p className="text-xs text-slate-400 mt-2 font-bold tracking-widest uppercase">{t.adminTitle}</p>
        </div>

        {/* Login Form Box */}
        <div className="rounded-3xl bg-slate-900 border border-slate-800 p-6 md:p-8 shadow-2xl relative overflow-hidden transition-all duration-300">
          <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-blue-600 to-amber-500" />

          {step === 1 ? (
            /* STEP 1: Email + Password Inputs */
            <form onSubmit={handleRequestOtp} className="space-y-5">
              <h3 className="text-lg font-bold text-white border-b border-slate-850 pb-2 flex items-center gap-2">
                <Lock className="w-5 h-5 text-amber-500" />
                <span>{t.loginTitle}</span>
              </h3>

              <div>
                <label className="block text-xs font-bold uppercase text-slate-400 mb-2">
                  {t.loginEmail}
                </label>
                <div className="relative">
                  <input 
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="pastor@parousiabaptist.org"
                    className="w-full pl-10 pr-4 py-3 rounded-xl bg-slate-950 border border-slate-800 focus:border-amber-500 focus:outline-none text-slate-100 text-sm transition-all font-medium"
                  />
                  <Mail className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase text-slate-400 mb-2">
                  {t.loginAccessCode}
                </label>
                <div className="relative">
                  <input 
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••••••"
                    className="w-full pl-10 pr-12 py-3 rounded-xl bg-slate-950 border border-slate-800 focus:border-amber-500 focus:outline-none text-slate-100 text-sm transition-all font-medium font-mono"
                  />
                  <Key className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {error && (
                <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs font-semibold animate-fade-in leading-relaxed">
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={isPending}
                className="w-full py-4 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 disabled:opacity-50 text-slate-950 font-extrabold text-sm shadow-xl shadow-amber-500/10 cursor-pointer transition-all flex items-center justify-center gap-2"
              >
                {isPending ? (
                  <Clock className="w-4 h-4 animate-spin" />
                ) : (
                  <Sparkles className="w-4 h-4" />
                )}
                <span>{isPending ? t.btnLoading : t.loginBtnNext}</span>
              </button>
            </form>
          ) : (
            /* STEP 2: One-Time Password Input */
            <form onSubmit={handleVerifyOtp} className="space-y-5">
              <div className="flex items-center gap-2 border-b border-slate-850 pb-2">
                <button
                  type="button"
                  onClick={() => {
                    setStep(1);
                    setError('');
                  }}
                  className="p-1 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white transition-colors cursor-pointer"
                >
                  <ArrowLeft className="w-4 h-4" />
                </button>
                <h3 className="text-lg font-bold text-white flex items-center gap-2">
                  <Clock className="w-5 h-5 text-blue-500" />
                  <span>{t.loginStep2Title}</span>
                </h3>
              </div>

              <p className="text-xs text-slate-400 leading-relaxed bg-slate-950/40 p-4 rounded-2xl border border-slate-850">
                {t.loginStep2Desc}
              </p>

              <div>
                <label className="block text-xs font-bold uppercase text-slate-400 mb-2">
                  {t.loginFieldCode}
                </label>
                <div className="relative">
                  <input 
                    type="text"
                    required
                    maxLength={6}
                    value={otpCode}
                    onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, ''))}
                    placeholder="123456"
                    className="w-full pl-10 pr-4 py-3 rounded-xl bg-slate-950 border border-slate-800 focus:border-blue-500 focus:outline-none text-slate-100 text-lg tracking-[0.4em] font-extrabold font-mono text-center transition-all"
                  />
                  <Key className="w-4 h-4 text-slate-500 absolute left-4 top-1/2 -translate-y-1/2" />
                </div>
              </div>

              {/* Timer Countdown UI */}
              <div className="flex items-center justify-center gap-2 py-1 text-xs font-semibold">
                <Clock className={`w-3.5 h-3.5 ${timer < 60 ? 'text-rose-500 animate-pulse' : 'text-blue-400'}`} />
                <span className={timer < 60 ? 'text-rose-400' : 'text-slate-300'}>
                  {t.loginTimer} <span className="font-mono font-bold">{formatTime(timer)}</span>
                </span>
              </div>

              {error && (
                <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs font-semibold animate-fade-in leading-relaxed">
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={isPending || timer <= 0}
                className="w-full py-4 rounded-xl bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 disabled:opacity-40 text-white font-extrabold text-sm shadow-xl shadow-blue-500/10 cursor-pointer transition-all flex items-center justify-center gap-2"
              >
                {isPending ? (
                  <Clock className="w-4 h-4 animate-spin" />
                ) : (
                  <Sparkles className="w-4 h-4" />
                )}
                <span>{isPending ? t.btnLoading : t.loginBtnVerify}</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setStep(1);
                  setError('');
                }}
                className="w-full py-2.5 rounded-xl bg-transparent border border-slate-800 hover:border-slate-700 text-slate-400 hover:text-white text-xs font-bold transition-all cursor-pointer"
              >
                {t.loginBackBtn}
              </button>
            </form>
          )}

          {/* Prompt/Info Badge */}
          <div className="mt-6 pt-6 border-t border-slate-850 text-center">
            <span className="inline-flex items-center gap-1.5 text-[10px] font-bold text-slate-500 uppercase tracking-widest">
              <Sparkles className="w-3 h-3 text-amber-500" />
              <span>Sistèm Sekirize OTP</span>
            </span>
          </div>

        </div>

        {/* Back Link */}
        <div className="text-center mt-6">
          <a href="/" className="text-xs font-bold text-slate-500 hover:text-amber-400 transition-colors uppercase tracking-widest">
            ← Retounen nan Akèy / Back to Home
          </a>
        </div>

      </div>
    </div>
  );
}
