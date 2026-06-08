import { useState } from "react";

const timeModes = [
  { value: "leave_now", label: "Leave now" },
  { value: "depart_at", label: "Depart at" },
  { value: "arrive_by", label: "Arrive by" }
] as const;

type TimeMode = (typeof timeModes)[number]["value"];

function App() {
  const [timeMode, setTimeMode] = useState<TimeMode>("leave_now");

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
          onSubmit={(event) => event.preventDefault()}
        >
          <div className="grid gap-5 lg:grid-cols-[1fr_1fr_auto] lg:items-end">
            <label className="grid gap-2 text-base font-bold text-transit-ink">
              Starting point
              <input
                className="min-h-14 rounded-md border border-slate-300 bg-white px-4 text-lg text-transit-ink outline-none transition focus:border-transit-teal focus:ring-4 focus:ring-teal-100"
                name="start"
                placeholder="Waterfront Station"
                required
                type="text"
              />
            </label>

            <label className="grid gap-2 text-base font-bold text-transit-ink">
              Destination
              <input
                className="min-h-14 rounded-md border border-slate-300 bg-white px-4 text-lg text-transit-ink outline-none transition focus:border-transit-teal focus:ring-4 focus:ring-teal-100"
                name="destination"
                placeholder="UBC Exchange"
                required
                type="text"
              />
            </label>

            <button
              className="min-h-14 rounded-md bg-transit-green px-6 text-lg font-bold text-white transition hover:bg-transit-teal focus:outline-none focus:ring-4 focus:ring-teal-100 lg:min-w-40"
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
                required
                type="datetime-local"
              />
            </label>
          ) : null}
        </form>
      </section>
    </main>
  );
}

export default App;
