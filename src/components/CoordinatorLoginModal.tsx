'use client';

import React, { useEffect, useState } from 'react';
import { Eye, EyeOff, KeyRound, Mail, ShieldCheck, X } from 'lucide-react';
import {
  completeCoordinatorPasswordSetup,
  prevalidateCoordinatorLogin,
  requestCoordinatorLogin,
  verifyCoordinatorOtp,
} from '@/lib/coordinator-session';
import { setCoordinatorUiClient } from '@/lib/coordinator-cookies';
import { useCoordinatorSession } from '@/lib/CoordinatorSessionContext';
import { useLanguage } from '@/lib/LanguageContext';
import type { RegistrantAccess } from '@/lib/registrant-scope';

function getDeviceHash(): string {
  let hash = localStorage.getItem('parousia_device_hash');
  if (!hash) {
    hash = 'dev_device_' + Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
    localStorage.setItem('parousia_device_hash', hash);
  }
  return hash;
}

export default function CoordinatorLoginModal({ isLight }: { isLight: boolean }) {
  const { language, t } = useLanguage();
  const { access, loginOpen, setLoginOpen, applyAccess, refresh } = useCoordinatorSession();
  const [email, setEmail] = useState(access.needsPasswordSetup && access.email ? access.email : '');
  const [password, setPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [code, setCode] = useState('');
  const [step, setStep] = useState<'credentials' | 'code' | 'password'>(
    access.needsPasswordSetup ? 'password' : 'credentials'
  );
  const [fromEmail, setFromEmail] = useState('');
  const [deviceHash, setDeviceHash] = useState(() => (typeof window === 'undefined' ? '' : getDeviceHash()));
  const [trusted, setTrusted] = useState(false);
  const [hasPassword, setHasPassword] = useState(false);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  useEffect(() => {
    if (!deviceHash) setDeviceHash(getDeviceHash());
  }, [deviceHash]);

  useEffect(() => {
    if (access.needsPasswordSetup) {
      setStep('password');
      if (access.email) setEmail(access.email);
    }
  }, [access.needsPasswordSetup, access.email]);

  useEffect(() => {
    if (!loginOpen || !deviceHash || !email.trim() || step !== 'credentials') {
      return;
    }

    let cancelled = false;
    const timeout = setTimeout(async () => {
      const res = await prevalidateCoordinatorLogin(email, deviceHash, language);
      if (cancelled) return;
      setTrusted(res.trusted);
      setHasPassword(res.hasPassword);
      if (res.error && !res.authorized) {
        setError(res.error);
      } else {
        setError('');
      }
    }, 300);

    return () => {
      cancelled = true;
      clearTimeout(timeout);
    };
  }, [email, deviceHash, language, loginOpen, step]);

  if (!loginOpen) return null;

  const panel = isLight
    ? 'bg-white border-slate-200 text-slate-900'
    : 'bg-slate-950 border-slate-800 text-white';
  const muted = isLight ? 'text-slate-600' : 'text-slate-400';
  const fieldClass = `w-full px-3 py-2.5 rounded-xl border text-sm ${isLight ? 'bg-slate-50 border-slate-200' : 'bg-slate-900 border-slate-800'} focus:outline-none focus:border-amber-500`;

  const finishLogin = async (nextAccess?: RegistrantAccess) => {
    if (nextAccess) applyAccess(nextAccess);
    await refresh();
    if (nextAccess && !nextAccess.needsPasswordSetup) {
      setCoordinatorUiClient();
      setLoginOpen(false);
      setStep('credentials');
      setPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setCode('');
      setError('');
      setBusy(false);
    } else {
      setStep('password');
      setBusy(false);
    }
  };

  const close = () => {
    if (access.needsPasswordSetup) return;
    setLoginOpen(false);
    setStep('credentials');
    setCode('');
    setError('');
    setBusy(false);
  };

  const submitCredentials = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setError('');
    const res = await requestCoordinatorLogin(email, password, deviceHash, language);
    setBusy(false);
    if (!res.success) {
      setError(res.error || t.coordinatorNotRecipient);
      return;
    }
    if (res.otpRequired) {
      setFromEmail(res.fromEmail || '');
      setStep('code');
      return;
    }
    if (res.setupPasswordRequired) {
      setStep('password');
      if (res.access) applyAccess(res.access);
      return;
    }
    finishLogin(res.access);
  };

  const submitCode = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setError('');
    const res = await verifyCoordinatorOtp(email, code, deviceHash, language);
    setBusy(false);
    if (!res.success) {
      setError(res.error || t.coordinatorInvalidCode);
      return;
    }
    if (res.setupPasswordRequired) {
      if (res.access) applyAccess(res.access);
      setStep('password');
      return;
    }
    finishLogin(res.access);
  };

  const submitPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setError('');
    const res = await completeCoordinatorPasswordSetup(newPassword, confirmPassword, deviceHash, language);
    setBusy(false);
    if (!res.success) {
      setError(res.error || t.coordinatorPasswordSaveError);
      return;
    }
    finishLogin(res.access);
  };

  const hint = !hasPassword
    ? t.coordinatorFirstLoginHint
    : trusted
      ? t.coordinatorTrustedDeviceHint
      : t.coordinatorNewDeviceHint;

  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm">
      <div className={`w-full max-w-md rounded-3xl border shadow-2xl ${panel} p-6 relative`}>
        {!access.needsPasswordSetup && (
          <button
            type="button"
            onClick={close}
            className={`absolute top-4 right-4 p-1 rounded-lg ${isLight ? 'text-slate-500 hover:bg-slate-100' : 'text-slate-400 hover:bg-slate-900'} cursor-pointer`}
            aria-label={t.coordinatorClose}
          >
            <X className="w-5 h-5" />
          </button>
        )}
        <div className="flex items-center gap-2 mb-2">
          <ShieldCheck className="w-5 h-5 text-amber-500" />
          <h2 className="text-lg font-bold font-serif">
            {step === 'password' ? t.coordinatorCreatePasswordTitle : t.coordinatorSignIn}
          </h2>
        </div>
        <p className={`text-sm mb-5 ${muted}`}>
          {step === 'password' ? t.coordinatorCreatePasswordHint : t.coordinatorSignInHint}
        </p>

        {step === 'credentials' && (
          <form onSubmit={submitCredentials} className="space-y-4">
            <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500">
              {t.coordinatorEmail}
            </label>
            <div className="relative">
              <Mail className={`absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 ${isLight ? 'text-slate-400' : 'text-slate-500'}`} />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className={`${fieldClass} pl-10`}
              />
            </div>
            <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500">
              {t.coordinatorPassword}
            </label>
            <div className="relative">
              <KeyRound className={`absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 ${isLight ? 'text-slate-400' : 'text-slate-500'}`} />
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="current-password"
                className={`${fieldClass} pl-10 pr-10`}
              />
              <button
                type="button"
                onClick={() => setShowPassword((prev) => !prev)}
                className={`absolute right-3 top-1/2 -translate-y-1/2 ${isLight ? 'text-slate-400' : 'text-slate-500'} cursor-pointer`}
                aria-label={showPassword ? t.coordinatorHidePassword : t.coordinatorShowPassword}
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
            <p className={`text-xs ${muted}`}>{hint}</p>
            {error && <p className="text-xs text-rose-500">{error}</p>}
            <button
              type="submit"
              disabled={busy}
              className="w-full py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 disabled:opacity-60 text-slate-950 text-sm font-bold cursor-pointer"
            >
              {busy ? t.coordinatorSending : (hasPassword && trusted ? t.coordinatorLogin : t.coordinatorContinue)}
            </button>
          </form>
        )}

        {step === 'code' && (
          <form onSubmit={submitCode} className="space-y-4">
            <p className={`text-xs ${muted}`}>
              {t.coordinatorCodeSent}{fromEmail ? ` (${fromEmail})` : ''}
            </p>
            <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500">
              {t.coordinatorCode}
            </label>
            <input
              type="text"
              inputMode="numeric"
              required
              value={code}
              onChange={(e) => setCode(e.target.value)}
              className={`${fieldClass} tracking-[0.4em] font-semibold`}
            />
            {error && <p className="text-xs text-rose-500">{error}</p>}
            <button
              type="submit"
              disabled={busy}
              className="w-full py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 disabled:opacity-60 text-slate-950 text-sm font-bold cursor-pointer"
            >
              {busy ? t.coordinatorVerifying : t.coordinatorVerify}
            </button>
            <button
              type="button"
              onClick={() => { setStep('credentials'); setError(''); }}
              className="w-full text-xs font-semibold text-amber-600 cursor-pointer"
            >
              {t.coordinatorUseDifferentEmail}
            </button>
          </form>
        )}

        {step === 'password' && (
          <form onSubmit={submitPassword} className="space-y-4">
            <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500">
              {t.coordinatorNewPassword}
            </label>
            <input
              type="password"
              required
              minLength={8}
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              autoComplete="new-password"
              className={fieldClass}
            />
            <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500">
              {t.coordinatorConfirmPassword}
            </label>
            <input
              type="password"
              required
              minLength={8}
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              autoComplete="new-password"
              className={fieldClass}
            />
            {error && <p className="text-xs text-rose-500">{error}</p>}
            <button
              type="submit"
              disabled={busy}
              className="w-full py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 disabled:opacity-60 text-slate-950 text-sm font-bold cursor-pointer"
            >
              {busy ? t.coordinatorSavingPassword : t.coordinatorSavePassword}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
