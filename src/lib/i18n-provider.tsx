"use client";

import i18next from "i18next";
import { createContext, ReactNode, useContext, useMemo, useState } from "react";
import { I18nextProvider, initReactI18next } from "react-i18next";
import en from "@/messages/en.json";
import vi from "@/messages/vi.json";

export type Locale = "vi" | "en";

if (!i18next.isInitialized) {
  i18next.use(initReactI18next).init({
    resources: {
      vi: { translation: vi },
      en: { translation: en },
    },
    lng: "vi",
    fallbackLng: "en",
    interpolation: { escapeValue: false },
  });
}

const LocaleContext = createContext<{
  locale: Locale;
  changeLanguage: (locale: Locale) => void;
}>({
  locale: "vi",
  changeLanguage: () => undefined,
});

export function I18nProvider({ children }: { children: ReactNode }) {
  const [locale, setLocale] = useState<Locale>("vi");
  const i18n = useMemo(() => i18next, []);

  function changeLanguage(nextLocale: Locale) {
    setLocale(nextLocale);
    i18n.changeLanguage(nextLocale);
  }

  return (
    <I18nextProvider i18n={i18n}>
      <LocaleContext.Provider value={{ locale, changeLanguage }}>
        {children}
      </LocaleContext.Provider>
    </I18nextProvider>
  );
}

export function useLocale() {
  return useContext(LocaleContext);
}
