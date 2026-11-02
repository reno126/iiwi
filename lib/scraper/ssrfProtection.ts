import dns from "node:dns";
import { BlockList, isIP } from "node:net";

export interface UrlSafetyResult {
  isValid: boolean;
  error?: string;
}

function createBlockedAddressRanges(): BlockList {
  const blockedRanges = new BlockList();
  const ipv4Subnets: Array<[string, number]> = [
    ["0.0.0.0", 8],
    ["10.0.0.0", 8],
    ["100.64.0.0", 10],
    ["127.0.0.0", 8],
    ["169.254.0.0", 16],
    ["172.16.0.0", 12],
    ["192.0.0.0", 24],
    ["192.0.2.0", 24],
    ["192.168.0.0", 16],
    ["198.18.0.0", 15],
    ["198.51.100.0", 24],
    ["203.0.113.0", 24],
    ["224.0.0.0", 3],
  ];

  for (const [networkAddress, prefixLength] of ipv4Subnets) {
    blockedRanges.addSubnet(networkAddress, prefixLength, "ipv4");
  }

  blockedRanges.addAddress("::", "ipv6");
  blockedRanges.addAddress("::1", "ipv6");
  blockedRanges.addSubnet("fc00::", 7, "ipv6");
  blockedRanges.addSubnet("fe80::", 10, "ipv6");
  return blockedRanges;
}

const blockedAddressRanges = createBlockedAddressRanges();

function isPrivateOrReservedIPv4(address: string): boolean {
  return isIP(address) === 4 && blockedAddressRanges.check(address, "ipv4");
}

function isPrivateOrReservedIPv6(address: string): boolean {
  return isIP(address) === 6 && blockedAddressRanges.check(address, "ipv6");
}

const FORBIDDEN_HOSTS = new Set([
  "localhost",
  "metadata.google.internal",
  "metadata",
  "instance-data",
]);

function isForbiddenDomainOrLocalSuffix(host: string): boolean {
  if (FORBIDDEN_HOSTS.has(host)) {
    return true;
  }

  const forbiddenSuffixes = [
    ".localhost",
    ".internal",
    ".local",
    ".lan",
    ".corp",
  ];

  return forbiddenSuffixes.some((suffix) => host.endsWith(suffix));
}

function stripIpv6Brackets(hostname: string): string {
  if (hostname.startsWith("[") && hostname.endsWith("]")) {
    return hostname.slice(1, -1);
  }
  return hostname;
}

export const SSRF_ERRORS = {
  invalidUrl: "Nieprawidłowy format adresu URL.",
  invalidProtocol:
    "Niedozwolony protokół. Dozwolone są wyłącznie http:// oraz https://",
  missingHostname: "Brak nazwy hosta w podanym adresie URL.",
  internalOrMetadata:
    "Podany adres wskazuje na sieć wewnętrzną, lokalną lub metadane chmurowe.",
  privateOrReservedIPv4:
    "Podany adres URL wskazuje na prywatny lub zastrzeżony adres IP.",
  privateOrReservedIPv6:
    "Podany adres URL wskazuje na prywatny lub zastrzeżony adres IPv6.",
  missingTopLevelDomain:
    "Podana nazwa domeny jest nieprawidłowa (wymagana domena najwyższego poziomu).",
  invalidHostnameFormat: "Nieprawidłowy format nazwy hosta.",
  dnsRebindingPrivateIp:
    "Rozpoznany adres IP domeny wskazuje na prywatną lub zastrzeżoną sieć.",
  dnsLookupFailed: "Nie udało się rozpoznać adresu sieciowego podanej domeny.",
} as const;

export function validateUrlSafety(inputUrl: string): UrlSafetyResult {
  let parsed: URL;
  try {
    parsed = new URL(inputUrl);
  } catch {
    return {
      isValid: false,
      error: SSRF_ERRORS.invalidUrl,
    };
  }

  const isHttpOrHttps =
    parsed.protocol === "http:" || parsed.protocol === "https:";
  if (!isHttpOrHttps) {
    return {
      isValid: false,
      error: SSRF_ERRORS.invalidProtocol,
    };
  }

  const rawHost = parsed.hostname.toLowerCase().trim();
  if (!rawHost) {
    return {
      isValid: false,
      error: SSRF_ERRORS.missingHostname,
    };
  }

  const cleanHost = stripIpv6Brackets(rawHost);

  if (isForbiddenDomainOrLocalSuffix(cleanHost)) {
    return {
      isValid: false,
      error: SSRF_ERRORS.internalOrMetadata,
    };
  }

  if (isPrivateOrReservedIPv4(cleanHost)) {
    return {
      isValid: false,
      error: SSRF_ERRORS.privateOrReservedIPv4,
    };
  }

  if (cleanHost.includes(":") && isPrivateOrReservedIPv6(cleanHost)) {
    return {
      isValid: false,
      error: SSRF_ERRORS.privateOrReservedIPv6,
    };
  }

  const lacksDomainSeparator =
    !cleanHost.includes(".") && !cleanHost.includes(":");
  if (lacksDomainSeparator) {
    return {
      isValid: false,
      error: SSRF_ERRORS.missingTopLevelDomain,
    };
  }

  const hasLeadingOrTrailingDot =
    cleanHost.startsWith(".") || cleanHost.endsWith(".");
  if (hasLeadingOrTrailingDot) {
    return {
      isValid: false,
      error: SSRF_ERRORS.invalidHostnameFormat,
    };
  }

  return { isValid: true };
}

export function validateResolvedIpSafety(
  address: string,
  family: number = isIP(address),
): boolean {
  if (isIP(address) !== family) {
    return false;
  }
  if (family === 4) {
    return !isPrivateOrReservedIPv4(address);
  }
  if (family === 6) {
    return !isPrivateOrReservedIPv6(address);
  }
  return false;
}

export async function validateDnsResolutionSafety(
  hostname: string,
): Promise<UrlSafetyResult> {
  const cleanHost = stripIpv6Brackets(hostname.toLowerCase().trim());
  if (
    isPrivateOrReservedIPv4(cleanHost) ||
    (cleanHost.includes(":") && isPrivateOrReservedIPv6(cleanHost))
  ) {
    return {
      isValid: false,
      error: cleanHost.includes(":")
        ? SSRF_ERRORS.privateOrReservedIPv6
        : SSRF_ERRORS.privateOrReservedIPv4,
    };
  }

  try {
    const resolvedAddresses = await dns.promises.lookup(cleanHost, {
      all: true,
    });
    for (const record of resolvedAddresses) {
      const isSafe = validateResolvedIpSafety(record.address, record.family);
      if (!isSafe) {
        return {
          isValid: false,
          error: SSRF_ERRORS.dnsRebindingPrivateIp,
        };
      }
    }
    return { isValid: true };
  } catch {
    return {
      isValid: false,
      error: SSRF_ERRORS.dnsLookupFailed,
    };
  }
}

export async function validateUrlSafetyAsync(
  inputUrl: string,
): Promise<UrlSafetyResult> {
  const syncValidation = validateUrlSafety(inputUrl);
  if (!syncValidation.isValid) {
    return syncValidation;
  }

  try {
    const parsedUrl = new URL(inputUrl);
    return await validateDnsResolutionSafety(parsedUrl.hostname);
  } catch {
    return {
      isValid: false,
      error: SSRF_ERRORS.invalidUrl,
    };
  }
}
