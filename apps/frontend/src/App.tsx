import { useState } from "react";
import type { FormEvent } from "react";
import { useTranslation } from "react-i18next";
import type { RouteSearchQuery } from "@transitroutefi/shared";
import { LanguageToggle } from "./components/LanguageToggle";
import { RouteMap } from "./components/RouteMap";
import { RouteResults } from "./components/RouteResults";
import { SearchStatus } from "./components/SearchStatus";
import { useRouteSearch } from "./hooks/useRouteSearch";

const timeModes = [
  { value: "leave_now", labelKey: "app.timeModes.leave_now" },
  { value: "depart_at", labelKey: "app.timeModes.depart_at" },
  { value: "arrive_by", labelKey: "app.timeModes.arrive_by" }
] as const;

type TimeMode = (typeof timeModes)[number]["value"];

function App() {
  const { t } = useTranslation();
  const [start, setStart] = useState("");
  const [destination, setDestination] = useState("");
  const [timeMode, setTimeMode] = useState<TimeMode>("leave_now");
  const [requestedTime, setRequestedTime] = useState("");
  const routeSearch = useRouteSearch();

  function swapLocations() {
    setStart(destination);
    setDestination(start);
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const trimmedStart = start.trim();
    const trimmedDestination = destination.trim();

    if (!trimmedStart || !trimmedDestination) {
      return;
    }

    const baseQuery = {
      start: { label: trimmedStart },
      destination: { label: trimmedDestination }
    };

    if (timeMode === "leave_now") {
      routeSearch.mutate({
        ...baseQuery,
        timeMode: "leave_now"
      });
      return;
    }

    if (!requestedTime) {
      return;
    }

    routeSearch.mutate({
      ...baseQuery,
      timeMode,
      requestedTime: new Date(requestedTime).toISOString()
    } as RouteSearchQuery);
  }

  const routes = routeSearch.data?.status === "ok" ? routeSearch.data.routes : [];
  const selectedRoute = routes[0];
  const hasNoRoutes = routeSearch.data?.status === "no_routes";

  return (
    <main className="min-h-screen bg-transit-mist px-5 py-8 text-transit-ink sm:px-8 lg:px-10">
      <header className="mx-auto mb-6 flex w-full max-w-6xl justify-end">
        <LanguageToggle />
      </header>

      <section className="mx-auto flex w-full max-w-6xl flex-col gap-8 lg:min-h-[calc(100vh-7rem)] lg:justify-center">
        <div className="max-w-4xl">
          <p className="mb-3 text-sm font-bold uppercase tracking-wide text-transit-teal">
            {t("app.eyebrow")}
          </p>
          <h1 className="max-w-4xl text-5xl font-bold leading-none text-transit-blue sm:text-6xl lg:text-7xl">
            {t("app.title")}
          </h1>
          <p className="mt-5 max-w-2xl text-readable text-transit-muted">
            {t("app.intro")}
          </p>
        </div>

        <form
          className="w-full rounded-lg border border-teal-100 bg-white p-5 shadow-soft sm:p-7 lg:p-8"
          onSubmit={handleSubmit}
        >
          <div className="grid gap-5 lg:grid-cols-[1fr_auto_1fr_auto] lg:items-end">
            <label className="grid gap-2 text-base font-bold text-transit-ink">
              {t("app.startLabel")}
              <input
                className="min-h-14 rounded-md border border-slate-300 bg-white px-4 text-lg text-transit-ink outline-none transition focus:border-transit-teal focus:ring-4 focus:ring-teal-100"
                name="start"
                onChange={(event) => setStart(event.target.value)}
                placeholder={t("app.startPlaceholder")}
                required
                type="text"
                value={start}
              />
            </label>

            <button
              aria-label={t("app.swapAria")}
              className="min-h-12 rounded-md border border-teal-200 bg-teal-50 px-4 text-base font-bold text-transit-teal transition hover:border-transit-teal hover:bg-white focus:outline-none focus:ring-4 focus:ring-teal-100 lg:mb-0.5 lg:min-h-14"
              type="button"
              onClick={swapLocations}
            >
              {t("app.swap")}
            </button>

            <label className="grid gap-2 text-base font-bold text-transit-ink">
              {t("app.destinationLabel")}
              <input
                className="min-h-14 rounded-md border border-slate-300 bg-white px-4 text-lg text-transit-ink outline-none transition focus:border-transit-teal focus:ring-4 focus:ring-teal-100"
                name="destination"
                onChange={(event) => setDestination(event.target.value)}
                placeholder={t("app.destinationPlaceholder")}
                required
                type="text"
                value={destination}
              />
            </label>

            <button
              className="min-h-14 rounded-md bg-transit-green px-6 text-lg font-bold text-white transition hover:bg-transit-teal focus:outline-none focus:ring-4 focus:ring-teal-100 disabled:cursor-not-allowed disabled:bg-slate-400 lg:min-w-40"
              disabled={routeSearch.isPending}
              type="submit"
            >
              {routeSearch.isPending ? t("app.findingRoutes") : t("app.findRoutes")}
            </button>
          </div>

          <fieldset className="mt-6">
            <legend className="mb-3 text-base font-bold text-transit-ink">
              {t("app.travelTime")}
            </legend>
            <div className="grid gap-3 sm:grid-cols-3">
              {timeModes.map((mode) => (
                <label key={mode.value} className="relative">
                  <input
                    checked={timeMode === mode.value}
                    className="peer sr-only"
                    name="timeMode"
                    onChange={() => setTimeMode(mode.value)}
                    type="radio"
                    value={mode.value}
                  />
                  <span className="flex min-h-12 cursor-pointer items-center justify-center rounded-md border border-slate-300 px-4 text-base font-bold text-transit-muted transition peer-checked:border-transit-teal peer-checked:bg-teal-50 peer-checked:text-transit-teal peer-focus-visible:ring-4 peer-focus-visible:ring-teal-100">
                    {t(mode.labelKey)}
                  </span>
                </label>
              ))}
            </div>
          </fieldset>

          {timeMode !== "leave_now" ? (
            <label className="mt-6 grid gap-2 text-base font-bold text-transit-ink sm:max-w-sm">
              {t("app.dateTime")}
              <input
                className="min-h-14 rounded-md border border-slate-300 bg-white px-4 text-lg text-transit-ink outline-none transition focus:border-transit-teal focus:ring-4 focus:ring-teal-100"
                name="requestedTime"
                onChange={(event) => setRequestedTime(event.target.value)}
                required
                type="datetime-local"
                value={requestedTime}
              />
            </label>
          ) : null}
        </form>

        <SearchStatus
          isError={routeSearch.isError}
          isLoading={routeSearch.isPending}
          hasNoRoutes={hasNoRoutes}
        />

        <RouteMap route={selectedRoute} />

        <RouteResults routes={routes} />
      </section>
    </main>
  );
}

export default App;
