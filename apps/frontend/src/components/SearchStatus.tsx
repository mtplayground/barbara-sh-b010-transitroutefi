import { useTranslation } from "react-i18next";

interface SearchStatusProps {
  hasNoRoutes: boolean;
  isError: boolean;
  isLoading: boolean;
}

export function SearchStatus({ hasNoRoutes, isError, isLoading }: SearchStatusProps) {
  const { t } = useTranslation();

  if (isLoading) {
    return (
      <section
        className="rounded-lg border border-teal-100 bg-white p-5 shadow-soft"
        aria-live="polite"
      >
        <div className="flex items-center gap-4">
          <div className="h-4 w-4 animate-pulse rounded-full bg-transit-teal" />
          <div>
            <p className="text-lg font-bold text-transit-blue">
              {t("status.loadingTitle")}
            </p>
            <p className="mt-1 text-readable text-transit-muted">
              {t("status.loadingBody")}
            </p>
          </div>
        </div>
      </section>
    );
  }

  if (isError) {
    return (
      <section
        className="rounded-lg border border-red-200 bg-red-50 p-5 shadow-soft"
        aria-live="polite"
      >
        <p className="text-lg font-bold text-red-800">{t("status.errorTitle")}</p>
        <p className="mt-1 text-readable text-red-900">{t("status.errorBody")}</p>
      </section>
    );
  }

  if (hasNoRoutes) {
    return (
      <section
        className="rounded-lg border border-teal-100 bg-white p-5 shadow-soft"
        aria-live="polite"
      >
        <p className="text-lg font-bold text-transit-blue">
          {t("status.noRoutesTitle")}
        </p>
        <p className="mt-1 text-readable text-transit-muted">
          {t("status.noRoutesBody")}
        </p>
        <p className="mt-3 text-readable text-transit-muted">
          {t("status.noRoutesHelp")}
        </p>
      </section>
    );
  }

  return null;
}
