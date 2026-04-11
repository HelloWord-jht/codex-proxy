import { Hono } from "hono";

const REMOVED_RESPONSE = {
  error: "Update endpoints have been removed.",
};

export function createUpdateRoutes(): Hono {
  const app = new Hono();

  app.get("/admin/update-status", (c) => c.json(REMOVED_RESPONSE, 410));
  app.post("/admin/check-update", (c) => c.json(REMOVED_RESPONSE, 410));
  app.post("/admin/apply-update", (c) => c.json(REMOVED_RESPONSE, 410));

  return app;
}
