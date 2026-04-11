import { describe, it, expect } from "vitest";
import { UpstreamRouter } from "../upstream-router.js";
import type { UpstreamAdapter } from "../upstream-adapter.js";
import type { CodexResponsesRequest, CodexSSEEvent } from "../codex-types.js";

function makeAdapter(tag: string): UpstreamAdapter {
  return {
    tag,
    createResponse: (_req: CodexResponsesRequest, _signal: AbortSignal): Promise<Response> => {
      return Promise.resolve(new Response());
    },
    parseStream: async function*(_response: Response): AsyncGenerator<CodexSSEEvent> {},
    getRequestLogInfo: () => ({
      interfaceIdentifier: `${tag}.responses`,
      interfaceName: `${tag} responses`,
      interfaceUrl: `https://${tag}.example.test/v1/responses`,
    }),
  };
}

describe("UpstreamRouter", () => {
  const codexAdapter = makeAdapter("codex");
  const openaiAdapter = makeAdapter("openai");
  const anthropicAdapter = makeAdapter("anthropic");
  const geminiAdapter = makeAdapter("gemini");
  const deepseekAdapter = makeAdapter("deepseek");

  const adapters = new Map([
    ["codex", codexAdapter],
    ["openai", openaiAdapter],
    ["anthropic", anthropicAdapter],
    ["gemini", geminiAdapter],
    ["deepseek", deepseekAdapter],
  ]);

  const router = new UpstreamRouter(
    adapters,
    { "deepseek-chat": "deepseek", "deepseek-reasoner": "deepseek" },
    "codex",
  );

  it("routes explicit prefix openai: to openai adapter", () => {
    expect(router.resolve("openai:gpt-4o").tag).toBe("openai");
  });

  it("routes explicit prefix anthropic: to anthropic adapter", () => {
    expect(router.resolve("anthropic:claude-3-5-sonnet-20241022").tag).toBe("anthropic");
  });

  it("routes explicit prefix gemini: to gemini adapter", () => {
    expect(router.resolve("gemini:gemini-2.0-flash").tag).toBe("gemini");
  });

  it("routes model_routing table entries correctly", () => {
    expect(router.resolve("deepseek-chat").tag).toBe("deepseek");
    expect(router.resolve("deepseek-reasoner").tag).toBe("deepseek");
  });

  it("auto-routes claude-* to anthropic", () => {
    expect(router.resolve("claude-3-5-sonnet-20241022").tag).toBe("anthropic");
    expect(router.resolve("claude-3-haiku-20240307").tag).toBe("anthropic");
  });

  it("auto-routes gemini-* to gemini", () => {
    expect(router.resolve("gemini-2.0-flash").tag).toBe("gemini");
    expect(router.resolve("gemini-1.5-pro").tag).toBe("gemini");
  });

  it("falls back to codex for unknown models", () => {
    expect(router.resolve("gpt-5.2-codex").tag).toBe("codex");
    expect(router.resolve("o3").tag).toBe("codex");
    expect(router.resolve("unknown-model-xyz").tag).toBe("codex");
  });

  it("isCodexModel returns true only for codex-routed models", () => {
    expect(router.isCodexModel("gpt-5.2-codex")).toBe(true);
    expect(router.isCodexModel("claude-3-5-sonnet-20241022")).toBe(false);
    expect(router.isCodexModel("openai:gpt-4o")).toBe(false);
  });

  it("explicit prefix beats auto-routing", () => {
    // Even if model name starts with "claude-", explicit prefix wins
    expect(router.resolve("openai:claude-compat").tag).toBe("openai");
  });

  it("explicit prefix beats model_routing table", () => {
    // Even if "deepseek-chat" is in model_routing, prefix wins
    expect(router.resolve("openai:deepseek-chat").tag).toBe("openai");
  });

  it("returns default adapter for unknown prefix", () => {
    expect(router.resolve("unknown-provider:gpt-4o").tag).toBe("codex");
  });

  describe("without a registered codex adapter", () => {
    const providerOnlyAdapters = new Map([
      ["openai", openaiAdapter],
      ["anthropic", anthropicAdapter],
      ["gemini", geminiAdapter],
      ["deepseek", deepseekAdapter],
    ]);

    const providerOnlyRouter = new UpstreamRouter(
      providerOnlyAdapters,
      { "deepseek-chat": "deepseek", "deepseek-reasoner": "deepseek" },
      "codex",
    );

    it("falls back to codex when no rule matches", () => {
      const adapter = providerOnlyRouter.resolve("unknown-model-xyz");

      expect(adapter.tag).toBe("codex");
    });

    it("does not fall back to the first provider adapter", () => {
      const adapter = providerOnlyRouter.resolve("o3");

      expect(adapter.tag).toBe("codex");
      expect(adapter).not.toBe(openaiAdapter);
    });

    it("treats unmatched models as codex models", () => {
      expect(providerOnlyRouter.isCodexModel("o3")).toBe(true);
      expect(providerOnlyRouter.isCodexModel("unknown-model-xyz")).toBe(true);
    });

    it("keeps prefix, model_routing, and pattern matches unchanged", () => {
      expect(providerOnlyRouter.resolve("openai:gpt-4o")).toBe(openaiAdapter);
      expect(providerOnlyRouter.resolve("deepseek-chat")).toBe(deepseekAdapter);
      expect(providerOnlyRouter.resolve("claude-3-5-sonnet-20241022")).toBe(anthropicAdapter);
      expect(providerOnlyRouter.resolve("gemini-2.0-flash")).toBe(geminiAdapter);
    });
  });
});
