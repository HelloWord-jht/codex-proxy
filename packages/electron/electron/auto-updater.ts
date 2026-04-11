export interface AutoUpdateState {
  checking: boolean;
  updateAvailable: boolean;
  downloading: boolean;
  downloaded: boolean;
  progress: number;
  version: string | null;
  releaseUrl: string | null;
  error: string | null;
}

interface AutoUpdaterOptions {
  getMainWindow: () => unknown;
  rebuildTrayMenu: () => void;
  autoUpdate?: boolean;
  autoDownload?: boolean;
}

const disabledState: AutoUpdateState = {
  checking: false,
  updateAvailable: false,
  downloading: false,
  downloaded: false,
  progress: 0,
  version: null,
  releaseUrl: null,
  error: null,
};

export function getAutoUpdateState(): AutoUpdateState {
  return { ...disabledState };
}

export function initAutoUpdater(_options: AutoUpdaterOptions): void {
  // Electron auto-update has been removed.
}

export function checkForUpdateManual(): void {
  // Electron auto-update has been removed.
}

export function downloadUpdate(): void {
  // Electron auto-update has been removed.
}

export function installUpdate(): void {
  // Electron auto-update has been removed.
}

export function stopAutoUpdater(): void {
  // Electron auto-update has been removed.
}
