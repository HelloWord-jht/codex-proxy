import { beforeEach, describe, expect, it, vi } from "vitest";

const mockConfig = {
  server: { proxy_api_key: null as string | null },
  model: {
    default: "gpt-5.2-codex",
    default_reasoning_effort: null as string | null,
    default_service_tier: null as string | null,
  },
  auth: {
    request_interval_ms: 0,
  },
};

const mockCodexCreateResponse = vi.fn(async () => new Response("ok"));
const mockCodexParseStream = vi.fn();
const mockCodexGetRequestLogInfo = vi.fn(() => ({
  interfaceIdentifier: "codex.responses",
  interfaceName: "Codex Responses API",
  interfaceUrl: "https://chatgpt.com/backend-api/codex/responses",
}));

vi.mock("../../config.js", () => ({
  getConfig: vi.fn(() => mockConfig),
}));

vi.mock("../../utils/retry.js", () => ({
  withRetry: vi.fn(async (fn: () => Promise<unknown>) => fn()),
}));

vi.mock("../../proxy/codex-api.js", () => {
  class MockCodexApi {
    readonly tag = "codex" as const;

    constructor(..._args: unknown[]) {}

    createResponse(...args: Parameters<typeof mockCodexCreateResponse>) {
      return mockCodexCreateResponse(...args);
    }

    parseStream(...args: Parameters<typeof mockCodexParseStream>) {
      return mockCodexParseStream(...args);
    }

    getRequestLogInfo(...args: Parameters<typeof mockCodexGetRequestLogInfo>) {
      return mockCodexGetRequestLogInfo(...args);
    }
  }

  class MockCodexApiError extends Error {
    status: number;
    body: string;

    constructor(status: number, body: string) {
      super(body);
      this.name = "CodexApiError";
      this.status = status;
      this.body = body;
    }
  }

  return {
    CodexApi: MockCodexApi,
    CodexApiError: MockCodexApiError,
  };
});

import { createChatRoutes } from "../chat.js";
import { createMessagesRoutes } from "../messages.js";
import { createGeminiRoutes } from "../gemini.js";
import { createResponsesRoutes } from "../responses.js";
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

function createDirectSuccessAdapter(tag = "openai"): UpstreamAdapter {
  return {
    tag,
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
        interfaceIdentifier: `${tag}.chat.completions`,
        interfaceName: `${tag} /chat/completions`,
        interfaceUrl: `https://api.${tag}.example/v1/chat/completions`,
      };
    },
  };
}

function createDirectFailureAdapter(tag = "openai"): UpstreamAdapter {
  return {
    tag,
    async createResponse() {
      throw new CodexApiError(500, "upstream failed");
    },
    async *parseStream() {
      yield { event: "response.created", data: { response: { id: "never" } } };
    },
    getRequestLogInfo() {
      return {
        interfaceIdentifier: `${tag}.chat.completions`,
        interfaceName: `${tag} /chat/completions`,
        interfaceUrl: `https://api.${tag}.example/v1/chat/completions`,
      };
    },
  };
}

function createDirectAccountPool() {
  return {
    isAuthenticated: () => true,
    validateProxyApiKey: () => true,
  } as never;
}

function createDirectRouter(adapter: UpstreamAdapter) {
  return {
    isCodexModel: () => false,
    resolve: () => adapter,
  } as never;
}

function createProxyAccountPool() {
  return {
    isAuthenticated: () => true,
    validateProxyApiKey: () => true,
    acquire: vi.fn(() => ({
      entryId: "acct-1",
      token: "token-1",
      accountId: "account-1",
      prevSlotMs: null,
    })),
    release: vi.fn(),
    getEntry: vi.fn(() => ({ email: "user@example.com", planType: "plus" })),
    updateCachedQuota: vi.fn(),
    syncRateLimitWindow: vi.fn(),
    markRateLimited: vi.fn(),
    recordEmptyResponse: vi.fn(),
    markStatus: vi.fn(),
    markQuotaExhausted: vi.fn(),
  } as never;
}

function setCodexSuccessStream(inputTokens = 5, outputTokens = 3): void {
  mockCodexParseStream.mockImplementation(async function* (): AsyncGenerator<CodexSSEEvent> {
    yield {
      event: "response.created",
      data: { response: { id: "resp_codex" } },
    };
    yield {
      event: "response.completed",
      data: {
        response: {
          id: "resp_codex",
          status: "completed",
          output: [],
          usage: {
            input_tokens: inputTokens,
            output_tokens: outputTokens,
            input_tokens_details: {},
            output_tokens_details: {},
          },
        },
      },
    };
  });
}

