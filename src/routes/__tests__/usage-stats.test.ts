/**
 * Tests for usage stats API routes.
 */

import { describe, it, expect, vi } from "vitest";

vi.mock("../../paths.js", () => ({
  getDataDir: vi.fn(() => "/tmp/test-data"),
}));

import { Hono } from "hono";
import { UsageStatsStore, type UsageStatsPersistence, type UsageSnapshot } from "../../auth/usage-stats.js";
import { createUsageStatsRoutes } from "../admin/usage-stats.js";
import type { AccountPool } from "../../auth/account-pool.js";
import { ApiCallLogStore, type ApiCallLogPersistence } from "../../services/api-call-logs.js";

function createMockPool(totals: { input_tokens: number; output_tokens: number; request_count: number }): AccountPool {
  return {
    getAllEntries: () => [
      {
        id: "e1",
        status: "active",
        usage: totals,
      },
    ],
  } as unknown as AccountPool;
}

function createStore(snapshots: UsageSnapshot[] = []): UsageStatsStore {
  const persistence: UsageStatsPersistence = {
    load: () => ({ version: 1, snapshots: [...snapshots] }),
    save: vi.fn(),
  };
  return new UsageStatsStore(persistence);
}

function createLogStore(): ApiCallLogStore {
  const persistence: ApiCallLogPersistence = {
    load: () => ({ version: 1, records: [] }),
    save: vi.fn(),
  };
  return new ApiCallLogStore(persistence);
}

function seedCalls(store: ApiCallLogStore, count: number) {
  for (let index = 0; index < count; index += 1) {
    const startedAt = new Date(Date.UTC(2026, 3, 11, 0, index, 0)).toISOString();
    const finishedAt = new Date(Date.UTC(2026, 3, 11, 0, index, 30)).toISOString();
    const id = store.startCall({
      interface_identifier: `openai.chat.completions.${index}`,
      interface_name: `OpenAI /chat/completions ${index}`,
      interface_url: `https://api.openai.com/v1/chat/completions/${index}`,
      provider_tag: "openai",
      model: `gpt-4o-${index}`,
      started_at: startedAt,
    });
    store.completeCall(id, {
      finished_at: finishedAt,
      status: "success",
      is_success: true,
      input_tokens: index + 1,
      output_tokens: index + 2,
    });
  }
}

