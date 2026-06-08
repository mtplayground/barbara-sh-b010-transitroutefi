import { useState } from "react";
import type { FormEvent } from "react";
import type { RouteSearchQuery } from "@transitroutefi/shared";
import { RouteResults } from "./components/RouteResults";
import { useRouteSearch } from "./hooks/useRouteSearch";

const timeModes = [
  { value: "leave_now", label: "Leave now" },
  { value: "depart_at", label: "Depart at" },
  { value: "arrive_by", label: "Arrive by" }
] as const;

type TimeMode = (typeof timeModes)[number]["value"];

function App() {
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

  return (
    <main className="min-h-screen bg-transit-mist px-5 py-8 text-transit-ink sm:px-8 lg:px-10">
      <section className="mx-auto flex w-full max-w-6xl flex-col gap-8 lg:min-h-[calc(100vh-4rem)] lg:justify-center">
        <div className="max-w-4xl">
          <p className="mb-3 text-sm font-bold uppercase tracking-wide text-transit-teal">
            Public transit routing
          </p>
          <h1 className="max-w-4xl text-5xl font-bold leading-none text-transit-blue sm:text-6xl lg:text-7xl">
            Find the Best Public Transit Route
          </h1>
          <p className="mt-5 max-w-2xl text-readable text-transit-muted">
            Plan a calm, reliable ride across Metro Vancouver with clear start,
            destination, and travel-time choices.
          </p>
        </div>

        <form
          className="w-full rounded-lg border border-teal-100 bg-white p-5 shadow-soft sm:p-7 lg:p-8"
          onSubmit={handleSubmit}
        >
          <div className="grid gap-5 lg:grid-cols-[1fr_auto_1fr_auto] lg:items-end">
            <label className="grid gap-2 text-base font-bold text-transit-ink">
              Starting point
              <input
                className="min-h-14 rounded-md border border-slate-300 bg-white px-4 text-lg text-transit-ink outline-none transition focus:border-transit-teal focus:ring-4 focus:ring-teal-100"
                name="start"
                onChange={(event) => setStart(event.target.value)}
                placeholder="Waterfront Station"
                required
                type="text"
                value={start}
              />
            </label>

            <button
              aria-label="Swap start and destination"
              className="min-h-12 rounded-md border border-teal-200 bg-teal-50 px-4 text-base font-bold text-transit-teal transition hover:border-transit-teal hover:bg-white focus:outline-none focus:ring-4 focus:ring-teal-100 lg:mb-0.5 lg:min-h-14"
              type="button"
              onClick={swapLocations}
            >
              Swap
            </button>

            <label className="grid gap-2 text-base font-bold text-transit-ink">
              Destination
              <input
                className="min-h-14 rounded-md border border-slate-300 bg-white px-4 text-lg text-transit-ink outline-none transition focus:border-transit-teal focus:ring-4 focus:ring-teal-100"
                name="destination"
                onChange={(event) => setDestination(event.target.value)}
                placeholder="UBC Exchange"
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
              Find Routes
            </button>
          </div>

          <fieldset className="mt-6">
            <legend className="mb-3 text-base font-bold text-transit-ink">
              Travel time
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
                    {mode.label}
                  </span>
                </label>
              ))}
            </div>
          </fieldset>

          {timeMode !== "leave_now" ? (
            <label className="mt-6 grid gap-2 text-base font-bold text-transit-ink sm:max-w-sm">
              Date and time
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

        <RouteResults routes={routes} />
      </section>
    </main>
  );
}

export default App;
