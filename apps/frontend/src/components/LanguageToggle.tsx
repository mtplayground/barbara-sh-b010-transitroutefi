import { useTranslation } from "react-i18next";

const languages = [
  { code: "en", labelKey: "language.en" },
  { code: "zh-Hans", labelKey: "language.zhHans" }
] as const;

export function LanguageToggle() {
  const { i18n, t } = useTranslation();

  return (
    <div
      className="inline-grid grid-cols-2 rounded-md border border-teal-200 bg-white p-1 shadow-soft"
      role="group"
      aria-label={t("language.toggleAria")}
    >
      {languages.map((language) => {
        const isActive = i18n.resolvedLanguage === language.code;

        return (
          <button
            key={language.code}
            aria-pressed={isActive}
            className={[
              "min-h-10 rounded px-3 text-sm font-bold transition focus:outline-none focus:ring-4 focus:ring-teal-100",
              isActive
                ? "bg-transit-teal text-white"
                : "text-transit-muted hover:bg-teal-50 hover:text-transit-teal"
            ].join(" ")}
            type="button"
            onClick={() => void i18n.changeLanguage(language.code)}
          >
            {t(language.labelKey)}
          </button>
        );
      })}
    </div>
  );
}
