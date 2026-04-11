import { describe, it, expect } from "vitest";
import {
  ConfigSchema,
  FingerprintSchema,
  ROTATION_STRATEGIES,
} from "../config-schema.js";

describe("ROTATION_STRATEGIES", () => {
  it("contains expected values", () => {
    expect(ROTATION_STRATEGIES).toEqual(["least_used", "round_robin", "sticky"]);
  });
});

describe("ConfigSchema", () => {
  it("parses minimal input with defaults for core settings", () => {
    const result = ConfigSchema.parse({
      api: {},
      client: {},
      model: {},
      auth: {},
      server: {},
      session: {},
    });

    expect(result.api.base_url).toBe("https://chatgpt.com/backend-api");
    expect(result.server.port).toBe(8080);
    expect(result.server.host).toBe("0.0.0.0");
    expect(result.server.proxy_api_key).toBeNull();
    expect(result.auth.rotation_strategy).toBe("least_used");
    expect(result.auth.refresh_concurrency).toBe(2);
    expect(result.auth.max_concurrent_per_account).toBe(3);
    expect(result.auth.request_interval_ms).toBe(50);
    expect(result.model.default).toBe("gpt-5.2-codex");
    expect(result.model.default_reasoning_effort).toBeNull();
    expect(result.tls.force_http11).toBe(false);
    expect(result.quota.refresh_interval_minutes).toBe(5);
    expect(result.quota.warning_thresholds.primary).toEqual([80, 90]);
    expect(result.quota.skip_exhausted).toBe(true);
    expect(result).not.toHaveProperty("update");
  });

  it("strips legacy update settings from parsed config", () => {
    const result = ConfigSchema.parse({
      api: {},
      client: {},
      model: {},
      auth: {},
      server: {},
      session: {},
      update: { auto_update: false, auto_download: true },
    });

    expect(result).not.toHaveProperty("update");
  });

  it("rejects invalid settings", () => {
    expect(ConfigSchema.safeParse({
      api: {}, client: {}, model: {}, auth: {}, server: { port: 0 }, session: {},
    }).success).toBe(false);

    expect(ConfigSchema.safeParse({
      api: {}, client: {}, model: {}, auth: { rotation_strategy: "random" }, server: {}, session: {},
    }).success).toBe(false);

    expect(ConfigSchema.safeParse({
      api: {}, client: {}, model: {}, auth: { refresh_concurrency: 0 }, server: {}, session: {},
    }).success).toBe(false);
  });

  it("accepts optional tls and quota blocks", () => {
    const result = ConfigSchema.parse({
      api: {},
      client: {},
      model: {},
      auth: {},
      server: {},
      session: {},
    });

    expect(result.quota.concurrency).toBe(10);
    expect(result.tls.proxy_url).toBeNull();
  });
});

describe("FingerprintSchema", () => {
  it("parses valid fingerprint config", () => {
    const result = FingerprintSchema.parse({
      user_agent_template: "Codex/{version}",
      auth_domains: ["chatgpt.com"],
      auth_domain_exclusions: [],
      header_order: ["Authorization", "Content-Type"],
    });
    expect(result.user_agent_template).toBe("Codex/{version}");
    expect(result.default_headers).toEqual({});
  });

  it("rejects missing required fields", () => {
    const result = FingerprintSchema.safeParse({
      user_agent_template: "Codex/{version}",
    });
    expect(result.success).toBe(false);
  });
});
