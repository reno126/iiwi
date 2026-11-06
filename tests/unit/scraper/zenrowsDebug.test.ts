import { mkdir, writeFile } from "node:fs/promises";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  MAX_ZENROWS_DEBUG_BYTES,
  ZENROWS_DEBUG_TIMEOUT_MS,
  saveRejectedZenRowsResponse,
} from "@/lib/scraper/zenrowsDebug";

vi.mock("node:fs/promises", () => ({
  mkdir: vi.fn().mockResolvedValue(undefined),
  writeFile: vi.fn().mockResolvedValue(undefined),
}));

describe("ZenRows rejected response diagnostics", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.stubEnv("NODE_ENV", "development");
  });

  afterEach(() => {
    vi.unstubAllEnvs();
    vi.useRealTimers();
  });

  it("saves HTTP error status, selected headers, and body without persisting credential headers", async () => {
    const body = JSON.stringify({ error: "Request blocked" });
    const response = new Response(body, {
      status: 403,
      statusText: "Forbidden",
      headers: {
        "content-type": "application/json",
        "x-request-id": "provider-request-123",
        "set-cookie": "private-cookie",
        "x-api-key": "private-key",
      },
    });

    await saveRejectedZenRowsResponse(
      response,
      "https://shop.pl/item",
      new AbortController().signal,
    );

    expect(mkdir).toHaveBeenCalledWith(expect.stringContaining("scrapes"), {
      recursive: true,
    });
    expect(writeFile).toHaveBeenCalledWith(
      expect.stringContaining("shop.pl_last_zenrows_response.txt"),
      body,
      "utf8",
    );
    const metadata = vi
      .mocked(writeFile)
      .mock.calls.find(([filename]) => String(filename).endsWith(".json"))?.[1];
    expect(metadata).toContain('"status": 403');
    expect(metadata).toContain('"x-request-id": "provider-request-123"');
    expect(metadata).toContain('"truncated": false');
    expect(metadata).not.toContain("private-cookie");
    expect(metadata).not.toContain("private-key");
  });

  it("caps the preview and cancels the remaining stream", async () => {
    const cancel = vi.fn();
    const body = new ReadableStream<Uint8Array>({
      start(controller) {
        controller.enqueue(
          new TextEncoder().encode("x".repeat(MAX_ZENROWS_DEBUG_BYTES + 100)),
        );
      },
      cancel,
    });

    await saveRejectedZenRowsResponse(
      new Response(body),
      "https://shop.pl/item",
      new AbortController().signal,
    );

    expect(writeFile).toHaveBeenCalledWith(
      expect.stringContaining(".txt"),
      "x".repeat(MAX_ZENROWS_DEBUG_BYTES),
      "utf8",
    );
    expect(writeFile).toHaveBeenCalledWith(
      expect.stringContaining(".json"),
      expect.stringContaining('"truncated": true'),
      "utf8",
    );
    expect(cancel).toHaveBeenCalledOnce();
    expect(body.locked).toBe(false);
  });

  it.each(["preview deadline", "request cancellation"])(
    "saves a partial body after %s",
    async (abortSource) => {
      vi.useFakeTimers();
      const parentController = new AbortController();
      const cancel = vi.fn(() => new Promise<void>(() => undefined));
      const body = new ReadableStream<Uint8Array>({
        start(controller) {
          controller.enqueue(new TextEncoder().encode("Partial response"));
        },
        cancel,
      });
      const snapshot = saveRejectedZenRowsResponse(
        new Response(body),
        "https://shop.pl/item",
        parentController.signal,
      );

      await vi.advanceTimersByTimeAsync(ZENROWS_DEBUG_TIMEOUT_MS - 1);
      expect(writeFile).not.toHaveBeenCalled();
      if (abortSource === "request cancellation") parentController.abort();
      else await vi.advanceTimersByTimeAsync(1);
      await snapshot;

      expect(writeFile).toHaveBeenCalledWith(
        expect.stringContaining(".txt"),
        "Partial response",
        "utf8",
      );
      expect(writeFile).toHaveBeenCalledWith(
        expect.stringContaining(".json"),
        expect.stringContaining('"truncated": true'),
        "utf8",
      );
      expect(cancel).toHaveBeenCalledOnce();
      expect(body.locked).toBe(false);
      expect(vi.getTimerCount()).toBe(0);
    },
  );

  it("does not read bodies or write files in production", async () => {
    vi.stubEnv("NODE_ENV", "production");
    const response = new Response("Provider response");

    await saveRejectedZenRowsResponse(
      response,
      "https://shop.pl/item",
      new AbortController().signal,
    );

    expect(response.bodyUsed).toBe(false);
    expect(mkdir).not.toHaveBeenCalled();
    expect(writeFile).not.toHaveBeenCalled();
  });

  it("reports filesystem failure without interrupting response rejection", async () => {
    vi.mocked(mkdir).mockRejectedValueOnce(new Error("Directory is read-only"));

    await expect(
      saveRejectedZenRowsResponse(
        new Response("Provider response"),
        "https://shop.pl/item",
        new AbortController().signal,
      ),
    ).resolves.toBeUndefined();
    expect(writeFile).not.toHaveBeenCalled();
  });
});
