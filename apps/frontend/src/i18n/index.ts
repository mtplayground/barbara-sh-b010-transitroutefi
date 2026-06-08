import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import en from "./locales/en.json";
import zhHans from "./locales/zh-Hans.json";

const languageStorageKey = "preferred-language";
const supportedLanguages = ["en", "zh-Hans"] as const;
type SupportedLanguage = (typeof supportedLanguages)[number];

export const resources = {
  en: {
    translation: en
  },
  "zh-Hans": {
    translation: zhHans
  }
} as const;

function isSupportedLanguage(value: string | null): value is SupportedLanguage {
  return supportedLanguages.some((language) => language === value);
}

function storedLanguage(): SupportedLanguage {
  try {
    const value = window.localStorage.getItem(languageStorageKey);
    return isSupportedLanguage(value) ? value : "en";
  } catch {
    return "en";
  }
}

void i18n.use(initReactI18next).init({
  resources,
  lng: storedLanguage(),
  fallbackLng: "en",
  interpolation: {
    escapeValue: false
  }
});

i18n.on("languageChanged", (language) => {
  if (!isSupportedLanguage(language)) {
    return;
  }

  try {
    window.localStorage.setItem(languageStorageKey, language);
    document.documentElement.lang = language;
  } catch {
    document.documentElement.lang = language;
  }
});

document.documentElement.lang = i18n.language;

export default i18n;
