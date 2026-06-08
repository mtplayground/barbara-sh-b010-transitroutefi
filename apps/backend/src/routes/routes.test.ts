import type { RouteOption, RouteSearchQuery } from "@transitroutefi/shared";
import request from "supertest";
import { describe, expect, it, vi } from "vitest";
import { createApp } from "../app.js";
import type { RoutingProvider } from "../providers/index.js";

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

function providerReturning(routes: RouteOption[]): RoutingProvider {
  return {
    name: "test",
    findRoutes: vi.fn(async (_query: RouteSearchQuery) => routes)
  };
}

describe("POST /api/routes", () => {
  it("validates input, ranks provider routes, and returns normalized JSON", async () => {
    const provider = providerReturning([
      route({ id: "slow", totalDurationMinutes: 60 }),
      route({ id: "fast", totalDurationMinutes: 30 })
    ]);
    const app = createApp({ routingProvider: provider });

    const response = await request(app)
      .post("/api/routes")
      .send({
        start: "Waterfront Station",
        destination: "UBC Exchange",
        timeMode: "leave_now"
      })
      .expect(200);

    expect(response.body.status).toBe("ok");
    expect(response.body.routes.map((option: RouteOption) => option.id)).toEqual([
      "fast",
      "slow"
    ]);
    expect(provider.findRoutes).toHaveBeenCalledWith({
      start: { label: "Waterfront Station" },
      destination: { label: "UBC Exchange" },
      timeMode: "leave_now"
    });
  });

  it("returns a distinct no-route result when provider has no routes", async () => {
    const app = createApp({ routingProvider: providerReturning([]) });

    const response = await request(app)
      .post("/api/routes")
      .send({
        start: "Waterfront Station",
        destination: "UBC Exchange",
        timeMode: "leave_now"
      })
      .expect(200);

    expect(response.body).toEqual({
      status: "no_routes",
      routes: [],
      message: "No transit route available for this search."
    });
  });

  it("returns validation errors for invalid route searches", async () => {
    const app = createApp({ routingProvider: providerReturning([]) });

    const response = await request(app)
      .post("/api/routes")
      .send({
        start: "Waterfront Station",
        destination: "UBC Exchange",
        timeMode: "depart_at"
      })
      .expect(400);

    expect(response.body.status).toBe("error");
    expect(response.body.error.code).toBe("VALIDATION_ERROR");
    expect(response.body.error.details).toEqual(
      expect.arrayContaining([expect.objectContaining({ path: "requestedTime" })])
    );
  });

  it("surfaces provider failures through the app error handler", async () => {
    const consoleError = vi.spyOn(console, "error").mockImplementation(() => {});
    const provider: RoutingProvider = {
      name: "failing",
      findRoutes: vi.fn(async () => {
        throw new Error("provider failed");
      })
    };
    const app = createApp({ routingProvider: provider });

    const response = await request(app)
      .post("/api/routes")
      .send({
        start: "Waterfront Station",
        destination: "UBC Exchange",
        timeMode: "leave_now"
      })
      .expect(500);

    expect(response.body).toEqual({
      status: "error",
      error: {
        code: "INTERNAL_SERVER_ERROR",
        message: "Unable to find routes right now."
      }
    });
    expect(consoleError).toHaveBeenCalled();
    consoleError.mockRestore();
  });
});
