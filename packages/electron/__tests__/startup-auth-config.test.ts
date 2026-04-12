import { describe, expect, it } from "vitest";
import {
  DESKTOP_STARTUP_AUTH_DEFAULTS,
  getStoredStartupAuthSecretKey,
  mergeDesktopStartupAuthConfig,
  normalizeSecretKey,
} from "../electron/startup-auth-config.js";

describe("startup-auth-config", () => {
  it("normalizes blank secret keys to null", () => {
    expect(normalizeSecretKey("   ")).toBeNull();
    expect(normalizeSecretKey(null)).toBeNull();
  });

  it("preserves unrelated local config fields", () => {
    const merged = mergeDesktopStartupAuthConfig({
      server: { proxy_api_key: "abc" },
    });

    expect(merged.server).toEqual({ proxy_api_key: "abc" });
  });

  it("applies packaged startup_auth defaults", () => {
    const merged = mergeDesktopStartupAuthConfig({});

    expect(merged.startup_auth).toEqual(DESKTOP_STARTUP_AUTH_DEFAULTS);
  });

  it("uses stored secret key when no new key is supplied", () => {
    const merged = mergeDesktopStartupAuthConfig({
      startup_auth: {
        secretKey: "existing-key",
      },
    });

    expect(getStoredStartupAuthSecretKey(merged)).toBe("existing-key");
    expect((merged.startup_auth as { endpoint: string }).endpoint).toBe(
      DESKTOP_STARTUP_AUTH_DEFAULTS.endpoint,
    );
  });

  it("overrides secret key with the newly entered value", () => {
    const merged = mergeDesktopStartupAuthConfig({
      startup_auth: {
        secretKey: "old-key",
      },
    }, "new-key");

    expect(getStoredStartupAuthSecretKey(merged)).toBe("new-key");
  });
});
