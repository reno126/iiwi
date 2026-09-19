export interface ZenRowsScrapeOptions {
  timeoutMs?: number;
  antibot?: boolean;
  proxyCountry?: string;
  waitMs?: number;
  waitFor?: string;
}

function extractPageTitle(html: string): string {
  const titleMatch = html.match(/<title[^>]*>([^<]+)<\/title>/i);
  return titleMatch ? titleMatch[1].trim() : "Brak <title>";
}

function isBotChallengeDetected(html: string): boolean {
  const challengeTitlePattern =
    /<title>.*(Just a moment|Attention Required|Security Check|Access Denied).*<\/title>/i;
  return (
    challengeTitlePattern.test(html) ||
    html.includes("challenge-running") ||
    html.includes("cf-browser-verification") ||
    html.includes("turnstile")
  );
}

async function saveDebugHtmlSnapshotIfDevelopment(
  html: string,
  targetUrl: string,
): Promise<void> {
  if (process.env.NODE_ENV === "production") {
    return;
  }

  try {
    const fs = await import("fs");
    const path = await import("path");
    const debugDir = path.resolve(process.cwd(), "tmp", "scrapes");
    if (!fs.existsSync(debugDir)) {
      fs.mkdirSync(debugDir, { recursive: true });
    }
    const hostname = new URL(targetUrl).hostname.replace(
      /[^a-zA-Z0-9.-]/g,
      "_",
    );
    const debugFile = path.join(debugDir, `${hostname}_last_zenrows.html`);
    fs.writeFileSync(debugFile, html, "utf-8");
    console.log(`[ZenRows] Debug HTML snapshot saved to: ${debugFile}`);
  } catch {
    return;
  }
}

export async function fetchWithZenRows(
  targetUrl: string,
  options: ZenRowsScrapeOptions = {},
): Promise<string | null> {
  const apiKey = process.env.ZENROWS_API_KEY?.trim();
  if (!apiKey) {
    console.warn(
      "[ZenRows] ZENROWS_API_KEY is not configured in environment variables.",
    );
    return null;
  }

  const {
    timeoutMs = 25000,
    antibot = true,
    proxyCountry = "pl",
    waitMs,
    waitFor,
  } = options;

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const zenrowsEndpoint = new URL("https://api.zenrows.com/v1/");
    zenrowsEndpoint.searchParams.set("apikey", apiKey);
    zenrowsEndpoint.searchParams.set("url", targetUrl);
    zenrowsEndpoint.searchParams.set("js_render", "true");
    zenrowsEndpoint.searchParams.set("premium_proxy", "true");

    if (antibot) {
      zenrowsEndpoint.searchParams.set("antibot", "true");
    }
    if (proxyCountry) {
      zenrowsEndpoint.searchParams.set("proxy_country", proxyCountry);
    }
    if (waitMs) {
      zenrowsEndpoint.searchParams.set("wait", String(waitMs));
    }
    if (waitFor) {
      zenrowsEndpoint.searchParams.set("wait_for", waitFor);
    }

    const maskedEndpoint = new URL(zenrowsEndpoint.toString());
    maskedEndpoint.searchParams.set("apikey", "***MASKED***");
    console.log(
      `[ZenRows] Calling API for: ${targetUrl} [${maskedEndpoint.toString()}]`,
    );

    const startTime = Date.now();
    const response = await fetch(zenrowsEndpoint.toString(), {
      method: "GET",
      signal: controller.signal,
    });
    const durationMs = Date.now() - startTime;

    const zrStatus = response.headers.get("zr-status");
    const zrUrl = response.headers.get("zr-url");
    const contentType = response.headers.get("content-type");

    console.log(
      `[ZenRows] Response HTTP ${response.status} in ${durationMs}ms | zr-status: ${zrStatus ?? "N/A"} | zr-url: ${zrUrl ?? targetUrl} | type: ${contentType ?? "unknown"}`,
    );

    if (!response.ok) {
      console.warn(
        `[ZenRows] API error: HTTP ${response.status} (${response.statusText}) for ${targetUrl}`,
      );
      return null;
    }

    const html = await response.text();
    const pageTitle = extractPageTitle(html);

    if (isBotChallengeDetected(html)) {
      console.warn(
        `[ZenRows] WARNING: Bot challenge / captcha detected in returned HTML despite HTTP ${response.status}! Title: "${pageTitle}"`,
      );
    } else {
      console.log(
        `[ZenRows] Successfully received HTML (${html.length} chars). Page title: "${pageTitle}"`,
      );
    }

    await saveDebugHtmlSnapshotIfDevelopment(html, targetUrl);

    return html;
  } catch (err: unknown) {
    if (err instanceof Error && err.name === "AbortError") {
      console.warn(
        `[ZenRows] Request timed out after ${timeoutMs}ms for ${targetUrl}`,
      );
    } else {
      console.warn("[ZenRows] Request failed:", err);
    }
    return null;
  } finally {
    clearTimeout(timer);
  }
}