beforeEach(() => {
  vi.clearAllMocks();
  mockConfig.server.proxy_api_key = null;
  mockConfig.model.default = "gpt-5.2-codex";
  mockConfig.model.default_reasoning_effort = null;
  mockConfig.model.default_service_tier = null;
  mockConfig.auth.request_interval_ms = 0;

  mockCodexCreateResponse.mockResolvedValue(new Response("ok"));
  mockCodexGetRequestLogInfo.mockReturnValue({
    interfaceIdentifier: "codex.responses.websocket",
    interfaceName: "Codex Responses WebSocket",
    interfaceUrl: "https://chatgpt.com/backend-api/codex/responses",
  });
  setCodexSuccessStream();
});

describe("api call logging", () => {
  it("records the real upstream model for direct chat requests even when a prefixed request falls back to a local display model", async () => {
    const logStore = createLogStore();
    const app = createChatRoutes(
      createDirectAccountPool(),
      undefined,
      undefined,
      createDirectRouter(createDirectSuccessAdapter("openai")),
      logStore,
    );

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
    const logs = logStore.getLogs();

    expect(logs.items[0].model).toBe("gpt-4o");
    expect(logs.items[0].model).not.toBe(mockConfig.model.default);
    expect(logs.items[0].call_status).toBe("success");
  });

  it("records the real upstream model for direct messages requests when local parsing falls back to the default display model", async () => {
    const logStore = createLogStore();
    const app = createMessagesRoutes(
      createDirectAccountPool(),
      undefined,
      undefined,
      createDirectRouter(createDirectSuccessAdapter("deepseek")),
      logStore,
    );

    const res = await app.request("/v1/messages", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        model: "deepseek-chat",
        max_tokens: 64,
        messages: [{ role: "user", content: "hello" }],
        stream: false,
      }),
    });

    expect(res.status).toBe(200);
    const logs = logStore.getLogs();

    expect(logs.items[0].model).toBe("deepseek-chat");
    expect(logs.items[0].model).not.toBe(mockConfig.model.default);
    expect(logs.items[0].call_status).toBe("success");
  });

  it("records the real upstream model for direct gemini route requests", async () => {
    const logStore = createLogStore();
    const app = createGeminiRoutes(
      createDirectAccountPool(),
      undefined,
      undefined,
      createDirectRouter(createDirectSuccessAdapter("gemini")),
      logStore,
    );

    const res = await app.request("/v1beta/models/deepseek-chat:generateContent", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        contents: [{ role: "user", parts: [{ text: "hello" }] }],
      }),
    });

    expect(res.status).toBe(200);
    expect(logStore.getLogs().items[0].model).toBe("deepseek-chat");
  });

  it("records the real upstream model for direct responses requests", async () => {
    const logStore = createLogStore();
    const app = createResponsesRoutes(
      createDirectAccountPool(),
      undefined,
      undefined,
      createDirectRouter(createDirectSuccessAdapter("openai")),
      logStore,
    );

    const res = await app.request("/v1/responses", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        model: "openai:gpt-4.1",
        input: [{ role: "user", content: "hello" }],
        stream: false,
      }),
    });

    expect(res.status).toBe(200);
    const logs = logStore.getLogs();

    expect(logs.items[0].model).toBe("gpt-4.1");
    expect(logs.items[0].model).not.toBe(mockConfig.model.default);
  });

  it("records the actual codex upstream model on the account-pool path instead of the display model", async () => {
    const logStore = createLogStore();
    const app = createResponsesRoutes(
      createProxyAccountPool(),
      undefined,
      undefined,
      undefined,
      logStore,
    );

    const res = await app.request("/v1/responses", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        model: "gpt-5.2-codex-high",
        input: [{ role: "user", content: "hello" }],
        stream: false,
      }),
    });

    expect(res.status).toBe(200);
    const logs = logStore.getLogs();

    expect(logs.items[0].model).toBe("gpt-5.2-codex");
    expect(logs.items[0].model).not.toBe("gpt-5.2-codex-high");
    expect(logs.items[0].call_status).toBe("success");
  });

  it("records failed direct upstream calls with the real upstream model", async () => {
    const logStore = createLogStore();
    const app = createChatRoutes(
      createDirectAccountPool(),
      undefined,
      undefined,
      createDirectRouter(createDirectFailureAdapter("openai")),
      logStore,
    );

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
    const logs = logStore.getLogs();

    expect(logs.items[0].model).toBe("gpt-4o");
    expect(logs.items[0].call_status).toBe("failed");
    expect(logs.items[0].error_message).toContain("upstream failed");
  });
});
