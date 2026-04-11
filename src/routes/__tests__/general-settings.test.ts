import { describe, it, expect, vi, beforeEach } from "vitest";

const mockConfig = {
  server: { port: 8080, proxy_api_key: null as string | null },
  tls: { proxy_url: null as string | null, force_http11: false },
  model: {
    default: "gpt-5.2-codex",
    default_reasoning_effort: null as string | null,
    inject_desktop_context: false,
    suppress_desktop_directives: true,
  },
  quota: {
    refresh_interval_minutes: 5,
    warning_thresholds: { primary: [80, 90], secondary: [80, 90] },
    skip_exhausted: true,
  },
  auth: {
    rotation_strategy: "least_used",
    refresh_enabled: true,
    refresh_margin_seconds: 300,
    refresh_concurrency: 2,
    max_concurrent_per_account: 3 as number | null,
    request_interval_ms: 50 as number | null,
  },
};

vi.mock("../../config.js", () => ({
  getConfig: vi.fn(() => mockConfig),
  reloadAllConfigs: vi.fn(),
  getLocalConfigPath: vi.fn(() => "/tmp/test/local.yaml"),
  ROTATION_STRATEGIES: ["least_used", "round_robin", "sticky"],
}));

vi.mock("../../paths.js", () => ({
  getConfigDir: vi.fn(() => "/tmp/test-config"),
  getPublicDir: vi.fn(() => "/tmp/test-public"),
  getDesktopPublicDir: vi.fn(() => "/tmp/test-desktop"),
  getDataDir: vi.fn(() => "/tmp/test-data"),
  getBinDir: vi.fn(() => "/tmp/test-bin"),
  isEmbedded: vi.fn(() => false),
}));

vi.mock("../../utils/yaml-mutate.js", () => ({
  mutateYaml: vi.fn(),
}));

vi.mock("../../tls/transport.js", () => ({
  getTransport: vi.fn(),
  getTransportInfo: vi.fn(() => ({})),
}));

vi.mock("../../fingerprint/manager.js", () => ({
  buildHeaders: vi.fn(() => ({})),
}));

vi.mock("@hono/node-server/serve-static", () => ({
  serveStatic: vi.fn(() => vi.fn()),
}));

vi.mock("@hono/node-server/conninfo", () => ({
  getConnInfo: vi.fn(() => ({ remote: { address: "127.0.0.1" } })),
}));

import { createWebRoutes } from "../web.js";
import { mutateYaml } from "../../utils/yaml-mutate.js";
import { reloadAllConfigs } from "../../config.js";

const mockPool = {
  getAll: vi.fn(() => []),
  acquire: vi.fn(),
  release: vi.fn(),
} as unknown as Parameters<typeof createWebRoutes>[0];

const mockUsageStats = {} as unknown as Parameters<typeof createWebRoutes>[1];

function makeApp() {
  return createWebRoutes(mockPool, mockUsageStats);
}

describe("general settings routes", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockConfig.server.port = 8080;
    mockConfig.server.proxy_api_key = null;
    mockConfig.tls.proxy_url = null;
    mockConfig.tls.force_http11 = false;
    mockConfig.model.default = "gpt-5.2-codex";
    mockConfig.model.default_reasoning_effort = null;
    mockConfig.model.inject_desktop_context = false;
    mockConfig.model.suppress_desktop_directives = true;
    mockConfig.auth.refresh_enabled = true;
    mockConfig.auth.refresh_margin_seconds = 300;
    mockConfig.auth.refresh_concurrency = 2;
    mockConfig.auth.max_concurrent_per_account = 3;
    mockConfig.auth.request_interval_ms = 50;
  });

  it("returns current core settings without update fields", async () => {
    const app = makeApp();
    const response = await app.request("/admin/general-settings");

    expect(response.status).toBe(200);
    const data = await response.json();
    expect(data).toMatchObject({
      port: 8080,
      proxy_url: null,
      force_http11: false,
      inject_desktop_context: false,
      suppress_desktop_directives: true,
      default_model: "gpt-5.2-codex",
      default_reasoning_effort: null,
      refresh_enabled: true,
      refresh_margin_seconds: 300,
      refresh_concurrency: 2,
      max_concurrent_per_account: 3,
      request_interval_ms: 50,
    });
    expect(data).not.toHaveProperty("auto_update");
    expect(data).not.toHaveProperty("auto_download");
  });

  it("persists core settings changes and reports restart requirement when needed", async () => {
    const app = makeApp();
    const response = await app.request("/admin/general-settings", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        port: 9090,
        proxy_url: "http://127.0.0.1:7890",
        force_http11: true,
      }),
    });

    expect(response.status).toBe(200);
    const data = await response.json();
    expect(data.success).toBe(true);
    expect(data.restart_required).toBe(true);
    expect(mutateYaml).toHaveBeenCalledOnce();
    expect(reloadAllConfigs).toHaveBeenCalledOnce();
  });

  it("rejects invalid proxy_url format", async () => {
    const app = makeApp();
    const response = await app.request("/admin/general-settings", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ proxy_url: "not-a-url" }),
    });

    expect(response.status).toBe(400);
  });

  it("accepts concurrency and pacing controls", async () => {
    const app = makeApp();
    const response = await app.request("/admin/general-settings", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        max_concurrent_per_account: 5,
        request_interval_ms: 0,
      }),
    });

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toMatchObject({
      success: true,
      restart_required: false,
    });
  });

  it("requires auth when proxy_api_key is set", async () => {
    mockConfig.server.proxy_api_key = "my-secret";
    const app = makeApp();

    const unauthorized = await app.request("/admin/general-settings", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ force_http11: true }),
    });
    expect(unauthorized.status).toBe(401);

    const authorized = await app.request("/admin/general-settings", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: "Bearer my-secret",
      },
      body: JSON.stringify({ force_http11: true }),
    });
    expect(authorized.status).toBe(200);
  });
});
