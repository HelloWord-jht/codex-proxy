import { existsSync, mkdirSync, readFileSync, renameSync, writeFileSync } from "fs";
import { dirname } from "path";
import yaml from "js-yaml";

export const DESKTOP_STARTUP_AUTH_DEFAULTS = {
  enabled: true,
  endpoint: "http://8.138.98.141:7544/auth/startup",
  secretKey: null,
  instanceId: "auto",
  clientIp: "auto",
  requestTimeoutMs: 3000,
} as const;

function isRecord(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

export function normalizeSecretKey(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

export function readLocalConfig(filePath: string): Record<string, unknown> {
  if (!existsSync(filePath)) {
    return {};
  }

  const raw = readFileSync(filePath, "utf-8");
  const parsed = yaml.load(raw);
  return isRecord(parsed) ? parsed : {};
}

export function getStoredStartupAuthSecretKey(data: Record<string, unknown>): string | null {
  if (!isRecord(data.startup_auth)) {
    return null;
  }
  return normalizeSecretKey(data.startup_auth.secretKey);
}

export function mergeDesktopStartupAuthConfig(
  data: Record<string, unknown>,
  secretKey?: string | null,
): Record<string, unknown> {
  const next = { ...data };
  const existingStartupAuth = isRecord(next.startup_auth) ? next.startup_auth : {};
  const nextSecretKey = secretKey === undefined
    ? getStoredStartupAuthSecretKey(next)
    : normalizeSecretKey(secretKey);

  next.startup_auth = {
    ...existingStartupAuth,
    ...DESKTOP_STARTUP_AUTH_DEFAULTS,
    secretKey: nextSecretKey,
  };

  return next;
}

export function writeLocalConfig(filePath: string, data: Record<string, unknown>): void {
  mkdirSync(dirname(filePath), { recursive: true });
  const tmp = `${filePath}.tmp`;
  writeFileSync(tmp, yaml.dump(data, { lineWidth: -1, quotingType: '"' }), "utf-8");
  renameSync(tmp, filePath);
}

export function ensureDesktopStartupAuthConfig(
  filePath: string,
  secretKey?: string | null,
): Record<string, unknown> {
  const current = readLocalConfig(filePath);
  const next = mergeDesktopStartupAuthConfig(current, secretKey);
  writeLocalConfig(filePath, next);
  return next;
}
