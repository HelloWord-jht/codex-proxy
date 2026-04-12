/**
 * Hooks for fetching usage stats data.
 */

import { useState, useEffect, useCallback } from "preact/hooks";

export interface UsageSummary {
  total_input_tokens: number;
  total_output_tokens: number;
  total_request_count: number;
  total_accounts: number;
  active_accounts: number;
  api_calls: {
    total_call_count: number;
    success_call_count: number;
    failed_call_count: number;
    pending_call_count: number;
    total_input_tokens: number;
    total_output_tokens: number;
    total_token_count: number;
  };
}

export interface UsageDataPoint {
  timestamp: string;
  input_tokens: number;
  output_tokens: number;
  request_count: number;
}

export interface ApiCallLogRecord {
  id: string;
  interface_identifier: string;
  interface_name: string;
  interface_url: string;
  provider_tag: string;
  model: string;
  call_started_at: string;
  call_finished_at: string;
  call_status: "pending" | "success" | "failed" | "aborted";
  is_success: boolean;
  duration_ms: number;
  input_tokens: number;
  output_tokens: number;
  total_tokens: number;
  error_message: string;
}

export interface ApiCallLogsResponse {
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
  items: ApiCallLogRecord[];
}

export type Granularity = "raw" | "hourly" | "daily";

function normalizePage(value: number | undefined): number {
  if (typeof value !== "number" || !Number.isFinite(value)) return 1;
  return Math.max(1, Math.trunc(value));
}

function normalizePageSize(value: number | undefined): number {
  if (typeof value !== "number" || !Number.isFinite(value)) return 10;
  return Math.min(50, Math.max(10, Math.trunc(value)));
}

export function useUsageSummary(refreshIntervalMs = 30_000) {
  const [summary, setSummary] = useState<UsageSummary | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    try {
      const resp = await fetch("/admin/usage-stats/summary");
      if (resp.ok) setSummary(await resp.json());
    } catch { /* ignore */ }
    setLoading(false);
  }, []);

  useEffect(() => {
    load();
    const id = setInterval(load, refreshIntervalMs);
    return () => clearInterval(id);
  }, [load, refreshIntervalMs]);

  return { summary, loading };
}

export function useUsageHistory(granularity: Granularity, hours: number, refreshIntervalMs = 60_000) {
  const [dataPoints, setDataPoints] = useState<UsageDataPoint[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    try {
      const resp = await fetch(
        `/admin/usage-stats/history?granularity=${granularity}&hours=${hours}`,
      );
      if (resp.ok) {
        const body = await resp.json();
        setDataPoints(body.data_points);
      }
    } catch { /* ignore */ }
    setLoading(false);
  }, [granularity, hours]);

  useEffect(() => {
    setLoading(true);
    load();
    const id = setInterval(load, refreshIntervalMs);
    return () => clearInterval(id);
  }, [load, refreshIntervalMs]);

  return { dataPoints, loading };
}

export function useApiCallLogs(page = 1, pageSize = 10, refreshIntervalMs = 30_000) {
  const normalizedPage = normalizePage(page);
  const normalizedPageSize = normalizePageSize(pageSize);
  const [result, setResult] = useState<ApiCallLogsResponse>({
    page: normalizedPage,
    pageSize: normalizedPageSize,
    total: 0,
    totalPages: 1,
    items: [],
  });
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    try {
      const resp = await fetch(
        `/admin/usage-stats/call-logs?page=${normalizedPage}&pageSize=${normalizedPageSize}`,
      );
      if (resp.ok) {
        const body = await resp.json() as Partial<ApiCallLogsResponse>;
        setResult({
          page: typeof body.page === "number" ? body.page : normalizedPage,
          pageSize: typeof body.pageSize === "number" ? body.pageSize : normalizedPageSize,
          total: typeof body.total === "number" ? body.total : 0,
          totalPages: typeof body.totalPages === "number" ? body.totalPages : 1,
          items: Array.isArray(body.items) ? body.items : [],
        });
      }
    } catch { /* ignore */ }
    setLoading(false);
  }, [normalizedPage, normalizedPageSize]);

  useEffect(() => {
    setLoading(true);
    load();
    const id = setInterval(load, refreshIntervalMs);
    return () => clearInterval(id);
  }, [load, refreshIntervalMs]);

  return { ...result, loading };
}
