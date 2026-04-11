import { describe, it, expect, vi } from "vitest";

const { mockGetConfig, mockGetProxyInfo } = vi.hoisted(() => ({
  mockGetConfig: vi.fn(() => ({
    server: {
      port: 8080,
      proxy_api_key: "proxy-key",
    },
  })),
  mockGetProxyInfo: vi.fn(() => ({
    version: "2.0.54",
    commit: "abc1234",
  })),
}));

vi.mock("../../config.js", () => ({
  getConfig: mockGetConfig,
}));

vi.mock("../../self-update.js", () => ({
  getProxyInfo: mockGetProxyInfo,
}));

import { createAuthRoutes } from "../auth.js";

describe("GET /auth/status", () => {
  it("keeps auth status available and exposes local proxy version info", async () => {
    const pool = {
      isAuthenticated: () => true,
      getUserInfo: () => ({ email: "user@example.com" }),
      getProxyApiKey: () => "generated-key",
      getPoolSummary: () => ({ total: 2, active: 1 }),
    } as Parameters<typeof createAuthRoutes>[0];

    const scheduler = {} as Parameters<typeof createAuthRoutes>[1];
    const app = createAuthRoutes(pool, scheduler);

    const response = await app.request("/auth/status");

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toMatchObject({
      authenticated: true,
      proxy_api_key: "proxy-key",
      pool: { total: 2, active: 1 },
      proxy_version: "2.0.54",
      proxy_commit: "abc1234",
    });
  });
});
