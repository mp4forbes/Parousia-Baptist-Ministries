'use client';

import React, { useState, useTransition, useEffect } from 'react';
import { useLanguage } from '@/lib/LanguageContext';
import { requestAdminOtp, verifyAdminOtp, completeAdminPasswordSetup, requestAdminForgotPassword, checkAdminDeviceTrusted, prevalidateAdminLoginEmail } from '@/lib/actions';
import { useRouter } from 'next/navigation';
import { Lock, Eye, EyeOff, Sparkles, Globe2, Clock, Mail, Key, ArrowLeft } from 'lucide-react';

interface AdminLoginClientProps {
  logoUrl?: string;
  themePrimary?: string;
  themeHover?: string;
  themeAccent?: string;
  initialStep?: 1 | 2 | 3;
  pendingSetupEmail?: string;
  pendingPasswordReset?: boolean;
}

export default function AdminLoginClient({ 
  logoUrl = '/logo.png', 
  themePrimary = '#f59e0b', 
  themeHover = '#d97706', 
  themeAccent = '#3b82f6',
  initialStep = 1,
  pendingSetupEmail = '',
  pendingPasswordReset = false,
}: AdminLoginClientProps) {
  const { language, setLanguage, t } = useLanguage();
  const router = useRouter();
  
  const [viewMode, setViewMode] = useState<'login' | 'forgot'>('login');
  const [step, setStep] = useState<1 | 2 | 3>(initialStep);
  const [isPasswordReset, setIsPasswordReset] = useState(pendingPasswordReset);
  const [email, setEmail] = useState(pendingSetupEmail);
  const [password, setPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [otpCode, setOtpCode] = useState('');
  const [otpFromEmail, setOtpFromEmail] = useState('contact@parousiabaptistchurch.org');
  const [showPassword, setShowPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [deviceHash, setDeviceHash] = useState('');
  
  const [error, setError] = useState('');
  const [isPending, startTransition] = useTransition();
  const [timer, setTimer] = useState(600);
  const [deviceTrusted, setDeviceTrusted] = useState(false);
  const [emailValidationError, setEmailValidationError] = useState('');

  useEffect(() => {
    let hash = localStorage.getItem('parousia_device_hash');
    if (!hash) {
      hash = 'dev_device_' + Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
      localStorage.setItem('parousia_device_hash', hash);
    }
    setDeviceHash(hash);
  }, []);

  useEffect(() => {
    if (pendingSetupEmail) {
      setEmail(pendingSetupEmail);
      setStep(3);
    }
    if (pendingPasswordReset) {
      setIsPasswordReset(true);
    }
  }, [pendingSetupEmail, pendingPasswordReset]);

  useEffect(() => {
    if (step !== 2 || timer <= 0) return;
    const interval = setInterval(() => {
      setTimer(prev => prev - 1);
    }, 1000);
    return () => clearInterval(interval);
  }, [step, timer]);

  useEffect(() => {
    if (!deviceHash || !email.trim() || step !== 1 || viewMode !== 'login') {
      setDeviceTrusted(false);
      setEmailValidationError('');
      return;
    }

    let cancelled = false;

    const timeout = setTimeout(async () => {
      const validation = await prevalidateAdminLoginEmail(email, language);
      if (cancelled) return;

      setEmailValidationError(validation.error || '');

      if (!validation.authorized) {
        setDeviceTrusted(false);
        return;
      }

      const res = await checkAdminDeviceTrusted(email, deviceHash);
      if (!cancelled) {
        setDeviceTrusted(res.trusted);
      }
    }, 300);

    return () => {
      cancelled = true;
      clearTimeout(timeout);
    };
  }, [email, deviceHash, step, viewMode, language]);

  const loginButtonLabel = deviceTrusted ? t.loginBtnLogin : t.loginBtnNext;

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handleRequestOtp = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) {
      setError(language === 'fr_ht' ? 'Tanpri antre adrès imel ou.' : 'Please enter your email address.');
      return;
    }
    if (emailValidationError) {
      setError(emailValidationError);
      return;
    }
    setError('');

    startTransition(async () => {
      const res = await requestAdminOtp(email, password, deviceHash);
      if (res.success) {
        if (res.otpRequired) {
          setTimer(600);
          if (res.fromEmail) {
            setOtpFromEmail(res.fromEmail);
          }
          setIsPasswordReset(false);
          setStep(2);
        } else if (res.setupPasswordRequired) {
          setIsPasswordReset(false);
          setStep(3);
        } else {
          router.push('/admin/dashboard');
          router.refresh();
        }
      } else {
        setError(res.error || t.adminErrorMsg);
      }
    });
  };

  const handleRequestForgotPassword = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) {
      setError(language === 'fr_ht' ? 'Tanpri antre adrès imel ou.' : 'Please enter your email address.');
      return;
    }
    setError('');

    startTransition(async () => {
      const res = await requestAdminForgotPassword(email);
      if (res.success) {
        setTimer(600);
        if (res.fromEmail) {
          setOtpFromEmail(res.fromEmail);
        }
        setIsPasswordReset(true);
        setStep(2);
      } else {
        setError(res.error || t.adminErrorMsg);
      }
    });
  };

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
      const res = await verifyAdminOtp(email, otpCode, deviceHash, { passwordReset: isPasswordReset });
      if (res.success) {
        if (res.setupPasswordRequired || res.resetPasswordRequired) {
          setIsPasswordReset(!!res.resetPasswordRequired);
          setStep(3);
        } else {
          router.push('/admin/dashboard');
          router.refresh();
        }
      } else {
        setError(res.error || (language === 'fr_ht' ? 'Kòd la pa korèk.' : 'Invalid code.'));
      }
    });
  };

  const handleCreatePassword = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPassword.trim() || !confirmPassword.trim()) {
      setError(language === 'fr_ht' ? 'Tanpri ranpli tout jaden yo.' : 'Please fill out all fields.');
      return;
    }
    setError('');

    startTransition(async () => {
      const res = await completeAdminPasswordSetup(newPassword, confirmPassword, deviceHash);
      if (res.success) {
        router.push('/admin/dashboard');
        router.refresh();
      } else {
        setError(res.error || (language === 'fr_ht' ? 'Pa t kapab sove modpas la.' : 'Could not save password.'));
      }
    });
  };

  const goBackToLogin = () => {
    setViewMode('login');
    setStep(1);
    setIsPasswordReset(false);
    setOtpCode('');
    setError('');
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

      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-blue-600/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />

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
        <div className="flex flex-col items-center mb-8 text-center">
          <div className="relative flex items-center justify-center w-16 h-16 rounded-2xl bg-white border border-slate-800 overflow-hidden shadow-2xl mb-4 p-0.5">
            <img src={logoUrl} alt="Parousia Baptist Ministries Logo" className="w-full h-full object-contain" />
          </div>
          <h2 className="text-2xl md:text-3xl font-extrabold font-serif text-white tracking-tight leading-tight">{t.churchName}</h2>
          <p className="text-xs text-slate-400 mt-2 font-bold tracking-widest uppercase">{t.adminTitle}</p>
        </div>

        <div className="rounded-3xl bg-slate-900 border border-slate-800 p-6 md:p-8 shadow-2xl relative overflow-hidden transition-all duration-300">
          <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-blue-600 to-amber-500" />

          {step === 1 && viewMode === 'login' ? (
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
                {emailValidationError && (
                  <p className="text-[11px] text-rose-400 mt-2 leading-relaxed font-semibold">
                    {emailValidationError}
                  </p>
                )}
              </div>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="block text-xs font-bold uppercase text-slate-400">
                    {t.loginPersonalAccessCode}
                  </label>
                  <button
                    type="button"
                    onClick={() => {
                      setViewMode('forgot');
                      setError('');
                      setPassword('');
                    }}
                    className="text-[11px] font-bold text-amber-400 hover:text-amber-300 transition-colors cursor-pointer"
                  >
                    {t.loginForgotPassword}
                  </button>
                </div>
                <div className="relative">
                  <input 
                    type={showPassword ? 'text' : 'password'}
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
                <p className="text-[11px] text-slate-500 mt-2 leading-relaxed">
                  {t.loginAccessCodeHint}
                </p>
              </div>

              {error && (
                <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs font-semibold animate-fade-in leading-relaxed">
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={isPending || Boolean(emailValidationError)}
                className="w-full py-4 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 disabled:opacity-50 text-slate-950 font-extrabold text-sm shadow-xl shadow-amber-500/10 cursor-pointer transition-all flex items-center justify-center gap-2"
              >
                {isPending ? (
                  <Clock className="w-4 h-4 animate-spin" />
                ) : (
                  <Sparkles className="w-4 h-4" />
                )}
                <span>{isPending ? t.btnLoading : loginButtonLabel}</span>
              </button>
            </form>
          ) : step === 1 && viewMode === 'forgot' ? (
            <form onSubmit={handleRequestForgotPassword} className="space-y-5">
              <div className="flex items-center gap-2 border-b border-slate-850 pb-2">
                <button
                  type="button"
                  onClick={goBackToLogin}
                  className="p-1 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white transition-colors cursor-pointer"
                >
                  <ArrowLeft className="w-4 h-4" />
                </button>
                <h3 className="text-lg font-bold text-white flex items-center gap-2">
                  <Lock className="w-5 h-5 text-blue-500" />
                  <span>{t.loginForgotTitle}</span>
                </h3>
              </div>

              <p className="text-xs text-slate-400 leading-relaxed bg-slate-950/40 p-4 rounded-2xl border border-slate-850">
                {t.loginForgotDesc}
              </p>

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
                    className="w-full pl-10 pr-4 py-3 rounded-xl bg-slate-950 border border-slate-800 focus:border-blue-500 focus:outline-none text-slate-100 text-sm transition-all font-medium"
                  />
                  <Mail className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
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
                className="w-full py-4 rounded-xl bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 disabled:opacity-50 text-white font-extrabold text-sm shadow-xl shadow-blue-500/10 cursor-pointer transition-all flex items-center justify-center gap-2"
              >
                {isPending ? (
                  <Clock className="w-4 h-4 animate-spin" />
                ) : (
                  <Sparkles className="w-4 h-4" />
                )}
                <span>{isPending ? t.btnLoading : t.loginBtnSendReset}</span>
              </button>

              <button
                type="button"
                onClick={goBackToLogin}
                className="w-full py-2.5 rounded-xl bg-transparent border border-slate-800 hover:border-slate-700 text-slate-400 hover:text-white text-xs font-bold transition-all cursor-pointer"
              >
                {t.loginBackToSignIn}
              </button>
            </form>
          ) : step === 2 ? (
            <form onSubmit={handleVerifyOtp} className="space-y-5">
              <div className="flex items-center gap-2 border-b border-slate-850 pb-2">
                <button
                  type="button"
                  onClick={() => {
                    setStep(1);
                    setOtpCode('');
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
              <div className="text-xs text-slate-300 bg-slate-950/60 border border-slate-850 rounded-xl px-4 py-3 space-y-1">
                <p>
                  <span className="text-slate-500">{language === 'fr_ht' ? 'Voye bay: ' : 'Sent to: '}</span>
                  <span className="font-semibold text-amber-400">{email}</span>
                </p>
                <p>
                  <span className="text-slate-500">{language === 'fr_ht' ? 'Soti nan: ' : 'From: '}</span>
                  <span className="font-semibold">{otpFromEmail}</span>
                </p>
              </div>

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
                onClick={goBackToLogin}
                className="w-full py-2.5 rounded-xl bg-transparent border border-slate-800 hover:border-slate-700 text-slate-400 hover:text-white text-xs font-bold transition-all cursor-pointer"
              >
                {t.loginBackBtn}
              </button>
            </form>
          ) : (
            <form onSubmit={handleCreatePassword} className="space-y-5">
              <h3 className="text-lg font-bold text-white border-b border-slate-850 pb-2 flex items-center gap-2">
                <Lock className="w-5 h-5 text-emerald-500" />
                <span>{isPasswordReset ? t.loginStep3ResetTitle : t.loginStep3Title}</span>
              </h3>

              <p className="text-xs text-slate-400 leading-relaxed bg-slate-950/40 p-4 rounded-2xl border border-slate-850">
                {isPasswordReset ? t.loginStep3ResetDesc : t.loginStep3Desc}
              </p>

              {email && (
                <div className="text-xs text-slate-300 bg-slate-950/60 border border-slate-850 rounded-xl px-4 py-3">
                  <span className="text-slate-500">{language === 'fr_ht' ? 'Kont: ' : 'Account: '}</span>
                  <span className="font-semibold text-amber-400">{email}</span>
                </div>
              )}

              <div>
                <label className="block text-xs font-bold uppercase text-slate-400 mb-2">
                  {t.loginFieldNewPassword}
                </label>
                <div className="relative">
                  <input 
                    type={showNewPassword ? 'text' : 'password'}
                    required
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="••••••••••••"
                    className="w-full pl-10 pr-12 py-3 rounded-xl bg-slate-950 border border-slate-800 focus:border-emerald-500 focus:outline-none text-slate-100 text-sm transition-all font-medium font-mono"
                  />
                  <Key className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                  <button
                    type="button"
                    onClick={() => setShowNewPassword(!showNewPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300"
                  >
                    {showNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase text-slate-400 mb-2">
                  {t.loginFieldConfirmPassword}
                </label>
                <div className="relative">
                  <input 
                    type={showConfirmPassword ? 'text' : 'password'}
                    required
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="••••••••••••"
                    className="w-full pl-10 pr-12 py-3 rounded-xl bg-slate-950 border border-slate-800 focus:border-emerald-500 focus:outline-none text-slate-100 text-sm transition-all font-medium font-mono"
                  />
                  <Key className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300"
                  >
                    {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
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
                className="w-full py-4 rounded-xl bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 disabled:opacity-50 text-slate-950 font-extrabold text-sm shadow-xl shadow-emerald-500/10 cursor-pointer transition-all flex items-center justify-center gap-2"
              >
                {isPending ? (
                  <Clock className="w-4 h-4 animate-spin" />
                ) : (
                  <Sparkles className="w-4 h-4" />
                )}
                <span>{isPending ? t.btnLoading : (isPasswordReset ? t.loginBtnResetPassword : t.loginBtnCreatePassword)}</span>
              </button>
            </form>
          )}

          <div className="mt-6 pt-6 border-t border-slate-850 text-center">
            <span className="inline-flex items-center gap-1.5 text-[10px] font-bold text-slate-500 uppercase tracking-widest">
              <Sparkles className="w-3 h-3 text-amber-500" />
              <span>Sistèm Sekirize OTP</span>
            </span>
          </div>

        </div>

        <div className="text-center mt-6">
          <a href="/" className="text-xs font-bold text-slate-500 hover:text-amber-400 transition-colors uppercase tracking-widest">
            ← Retounen nan Akèy / Back to Home
          </a>
        </div>

      </div>
    </div>
  );
}