describe("usage stats routes", () => {
  describe("GET /admin/usage-stats/summary", () => {
    it("returns cumulative totals", async () => {
      const pool = createMockPool({ input_tokens: 5000, output_tokens: 1000, request_count: 20 });
      const store = createStore();
      const logStore = createLogStore();
      const successId = logStore.startCall({
        interface_identifier: "openai.chat.completions",
        interface_name: "OpenAI /chat/completions",
        interface_url: "https://api.openai.com/v1/chat/completions",
        provider_tag: "openai",
        model: "gpt-4o",
      });
      logStore.completeCall(successId, {
        status: "success",
        is_success: true,
        input_tokens: 10,
        output_tokens: 5,
      });
      const app = new Hono();
      app.route("/", createUsageStatsRoutes(pool, store, logStore));

      const res = await app.request("/admin/usage-stats/summary");
      expect(res.status).toBe(200);

      const body = await res.json();
      expect(body.total_input_tokens).toBe(5000);
      expect(body.total_output_tokens).toBe(1000);
      expect(body.total_request_count).toBe(20);
      expect(body.total_accounts).toBe(1);
      expect(body.active_accounts).toBe(1);
      expect(body.api_calls.total_call_count).toBe(1);
      expect(body.api_calls.success_call_count).toBe(1);
      expect(body.api_calls.total_token_count).toBe(15);
    });
  });

  describe("GET /admin/usage-stats/history", () => {
    it("returns empty data_points when no history", async () => {
      const pool = createMockPool({ input_tokens: 0, output_tokens: 0, request_count: 0 });
      const store = createStore();
      const app = new Hono();
      app.route("/", createUsageStatsRoutes(pool, store));

      const res = await app.request("/admin/usage-stats/history");
      expect(res.status).toBe(200);

      const body = await res.json();
      expect(body.granularity).toBe("hourly");
      expect(body.data_points).toEqual([]);
    });

    it("returns delta data points with raw granularity", async () => {
      const now = Date.now();
      const snapshots: UsageSnapshot[] = [
        {
          timestamp: new Date(now - 3600_000).toISOString(),
          totals: { input_tokens: 100, output_tokens: 10, request_count: 1, active_accounts: 1 },
        },
        {
          timestamp: new Date(now).toISOString(),
          totals: { input_tokens: 500, output_tokens: 50, request_count: 5, active_accounts: 1 },
        },
      ];

      const pool = createMockPool({ input_tokens: 500, output_tokens: 50, request_count: 5 });
      const store = createStore(snapshots);
      const app = new Hono();
      app.route("/", createUsageStatsRoutes(pool, store));

      const res = await app.request("/admin/usage-stats/history?granularity=raw&hours=2");
      expect(res.status).toBe(200);

      const body = await res.json();
      expect(body.granularity).toBe("raw");
      expect(body.data_points).toHaveLength(1);
      expect(body.data_points[0].input_tokens).toBe(400);
    });

    it("rejects invalid granularity", async () => {
      const pool = createMockPool({ input_tokens: 0, output_tokens: 0, request_count: 0 });
      const store = createStore();
      const app = new Hono();
      app.route("/", createUsageStatsRoutes(pool, store));

      const res = await app.request("/admin/usage-stats/history?granularity=yearly");
      expect(res.status).toBe(400);
    });
  });

  describe("GET /admin/usage-stats/call-logs", () => {
    it("returns paginated api call log list", async () => {
      const pool = createMockPool({ input_tokens: 0, output_tokens: 0, request_count: 0 });
      const store = createStore();
      const logStore = createLogStore();
      seedCalls(logStore, 12);

      const app = new Hono();
      app.route("/", createUsageStatsRoutes(pool, store, logStore));

      const res = await app.request("/admin/usage-stats/call-logs?page=2&pageSize=10");
      expect(res.status).toBe(200);

      const body = await res.json();
      expect(Object.keys(body).sort()).toEqual(["items", "page", "pageSize", "total", "totalPages"].sort());
      expect(body.page).toBe(2);
      expect(body.pageSize).toBe(10);
      expect(body.total).toBe(12);
      expect(body.totalPages).toBe(2);
      expect(body.items).toHaveLength(2);
      expect(body.items[0].interface_identifier).toBe("openai.chat.completions.1");
      expect(body.items[0].model).toBe("gpt-4o-1");
      expect(body.items[1].interface_identifier).toBe("openai.chat.completions.0");
    });

    it("normalizes page and pageSize query parameters", async () => {
      const pool = createMockPool({ input_tokens: 0, output_tokens: 0, request_count: 0 });
      const store = createStore();
      const logStore = createLogStore();
      seedCalls(logStore, 60);

      const app = new Hono();
      app.route("/", createUsageStatsRoutes(pool, store, logStore));

      const lowerBoundRes = await app.request("/admin/usage-stats/call-logs?page=0&pageSize=1");
      expect(lowerBoundRes.status).toBe(200);
      const lowerBoundBody = await lowerBoundRes.json();
      expect(lowerBoundBody.page).toBe(1);
      expect(lowerBoundBody.pageSize).toBe(10);
      expect(lowerBoundBody.total).toBe(60);
      expect(lowerBoundBody.totalPages).toBe(6);
      expect(lowerBoundBody.items).toHaveLength(10);
      expect(lowerBoundBody.items[0].model).toBe("gpt-4o-59");
      expect(lowerBoundBody.items[9].model).toBe("gpt-4o-50");

      const upperBoundRes = await app.request("/admin/usage-stats/call-logs?page=1&pageSize=999");
      expect(upperBoundRes.status).toBe(200);
      const upperBoundBody = await upperBoundRes.json();
      expect(upperBoundBody.page).toBe(1);
      expect(upperBoundBody.pageSize).toBe(50);
      expect(upperBoundBody.total).toBe(60);
      expect(upperBoundBody.totalPages).toBe(2);
      expect(upperBoundBody.items).toHaveLength(50);
      expect(upperBoundBody.items[0].model).toBe("gpt-4o-59");
      expect(upperBoundBody.items[49].model).toBe("gpt-4o-10");
    });
  });
});
