import { describe, it, expect } from "vitest";

import {
  createLocalOnlyWindowOpenHandler,
  isAllowedLocalWindowUrl,
} from "../electron/window-open-policy.js";

describe("window-open-policy", () => {
  it("allows only local dashboard origins for the current port", () => {
    expect(isAllowedLocalWindowUrl("http://127.0.0.1:1455/settings", 1455)).toBe(true);
    expect(isAllowedLocalWindowUrl("http://localhost:1455/docs", 1455)).toBe(true);
    expect(isAllowedLocalWindowUrl("http://[::1]:1455/", 1455)).toBe(true);
    expect(isAllowedLocalWindowUrl("http://127.0.0.1:8080/", 1455)).toBe(false);
    expect(isAllowedLocalWindowUrl("https://example.com", 1455)).toBe(false);
  });

  it("denies non-local windows without opening external links", () => {
    const handler = createLocalOnlyWindowOpenHandler(1455);

    expect(handler({ url: "http://127.0.0.1:1455/help" })).toEqual({ action: "allow" });
    expect(handler({ url: "https://github.com/icebear0828/codex-proxy" })).toEqual({ action: "deny" });
    expect(handler({ url: "not a url" })).toEqual({ action: "deny" });
  });
});
