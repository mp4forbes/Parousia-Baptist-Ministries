'use client';

import React, { useEffect, useMemo, useState, useTransition } from 'react';
import { CheckCircle, Copy, X } from 'lucide-react';
import { registerForEvent } from '@/lib/actions';
import { EventRecord } from '@/lib/db';
import {
  getEventRegistrationFields,
} from '@/lib/event-registration-fields';
import { getEventPaymentInstructions, isEventPaymentRequired } from '@/lib/event-payment';

type EventRegistrationModalProps = {
  event: EventRecord;
  onClose: () => void;
  language: 'fr_ht' | 'en';
  isLight: boolean;
  textTitle: string;
  textBody: string;
  textMuted: string;
  bgCard: string;
  bgInput: string;
  registerTitle: string;
  fieldName: string;
  fieldEmail: string;
  fieldPhone: string;
  cancelLabel: string;
  submitLabel: string;
  loadingLabel: string;
  successTitle: string;
  successMessage: string;
  okLabel: string;
};

export default function EventRegistrationModal({
  event,
  onClose,
  language,
  isLight,
  textTitle,
  textBody,
  textMuted,
  bgCard,
  bgInput,
  registerTitle,
  fieldName,
  fieldEmail,
  fieldPhone,
  cancelLabel,
  submitLabel,
  loadingLabel,
  successTitle,
  successMessage,
  okLabel,
}: EventRegistrationModalProps) {
  const fields = useMemo(
    () => getEventRegistrationFields(event.registration_type),
    [event.registration_type]
  );
  const paymentRequired = isEventPaymentRequired(event);

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [responses, setResponses] = useState<Record<string, string>>({});
  const [zellePaymentSent, setZellePaymentSent] = useState(false);
  const [copiedZellePhone, setCopiedZellePhone] = useState(false);
  const [copiedZelleName, setCopiedZelleName] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    setName('');
    setEmail('');
    setPhone('');
    setResponses({});
    setZellePaymentSent(false);
    setCopiedZellePhone(false);
    setCopiedZelleName(false);
    setError('');
    setSuccess(false);
  }, [event.id, event.registration_type, event.payment_required]);

  const eventTitle = language === 'fr_ht' ? event.title_kreyol : event.title_english;
  const paymentInstructions = getEventPaymentInstructions(event, language);

  const handleCopy = async (value: string, type: 'phone' | 'name') => {
    try {
      await navigator.clipboard.writeText(value);
      if (type === 'phone') {
        setCopiedZellePhone(true);
        setTimeout(() => setCopiedZellePhone(false), 2000);
      } else {
        setCopiedZelleName(true);
        setTimeout(() => setCopiedZelleName(false), 2000);
      }
    } catch {
      // ignore clipboard errors
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!name.trim() || !phone.trim()) {
      setError(
        language === 'fr_ht'
          ? 'Veuillez saisir votre nom et votre numéro de téléphone.'
          : 'Please enter your name and phone number.'
      );
      return;
    }

    for (const field of fields) {
      const value = responses[field.key]?.trim() ?? '';
      if (field.required && !value) {
        setError(
          language === 'fr_ht'
            ? `Veuillez remplir le champ obligatoire : ${field.label_ht}`
            : `Please complete required field: ${field.label_en}`
        );
        return;
      }
      if (field.type === 'number' && value) {
        const num = Number(value);
        const min = field.min ?? 0;
        if (Number.isNaN(num) || num < min) {
          setError(
            language === 'fr_ht'
              ? `${field.label_ht} doit être au moins ${min}.`
              : `${field.label_en} must be at least ${min}.`
          );
          return;
        }
      }
    }

    if (paymentRequired && !zellePaymentSent) {
      setError(
        language === 'fr_ht'
          ? 'Veuillez confirmer que vous avez envoyé le paiement Zelle à l’organisateur.'
          : 'Please confirm that you have sent Zelle payment to the event organizer.'
      );
      return;
    }

    const submissionResponses = {
      ...responses,
      ...(paymentRequired ? { zelle_payment_sent: 'yes' } : {}),
    };

    startTransition(async () => {
      const res = await registerForEvent(event.id, name.trim(), email.trim(), phone.trim(), submissionResponses);
      if (res.success) {
        setSuccess(true);
        setName('');
        setEmail('');
        setPhone('');
        setResponses({});
        setZellePaymentSent(false);
      } else {
        setError(res.error || (language === 'fr_ht' ? 'Échec de l’inscription.' : 'Failed to submit registration.'));
      }
    });
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
      <div className={`relative w-full max-w-lg rounded-2xl ${bgCard} p-6 md:p-8 animate-scale-up`}>
        <button
          type="button"
          onClick={onClose}
          className={`absolute top-4 right-4 p-1.5 rounded-lg ${isLight ? 'bg-slate-100 hover:bg-slate-200 text-slate-500 hover:text-slate-800' : 'bg-slate-950 hover:bg-slate-800 text-slate-400 hover:text-white'} cursor-pointer`}
        >
          <X className="w-5 h-5" />
        </button>

        {!success ? (
          <form onSubmit={handleSubmit}>
            <h5 className={`text-2xl font-extrabold font-serif ${textTitle} mb-2`}>{registerTitle}</h5>
            <p className="text-sm text-amber-400 font-medium mb-6">{eventTitle}</p>

            {error && (
              <div className="mb-4 p-3 rounded-lg bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs font-medium">
                {error}
              </div>
            )}

            <div className="space-y-4 mb-6 max-h-[50vh] overflow-y-auto pr-1">
              <div>
                <label className={`block text-xs font-bold uppercase ${textMuted} mb-1.5`}>{fieldName} *</label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Jean Baptiste"
                  className={`w-full px-4 py-3 rounded-lg ${bgInput} focus:border-blue-500 focus:outline-none text-sm transition-all`}
                />
              </div>

              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <label className={`block text-xs font-bold uppercase ${textMuted} mb-1.5`}>{fieldEmail}</label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="e.g. jean@gmail.com"
                    className={`w-full px-4 py-3 rounded-lg ${bgInput} focus:border-blue-500 focus:outline-none text-sm transition-all`}
                  />
                </div>
                <div>
                  <label className={`block text-xs font-bold uppercase ${textMuted} mb-1.5`}>{fieldPhone} *</label>
                  <input
                    type="tel"
                    required
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="e.g. (954) 555-1122"
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
                      {label}
                      {field.required ? ' *' : ''}
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
                    ) : field.type === 'select' && field.options ? (
                      <select
                        value={value}
                        onChange={(e) => setResponses((prev) => ({ ...prev, [field.key]: e.target.value }))}
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
                        type={field.type === 'number' ? 'number' : 'text'}
                        min={field.type === 'number' ? field.min ?? 0 : undefined}
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

              {paymentRequired && (
                <div
                  className={`rounded-xl border p-4 space-y-3 ${
                    isLight ? 'border-amber-200 bg-amber-50/80' : 'border-amber-500/30 bg-amber-500/10'
                  }`}
                >
                  <div>
                    <p className="text-xs font-bold uppercase text-amber-500 mb-1">
                      {language === 'fr_ht' ? 'Paiement Zelle (organisateur)' : 'Zelle Payment (Event Organizer)'}
                    </p>
                    <p className={`text-sm ${textBody}`}>
                      {language === 'fr_ht'
                        ? 'Ce paiement va à l’organisateur de l’événement, pas à l’église.'
                        : 'This payment goes to the event organizer, not the church.'}
                    </p>
                    {event.payment_amount?.trim() && (
                      <p className={`text-sm font-bold ${textTitle} mt-2`}>
                        {language === 'fr_ht' ? 'Montant : ' : 'Amount: '}
                        {event.payment_amount.trim()}
                      </p>
                    )}
                  </div>

                  {event.payment_zelle_name?.trim() && (
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <p className={`text-[10px] font-bold uppercase ${textMuted}`}>
                          {language === 'fr_ht' ? 'Nom Zelle' : 'Zelle Name'}
                        </p>
                        <p className={`text-sm font-semibold ${textTitle}`}>{event.payment_zelle_name}</p>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleCopy(event.payment_zelle_name!.trim(), 'name')}
                        className={`p-2 rounded-lg ${isLight ? 'bg-white border border-slate-200' : 'bg-slate-950 border border-slate-800'} cursor-pointer`}
                        title={language === 'fr_ht' ? 'Copier' : 'Copy'}
                      >
                        <Copy className="w-4 h-4" />
                      </button>
                    </div>
                  )}
                  {copiedZelleName && (
                    <p className="text-[10px] text-emerald-500 font-semibold">
                      {language === 'fr_ht' ? 'Nom copié !' : 'Name copied!'}
                    </p>
                  )}

                  {event.payment_zelle_phone?.trim() && (
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <p className={`text-[10px] font-bold uppercase ${textMuted}`}>
                          {language === 'fr_ht' ? 'Zelle (téléphone ou courriel)' : 'Zelle Phone or Email'}
                        </p>
                        <p className={`text-sm font-semibold ${textTitle}`}>{event.payment_zelle_phone}</p>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleCopy(event.payment_zelle_phone!.trim(), 'phone')}
                        className={`p-2 rounded-lg ${isLight ? 'bg-white border border-slate-200' : 'bg-slate-950 border border-slate-800'} cursor-pointer`}
                        title={language === 'fr_ht' ? 'Copier' : 'Copy'}
                      >
                        <Copy className="w-4 h-4" />
                      </button>
                    </div>
                  )}
                  {copiedZellePhone && (
                    <p className="text-[10px] text-emerald-500 font-semibold">
                      {language === 'fr_ht' ? 'Numéro copié !' : 'Number copied!'}
                    </p>
                  )}

                  {paymentInstructions && (
                    <p className={`text-xs ${textBody} whitespace-pre-wrap`}>{paymentInstructions}</p>
                  )}

                  <label className={`flex items-start gap-3 text-sm ${textBody} cursor-pointer`}>
                    <input
                      type="checkbox"
                      checked={zellePaymentSent}
                      onChange={(e) => setZellePaymentSent(e.target.checked)}
                      className="mt-1"
                    />
                    <span>
                      {language === 'fr_ht'
                        ? 'J’ai envoyé mon paiement Zelle à l’organisateur (requis pour soumettre l’inscription).'
                        : 'I have sent my Zelle payment to the event organizer (required to submit registration).'}
                    </span>
                  </label>
                </div>
              )}
            </div>

            <div className="flex gap-4 justify-end">
              <button
                type="button"
                onClick={onClose}
                className={`px-5 py-2.5 rounded-lg ${isLight ? 'bg-slate-100 hover:bg-slate-200 text-slate-700' : 'bg-slate-950 hover:bg-slate-850 text-slate-300'} font-semibold text-sm transition-all cursor-pointer`}
              >
                {cancelLabel}
              </button>
              <button
                type="submit"
                disabled={isPending}
                className="px-6 py-2.5 rounded-lg bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-bold text-sm transition-all cursor-pointer"
              >
                {isPending ? loadingLabel : submitLabel}
              </button>
            </div>
          </form>
        ) : (
          <div className="text-center py-6">
            <div
              className={`w-16 h-14 rounded-2xl ${isLight ? 'bg-emerald-50 text-emerald-600' : 'bg-emerald-500/10 text-emerald-400'} flex items-center justify-center mx-auto mb-6`}
            >
              <CheckCircle className="w-8 h-8" />
            </div>
            <h5 className={`text-2xl font-extrabold font-serif ${textTitle} mb-2`}>{successTitle}</h5>
            <p className={`${textBody} text-sm mb-4 leading-relaxed`}>{successMessage}</p>
            {paymentRequired && (
              <p className={`${textMuted} text-xs mb-8 leading-relaxed`}>
                {language === 'fr_ht'
                  ? 'Si vous n’avez pas encore payé, envoyez le montant via Zelle à l’organisateur. L’inscription sera confirmée une fois le paiement reçu.'
                  : 'If you have not paid yet, please send the amount via Zelle to the organizer. Your registration will be confirmed once payment is received.'}
              </p>
            )}
            {!paymentRequired && <div className="mb-8" />}
            <button
              type="button"
              onClick={onClose}
              className={`px-6 py-2.5 rounded-lg ${isLight ? 'bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-200' : 'bg-slate-950 hover:bg-slate-800 border-slate-800 text-slate-200'} font-bold text-sm cursor-pointer`}
            >
              {okLabel}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
