import { getConfig } from "./config.js";

export interface UpdateState {
  last_check: string;
  latest_version: string | null;
  latest_build: string | null;
  download_url: string | null;
  update_available: boolean;
  current_version: string;
  current_build: string;
}

let currentState: UpdateState | null = null;

function createLocalState(): UpdateState {
  const config = getConfig();
  return {
    last_check: new Date().toISOString(),
    latest_version: config.client.app_version,
    latest_build: config.client.build_number,
    download_url: null,
    update_available: false,
    current_version: config.client.app_version,
    current_build: config.client.build_number,
  };
}

export async function checkForUpdate(): Promise<UpdateState> {
  currentState = createLocalState();
  return currentState;
}

export function getUpdateState(): UpdateState | null {
  return currentState;
}

export function isUpdateInProgress(): boolean {
  return false;
}

export function startUpdateChecker(): void {
  currentState = createLocalState();
}

export function stopUpdateChecker(): void {
  // Intentionally empty: remote update checks have been removed.
}
