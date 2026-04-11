import crypto from "crypto";
import {
  existsSync,
  mkdirSync,
  readFileSync,
  renameSync,
  writeFileSync,
} from "fs";
import { dirname, resolve } from "path";
import { getDataDir } from "../paths.js";

export type ApiCallStatus = "pending" | "success" | "failed" | "aborted";

export interface ApiCallLogRecord {
  id: string;
  interface_identifier: string;
  interface_name: string;
  interface_url: string;
  provider_tag: string;
  model: string;
  call_started_at: string;
  call_finished_at: string;
  call_status: ApiCallStatus;
  is_success: boolean;
  duration_ms: number;
  input_tokens: number;
  output_tokens: number;
  total_tokens: number;
  error_message: string;
}

export interface ApiCallLogSummary {
  total_call_count: number;
  success_call_count: number;
  failed_call_count: number;
  pending_call_count: number;
  total_input_tokens: number;
  total_output_tokens: number;
  total_token_count: number;
}

export interface ApiCallLogListResult {
  total: number;
  items: ApiCallLogRecord[];
}

interface ApiCallLogFile {
  version: 1;
  records: ApiCallLogRecord[];
}

function normalizeModel(value: unknown): string {
  return typeof value === "string" ? value : "";
}

function normalizeRecord(record: Partial<ApiCallLogRecord>): ApiCallLogRecord {
  return {
    id: typeof record.id === "string" ? record.id : crypto.randomUUID(),
    interface_identifier: typeof record.interface_identifier === "string" ? record.interface_identifier : "",
    interface_name: typeof record.interface_name === "string" ? record.interface_name : "",
    interface_url: typeof record.interface_url === "string" ? record.interface_url : "",
    provider_tag: typeof record.provider_tag === "string" ? record.provider_tag : "",
    model: normalizeModel(record.model),
    call_started_at: typeof record.call_started_at === "string" ? record.call_started_at : "",
    call_finished_at: typeof record.call_finished_at === "string" ? record.call_finished_at : "",
    call_status: record.call_status === "success" || record.call_status === "failed" || record.call_status === "aborted"
      ? record.call_status
      : "pending",
    is_success: typeof record.is_success === "boolean" ? record.is_success : false,
    duration_ms: typeof record.duration_ms === "number" ? record.duration_ms : 0,
    input_tokens: typeof record.input_tokens === "number" ? record.input_tokens : 0,
    output_tokens: typeof record.output_tokens === "number" ? record.output_tokens : 0,
    total_tokens: typeof record.total_tokens === "number" ? record.total_tokens : 0,
    error_message: typeof record.error_message === "string" ? record.error_message : "",
  };
}

export interface ApiCallLogPersistence {
  load(): ApiCallLogFile;
  save(data: ApiCallLogFile): void;
}

export interface ApiCallLogStartInput {
  interface_identifier?: string;
  interface_name?: string;
  interface_url?: string;
  interfaceIdentifier?: string;
  interfaceName?: string;
  interfaceUrl?: string;
  provider_tag: string;
  model: string;
  started_at?: string;
}

export interface ApiCallLogCompleteInput {
  finished_at?: string;
  status: Exclude<ApiCallStatus, "pending">;
  is_success: boolean;
  model?: string;
  input_tokens?: number;
  output_tokens?: number;
  error_message?: string;
}

export interface ApiCallRequestInfo {
  interfaceIdentifier: string;
  interfaceName: string;
  interfaceUrl: string;
}

const FILE_NAME = "api-call-logs.json";
const MAX_RECORDS = 5000;

export function createFsApiCallLogPersistence(): ApiCallLogPersistence {
  function getFilePath(): string {
    return resolve(getDataDir(), FILE_NAME);
  }

  return {
    load(): ApiCallLogFile {
      try {
        const filePath = getFilePath();
        if (!existsSync(filePath)) {
          return { version: 1, records: [] };
        }
        const raw = readFileSync(filePath, "utf-8");
        const parsed = JSON.parse(raw) as Partial<ApiCallLogFile>;
        return {
          version: 1,
          records: Array.isArray(parsed.records)
            ? parsed.records.map((record) => normalizeRecord(record as Partial<ApiCallLogRecord>))
            : [],
        };
      } catch {
        return { version: 1, records: [] };
      }
    },

    save(data: ApiCallLogFile): void {
      try {
        const filePath = getFilePath();
        const dir = dirname(filePath);
        if (!existsSync(dir)) mkdirSync(dir, { recursive: true });
        const tmp = `${filePath}.tmp`;
        writeFileSync(tmp, JSON.stringify(data), "utf-8");
        renameSync(tmp, filePath);
      } catch (err) {
        console.error("[ApiCallLogs] Failed to persist:", err instanceof Error ? err.message : err);
      }
    },
  };
}

