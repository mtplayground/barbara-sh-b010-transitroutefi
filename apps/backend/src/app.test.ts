import { mkdtemp, rm, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { tmpdir } from "node:os";
import request from "supertest";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { createApp } from "./app.js";

let frontendDistPath: string;

beforeEach(async () => {
  frontendDistPath = await mkdtemp(join(tmpdir(), "transitroutefi-frontend-"));
  await writeFile(
    join(frontendDistPath, "index.html"),
    '<!doctype html><html><body><div id="root">TransitRouteFI</div></body></html>'
  );
  await writeFile(
    join(frontendDistPath, "app.js"),
    "window.__transitroutefiLoaded = true;"
  );
});

afterEach(async () => {
  await rm(frontendDistPath, { force: true, recursive: true });
});

describe("frontend production serving", () => {
  it("serves the built frontend at the root", async () => {
    const app = createApp({ frontendDistPath });

    const response = await request(app).get("/").expect(200);

    expect(response.text).toContain("TransitRouteFI");
    expect(response.headers["content-type"]).toContain("text/html");
  });

  it("serves the frontend shell for non-api browser routes", async () => {
    const app = createApp({ frontendDistPath });

    const response = await request(app)
      .get("/recent/searches")
      .set("accept", "text/html")
      .expect(200);

    expect(response.text).toContain("TransitRouteFI");
  });

  it("serves static frontend assets without falling back to the shell", async () => {
    const app = createApp({ frontendDistPath });

    const response = await request(app).get("/app.js").expect(200);

    expect(response.text).toContain("__transitroutefiLoaded");
    await request(app).get("/missing.js").expect(404);
  });

  it("keeps API paths separate from the frontend fallback", async () => {
    const app = createApp({ frontendDistPath });

    await request(app).get("/api/health").expect(200, { status: "ok" });
    await request(app).get("/api/unknown").set("accept", "text/html").expect(404);
  });
});
