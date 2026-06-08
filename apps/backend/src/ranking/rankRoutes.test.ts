import type { RouteOption } from "@transitroutefi/shared";
import { describe, expect, it } from "vitest";
import { compareRouteOptions, rankRoutes } from "./rankRoutes.js";

function route(overrides: Partial<RouteOption> & { id: string }): RouteOption {
  return {
    id: overrides.id,
    summary: overrides.summary ?? overrides.id,
    totalDurationMinutes: overrides.totalDurationMinutes ?? 45,
    walkingTimeMinutes: overrides.walkingTimeMinutes ?? 8,
    transfers: overrides.transfers ?? 1,
    departureTime: overrides.departureTime ?? "2026-01-01T08:00:00.000Z",
    arrivalTime: overrides.arrivalTime ?? "2026-01-01T08:45:00.000Z",
    legs: overrides.legs ?? [],
    fare: overrides.fare,
    routePolyline: overrides.routePolyline,
    bounds: overrides.bounds
  };
}

describe("rankRoutes", () => {
  it("orders by shortest total duration first", () => {
    const ranked = rankRoutes([
      route({ id: "slow", totalDurationMinutes: 55 }),
      route({ id: "fast", totalDurationMinutes: 35 }),
      route({ id: "middle", totalDurationMinutes: 45 })
    ]);

    expect(ranked.map((option) => option.id)).toEqual(["fast", "middle", "slow"]);
  });

  it("uses fewer transfers when total duration ties", () => {
    const ranked = rankRoutes([
      route({ id: "two-transfers", totalDurationMinutes: 40, transfers: 2 }),
      route({ id: "direct", totalDurationMinutes: 40, transfers: 0 }),
      route({ id: "one-transfer", totalDurationMinutes: 40, transfers: 1 })
    ]);

    expect(ranked.map((option) => option.id)).toEqual([
      "direct",
      "one-transfer",
      "two-transfers"
    ]);
  });

  it("uses less walking when duration and transfers tie", () => {
    const ranked = rankRoutes([
      route({
        id: "long-walk",
        totalDurationMinutes: 42,
        transfers: 1,
        walkingTimeMinutes: 16
      }),
      route({
        id: "short-walk",
        totalDurationMinutes: 42,
        transfers: 1,
        walkingTimeMinutes: 4
      })
    ]);

    expect(ranked.map((option) => option.id)).toEqual(["short-walk", "long-walk"]);
  });

  it("uses earlier arrival as the final ranking tie-breaker", () => {
    const ranked = rankRoutes([
      route({
        id: "later",
        totalDurationMinutes: 42,
        transfers: 1,
        walkingTimeMinutes: 6,
        arrivalTime: "2026-01-01T09:30:00.000Z"
      }),
      route({
        id: "earlier",
        totalDurationMinutes: 42,
        transfers: 1,
        walkingTimeMinutes: 6,
        arrivalTime: "2026-01-01T09:15:00.000Z"
      })
    ]);

    expect(ranked.map((option) => option.id)).toEqual(["earlier", "later"]);
  });

  it("applies ranking priorities before later tie-breakers", () => {
    const ranked = rankRoutes([
      route({
        id: "same-duration-more-transfers",
        totalDurationMinutes: 40,
        transfers: 2,
        walkingTimeMinutes: 1,
        arrivalTime: "2026-01-01T08:41:00.000Z"
      }),
      route({
        id: "shortest-with-tradeoffs",
        totalDurationMinutes: 39,
        transfers: 3,
        walkingTimeMinutes: 30,
        arrivalTime: "2026-01-01T09:30:00.000Z"
      }),
      route({
        id: "same-duration-transfer-longer-walk",
        totalDurationMinutes: 40,
        transfers: 1,
        walkingTimeMinutes: 10,
        arrivalTime: "2026-01-01T08:50:00.000Z"
      }),
      route({
        id: "same-duration-fewer-transfers",
        totalDurationMinutes: 40,
        transfers: 0,
        walkingTimeMinutes: 20,
        arrivalTime: "2026-01-01T09:00:00.000Z"
      }),
      route({
        id: "same-duration-transfer-shorter-walk",
        totalDurationMinutes: 40,
        transfers: 1,
        walkingTimeMinutes: 5,
        arrivalTime: "2026-01-01T08:55:00.000Z"
      })
    ]);

    expect(ranked.map((option) => option.id)).toEqual([
      "shortest-with-tradeoffs",
      "same-duration-fewer-transfers",
      "same-duration-transfer-shorter-walk",
      "same-duration-transfer-longer-walk",
      "same-duration-more-transfers"
    ]);
  });

  it("does not mutate input and keeps original order for complete ties", () => {
    const original = [
      route({ id: "first" }),
      route({ id: "second" }),
      route({ id: "third" })
    ];
    const ranked = rankRoutes(original);

    expect(ranked).not.toBe(original);
    expect(ranked.map((option) => option.id)).toEqual(["first", "second", "third"]);
    expect(original.map((option) => option.id)).toEqual(["first", "second", "third"]);
  });
});

describe("compareRouteOptions", () => {
  it("treats an invalid arrival time as later than a valid arrival time", () => {
    const validArrival = route({
      id: "valid-arrival",
      arrivalTime: "2026-01-01T08:45:00.000Z"
    });
    const invalidArrival = route({
      id: "invalid-arrival",
      arrivalTime: "not-a-date"
    });

    expect(compareRouteOptions(validArrival, invalidArrival)).toBeLessThan(0);
    expect(compareRouteOptions(invalidArrival, validArrival)).toBeGreaterThan(0);
  });
});
