export interface ZenRowsScrapeOptions {
  timeoutMs?: number;
}

export async function fetchWithZenRows(
  targetUrl: string,
  options: ZenRowsScrapeOptions = {}
): Promise<string | null> {
  const apiKey = process.env.ZENROWS_API_KEY?.trim();
  if (!apiKey) {
    console.warn("ZENROWS_API_KEY is not configured in environment variables.");
    return null;
  }

  const { timeoutMs = 8000 } = options;
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const zenrowsEndpoint = new URL("https://api.zenrows.com/v1/");
    zenrowsEndpoint.searchParams.set("apikey", apiKey);
    zenrowsEndpoint.searchParams.set("url", targetUrl);
    zenrowsEndpoint.searchParams.set("js_render", "true");
    zenrowsEndpoint.searchParams.set("premium_proxy", "true");

    const response = await fetch(zenrowsEndpoint.toString(), {
      method: "GET",
      signal: controller.signal,
    });

    if (!response.ok) {
      console.warn(`ZenRows API returned HTTP ${response.status} for ${targetUrl}`);
      return null;
    }

    const html = await response.text();
    return html;
  } catch (err: unknown) {
    if (err instanceof Error && err.name === "AbortError") {
      console.warn(`ZenRows request timed out after ${timeoutMs}ms for ${targetUrl}`);
    } else {
      console.warn("ZenRows request failed:", err);
    }
    return null;
  } finally {
    clearTimeout(timer);
  }
}
