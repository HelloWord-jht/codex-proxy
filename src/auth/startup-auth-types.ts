export interface StartupAuthConfig {
  enabled: boolean;
  endpoint: string;
  secretKey: string | null;
  instanceId: string;
  clientIp: string;
  requestTimeoutMs: number;
}

export interface StartupAuthApiSuccessData {
  token: string;
  expiresIn: number;
  expiresAt: string;
  secretKeyId: number;
  userAccount: string;
  instanceId: string;
  accountNum: number;
  activatedNow: boolean;
}

export interface StartupAuthApiResponse {
  success: boolean;
  code: string;
  message: string;
  retryable: boolean;
  data: StartupAuthApiSuccessData | null;
}

export class AuthFailedError extends Error {
  constructor(
    public readonly code: string,
    message: string,
    public readonly retryable: boolean,
  ) {
    super(message);
    this.name = "AuthFailedError";
  }
}
