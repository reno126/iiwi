import { createHash } from "node:crypto";
import { isIP } from "node:net";

export function hashAbuseKey(value: string): string {
  return createHash("sha256").update(value).digest("hex");
}

function normalizeClientAddress(address: string): string | null {
  const family = isIP(address);
  if (family === 4) return address;
  if (family !== 6 || address.includes("%")) return null;

  const hostname = new URL(`http://[${address}]/`).hostname.slice(1, -1);
  const [leading = "", trailing] = hostname.split("::");
  const leadingWords = leading ? leading.split(":") : [];
  const trailingWords = trailing ? trailing.split(":") : [];
  const words =
    trailing === undefined
      ? leadingWords
      : [
          ...leadingWords,
          ...Array<string>(8 - leadingWords.length - trailingWords.length).fill(
            "0",
          ),
          ...trailingWords,
        ];
  const octets = words.map((word) => Number.parseInt(word, 16));
  const highAddress = octets[6];
  const lowAddress = octets[7];

  if (
    octets.slice(0, 5).every((word) => word === 0) &&
    octets[5] === 65535 &&
    highAddress !== undefined &&
    lowAddress !== undefined
  ) {
    return [
      highAddress >> 8,
      highAddress & 255,
      lowAddress >> 8,
      lowAddress & 255,
    ].join(".");
  }

  return `${octets
    .slice(0, 4)
    .map((word) => word.toString(16))
    .join(":")}::/64`;
}

export function getClientIdentity(
  requestHeaders: Pick<Headers, "get">,
): string {
  const trustedHeader =
    process.env.ABUSE_TRUSTED_IP_HEADER?.trim() ||
    (process.env.VERCEL === "1" ? "x-vercel-forwarded-for" : undefined);
  const headerValue = trustedHeader
    ? requestHeaders.get(trustedHeader)?.trim()
    : undefined;
  const address = headerValue ? normalizeClientAddress(headerValue) : null;
  return address ? hashAbuseKey(address) : "unknown-client";
}
