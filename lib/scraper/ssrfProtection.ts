export interface UrlSafetyResult {
  isValid: boolean;
  error?: string;
}

function isCurrentNetworkIPv4(o1: number): boolean {
  return o1 === 0;
}

function isLoopbackIPv4(o1: number): boolean {
  return o1 === 127;
}

function isLinkLocalOrCloudMetadataIPv4(o1: number, o2: number): boolean {
  return o1 === 169 && o2 === 254;
}

function isPrivateNetworkRFC1918(o1: number, o2: number): boolean {
  const isClassA = o1 === 10;
  const isClassB = o1 === 172 && o2 >= 16 && o2 <= 31;
  const isClassC = o1 === 192 && o2 === 168;
  return isClassA || isClassB || isClassC;
}

function isCarrierGradeNatIPv4(o1: number, o2: number): boolean {
  return o1 === 100 && o2 >= 64 && o2 <= 127;
}

function isReservedOrBenchmarkIPv4(o1: number, o2: number, o3: number): boolean {
  const isIetfProtocolAssignment = o1 === 192 && o2 === 0 && o3 === 0;
  const isTestNet1 = o1 === 192 && o2 === 0 && o3 === 2;
  const isBenchmark = o1 === 198 && (o2 === 18 || o2 === 19);
  const isTestNet2 = o1 === 198 && o2 === 51 && o3 === 100;
  const isTestNet3 = o1 === 203 && o2 === 0 && o3 === 113;
  return (
    isIetfProtocolAssignment ||
    isTestNet1 ||
    isBenchmark ||
    isTestNet2 ||
    isTestNet3
  );
}

function isMulticastOrBroadcastIPv4(o1: number): boolean {
  return o1 >= 224;
}

function isPrivateOrReservedIPv4(hostname: string): boolean {
  const ipv4Pattern = /^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/;
  const match = hostname.match(ipv4Pattern);

  if (!match) return false;

  const [, oct1, oct2, oct3, oct4] = match;
  const o1 = Number(oct1);
  const o2 = Number(oct2);
  const o3 = Number(oct3);
  const o4 = Number(oct4);

  const hasInvalidOctet = [o1, o2, o3, o4].some((o) => o < 0 || o > 255);
  if (hasInvalidOctet) {
    return true;
  }

  return (
    isCurrentNetworkIPv4(o1) ||
    isPrivateNetworkRFC1918(o1, o2) ||
    isCarrierGradeNatIPv4(o1, o2) ||
    isLoopbackIPv4(o1) ||
    isLinkLocalOrCloudMetadataIPv4(o1, o2) ||
    isReservedOrBenchmarkIPv4(o1, o2, o3) ||
    isMulticastOrBroadcastIPv4(o1)
  );
}

function isLoopbackIPv6(host: string): boolean {
  return host === "::1" || host === "0000:0000:0000:0000:0000:0000:0000:0001";
}

function isUnspecifiedIPv6(host: string): boolean {
  return host === "::" || host === "0000:0000:0000:0000:0000:0000:0000:0000";
}

function isUniqueLocalAddressIPv6(host: string): boolean {
  return host.startsWith("fc") || host.startsWith("fd");
}

function isLinkLocalIPv6(host: string): boolean {
  return (
    host.startsWith("fe8") ||
    host.startsWith("fe9") ||
    host.startsWith("fea") ||
    host.startsWith("feb")
  );
}

function isIPv4MappedIPv6(host: string): boolean {
  if (host.startsWith("::ffff:") || host.startsWith("0:0:0:0:0:ffff:")) {
    const ipv4Part = host.split(":").pop();
    return Boolean(ipv4Part && isPrivateOrReservedIPv4(ipv4Part));
  }
  return false;
}

function isPrivateOrReservedIPv6(cleanHost: string): boolean {
  const host = cleanHost.toLowerCase();

  return (
    isLoopbackIPv6(host) ||
    isUnspecifiedIPv6(host) ||
    isUniqueLocalAddressIPv6(host) ||
    isLinkLocalIPv6(host) ||
    isIPv4MappedIPv6(host)
  );
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
  invalidProtocol: "Niedozwolony protokół. Dozwolone są wyłącznie http:// oraz https://",
  missingHostname: "Brak nazwy hosta w podanym adresie URL.",
  internalOrMetadata: "Podany adres wskazuje na sieć wewnętrzną, lokalną lub metadane chmurowe.",
  privateOrReservedIPv4: "Podany adres URL wskazuje na prywatny lub zastrzeżony adres IP.",
  privateOrReservedIPv6: "Podany adres URL wskazuje na prywatny lub zastrzeżony adres IPv6.",
  missingTopLevelDomain: "Podana nazwa domeny jest nieprawidłowa (wymagana domena najwyższego poziomu).",
  invalidHostnameFormat: "Nieprawidłowy format nazwy hosta.",
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

  const isHttpOrHttps = parsed.protocol === "http:" || parsed.protocol === "https:";
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

  const lacksDomainSeparator = !cleanHost.includes(".") && !cleanHost.includes(":");
  if (lacksDomainSeparator) {
    return {
      isValid: false,
      error: SSRF_ERRORS.missingTopLevelDomain,
    };
  }

  const hasLeadingOrTrailingDot = cleanHost.startsWith(".") || cleanHost.endsWith(".");
  if (hasLeadingOrTrailingDot) {
    return {
      isValid: false,
      error: SSRF_ERRORS.invalidHostnameFormat,
    };
  }

  return { isValid: true };
}
