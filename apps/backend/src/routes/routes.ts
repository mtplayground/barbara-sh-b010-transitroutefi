import type { RouteSearchQuery } from "@transitroutefi/shared";
import { Router } from "express";
import { z } from "zod";
import { createRoutingProvider } from "../providers/index.js";
import type { RoutingProvider } from "../providers/index.js";
import { rankRoutes } from "../ranking/index.js";

const coordinatesSchema = z
  .object({
    lat: z.number().min(-90).max(90),
    lng: z.number().min(-180).max(180)
  })
  .strict();

const locationObjectSchema = z
  .object({
    label: z.string().trim().min(1),
    address: z.string().trim().min(1).optional(),
    placeId: z.string().trim().min(1).optional(),
    coordinates: coordinatesSchema.optional()
  })
  .strict();

const locationSchema = z.union([
  z
    .string()
    .trim()
    .min(1)
    .transform((label) => ({ label })),
  locationObjectSchema
]);

const routeSearchBodySchema = z
  .object({
    start: locationSchema,
    destination: locationSchema,
    timeMode: z.enum(["leave_now", "depart_at", "arrive_by"]),
    requestedTime: z.string().datetime({ offset: true }).optional()
  })
  .strict()
  .superRefine((value, context) => {
    if (value.timeMode === "leave_now" && value.requestedTime) {
      context.addIssue({
        code: "custom",
        path: ["requestedTime"],
        message: "requestedTime is not allowed when timeMode is leave_now."
      });
    }

    if (value.timeMode !== "leave_now" && !value.requestedTime) {
      context.addIssue({
        code: "custom",
        path: ["requestedTime"],
        message: "requestedTime is required for depart_at and arrive_by searches."
      });
    }
  })
  .transform((value): RouteSearchQuery => {
    if (value.timeMode === "leave_now") {
      return {
        start: value.start,
        destination: value.destination,
        timeMode: "leave_now"
      };
    }

    return {
      start: value.start,
      destination: value.destination,
      timeMode: value.timeMode,
      requestedTime: value.requestedTime as string
    };
  });

function validationDetails(error: z.ZodError) {
  return error.issues.map((issue) => ({
    path: issue.path.join("."),
    message: issue.message
  }));
}

export function createRoutesRouter(
  provider: RoutingProvider = createRoutingProvider()
): Router {
  const router = Router();

  router.post("/routes", async (req, res, next) => {
    const parsed = routeSearchBodySchema.safeParse(req.body);

    if (!parsed.success) {
      res.status(400).json({
        status: "error",
        error: {
          code: "VALIDATION_ERROR",
          message: "Invalid route search request.",
          details: validationDetails(parsed.error)
        }
      });
      return;
    }

    try {
      const routes = rankRoutes(await provider.findRoutes(parsed.data));

      if (routes.length === 0) {
        res.json({
          status: "no_routes",
          routes: [],
          message: "No transit route available for this search."
        });
        return;
      }

      res.json({
        status: "ok",
        routes
      });
    } catch (error) {
      next(error);
    }
  });

  return router;
}
