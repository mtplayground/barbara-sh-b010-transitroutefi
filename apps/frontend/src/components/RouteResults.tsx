import type { RouteOption, TransitLine } from "@transitroutefi/shared";

interface RouteResultsProps {
  routes: RouteOption[];
}

const timeFormatter = new Intl.DateTimeFormat(undefined, {
  hour: "numeric",
  minute: "2-digit"
});

function formatClockTime(value: string) {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return timeFormatter.format(date);
}

function formatMinutes(minutes: number) {
  if (minutes < 60) {
    return `${minutes} min`;
  }

  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;

  if (remainingMinutes === 0) {
    return `${hours} hr`;
  }

  return `${hours} hr ${remainingMinutes} min`;
}

function formatTransfers(count: number) {
  return count === 1 ? "1 transfer" : `${count} transfers`;
}

function routeTransitLines(route: RouteOption): TransitLine[] {
  const lines = new Map<string, TransitLine>();

  for (const leg of route.legs) {
    if (!leg.transitLine) {
      continue;
    }

    const key = [
      leg.transitLine.shortName,
      leg.transitLine.name,
      leg.transitLine.agencyName
    ]
      .filter(Boolean)
      .join(":");

    lines.set(key, leg.transitLine);
  }

  return Array.from(lines.values());
}

function lineLabel(line: TransitLine) {
  return line.shortName ?? line.name;
}

export function RouteResults({ routes }: RouteResultsProps) {
  if (routes.length === 0) {
    return null;
  }

  return (
    <section className="grid gap-4" aria-labelledby="route-results-heading">
      <div>
        <p className="text-sm font-bold uppercase tracking-wide text-transit-teal">
          Ranked routes
        </p>
        <h2
          id="route-results-heading"
          className="mt-1 text-3xl font-bold text-transit-blue sm:text-4xl"
        >
          Route options
        </h2>
      </div>

      <div className="grid gap-4">
        {routes.map((route, index) => {
          const isBestRoute = index === 0;
          const transitLines = routeTransitLines(route);

          return (
            <article
              key={route.id}
              className={[
                "rounded-lg border bg-white p-5 shadow-soft sm:p-6",
                isBestRoute
                  ? "border-transit-green ring-4 ring-green-100"
                  : "border-teal-100"
              ].join(" ")}
            >
              <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <p
                    className={[
                      "mb-2 text-sm font-bold uppercase tracking-wide",
                      isBestRoute ? "text-transit-green" : "text-transit-muted"
                    ].join(" ")}
                  >
                    {isBestRoute ? "Best route" : `Alternative ${index}`}
                  </p>
                  <h3 className="text-2xl font-bold text-transit-ink">
                    {route.summary}
                  </h3>
                </div>

                <div className="rounded-md bg-teal-50 px-4 py-3 text-left sm:text-right">
                  <p className="text-sm font-bold uppercase tracking-wide text-transit-teal">
                    Duration
                  </p>
                  <p className="text-3xl font-bold text-transit-blue">
                    {formatMinutes(route.totalDurationMinutes)}
                  </p>
                </div>
              </div>

              <dl className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                <div>
                  <dt className="text-sm font-bold uppercase tracking-wide text-transit-muted">
                    Departure
                  </dt>
                  <dd className="mt-1 text-xl font-bold text-transit-ink">
                    {formatClockTime(route.departureTime)}
                  </dd>
                </div>
                <div>
                  <dt className="text-sm font-bold uppercase tracking-wide text-transit-muted">
                    Arrival
                  </dt>
                  <dd className="mt-1 text-xl font-bold text-transit-ink">
                    {formatClockTime(route.arrivalTime)}
                  </dd>
                </div>
                <div>
                  <dt className="text-sm font-bold uppercase tracking-wide text-transit-muted">
                    Transfers
                  </dt>
                  <dd className="mt-1 text-xl font-bold text-transit-ink">
                    {formatTransfers(route.transfers)}
                  </dd>
                </div>
                <div>
                  <dt className="text-sm font-bold uppercase tracking-wide text-transit-muted">
                    Walking
                  </dt>
                  <dd className="mt-1 text-xl font-bold text-transit-ink">
                    {formatMinutes(route.walkingTimeMinutes)}
                  </dd>
                </div>
              </dl>

              <div className="mt-5 flex flex-wrap gap-2">
                {transitLines.length > 0 ? (
                  transitLines.map((line) => (
                    <span
                      key={`${line.name}-${line.shortName ?? ""}`}
                      className="rounded-md border border-teal-200 bg-teal-50 px-3 py-2 text-sm font-bold text-transit-teal"
                    >
                      {lineLabel(line)}
                    </span>
                  ))
                ) : (
                  <span className="rounded-md border border-teal-200 bg-teal-50 px-3 py-2 text-sm font-bold text-transit-teal">
                    Walking
                  </span>
                )}
              </div>
            </article>
          );
        })}
      </div>
    </section>
  );
}
