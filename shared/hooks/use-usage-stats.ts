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

export type Granularity = "raw" | "hourly" | "daily";

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

export function useApiCallLogs(limit = 100, refreshIntervalMs = 30_000) {
  const [items, setItems] = useState<ApiCallLogRecord[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    try {
      const resp = await fetch(`/admin/usage-stats/call-logs?limit=${limit}`);
      if (resp.ok) {
        const body = await resp.json();
        setItems(body.items ?? []);
        setTotal(body.total ?? 0);
      }
    } catch { /* ignore */ }
    setLoading(false);
  }, [limit]);

  useEffect(() => {
    setLoading(true);
    load();
    const id = setInterval(load, refreshIntervalMs);
    return () => clearInterval(id);
  }, [load, refreshIntervalMs]);

  return { items, total, loading };
}
