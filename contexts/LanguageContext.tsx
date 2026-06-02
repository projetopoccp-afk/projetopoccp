"use client";

import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { translations } from "@/lib/i18n/translations";

type Language = "pt" | "en" | "es";

type LanguageContextValue = {
  language: Language;
  setLanguage: (language: Language) => void;
  t: (key: keyof typeof translations.pt) => string;
};

const LanguageContext = createContext<LanguageContextValue | null>(null);

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [language, setLanguageState] = useState<Language>("pt");

  useEffect(() => {
    if (typeof window === "undefined") return;

    const savedLanguage = window.localStorage.getItem("creator-nexus-language");

    if (
      savedLanguage === "pt" ||
      savedLanguage === "en" ||
      savedLanguage === "es"
    ) {
      setLanguageState(savedLanguage);
    }
  }, []);

  function setLanguage(nextLanguage: Language) {
    setLanguageState(nextLanguage);

    if (typeof window !== "undefined") {
      window.localStorage.setItem("creator-nexus-language", nextLanguage);
    }
  }

  const value = useMemo(
    () => ({
      language,
      setLanguage,
      t: (key: keyof typeof translations.pt) => {
        return translations[language][key] || translations.pt[key] || key;
      },
    }),
    [language]
  );

  return (
    <LanguageContext.Provider value={value}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);

  if (!context) {
    throw new Error("useLanguage precisa estar dentro de LanguageProvider");
  }

  return context;
}
