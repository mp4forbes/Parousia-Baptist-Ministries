'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Language, translations } from './translations';

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: typeof translations['fr_ht'];
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export function LanguageProvider({ 
  children,
  defaultLanguage = 'fr_ht'
}: { 
  children: React.ReactNode;
  defaultLanguage?: Language;
}) {
  const router = useRouter();
  // Default to the server-rendered language preference (French when unset)
  const [language, setLanguageState] = useState<Language>(defaultLanguage);

  // Load selected language from localStorage as fallback on mount
  useEffect(() => {
    try {
      const savedLang = localStorage.getItem('church_lang') as Language;
      if (savedLang === 'fr_ht' || savedLang === 'en') {
        if (savedLang !== language) {
          setLanguageState(savedLang);
          const isSecure = typeof window !== 'undefined' && window.location.protocol === 'https:';
          const secureFlag = isSecure ? ';Secure' : '';
          document.cookie = `church_lang=${savedLang};path=/;max-age=31536000;SameSite=Lax${secureFlag}`;
        }
      }
    } catch (e) {
      console.warn('localStorage is not accessible:', e);
    }
  }, []); // Run once on mount

  // Sync document.documentElement.lang with state changes
  useEffect(() => {
    if (typeof document !== 'undefined') {
      document.documentElement.lang = language === 'en' ? 'en' : 'fr';
    }
  }, [language]);

  const setLanguage = (lang: Language) => {
    setLanguageState(lang);
    try {
      localStorage.setItem('church_lang', lang);
      const isSecure = typeof window !== 'undefined' && window.location.protocol === 'https:';
      const secureFlag = isSecure ? ';Secure' : '';
      document.cookie = `church_lang=${lang};path=/;max-age=31536000;SameSite=Lax${secureFlag}`;
    } catch (e) {
      console.warn('Error saving language:', e);
    }
  };

  // Translations corresponding to the active language
  const t = translations[language] || translations['fr_ht'];

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (context === undefined) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
}

