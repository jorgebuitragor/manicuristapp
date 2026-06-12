import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getLocales } from 'expo-localization';
import { translations, type LangCode } from '@/lib/i18n';

type LangPreference = LangCode | 'system';

interface I18nContextValue {
  t: (key: string) => string;
  lang: LangCode;
  langPreference: LangPreference;
  setLangPreference: (pref: LangPreference) => void;
}

const I18nContext = createContext<I18nContextValue>({
  t: (key) => key,
  lang: 'es',
  langPreference: 'system',
  setLangPreference: () => {},
});

const STORAGE_KEY = '@app_lang';

function detectSystemLang(): LangCode {
  const locale = getLocales()[0]?.languageCode ?? 'es';
  return locale === 'en' ? 'en' : 'es';
}

export function I18nProvider({ children }: { children: ReactNode }) {
  const [langPreference, setLangPref] = useState<LangPreference>('system');
  const [lang, setLang] = useState<LangCode>(detectSystemLang());

  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY).then((stored) => {
      if (stored === 'es' || stored === 'en' || stored === 'system') {
        setLangPref(stored as LangPreference);
      }
    });
  }, []);

  useEffect(() => {
    if (langPreference === 'system') {
      setLang(detectSystemLang());
    } else {
      setLang(langPreference);
    }
  }, [langPreference]);

  const setLangPreference = (pref: LangPreference) => {
    setLangPref(pref);
    AsyncStorage.setItem(STORAGE_KEY, pref);
  };

  const t = (key: string): string => {
    return translations[lang][key] ?? key;
  };

  return (
    <I18nContext.Provider value={{ t, lang, langPreference, setLangPreference }}>
      {children}
    </I18nContext.Provider>
  );
}

export const useI18n = () => useContext(I18nContext);
