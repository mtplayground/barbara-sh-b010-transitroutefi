import { existsSync } from "node:fs";
import { extname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import express, {
  type Express,
  type ErrorRequestHandler,
  type NextFunction,
  type Request,
  type Response
} from "express";
import { createRoutesRouter } from "./routes/routes.js";
import type { RoutingProvider } from "./providers/index.js";

export interface CreateAppOptions {
  frontendDistPath?: string;
  routingProvider?: RoutingProvider;
}

const defaultFrontendDistPath = resolve(
  fileURLToPath(new URL(".", import.meta.url)),
  "../../frontend/dist"
);

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

function shouldServeSpaFallback(req: Request): boolean {
  return (
    req.method === "GET" &&
    !req.path.startsWith("/api") &&
    !extname(req.path) &&
    Boolean(req.accepts("html"))
  );
}

function mountFrontend(app: Express, frontendDistPath: string): void {
  const indexPath = join(frontendDistPath, "index.html");

  if (!existsSync(indexPath)) {
    return;
  }

  app.use(express.static(frontendDistPath, { index: false }));
  app.get(/^(?!\/api(?:\/|$)).*/, (req: Request, res: Response, next: NextFunction) => {
    if (!shouldServeSpaFallback(req)) {
      next();
      return;
    }

    res.sendFile(indexPath, (error) => {
      if (error) {
        next(error);
      }
    });
  });
}

export function createApp(options: CreateAppOptions = {}) {
  const app = express();

  app.use(express.json());

  app.get("/api/health", (_req: Request, res: Response) => {
    res.json({ status: "ok" });
  });

  app.use("/api", createRoutesRouter(options.routingProvider));
  mountFrontend(app, options.frontendDistPath ?? defaultFrontendDistPath);
  app.use(errorHandler);

  return app;
}
