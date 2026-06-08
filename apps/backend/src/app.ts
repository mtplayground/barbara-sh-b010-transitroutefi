import express, {
  type ErrorRequestHandler,
  type Request,
  type Response
} from "express";
import { createRoutesRouter } from "./routes/routes.js";
import type { RoutingProvider } from "./providers/index.js";

export interface CreateAppOptions {
  routingProvider?: RoutingProvider;
}

function errorCode(error: unknown): unknown {
  if (typeof error === "object" && error !== null && "code" in error) {
    return error.code;
  }

  return undefined;
}

export const errorHandler: ErrorRequestHandler = (err, _req, res, _next) => {
  console.error("Unhandled request error", {
    name: err instanceof Error ? err.name : undefined,
    code: errorCode(err),
    message: err instanceof Error ? err.message : String(err),
    stack: err instanceof Error ? err.stack : undefined
  });

  res.status(500).json({
    status: "error",
    error: {
      code: "INTERNAL_SERVER_ERROR",
      message: "Unable to find routes right now."
    }
  });
};

export function createApp(options: CreateAppOptions = {}) {
  const app = express();

  app.use(express.json());

  app.get("/api/health", (_req: Request, res: Response) => {
    res.json({ status: "ok" });
  });

  app.use("/api", createRoutesRouter(options.routingProvider));
  app.use(errorHandler);

  return app;
}
