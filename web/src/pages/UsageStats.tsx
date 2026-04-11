import { useState } from "preact/hooks";
import { useT } from "../../../shared/i18n/context";
import {
  useUsageSummary,
  useUsageHistory,
  useApiCallLogs,
  type Granularity,
  type ApiCallLogRecord,
} from "../../../shared/hooks/use-usage-stats";
import { UsageChart, formatNumber } from "../components/UsageChart";
import type { TranslationKey } from "../../../shared/i18n/translations";

const granularityOptions: Array<{ value: Granularity; label: TranslationKey }> = [
  { value: "hourly", label: "granularityHourly" },
  { value: "daily", label: "granularityDaily" },
];

const rangeOptions: Array<{ hours: number; label: TranslationKey }> = [
  { hours: 24, label: "last24h" },
  { hours: 72, label: "last3d" },
  { hours: 168, label: "last7d" },
];

function UsageContent({
  t,
  summary,
  summaryLoading,
  granularity,
  setGranularity,
  hours,
  setHours,
  dataPoints,
  historyLoading,
  callLogs,
  callLogsLoading,
}: {
  t: (key: TranslationKey) => string;
  summary: ReturnType<typeof useUsageSummary>["summary"];
  summaryLoading: boolean;
  granularity: Granularity;
  setGranularity: (g: Granularity) => void;
  hours: number;
  setHours: (h: number) => void;
  dataPoints: ReturnType<typeof useUsageHistory>["dataPoints"];
  historyLoading: boolean;
  callLogs: ApiCallLogRecord[];
  callLogsLoading: boolean;
}) {
  const apiCalls = summary?.api_calls;

  return (
    <>
      <div class="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
        <SummaryCard label={t("totalInputTokens")} value={summaryLoading ? "-" : formatNumber(summary?.total_input_tokens ?? 0)} />
        <SummaryCard label={t("totalOutputTokens")} value={summaryLoading ? "-" : formatNumber(summary?.total_output_tokens ?? 0)} />
        <SummaryCard label={t("totalRequestCount")} value={summaryLoading ? "-" : formatNumber(summary?.total_request_count ?? 0)} />
        <SummaryCard label={t("activeAccounts")} value={summaryLoading ? "-" : `${summary?.active_accounts ?? 0} / ${summary?.total_accounts ?? 0}`} />
      </div>

      <div class="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
        <SummaryCard label={t("totalCalls")} value={summaryLoading ? "-" : formatNumber(apiCalls?.total_call_count ?? 0)} />
        <SummaryCard label={t("successfulCalls")} value={summaryLoading ? "-" : formatNumber(apiCalls?.success_call_count ?? 0)} />
        <SummaryCard label={t("failedCalls")} value={summaryLoading ? "-" : formatNumber(apiCalls?.failed_call_count ?? 0)} />
        <SummaryCard label={t("totalTokenConsumption")} value={summaryLoading ? "-" : formatNumber(apiCalls?.total_token_count ?? 0)} />
      </div>

      <div class="flex flex-wrap gap-2 mb-4">
        {granularityOptions.map(({ value, label }) => (
          <button
            key={value}
            onClick={() => {
              setGranularity(value);
              if (value === "daily" && hours <= 24) setHours(72);
            }}
            class={`px-3 py-1 text-xs font-medium rounded-full border transition-colors ${
              granularity === value
                ? "bg-primary text-white border-primary"
                : "bg-white dark:bg-card-dark border-gray-200 dark:border-border-dark text-slate-600 dark:text-text-dim hover:border-primary/50"
            }`}
          >
            {t(label)}
          </button>
        ))}
        <div class="w-px h-5 bg-gray-200 dark:bg-border-dark self-center" />
        {rangeOptions
          .filter(({ hours: h }) => !(granularity === "daily" && h <= 24))
          .map(({ hours: h, label }) => (
            <button
              key={h}
              onClick={() => setHours(h)}
              class={`px-3 py-1 text-xs font-medium rounded-full border transition-colors ${
                hours === h
                  ? "bg-primary text-white border-primary"
                  : "bg-white dark:bg-card-dark border-gray-200 dark:border-border-dark text-slate-600 dark:text-text-dim hover:border-primary/50"
              }`}
            >
              {t(label)}
            </button>
          ))}
      </div>

      <div class="bg-white dark:bg-card-dark rounded-xl border border-gray-200 dark:border-border-dark p-4">
        {historyLoading ? (
          <div class="text-center py-12 text-slate-400 dark:text-text-dim text-sm">Loading...</div>
        ) : (
          <UsageChart data={dataPoints} />
        )}
      </div>

      <div class="bg-white dark:bg-card-dark rounded-xl border border-gray-200 dark:border-border-dark p-4 mt-6">
        <div class="text-sm font-semibold text-slate-800 dark:text-text-main mb-4">{t("apiCallRecords")}</div>
        {callLogsLoading ? (
          <div class="text-center py-12 text-slate-400 dark:text-text-dim text-sm">Loading...</div>
        ) : callLogs.length === 0 ? (
          <div class="text-center py-12 text-slate-400 dark:text-text-dim text-sm">{t("noApiCallRecords")}</div>
        ) : (
          <div class="overflow-x-auto">
            <table class="min-w-full text-xs">
              <thead>
                <tr class="border-b border-gray-200 dark:border-border-dark text-slate-500 dark:text-text-dim">
                  <th class="text-left py-2 pr-3">{t("callStatus")}</th>
                  <th class="text-left py-2 pr-3">{t("modelInfo")}</th>
                  <th class="text-left py-2 pr-3">{t("interfaceNameOrUrl")}</th>
                  <th class="text-left py-2 pr-3">{t("callTime")}</th>
                  <th class="text-left py-2 pr-3">{t("callFinishedTime")}</th>
                  <th class="text-left py-2 pr-3">{t("durationMs")}</th>
                  <th class="text-left py-2 pr-3">{t("tokenConsumption")}</th>
                  <th class="text-left py-2">{t("errorMessage")}</th>
                </tr>
              </thead>
              <tbody>
                {callLogs.map((item) => (
                  <tr key={item.id} class="border-b border-gray-100 dark:border-border-dark/60 align-top">
                    <td class="py-3 pr-3">
                      <StatusBadge success={item.is_success} status={item.call_status} t={t} />
                    </td>
                    <td class="py-3 pr-3 text-slate-700 dark:text-text-main whitespace-nowrap">
                      <span class="font-mono">{item.model || "-"}</span>
                    </td>
                    <td class="py-3 pr-3 text-slate-700 dark:text-text-main">
                      <div class="font-medium">{item.interface_name || item.interface_identifier}</div>
                      <div class="text-slate-400 dark:text-text-dim break-all">{item.interface_url}</div>
                    </td>
                    <td class="py-3 pr-3 text-slate-600 dark:text-text-dim whitespace-nowrap">{formatDateTime(item.call_started_at)}</td>
                    <td class="py-3 pr-3 text-slate-600 dark:text-text-dim whitespace-nowrap">{item.call_finished_at ? formatDateTime(item.call_finished_at) : "-"}</td>
                    <td class="py-3 pr-3 text-slate-600 dark:text-text-dim whitespace-nowrap">{formatNumber(item.duration_ms)} ms</td>
                    <td class="py-3 pr-3 text-slate-600 dark:text-text-dim whitespace-nowrap">
                      {formatNumber(item.total_tokens)} ({formatNumber(item.input_tokens)}/{formatNumber(item.output_tokens)})
                    </td>
                    <td class="py-3 text-slate-600 dark:text-text-dim break-all">{item.error_message || "-"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </>
  );
}

export function UsageStats({ embedded }: { embedded?: boolean } = {}) {
  const t = useT();
  const { summary, loading: summaryLoading } = useUsageSummary();
  const [granularity, setGranularity] = useState<Granularity>("hourly");
  const [hours, setHours] = useState(24);
  const { dataPoints, loading: historyLoading } = useUsageHistory(granularity, hours);
  const { items: callLogs, loading: callLogsLoading } = useApiCallLogs();

  const contentProps = {
    t,
    summary,
    summaryLoading,
    granularity,
    setGranularity,
    hours,
    setHours,
    dataPoints,
    historyLoading,
    callLogs,
    callLogsLoading,
  };

  if (embedded) {
    return (
      <div class="flex flex-col gap-4">
        <UsageContent {...contentProps} />
      </div>
    );
  }

  return (
    <div class="min-h-screen bg-slate-50 dark:bg-bg-dark flex flex-col">
      <header class="sticky top-0 z-50 bg-white dark:bg-card-dark border-b border-gray-200 dark:border-border-dark px-4 py-3">
        <div class="max-w-[1100px] mx-auto flex items-center gap-3">
          <a href="#/" class="text-sm text-slate-500 dark:text-text-dim hover:text-primary transition-colors">
            &larr; {t("backToDashboard")}
          </a>
          <h1 class="text-base font-semibold text-slate-800 dark:text-text-main">{t("usageStats")}</h1>
        </div>
      </header>

      <main class="flex-grow px-4 md:px-8 py-6 max-w-[1100px] mx-auto w-full">
        <UsageContent {...contentProps} />
      </main>
    </div>
  );
}

function SummaryCard({ label, value }: { label: string; value: string }) {
  return (
    <div class="bg-white dark:bg-card-dark rounded-xl border border-gray-200 dark:border-border-dark p-4">
      <div class="text-xs text-slate-500 dark:text-text-dim mb-1">{label}</div>
      <div class="text-lg font-semibold text-slate-800 dark:text-text-main">{value}</div>
    </div>
  );
}

function StatusBadge({ success, status, t }: { success: boolean; status: ApiCallLogRecord["call_status"]; t: (key: TranslationKey) => string }) {
  const label = success ? t("statusSuccess") : status === "pending" ? t("statusPending") : t("statusFailed");
  const classes = success
    ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-300"
    : status === "pending"
      ? "bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-300"
      : "bg-rose-100 text-rose-700 dark:bg-rose-500/20 dark:text-rose-300";
  return <span class={`inline-flex rounded-full px-2 py-1 ${classes}`}>{label}</span>;
}

function formatDateTime(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleString();
}
