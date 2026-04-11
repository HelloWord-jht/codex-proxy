export interface WindowOpenRequestLike {
  url: string;
}

export function getAllowedLocalOrigins(port: number): string[] {
  return [
    `http://127.0.0.1:${port}`,
    `http://localhost:${port}`,
    `http://[::1]:${port}`,
  ];
}

export function isAllowedLocalWindowUrl(url: string, port: number): boolean {
  try {
    const parsed = new URL(url);
    return getAllowedLocalOrigins(port).includes(parsed.origin);
  } catch {
    return false;
  }
}

export function createLocalOnlyWindowOpenHandler(port: number) {
  return ({ url }: WindowOpenRequestLike) => ({
    action: isAllowedLocalWindowUrl(url, port) ? "allow" as const : "deny" as const,
  });
}
