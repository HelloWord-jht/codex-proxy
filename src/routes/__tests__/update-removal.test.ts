import { describe, it, expect } from "vitest";

import { createUpdateRoutes } from "../admin/update.js";

describe("removed update routes", () => {
  it.each([
    ["GET", "/admin/update-status"],
    ["POST", "/admin/check-update"],
    ["POST", "/admin/apply-update"],
  ])("%s %s returns 410", async (method, path) => {
    const app = createUpdateRoutes();

    const response = await app.request(path, { method });

    expect(response.status).toBe(410);
    await expect(response.json()).resolves.toEqual({
      error: "Update endpoints have been removed.",
    });
  });
});
