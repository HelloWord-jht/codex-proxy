import { describe, expect, it, vi } from "vitest";

vi.mock("../../config.js", () => ({
  getConfig: vi.fn(() => ({
    server: { proxy_api_key: null },
    model: { default_reasoning_effort: null },
  })),
}));

import { createChatRoutes } from "../chat.js";
import { ApiCallLogStore, type ApiCallLogPersistence } from "../../services/api-call-logs.js";
import type { UpstreamAdapter } from "../../proxy/upstream-adapter.js";
import { CodexApiError } from "../../proxy/codex-api.js";
import type { CodexResponsesRequest, CodexSSEEvent } from "../../proxy/codex-api.js";

function createLogStore(): ApiCallLogStore {
  const persistence: ApiCallLogPersistence = {
    load: () => ({ version: 1, records: [] }),
    save: vi.fn(),
  };
  return new ApiCallLogStore(persistence);
}

function createSuccessAdapter(): UpstreamAdapter {
  return {
    tag: "openai",
    async createResponse(_req: CodexResponsesRequest) {
      return new Response("ok");
    },
    async *parseStream(_response: Response): AsyncGenerator<CodexSSEEvent> {
      yield { event: "response.created", data: { response: { id: "resp_1" } } };
      yield { event: "response.output_text.delta", data: { delta: "hello" } };
      yield {
        event: "response.completed",
        data: {
          response: {
            id: "resp_1",
            usage: {
              input_tokens: 11,
              output_tokens: 7,
              input_tokens_details: {},
              output_tokens_details: {},
            },
          },
        },
      };
    },
    getRequestLogInfo() {
      return {
        interfaceIdentifier: "openai.chat.completions",
        interfaceName: "OpenAI /chat/completions",
        interfaceUrl: "https://api.openai.com/v1/chat/completions",
      };
    },
  };
}

function createFailureAdapter(): UpstreamAdapter {
  return {
    tag: "openai",
    async createResponse() {
      throw new CodexApiError(500, "upstream failed");
    },
    async *parseStream() {
      yield { event: "response.created", data: { response: { id: "never" } } };
    },
    getRequestLogInfo() {
      return {
        interfaceIdentifier: "openai.chat.completions",
        interfaceName: "OpenAI /chat/completions",
        interfaceUrl: "https://api.openai.com/v1/chat/completions",
      };
    },
  };
}

function createApp(adapter: UpstreamAdapter, logStore: ApiCallLogStore) {
  const accountPool = {
    isAuthenticated: () => true,
    validateProxyApiKey: () => true,
  } as never;

  const upstreamRouter = {
    isCodexModel: () => false,
    resolve: () => adapter,
  } as never;

  return createChatRoutes(accountPool, undefined, undefined, upstreamRouter, logStore);
}

describe("api call logging", () => {
  it("records successful direct upstream calls", async () => {
    const logStore = createLogStore();
    const app = createApp(createSuccessAdapter(), logStore);

    const res = await app.request("/v1/chat/completions", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        model: "openai:gpt-4o",
        messages: [{ role: "user", content: "hello" }],
        stream: false,
      }),
    });

    expect(res.status).toBe(200);
    const summary = logStore.getSummary();
    const logs = logStore.getLogs();

    expect(summary.total_call_count).toBe(1);
    expect(summary.success_call_count).toBe(1);
    expect(summary.total_token_count).toBe(18);
    expect(logs.items[0].model).toBe("openai:gpt-4o");
    expect(logs.items[0].call_status).toBe("success");
    expect(logs.items[0].input_tokens).toBe(11);
    expect(logs.items[0].output_tokens).toBe(7);
  });

  it("records failed direct upstream calls", async () => {
    const logStore = createLogStore();
    const app = createApp(createFailureAdapter(), logStore);

    const res = await app.request("/v1/chat/completions", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        model: "openai:gpt-4o",
        messages: [{ role: "user", content: "hello" }],
        stream: false,
      }),
    });

    expect(res.status).toBe(500);
    const summary = logStore.getSummary();
    const logs = logStore.getLogs();

    expect(summary.total_call_count).toBe(1);
    expect(summary.failed_call_count).toBe(1);
    expect(logs.items[0].model).toBe("openai:gpt-4o");
    expect(logs.items[0].call_status).toBe("failed");
    expect(logs.items[0].error_message).toContain("upstream failed");
  });
});
