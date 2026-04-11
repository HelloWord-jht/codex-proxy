import { describe, it, expect } from "vitest";

import {
  getAutoUpdateState,
  initAutoUpdater,
  checkForUpdateManual,
  downloadUpdate,
  installUpdate,
  stopAutoUpdater,
} from "../electron/auto-updater.js";

describe("electron auto-updater compatibility layer", () => {
  it("stays disabled", () => {
    expect(getAutoUpdateState()).toEqual({
      checking: false,
      updateAvailable: false,
      downloading: false,
      downloaded: false,
      progress: 0,
      version: null,
      releaseUrl: null,
      error: null,
    });
  });

  it("no-op lifecycle methods do not throw", () => {
    expect(() => initAutoUpdater({
      getMainWindow: () => null,
      rebuildTrayMenu: () => undefined,
    })).not.toThrow();
    expect(() => checkForUpdateManual()).not.toThrow();
    expect(() => downloadUpdate()).not.toThrow();
    expect(() => installUpdate()).not.toThrow();
    expect(() => stopAutoUpdater()).not.toThrow();
  });
});