export class ApiCallLogStore {
  private readonly persistence: ApiCallLogPersistence;
  private records: ApiCallLogRecord[];

  constructor(persistence?: ApiCallLogPersistence) {
    this.persistence = persistence ?? createFsApiCallLogPersistence();
    this.records = this.persistence.load().records.map((record) => normalizeRecord(record));
  }

  startCall(input: ApiCallLogStartInput): string {
    const id = crypto.randomUUID();
    const startedAt = input.started_at ?? new Date().toISOString();
    this.records.push({
      id,
      interface_identifier: input.interface_identifier ?? input.interfaceIdentifier ?? "",
      interface_name: input.interface_name ?? input.interfaceName ?? "",
      interface_url: input.interface_url ?? input.interfaceUrl ?? "",
      provider_tag: input.provider_tag,
      model: normalizeModel(input.model),
      call_started_at: startedAt,
      call_finished_at: "",
      call_status: "pending",
      is_success: false,
      duration_ms: 0,
      input_tokens: 0,
      output_tokens: 0,
      total_tokens: 0,
      error_message: "",
    });
    this.trimAndSave();
    return id;
  }

  completeCall(id: string, input: ApiCallLogCompleteInput): void {
    const record = this.records.find((item) => item.id === id);
    if (!record) return;

    const finishedAt = input.finished_at ?? new Date().toISOString();
    const inputTokens = Math.max(0, input.input_tokens ?? 0);
    const outputTokens = Math.max(0, input.output_tokens ?? 0);
    const startedAtMs = new Date(record.call_started_at).getTime();
    const finishedAtMs = new Date(finishedAt).getTime();

    record.call_finished_at = finishedAt;
    record.call_status = input.status;
    record.is_success = input.is_success;
    if (input.model !== undefined) {
      record.model = normalizeModel(input.model);
    }
    record.duration_ms = Number.isFinite(startedAtMs) && Number.isFinite(finishedAtMs)
      ? Math.max(0, finishedAtMs - startedAtMs)
      : 0;
    record.input_tokens = inputTokens;
    record.output_tokens = outputTokens;
    record.total_tokens = inputTokens + outputTokens;
    record.error_message = input.error_message ?? "";

    this.trimAndSave();
  }

  getSummary(): ApiCallLogSummary {
    const completed = this.records.filter((item) => item.call_status !== "pending");
    const pending = this.records.length - completed.length;

    return completed.reduce<ApiCallLogSummary>((acc, item) => {
      acc.total_call_count += 1;
      if (item.is_success) acc.success_call_count += 1;
      else acc.failed_call_count += 1;
      acc.total_input_tokens += item.input_tokens;
      acc.total_output_tokens += item.output_tokens;
      acc.total_token_count += item.total_tokens;
      return acc;
    }, {
      total_call_count: 0,
      success_call_count: 0,
      failed_call_count: 0,
      pending_call_count: pending,
      total_input_tokens: 0,
      total_output_tokens: 0,
      total_token_count: 0,
    });
  }

  getLogs(limit = 100): ApiCallLogListResult {
    const normalizedLimit = Math.min(Math.max(1, limit), 500);
    const items = [...this.records]
      .sort((a, b) => new Date(b.call_started_at).getTime() - new Date(a.call_started_at).getTime())
      .slice(0, normalizedLimit);
    return {
      total: this.records.length,
      items,
    };
  }

  get size(): number {
    return this.records.length;
  }

  private trimAndSave(): void {
    if (this.records.length > MAX_RECORDS) {
      this.records = this.records.slice(this.records.length - MAX_RECORDS);
    }
    this.persistence.save({ version: 1, records: this.records });
  }
}
