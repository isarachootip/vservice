"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import { Language, getTranslation, translations } from "@/lib/i18n";

type LanguageContextType = {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: keyof typeof translations.th) => string;
};

const LanguageContext = createContext<LanguageContextType>({
  language: "th",
  setLanguage: () => {},
  t: (key) => getTranslation(key, "th"),
});

export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [language, setLanguageState] = useState<Language>("th");

  useEffect(() => {
    const saved = localStorage.getItem("app_lang") as Language;
    if (saved === "th" || saved === "en") {
      setLanguageState(saved);
    }
  }, []);

  const setLanguage = (lang: Language) => {
    setLanguageState(lang);
    localStorage.setItem("app_lang", lang);
  };

  const t = (key: keyof typeof translations.th) => getTranslation(key, language);

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => useContext(LanguageContext);
