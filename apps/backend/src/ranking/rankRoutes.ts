import type { RouteOption } from "@transitroutefi/shared";

function toArrivalTimestamp(route: RouteOption): number {
  const timestamp = Date.parse(route.arrivalTime);
  return Number.isNaN(timestamp) ? Number.POSITIVE_INFINITY : timestamp;
}

export function compareRouteOptions(a: RouteOption, b: RouteOption): number {
  return (
    a.totalDurationMinutes - b.totalDurationMinutes ||
    a.transfers - b.transfers ||
    a.walkingTimeMinutes - b.walkingTimeMinutes ||
    toArrivalTimestamp(a) - toArrivalTimestamp(b)
  );
}

export function rankRoutes(routes: readonly RouteOption[]): RouteOption[] {
  return routes
    .map((route, index) => ({ route, index }))
    .sort((a, b) => compareRouteOptions(a.route, b.route) || a.index - b.index)
    .map(({ route }) => route);
}
