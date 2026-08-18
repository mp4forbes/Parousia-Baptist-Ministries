'use client';

import React, { useMemo, useState } from 'react';
import { CheckCircle, Loader2 } from 'lucide-react';
import { submitAdministrativeCareForm } from '@/lib/actions';
import {
  ADMINISTRATIVE_CARE_BASE_FIELDS,
  ADMINISTRATIVE_CARE_FIELDS,
  isCheckedResponse,
} from '@/lib/administrative-care-fields';
import type { AdministrativeCareSlug } from '@/lib/site-nav';

interface AdministrativeCareFormProps {
  slug: AdministrativeCareSlug;
  categoryTitle: string;
  language: 'fr_ht' | 'en';
  isLight: boolean;
  textTitle: string;
  textBody: string;
  textMuted: string;
  bgInput: string;
}

export default function AdministrativeCareForm({
  slug,
  categoryTitle,
  language,
  isLight,
  textTitle,
  textBody,
  textMuted,
  bgInput,
}: AdministrativeCareFormProps) {
  const fields = ADMINISTRATIVE_CARE_FIELDS[slug];
  const [responses, setResponses] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  const allFields = useMemo(() => [...ADMINISTRATIVE_CARE_BASE_FIELDS, ...fields], [fields]);

  const setValue = (key: string, value: string) => {
    setResponses((prev) => ({ ...prev, [key]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess(false);

    const name = (responses.requester_name || '').trim();
    const email = (responses.requester_email || '').trim();
    if (!name || !email) {
      setError(language === 'fr_ht' ? 'Veuillez saisir votre nom et votre adresse e-mail.' : 'Please enter your name and email.');
      return;
    }

    for (const field of allFields) {
      if (!field.required) continue;
      const value = responses[field.key];
      if (field.type === 'checkbox') {
        if (!isCheckedResponse(value)) {
          setError(
            language === 'fr_ht'
              ? `Veuillez confirmer : ${field.label_ht}`
              : `Please confirm: ${field.label_en}`
          );
          return;
        }
      } else if (!value?.trim()) {
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
      const result = await submitAdministrativeCareForm(slug, {
        name,
        email,
        phone: (responses.requester_phone || '').trim(),
        responses,
        language,
      });
      if (!result.success) {
        setError(result.error || (language === 'fr_ht' ? 'Une erreur est survenue.' : 'Something went wrong.'));
        return;
      }
      setSuccess(true);
      setResponses({});
    } catch (err: any) {
      setError(err.message || (language === 'fr_ht' ? 'Une erreur est survenue.' : 'Something went wrong.'));
    } finally {
      setSubmitting(false);
    }
  };

  if (success) {
    return (
      <div className="text-center py-8">
        <div className={`w-16 h-16 rounded-2xl ${isLight ? 'bg-emerald-50 text-emerald-600' : 'bg-emerald-500/10 text-emerald-400'} flex items-center justify-center mx-auto mb-6`}>
          <CheckCircle className="w-8 h-8" />
        </div>
        <h5 className={`text-2xl font-extrabold font-serif ${textTitle} mb-2`}>
          {language === 'fr_ht' ? 'Demande reçue' : 'Request received'}
        </h5>
        <p className={`${textBody} text-sm leading-relaxed max-w-lg mx-auto`}>
          {language === 'fr_ht'
            ? 'Merci. Un accusé de réception vous a été envoyé par courriel, et notre équipe pastorale vous contactera.'
            : 'Thank you. A confirmation email has been sent to you, and our pastoral team will be in touch.'}
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div>
        <h5 className={`text-2xl font-extrabold font-serif ${textTitle} mb-2`}>
          {language === 'fr_ht' ? 'Formulaire de demande' : 'Request form'}
        </h5>
        <p className="text-sm text-amber-400 font-medium mb-2">{categoryTitle}</p>
        <p className={`${textMuted} text-sm leading-relaxed`}>
          {language === 'fr_ht'
            ? 'Remplissez ce formulaire et notre équipe pastorale vous contactera.'
            : 'Complete this form and our pastoral team will be in touch.'}
        </p>
      </div>

      {error && (
        <div className="p-3 rounded-lg bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs font-medium">
          {error}
        </div>
      )}

      {allFields.map((field) => {
        const label = language === 'fr_ht' ? field.label_ht : field.label_en;
        const value = responses[field.key] || '';

        if (field.type === 'checkbox') {
          return (
            <label key={field.key} className={`flex items-start gap-3 text-sm ${textBody} cursor-pointer`}>
              <input
                type="checkbox"
                checked={isCheckedResponse(value)}
                onChange={(e) => setValue(field.key, e.target.checked ? 'true' : '')}
                className="mt-1 h-4 w-4 rounded border-slate-400 text-amber-500 focus:ring-amber-500"
              />
              <span>
                {label}
                {field.required ? ' *' : ''}
              </span>
            </label>
          );
        }

        return (
          <div key={field.key}>
            <label className={`block text-xs font-bold uppercase ${textMuted} mb-1.5`}>
              {label}
              {field.required ? ' *' : ''}
            </label>
            {field.type === 'textarea' ? (
              <textarea
                rows={4}
                value={value}
                onChange={(e) => setValue(field.key, e.target.value)}
                required={field.required}
                className={`w-full px-4 py-3 rounded-lg ${bgInput} focus:border-blue-500 focus:outline-none text-sm transition-all resize-none`}
              />
            ) : field.type === 'select' && field.options ? (
              <select
                value={value}
                onChange={(e) => setValue(field.key, e.target.value)}
                required={field.required}
                className={`w-full px-4 py-3 rounded-lg ${bgInput} focus:border-blue-500 focus:outline-none text-sm transition-all`}
              >
                <option value="">{language === 'fr_ht' ? 'Choisir...' : 'Select...'}</option>
                {field.options.map((option) => (
                  <option key={option.value} value={option.value}>
                    {language === 'fr_ht' ? option.label_ht : option.label_en}
                  </option>
                ))}
              </select>
            ) : (
              <input
                type={field.key === 'requester_email' ? 'email' : field.type === 'number' ? 'number' : field.key.includes('phone') ? 'tel' : 'text'}
                value={value}
                onChange={(e) => setValue(field.key, e.target.value)}
                required={field.required}
                className={`w-full px-4 py-3 rounded-lg ${bgInput} focus:border-blue-500 focus:outline-none text-sm transition-all`}
              />
            )}
          </div>
        );
      })}

      <div className="flex justify-end pt-2">
        <button
          type="submit"
          disabled={submitting}
          className="px-6 py-3 rounded-lg bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-bold text-sm transition-all cursor-pointer inline-flex items-center gap-2"
        >
          {submitting && <Loader2 className="w-4 h-4 animate-spin" />}
          <span>
            {submitting
              ? language === 'fr_ht'
                ? 'Envoi en cours...'
                : 'Submitting...'
              : language === 'fr_ht'
                ? 'Envoyer la demande'
                : 'Submit request'}
          </span>
        </button>
      </div>
    </form>
  );
}
