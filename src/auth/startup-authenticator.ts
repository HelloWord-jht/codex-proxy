import { existsSync, mkdirSync, readFileSync, writeFileSync } from "fs";
import { hostname, networkInterfaces } from "os";
import { resolve } from "path";
import { getDataDir } from "../paths.js";
import {
  AuthFailedError,
  type StartupAuthApiResponse,
  type StartupAuthApiSuccessData,
  type StartupAuthConfig,
} from "./startup-auth-types.js";

function isRecord(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

function parseStartupAuthApiSuccessData(value: unknown): StartupAuthApiSuccessData | null {
  if (!isRecord(value)) return null;

  const token = value.token;
  const expiresIn = value.expiresIn;
  const expiresAt = value.expiresAt;
  const secretKeyId = value.secretKeyId;
  const userAccount = value.userAccount;
  const instanceId = value.instanceId;
  const accountNum = value.accountNum;
  const activatedNow = value.activatedNow;

  if (typeof token !== "string") return null;
  if (!Number.isInteger(expiresIn)) return null;
  if (typeof expiresAt !== "string") return null;
  if (!Number.isInteger(secretKeyId)) return null;
  if (typeof userAccount !== "string") return null;
  if (typeof instanceId !== "string") return null;
  if (!Number.isInteger(accountNum)) return null;
  if (typeof activatedNow !== "boolean") return null;

  const parsedExpiresIn = expiresIn as number;
  const parsedSecretKeyId = secretKeyId as number;
  const parsedAccountNum = accountNum as number;

  return {
    token,
    expiresIn: parsedExpiresIn,
    expiresAt,
    secretKeyId: parsedSecretKeyId,
    userAccount,
    instanceId,
    accountNum: parsedAccountNum,
    activatedNow,
  };
}

function parseStartupAuthApiResponse(value: unknown): StartupAuthApiResponse | null {
  if (!isRecord(value)) return null;

  const success = value.success;
  const code = value.code;
  const message = value.message;
  const retryable = value.retryable;
  const data = value.data;
  const parsedData = data === null ? null : parseStartupAuthApiSuccessData(data);

  if (typeof success !== "boolean") return null;
  if (typeof code !== "string") return null;
  if (typeof message !== "string") return null;
  if (typeof retryable !== "boolean") return null;
  if (data !== null && parsedData === null) return null;

  return {
    success,
    code,
    message,
    retryable,
    data: parsedData,
  };
}

function isPrivateIpv4(address: string): boolean {
  const parts = address.split(".");
  if (parts.length !== 4) return true;

  const octets = parts.map((part) => Number.parseInt(part, 10));
  if (octets.some((octet) => !Number.isInteger(octet) || octet < 0 || octet > 255)) {
    return true;
  }

  if (octets[0] === 10) return true;
  if (octets[0] === 172 && octets[1] >= 16 && octets[1] <= 31) return true;
  if (octets[0] === 192 && octets[1] === 168) return true;

  return false;
}

function logInfo(message: string): void {
  console.log(`[StartupAuth] ${message}`);
}

function logError(message: string): void {
  console.error(`[StartupAuth] ${message}`);
}

export class StartupAuthenticator {
  public async authenticateOrThrow(config: StartupAuthConfig): Promise<void> {
    if (!config.enabled) {
      logInfo("Startup authentication disabled.");
      return;
    }

    try {
      const endpoint = config.endpoint.trim();
      const secretKey = config.secretKey?.trim() ?? null;

      if (endpoint.length === 0) {
        throw new AuthFailedError(
          "INVALID_STARTUP_AUTH_CONFIG",
          "startup_auth.endpoint is required when startup authentication is enabled.",
          false,
        );
      }

      try {
        new URL(endpoint);
      } catch {
        throw new AuthFailedError(
          "INVALID_STARTUP_AUTH_CONFIG",
          "startup_auth.endpoint must be a valid absolute URL.",
          false,
        );
      }

      if (!secretKey) {
        throw new AuthFailedError(
          "INVALID_STARTUP_AUTH_CONFIG",
          "startup_auth.secretKey is required when startup authentication is enabled.",
          false,
        );
      }

      if (!Number.isInteger(config.requestTimeoutMs) || config.requestTimeoutMs < 1) {
        throw new AuthFailedError(
          "INVALID_STARTUP_AUTH_CONFIG",
          "startup_auth.requestTimeoutMs must be a positive integer.",
          false,
        );
      }

      logInfo("Performing startup authentication.");

      const instanceId = (await this.resolveInstanceId(config)).trim();
      if (instanceId.length === 0) {
        throw new AuthFailedError(
          "INVALID_STARTUP_AUTH_CONFIG",
          "Resolved startup instanceId must not be empty.",
          false,
        );
      }

      const clientIp = this.resolveClientIp(config).trim();
      if (clientIp.length === 0) {
        throw new AuthFailedError(
          "INVALID_STARTUP_AUTH_CONFIG",
          "Resolved startup clientIp must not be empty.",
          false,
        );
      }

      const response = await this.callStartupApi({
        ...config,
        endpoint,
        secretKey,
        instanceId,
        clientIp,
      });

      if (response.success !== true) {
        throw new AuthFailedError(
          response.code,
          response.message || "Startup authentication failed.",
          response.retryable,
        );
      }

      const token = response.data?.token?.trim() ?? "";
      if (token.length === 0) {
        throw new AuthFailedError(
          "INVALID_STARTUP_AUTH_RESPONSE",
          "Startup authentication response is missing a valid data.token.",
          true,
        );
      }

      logInfo("Startup authentication succeeded.");
    } catch (error: unknown) {
      if (error instanceof AuthFailedError) {
        logError(`${error.code}: ${error.message}`);
        throw error;
      }

      const message = error instanceof Error ? error.message : "Startup authentication failed.";
      const wrapped = new AuthFailedError("STARTUP_AUTH_FAILED", message, false);
      logError(`${wrapped.code}: ${wrapped.message}`);
      throw wrapped;
    }
  }

  public async callStartupApi(config: StartupAuthConfig): Promise<StartupAuthApiResponse> {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), config.requestTimeoutMs);
    if (typeof timer.unref === "function") timer.unref();

    try {
      const response = await fetch(config.endpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          secretKey: config.secretKey,
          instanceId: config.instanceId,
          clientIp: config.clientIp,
        }),
        signal: controller.signal,
      });

      const rawBody = await response.text();

      let parsedBody: unknown;
      try {
        parsedBody = JSON.parse(rawBody);
      } catch {
        throw new AuthFailedError(
          "INVALID_STARTUP_AUTH_RESPONSE",
          "Startup authentication response is not valid JSON.",
          true,
        );
      }

      const parsedResponse = parseStartupAuthApiResponse(parsedBody);
      if (parsedResponse === null) {
        throw new AuthFailedError(
          "INVALID_STARTUP_AUTH_RESPONSE",
          "Startup authentication response format is invalid.",
          true,
        );
      }

      if (!response.ok) {
        if (parsedResponse.success === false) {
          throw new AuthFailedError(
            parsedResponse.code,
            parsedResponse.message || `Startup authentication failed with HTTP ${response.status}.`,
            parsedResponse.retryable,
          );
        }

        throw new AuthFailedError(
          "STARTUP_AUTH_HTTP_ERROR",
          `Startup authentication failed with HTTP ${response.status}.`,
          response.status >= 500,
        );
      }

      return parsedResponse;
    } catch (error: unknown) {
      if (error instanceof AuthFailedError) throw error;

      if (error instanceof Error && error.name === "AbortError") {
        throw new AuthFailedError(
          "STARTUP_AUTH_TIMEOUT",
          `Startup authentication request timed out after ${config.requestTimeoutMs}ms.`,
          true,
        );
      }

      const message = error instanceof Error ? error.message : "Startup authentication request failed.";
      throw new AuthFailedError(
        "STARTUP_AUTH_NETWORK_ERROR",
        `Startup authentication request failed: ${message}`,
        true,
      );
    } finally {
      clearTimeout(timer);
    }
  }

  public async resolveInstanceId(config: StartupAuthConfig): Promise<string> {
    if (config.instanceId !== "auto") {
      return config.instanceId;
    }
    return this.readOrCreateInstanceId();
  }

  public async readOrCreateInstanceId(): Promise<string> {
    const dataDir = getDataDir();
    const instanceIdPath = resolve(dataDir, ".instance-id");

    if (existsSync(instanceIdPath)) {
      const existing = readFileSync(instanceIdPath, "utf-8").trim();
      if (existing.length > 0) {
        return existing;
      }
    }

    if (!existsSync(dataDir)) {
      mkdirSync(dataDir, { recursive: true });
    }

    const instanceId = `${hostname()}-${Date.now()}`;
    writeFileSync(instanceIdPath, instanceId, "utf-8");
    return instanceId;
  }

  public resolveClientIp(config: StartupAuthConfig): string {
    if (config.clientIp !== "auto") {
      return config.clientIp;
    }

    const interfaces = networkInterfaces();
    for (const interfaceEntries of Object.values(interfaces)) {
      if (!interfaceEntries) continue;

      for (const entry of interfaceEntries) {
        if (entry.family !== "IPv4") continue;
        if (entry.internal) continue;
        if (isPrivateIpv4(entry.address)) continue;
        return entry.address;
      }
    }

    return "127.0.0.1";
  }
}
