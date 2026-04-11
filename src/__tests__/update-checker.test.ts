import { describe, it, expect, vi, beforeEach } from "vitest";

const mockGetConfig = vi.fn(() => ({
  client: {
    app_version: "26.318.11754",
    build_number: "1100",
  },
}));

vi.mock("../config.js", () => ({
  getConfig: mockGetConfig,
}));

describe("update-checker", () => {
  beforeEach(() => {
    vi.resetModules();
    vi.clearAllMocks();
  });

  it("returns the local version without reporting remote updates", async () => {
    const { checkForUpdate } = await import("../update-checker.js");

    const result = await checkForUpdate();

    expect(result.current_version).toBe("26.318.11754");
    expect(result.current_build).toBe("1100");
    expect(result.latest_version).toBe("26.318.11754");
    expect(result.latest_build).toBe("1100");
    expect(result.update_available).toBe(false);
    expect(result.download_url).toBeNull();
  });

  it("startUpdateChecker seeds only local state and does not schedule work", async () => {
    const { startUpdateChecker, getUpdateState, isUpdateInProgress, stopUpdateChecker } = await import("../update-checker.js");

    startUpdateChecker();

    expect(getUpdateState()).toMatchObject({
      current_version: "26.318.11754",
      current_build: "1100",
      update_available: false,
    });
    expect(isUpdateInProgress()).toBe(false);

    expect(() => stopUpdateChecker()).not.toThrow();
  });
});
