import { execFileSync } from "child_process";
import { existsSync, readFileSync } from "fs";
import { resolve } from "path";
import { getRootDir, isEmbedded } from "./paths.js";

export interface ProxyInfo {
  version: string | null;
  commit: string | null;
}

export interface CommitInfo {
  hash: string;
  message: string;
}

export interface ReleaseInfo {
  version: string;
  tag: string;
  body: string;
  url: string;
  publishedAt: string;
}

export type DeployMode = "git" | "docker" | "electron";

export interface ProxySelfUpdateResult {
  commitsBehind: number;
  currentCommit: string | null;
  latestCommit: string | null;
  commits: CommitInfo[];
  changelog: string | null;
  release: ReleaseInfo | null;
  updateAvailable: boolean;
  mode: DeployMode;
}

const DISABLED_UPDATE_RESULT: Omit<
  ProxySelfUpdateResult,
  "currentCommit" | "latestCommit" | "mode"
> = {
  commitsBehind: 0,
  commits: [],
  changelog: null,
  release: null,
  updateAvailable: false,
};

let cachedResult: ProxySelfUpdateResult | null = null;

export function getProxyInfo(): ProxyInfo {
  let version: string | null = null;
  let commit: string | null = null;

  try {
    const pkg = JSON.parse(readFileSync(resolve(getRootDir(), "package.json"), "utf-8")) as {
      version?: string;
    };
    version = pkg.version ?? null;
  } catch {
    version = null;
  }

  try {
    if (existsSync(resolve(process.cwd(), ".git"))) {
      const stdout = execFileSync("git", ["rev-parse", "--short", "HEAD"], {
        cwd: process.cwd(),
        encoding: "utf-8",
        timeout: 5000,
      });
      commit = stdout.trim() || null;
    }
  } catch {
    commit = null;
  }

  return { version, commit };
}

export function canSelfUpdate(): boolean {
  return false;
}

export function getDeployMode(): DeployMode {
  if (isEmbedded()) return "electron";
  return existsSync(resolve(process.cwd(), ".git")) ? "git" : "docker";
}

export function isProxyUpdateInProgress(): boolean {
  return false;
}

export function getCachedProxyUpdateResult(): ProxySelfUpdateResult | null {
  return cachedResult;
}

export async function checkProxySelfUpdate(): Promise<ProxySelfUpdateResult> {
  const info = getProxyInfo();
  const result: ProxySelfUpdateResult = {
    ...DISABLED_UPDATE_RESULT,
    currentCommit: info.commit,
    latestCommit: info.commit,
    mode: getDeployMode(),
  };
  cachedResult = result;
  return result;
}

export type UpdateProgressCallback = (
  step: string,
  status: "running" | "done" | "error",
  detail?: string,
) => void;

export async function applyProxySelfUpdate(
  onProgress?: UpdateProgressCallback,
): Promise<{ started: boolean; restarting?: boolean; error?: string }> {
  onProgress?.("removed", "error", "Proxy self-update has been removed.");
  return {
    started: false,
    error: "Proxy self-update has been removed.",
  };
}

export function startProxyUpdateChecker(): void {
  cachedResult = cachedResult ?? {
    ...DISABLED_UPDATE_RESULT,
    currentCommit: getProxyInfo().commit,
    latestCommit: getProxyInfo().commit,
    mode: getDeployMode(),
  };
}

export function stopProxyUpdateChecker(): void {
  // Intentionally empty: periodic proxy update checks have been removed.
}
