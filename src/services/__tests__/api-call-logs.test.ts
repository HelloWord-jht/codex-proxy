import { describe, expect, it, vi } from "vitest";
import { ApiCallLogStore, type ApiCallLogPersistence } from "../api-call-logs.js";

function createStore() {
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
      interface_identifier: `provider.call.${index}`,
      interface_name: `Call ${index}`,
      interface_url: `https://example.com/${index}`,
      provider_tag: "openai",
      model: `model-${index}`,
      started_at: startedAt,
    });

    store.completeCall(id, {
      finished_at: finishedAt,
      status: "success",
      is_success: true,
      input_tokens: index,
      output_tokens: index + 1,
    });
  }
}

describe("ApiCallLogStore", () => {
  it("records success calls with token totals", () => {
    const store = createStore();
    const id = store.startCall({
      interface_identifier: "openai.chat.completions",
      interface_name: "OpenAI /chat/completions",
      interface_url: "https://api.openai.com/v1/chat/completions",
      provider_tag: "openai",
      model: "gpt-4o",
      started_at: "2026-04-11T00:00:00.000Z",
    });

    store.completeCall(id, {
      finished_at: "2026-04-11T00:00:02.000Z",
      status: "success",
      is_success: true,
      input_tokens: 10,
      output_tokens: 25,
    });

    const summary = store.getSummary();
    const logs = store.getLogs();

    expect(summary.total_call_count).toBe(1);
    expect(summary.success_call_count).toBe(1);
    expect(summary.failed_call_count).toBe(0);
    expect(summary.total_token_count).toBe(35);
    expect(logs.items[0].model).toBe("gpt-4o");
    expect(logs.items[0].duration_ms).toBe(2000);
    expect(logs.items[0].total_tokens).toBe(35);
  });

  it("records failed calls with default token values", () => {
    const store = createStore();
    const id = store.startCall({
      interface_identifier: "anthropic.messages",
      interface_name: "Anthropic /v1/messages",
      interface_url: "https://api.anthropic.com/v1/messages",
      provider_tag: "anthropic",
      model: "claude-sonnet",
    });

    store.completeCall(id, {
      status: "failed",
      is_success: false,
      error_message: "upstream 500",
    });

    const summary = store.getSummary();
    const logs = store.getLogs();

    expect(summary.total_call_count).toBe(1);
    expect(summary.success_call_count).toBe(0);
    expect(summary.failed_call_count).toBe(1);
    expect(summary.total_token_count).toBe(0);
    expect(logs.items[0].error_message).toBe("upstream 500");
    expect(logs.items[0].model).toBe("claude-sonnet");
    expect(logs.items[0].input_tokens).toBe(0);
    expect(logs.items[0].output_tokens).toBe(0);
  });

  it("normalizes legacy records without model info", () => {
    const persistence: ApiCallLogPersistence = {
      load: () => ({
        version: 1,
        records: [{
          id: "legacy-1",
          interface_identifier: "openai.chat.completions",
          interface_name: "OpenAI /chat/completions",
          interface_url: "https://api.openai.com/v1/chat/completions",
          provider_tag: "openai",
          call_started_at: "2026-04-11T00:00:00.000Z",
          call_finished_at: "2026-04-11T00:00:01.000Z",
          call_status: "success",
          is_success: true,
          duration_ms: 1000,
          input_tokens: 1,
          output_tokens: 2,
          total_tokens: 3,
          error_message: "",
        } as unknown as never],
      }),
      save: vi.fn(),
    };

    const store = new ApiCallLogStore(persistence);
    expect(store.getLogs().items[0].model).toBe("");
  });

  it("supports paginated logs with descending order and empty out-of-range pages", () => {
    const store = createStore();
    seedCalls(store, 12);

    const pageOne = store.getLogs(1, 10);
    expect(pageOne.page).toBe(1);
    expect(pageOne.pageSize).toBe(10);
    expect(pageOne.total).toBe(12);
    expect(pageOne.totalPages).toBe(2);
    expect(pageOne.items).toHaveLength(10);
    expect(pageOne.items[0].model).toBe("model-11");
    expect(pageOne.items[9].model).toBe("model-2");

    const pageTwo = store.getLogs(2, 10);
    expect(pageTwo.page).toBe(2);
    expect(pageTwo.pageSize).toBe(10);
    expect(pageTwo.total).toBe(12);
    expect(pageTwo.totalPages).toBe(2);
    expect(pageTwo.items).toHaveLength(2);
    expect(pageTwo.items[0].model).toBe("model-1");
    expect(pageTwo.items[1].model).toBe("model-0");

    const normalizedPageSize = store.getLogs(1, 1);
    expect(normalizedPageSize.pageSize).toBe(10);
    expect(normalizedPageSize.totalPages).toBe(2);

    const outOfRange = store.getLogs(3, 10);
    expect(outOfRange.page).toBe(3);
    expect(outOfRange.pageSize).toBe(10);
    expect(outOfRange.total).toBe(12);
    expect(outOfRange.totalPages).toBe(2);
    expect(outOfRange.items).toEqual([]);
  });
});
