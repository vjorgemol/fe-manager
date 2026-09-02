import React, { createContext, useContext, useState } from 'react';
import { translations } from '../utils/translations';

export type Language = 'es' | 'val';

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: keyof typeof translations.es, params?: Record<string, string | number>) => string;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [language, setLanguageState] = useState<Language>(() => {
    const saved = localStorage.getItem('language');
    return (saved === 'val' ? 'val' : 'es') as Language;
  });

  const setLanguage = (lang: Language) => {
    setLanguageState(lang);
    localStorage.setItem('language', lang);
  };

  const t = (key: keyof typeof translations.es, params?: Record<string, string | number>) => {
    const dict = translations[language] || translations.es;
    let translation = dict[key] || translations.es[key] || String(key);
    
    if (params) {
      Object.entries(params).forEach(([k, v]) => {
        translation = translation.replace(new RegExp(`{${k}}`, 'g'), String(v));
      });
    }
    return translation;
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage debe usarse dentro de un LanguageProvider');
  }
  return context;
};
export type { LanguageContextType };
