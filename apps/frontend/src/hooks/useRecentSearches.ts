import { useCallback, useState } from "react";
import type { RouteSearchQuery } from "@transitroutefi/shared";

export interface RecentSearch {
  id: string;
  query: RouteSearchQuery;
  savedAt: string;
}

const recentSearchesKey = "recent-searches";
const maxRecentSearches = 5;

function queryId(query: RouteSearchQuery) {
  return [
    query.start.label.trim().toLocaleLowerCase(),
    query.destination.label.trim().toLocaleLowerCase(),
    query.timeMode,
    "requestedTime" in query ? query.requestedTime : ""
  ].join("|");
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value && typeof value === "object");
}

function isRouteSearchQuery(value: unknown): value is RouteSearchQuery {
  if (!isRecord(value) || !isRecord(value.start) || !isRecord(value.destination)) {
    return false;
  }

  if (
    typeof value.start.label !== "string" ||
    typeof value.destination.label !== "string"
  ) {
    return false;
  }

  if (value.timeMode === "leave_now") {
    return true;
  }

  return (
    (value.timeMode === "depart_at" || value.timeMode === "arrive_by") &&
    typeof value.requestedTime === "string"
  );
}

function isRecentSearch(value: unknown): value is RecentSearch {
  return (
    isRecord(value) &&
    typeof value.id === "string" &&
    typeof value.savedAt === "string" &&
    isRouteSearchQuery(value.query)
  );
}

function loadRecentSearches() {
  try {
    const rawValue = window.localStorage.getItem(recentSearchesKey);
    const parsedValue = rawValue ? JSON.parse(rawValue) : [];

    return Array.isArray(parsedValue)
      ? parsedValue.filter(isRecentSearch).slice(0, maxRecentSearches)
      : [];
  } catch {
    return [];
  }
}

function storeRecentSearches(searches: RecentSearch[]) {
  try {
    window.localStorage.setItem(recentSearchesKey, JSON.stringify(searches));
  } catch {
    return;
  }
}

export function useRecentSearches() {
  const [recentSearches, setRecentSearches] =
    useState<RecentSearch[]>(loadRecentSearches);

  const saveSearch = useCallback((query: RouteSearchQuery) => {
    setRecentSearches((currentSearches) => {
      const id = queryId(query);
      const nextSearches = [
        {
          id,
          query,
          savedAt: new Date().toISOString()
        },
        ...currentSearches.filter((search) => search.id !== id)
      ].slice(0, maxRecentSearches);

      storeRecentSearches(nextSearches);
      return nextSearches;
    });
  }, []);

  return {
    recentSearches,
    saveSearch
  };
}
