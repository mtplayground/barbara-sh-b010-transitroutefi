import express, {
  type ErrorRequestHandler,
  type Request,
  type Response
} from "express";
import { appConfig } from "./config/env.js";

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

app.listen(appConfig.port, appConfig.host, () => {
  console.log(`Backend listening on http://${appConfig.host}:${appConfig.port}`);
});
