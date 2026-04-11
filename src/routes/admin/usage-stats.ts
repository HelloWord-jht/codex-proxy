/**
 * Usage stats API routes.
 *
 * GET /admin/usage-stats/summary  — current cumulative totals
 * GET /admin/usage-stats/history  — time-series delta data points
 */

import { Hono } from "hono";
import type { AccountPool } from "../../auth/account-pool.js";
import type { UsageStatsStore } from "../../auth/usage-stats.js";
import type { ApiCallLogStore } from "../../services/api-call-logs.js";

export function createUsageStatsRoutes(
  pool: AccountPool,
  statsStore: UsageStatsStore,
  apiCallLogs?: ApiCallLogStore,
): Hono {
  const app = new Hono();

  app.get("/admin/usage-stats/summary", (c) => {
    return c.json({
      ...statsStore.getSummary(pool),
      api_calls: apiCallLogs?.getSummary() ?? {
        total_call_count: 0,
        success_call_count: 0,
        failed_call_count: 0,
        pending_call_count: 0,
        total_input_tokens: 0,
        total_output_tokens: 0,
        total_token_count: 0,
      },
    });
  });

  app.get("/admin/usage-stats/history", (c) => {
    const granularity = c.req.query("granularity") ?? "hourly";
    if (granularity !== "raw" && granularity !== "hourly" && granularity !== "daily") {
      c.status(400);
      return c.json({ error: "Invalid granularity. Must be raw, hourly, or daily." });
    }

    const hoursStr = c.req.query("hours") ?? "24";
    const hours = Math.min(Math.max(1, parseInt(hoursStr, 10) || 24), 168);

    const data_points = statsStore.getHistory(hours, granularity);

    return c.json({
      granularity,
      hours,
      data_points,
    });
  });

  app.get("/admin/usage-stats/call-logs", (c) => {
    const limit = Math.min(Math.max(1, parseInt(c.req.query("limit") ?? "100", 10) || 100), 500);
    const result = apiCallLogs?.getLogs(limit) ?? { total: 0, items: [] };
    return c.json({
      limit,
      total: result.total,
      items: result.items,
    });
  });

  return app;
}
