'use client';

import React, { useMemo, useState } from 'react';
import { Ministry } from '@/lib/db';
import { submitMinistrySignup } from '@/lib/actions';
import { MINISTRY_SIGNUP_FIELDS, MinistrySignupSlug } from '@/lib/ministry-signup-fields';
import { frenchMinistryField } from '@/lib/french-content';
import { CheckCircle, Loader2, X } from 'lucide-react';

interface MinistrySignupFormProps {
  slug: MinistrySignupSlug;
  ministry?: Ministry | null;
  language: 'fr_ht' | 'en';
  isLight: boolean;
  textTitle: string;
  textBody: string;
  textMuted: string;
  bgCard: string;
  bgInput: string;
  registerLabel: string;
  cancelLabel: string;
  submitLabel: string;
}

export default function MinistrySignupForm({
  slug,
  ministry,
  language,
  isLight,
  textTitle,
  textBody,
  textMuted,
  bgCard,
  bgInput,
  registerLabel,
  cancelLabel,
  submitLabel,
}: MinistrySignupFormProps) {
  const fields = MINISTRY_SIGNUP_FIELDS[slug];
  const [isOpen, setIsOpen] = useState(false);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [responses, setResponses] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  const ministryTitle = useMemo(() => {
    if (!ministry) return slug;
    return language === 'fr_ht' ? frenchMinistryField(ministry, 'title') : ministry.title_english;
  }, [language, ministry, slug]);

  const resetForm = () => {
    setName('');
    setEmail('');
    setPhone('');
    setResponses({});
    setError('');
    setSuccess(false);
  };

  const openModal = () => {
    resetForm();
    setIsOpen(true);
  };

  const closeModal = () => {
    setIsOpen(false);
    resetForm();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess(false);

    if (!name.trim() || !email.trim()) {
      setError(language === 'fr_ht' ? 'Veuillez saisir votre nom et votre adresse e-mail.' : 'Please enter your name and email.');
      return;
    }

    for (const field of fields) {
      if (field.required && !responses[field.key]?.trim()) {
        setError(
          language === 'fr_ht'
            ? `Veuillez remplir le champ obligatoire : ${field.label_ht}`
            : `Please complete required field: ${field.label_en}`
        );
        return;
      }
    }

    setSubmitting(true);
    try {
      const result = await submitMinistrySignup(slug, {
        name: name.trim(),
        email: email.trim(),
        phone: phone.trim(),
        responses,
      });

      if (!result.success) {
        setError(result.error || (language === 'fr_ht' ? 'Une erreur est survenue.' : 'Something went wrong.'));
        return;
      }

      setSuccess(true);
      setName('');
      setEmail('');
      setPhone('');
      setResponses({});
    } catch (err: any) {
      setError(err.message || (language === 'fr_ht' ? 'Une erreur est survenue.' : 'Something went wrong.'));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      <button
        type="button"
        onClick={openModal}
        className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition-all duration-300 hover:scale-105 cursor-pointer"
      >
        {registerLabel}
      </button>

      {isOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
          <div className={`relative w-full max-w-lg rounded-2xl ${bgCard} p-6 md:p-8 animate-scale-up`}>
            <button
              type="button"
              onClick={closeModal}
              className={`absolute top-4 right-4 p-1.5 rounded-lg ${isLight ? 'bg-slate-100 hover:bg-slate-200 text-slate-500 hover:text-slate-800' : 'bg-slate-950 hover:bg-slate-800 text-slate-400 hover:text-white'} cursor-pointer`}
            >
              <X className="w-5 h-5" />
            </button>

            {!success ? (
              <form onSubmit={handleSubmit}>
                <h5 className={`text-2xl font-extrabold font-serif ${textTitle} mb-2`}>
                  {language === 'fr_ht' ? 'Inscription au ministère' : 'Ministry Signup'}
                </h5>
                <p className="text-sm text-amber-400 font-medium mb-2">{ministryTitle}</p>
                <p className={`${textMuted} text-sm mb-6 leading-relaxed`}>
                  {language === 'fr_ht'
                    ? 'Remplissez ce formulaire et un responsable du ministère vous contactera bientôt.'
                    : 'Fill out this form and a ministry leader will reach out soon.'}
                </p>

                {ministry?.contact_name && (
                  <div className={`mb-4 rounded-xl border ${isLight ? 'border-slate-200 bg-slate-50' : 'border-slate-800 bg-slate-950/50'} px-4 py-3 text-sm ${textBody}`}>
                    <p className="font-semibold mb-1">
                      {language === 'fr_ht' ? 'Contact du ministère' : 'Ministry Committee Contact'}
                    </p>
                    <p>{ministry.contact_name}</p>
                    {ministry.contact_email && <p>{ministry.contact_email}</p>}
                    {ministry.contact_phone && <p>{ministry.contact_phone}</p>}
                  </div>
                )}

                {error && (
                  <div className="mb-4 p-3 rounded-lg bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs font-medium">
                    {error}
                  </div>
                )}

                <div className="space-y-4 mb-6 max-h-[50vh] overflow-y-auto pr-1">
                  <div>
                    <label className={`block text-xs font-bold uppercase ${textMuted} mb-1.5`}>
                      {language === 'fr_ht' ? 'Nom complet' : 'Full Name'} *
                    </label>
                    <input
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      required
                      className={`w-full px-4 py-3 rounded-lg ${bgInput} focus:border-blue-500 focus:outline-none text-sm transition-all`}
                    />
                  </div>

                  <div className="grid sm:grid-cols-2 gap-4">
                    <div>
                      <label className={`block text-xs font-bold uppercase ${textMuted} mb-1.5`}>
                        {language === 'fr_ht' ? 'Adresse e-mail' : 'Email'} *
                      </label>
                      <input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                        className={`w-full px-4 py-3 rounded-lg ${bgInput} focus:border-blue-500 focus:outline-none text-sm transition-all`}
                      />
                    </div>
                    <div>
                      <label className={`block text-xs font-bold uppercase ${textMuted} mb-1.5`}>
                        {language === 'fr_ht' ? 'Téléphone' : 'Phone'}
                      </label>
                      <input
                        type="tel"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        className={`w-full px-4 py-3 rounded-lg ${bgInput} focus:border-blue-500 focus:outline-none text-sm transition-all`}
                      />
                    </div>
                  </div>

                  {fields.map((field) => {
                    const label = language === 'fr_ht' ? field.label_ht : field.label_en;
                    const placeholder = language === 'fr_ht' ? field.placeholder_ht : field.placeholder_en;
                    const value = responses[field.key] || '';

                    return (
                      <div key={field.key}>
                        <label className={`block text-xs font-bold uppercase ${textMuted} mb-1.5`}>
                          {label}{field.required ? ' *' : ''}
                        </label>
                        {field.type === 'textarea' ? (
                          <textarea
                            rows={3}
                            value={value}
                            onChange={(e) => setResponses((prev) => ({ ...prev, [field.key]: e.target.value }))}
                            placeholder={placeholder}
                            required={field.required}
                            className={`w-full px-4 py-3 rounded-lg ${bgInput} focus:border-blue-500 focus:outline-none text-sm transition-all resize-none`}
                          />
                        ) : (
                          <input
                            type={field.type === 'number' ? 'number' : 'text'}
                            value={value}
                            onChange={(e) => setResponses((prev) => ({ ...prev, [field.key]: e.target.value }))}
                            placeholder={placeholder}
                            required={field.required}
                            className={`w-full px-4 py-3 rounded-lg ${bgInput} focus:border-blue-500 focus:outline-none text-sm transition-all`}
                          />
                        )}
                      </div>
                    );
                  })}
                </div>

                <div className="flex gap-4 justify-end">
                  <button
                    type="button"
                    onClick={closeModal}
                    className={`px-5 py-2.5 rounded-lg ${isLight ? 'bg-slate-100 hover:bg-slate-200 text-slate-700' : 'bg-slate-950 hover:bg-slate-850 text-slate-300'} font-semibold text-sm transition-all cursor-pointer`}
                  >
                    {cancelLabel}
                  </button>
                  <button
                    type="submit"
                    disabled={submitting}
                    className="px-6 py-2.5 rounded-lg bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-bold text-sm transition-all cursor-pointer inline-flex items-center gap-2"
                  >
                    {submitting && <Loader2 className="w-4 h-4 animate-spin" />}
                    <span>{submitting ? (language === 'fr_ht' ? 'Envoi en cours...' : 'Submitting...') : submitLabel}</span>
                  </button>
                </div>
              </form>
            ) : (
              <div className="text-center py-6">
                <div className={`w-16 h-14 rounded-2xl ${isLight ? 'bg-emerald-50 text-emerald-600' : 'bg-emerald-500/10 text-emerald-400'} flex items-center justify-center mx-auto mb-6`}>
                  <CheckCircle className="w-8 h-8" />
                </div>
                <h5 className={`text-2xl font-extrabold font-serif ${textTitle} mb-2`}>
                  {language === 'fr_ht' ? 'Inscription reçue !' : 'Signup Received!'}
                </h5>
                <p className={`${textBody} text-sm mb-8 leading-relaxed`}>
                  {language === 'fr_ht'
                    ? 'Merci ! Un responsable du ministère vous contactera bientôt.'
                    : 'Thank you! A ministry leader will reach out to you soon.'}
                </p>
                <button
                  type="button"
                  onClick={closeModal}
                  className={`px-6 py-2.5 rounded-lg ${isLight ? 'bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-200' : 'bg-slate-950 hover:bg-slate-800 border-slate-800 text-slate-200'} font-bold text-sm cursor-pointer`}
                >
                  OK
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}
