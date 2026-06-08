import express, {
  type ErrorRequestHandler,
  type Request,
  type Response
} from "express";

const DEFAULT_PORT = 8080;
const HOST = "0.0.0.0";

function parsePort(value: string | undefined): number {
  if (!value) {
    return DEFAULT_PORT;
  }

  const port = Number.parseInt(value, 10);
  if (!Number.isInteger(port) || port <= 0 || port > 65535) {
    throw new Error(`Invalid PORT value: ${value}`);
  }

  return port;
}

const app = express();

app.use(express.json());

app.get("/api/health", (_req: Request, res: Response) => {
  res.json({ status: "ok" });
});

const errorHandler: ErrorRequestHandler = (err, _req, res, _next) => {
  console.error("Unhandled request error", {
    name: err instanceof Error ? err.name : undefined,
    message: err instanceof Error ? err.message : String(err),
    stack: err instanceof Error ? err.stack : undefined
  });

  res.status(500).json({ error: "Internal server error" });
};

app.use(errorHandler);

const port = parsePort(process.env.PORT);

app.listen(port, HOST, () => {
  console.log(`Backend listening on http://${HOST}:${port}`);
});
