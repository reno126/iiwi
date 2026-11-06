export const MAX_ZENROWS_DEBUG_BYTES = 64 * 1024;
export const ZENROWS_DEBUG_TIMEOUT_MS = 1000;

async function readResponsePreview(
  response: Response,
  parentSignal: AbortSignal,
) {
  const bytes = new Uint8Array(MAX_ZENROWS_DEBUG_BYTES);
  let capturedBytes = 0;
  let truncated = false;
  let readError: string | null = null;
  if (!response.body) {
    return { body: "", capturedBytes, truncated, readError };
  }

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), ZENROWS_DEBUG_TIMEOUT_MS);
  const signal = AbortSignal.any([parentSignal, controller.signal]);
  const reader = response.body.getReader();
  const cancelBody = () => {
    void reader.cancel().catch(() => undefined);
  };
  signal.addEventListener("abort", cancelBody, { once: true });

  try {
    while (true) {
      signal.throwIfAborted();
      const { done, value } = await reader.read();
      signal.throwIfAborted();
      if (done) break;
      const remainingBytes = MAX_ZENROWS_DEBUG_BYTES - capturedBytes;
      const capturedChunk = value.subarray(0, remainingBytes);
      bytes.set(capturedChunk, capturedBytes);
      capturedBytes += capturedChunk.byteLength;
      if (capturedBytes === MAX_ZENROWS_DEBUG_BYTES) {
        truncated = true;
        cancelBody();
        break;
      }
    }
  } catch (error) {
    truncated = true;
    readError = error instanceof Error ? error.message : "Preview read failed";
    cancelBody();
  } finally {
    clearTimeout(timer);
    signal.removeEventListener("abort", cancelBody);
    reader.releaseLock();
  }

  return {
    body: new TextDecoder().decode(bytes.subarray(0, capturedBytes)),
    capturedBytes,
    truncated,
    readError,
  };
}

export async function saveRejectedZenRowsResponse(
  response: Response,
  targetUrl: string,
  signal: AbortSignal,
): Promise<void> {
  if (process.env.NODE_ENV !== "development") return;

  try {
    const { body, ...previewMetadata } = await readResponsePreview(
      response,
      signal,
    );
    const fs = await import("node:fs/promises");
    const path = await import("node:path");
    const directory = path.resolve(process.cwd(), "tmp", "scrapes");
    const hostname = new URL(targetUrl).hostname.replace(
      /[^a-zA-Z0-9.-]/g,
      "_",
    );
    const basename = `${hostname}_last_zenrows_response`;
    const bodyFile = path.join(directory, `${basename}.txt`);
    const metadataFile = path.join(directory, `${basename}.json`);
    const metadata = {
      capturedAt: new Date().toISOString(),
      targetUrl,
      status: response.status,
      statusText: response.statusText,
      headers: {
        "content-type": response.headers.get("content-type"),
        "content-length": response.headers.get("content-length"),
        "zr-status": response.headers.get("zr-status"),
        "zr-url": response.headers.get("zr-url"),
        "zr-request-id": response.headers.get("zr-request-id"),
        "x-request-id": response.headers.get("x-request-id"),
      },
      ...previewMetadata,
      maxPreviewBytes: MAX_ZENROWS_DEBUG_BYTES,
      bodyFile,
    };

    await fs.mkdir(directory, { recursive: true });
    await fs.writeFile(bodyFile, body, "utf8");
    await fs.writeFile(metadataFile, JSON.stringify(metadata, null, 2), "utf8");
    console.log(
      `[ZenRows] Rejected response snapshot saved to: ${metadataFile} and ${bodyFile}`,
    );
  } catch (error) {
    console.warn("[ZenRows] Could not save rejected response snapshot:", error);
  }
}
