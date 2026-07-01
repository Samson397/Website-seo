export type UptimeStatus = "up" | "down";

export interface UptimeResult {
  status: UptimeStatus;
  httpStatus?: number;
  responseMs: number;
  error?: string;
}

const UPTIME_TIMEOUT_MS = 12000;
const USER_AGENT = "SEOScan-Uptime/1.0";

async function probe(url: string, method: "HEAD" | "GET"): Promise<Response> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), UPTIME_TIMEOUT_MS);

  try {
    return await fetch(url, {
      method,
      redirect: "follow",
      signal: controller.signal,
      headers: { "User-Agent": USER_AGENT },
    });
  } finally {
    clearTimeout(timeout);
  }
}

export async function checkUptime(url: string): Promise<UptimeResult> {
  const start = Date.now();
  let lastError = "Site unreachable";

  for (const method of ["HEAD", "GET"] as const) {
    try {
      const response = await probe(url, method);
      const responseMs = Date.now() - start;

      if (response.status >= 500) {
        return {
          status: "down",
          httpStatus: response.status,
          responseMs,
          error: `Server returned HTTP ${response.status}`,
        };
      }

      return {
        status: "up",
        httpStatus: response.status,
        responseMs,
      };
    } catch (err) {
      lastError = err instanceof Error ? err.message : "Site unreachable";
      if (method === "GET") {
        return {
          status: "down",
          responseMs: Date.now() - start,
          error: lastError,
        };
      }
    }
  }

  return {
    status: "down",
    responseMs: Date.now() - start,
    error: lastError,
  };
}
