import { useTranslation } from "react-i18next";
import type { RouteSearchQuery } from "@transitroutefi/shared";
import type { RecentSearch } from "../hooks/useRecentSearches";

interface RecentSearchesProps {
  searches: RecentSearch[];
  onSelect: (query: RouteSearchQuery) => void;
}

function searchLabel(query: RouteSearchQuery) {
  return `${query.start.label} -> ${query.destination.label}`;
}

export function RecentSearches({ searches, onSelect }: RecentSearchesProps) {
  const { t } = useTranslation();

  if (searches.length === 0) {
    return null;
  }

  return (
    <section className="rounded-lg border border-teal-100 bg-white p-5 shadow-soft sm:p-6">
      <div>
        <p className="text-sm font-bold uppercase tracking-wide text-transit-teal">
          {t("recent.eyebrow")}
        </p>
        <h2 className="mt-1 text-2xl font-bold text-transit-blue">
          {t("recent.heading")}
        </h2>
      </div>

      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        {searches.map((search) => (
          <button
            key={search.id}
            className="rounded-md border border-teal-100 bg-teal-50 p-4 text-left transition hover:border-transit-teal hover:bg-white focus:outline-none focus:ring-4 focus:ring-teal-100"
            type="button"
            onClick={() => onSelect(search.query)}
          >
            <span className="block text-lg font-bold text-transit-ink">
              {searchLabel(search.query)}
            </span>
            <span className="mt-2 block text-sm font-bold uppercase tracking-wide text-transit-muted">
              {t(`app.timeModes.${search.query.timeMode}`)}
            </span>
          </button>
        ))}
      </div>
    </section>
  );
}
