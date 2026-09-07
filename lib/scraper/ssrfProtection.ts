/**
 * Ochrona przed atakami Server-Side Request Forgery (SSRF).
 * Weryfikuje, czy dany adres URL nie prowadzi do zasobów lokalnych, prywatnych sieci lub serwisów chmurowych metadanych.
 */

export interface UrlSafetyResult {
  isValid: boolean;
  error?: string;
}

function isPrivateOrReservedIPv4(hostname: string): boolean {
  // Sprawdzenie standardowej notacji kropkowej IPv4 (np. 192.168.1.1)
  const ipv4Pattern = /^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/;
  const match = hostname.match(ipv4Pattern);

  if (!match) return false;

  const [, oct1, oct2, oct3, oct4] = match;
  const o1 = Number(oct1);
  const o2 = Number(oct2);
  const o3 = Number(oct3);
  const o4 = Number(oct4);

  if ([o1, o2, o3, o4].some((o) => o < 0 || o > 255)) {
    return true; // nieprawidłowy/zniekształcony IP traktujemy jako niebezpieczny
  }

  // 0.0.0.0/8 (Bieżąca sieć)
  if (o1 === 0) return true;

  // 10.0.0.0/8 (Sieć prywatna RFC 1918)
  if (o1 === 10) return true;

  // 100.64.0.0/10 (Shared Address Space / CGNAT RFC 6598)
  if (o1 === 100 && o2 >= 64 && o2 <= 127) return true;

  // 127.0.0.0/8 (Pętla zwrotna / Loopback RFC 1122)
  if (o1 === 127) return true;

  // 169.254.0.0/16 (Link-local, w tym AWS/GCP/Azure metadata 169.254.169.254 RFC 3927)
  if (o1 === 169 && o2 === 254) return true;

  // 172.16.0.0/12 (Sieć prywatna RFC 1918: 172.16.0.0 - 172.31.255.255)
  if (o1 === 172 && o2 >= 16 && o2 <= 31) return true;

  // 192.0.0.0/24 (IETF Protocol Assignments)
  if (o1 === 192 && o2 === 0 && o3 === 0) return true;

  // 192.0.2.0/24 (TEST-NET-1)
  if (o1 === 192 && o2 === 0 && o3 === 2) return true;

  // 192.168.0.0/16 (Sieć prywatna RFC 1918)
  if (o1 === 192 && o2 === 168) return true;

  // 198.18.0.0/15 (Benchmarking)
  if (o1 === 198 && (o2 === 18 || o2 === 19)) return true;

  // 198.51.100.0/24 (TEST-NET-2)
  if (o1 === 198 && o2 === 51 && o3 === 100) return true;

  // 203.0.113.0/24 (TEST-NET-3)
  if (o1 === 203 && o2 === 0 && o3 === 113) return true;

  // 224.0.0.0/4 (Multicast) & 240.0.0.0/4 (Reserved) & 255.255.255.255 (Broadcast)
  if (o1 >= 224) return true;

  return false;
}

function isPrivateOrReservedIPv6(cleanHost: string): boolean {
  const host = cleanHost.toLowerCase();

  // Loopback ::1
  if (host === "::1" || host === "0000:0000:0000:0000:0000:0000:0000:0001") return true;

  // Unspecified ::
  if (host === "::" || host === "0000:0000:0000:0000:0000:0000:0000:0000") return true;

  // Unique Local Address (ULA) fc00::/7 (fc00:: - fdff::)
  if (host.startsWith("fc") || host.startsWith("fd")) return true;

  // Link-Local fe80::/10
  if (
    host.startsWith("fe8") ||
    host.startsWith("fe9") ||
    host.startsWith("fea") ||
    host.startsWith("feb")
  ) {
    return true;
  }

  // IPv4-mapped IPv6 (np. ::ffff:127.0.0.1 lub ::ffff:7f00:1)
  if (host.startsWith("::ffff:") || host.startsWith("0:0:0:0:0:ffff:")) {
    const ipv4Part = host.split(":").pop();
    if (ipv4Part && isPrivateOrReservedIPv4(ipv4Part)) {
      return true;
    }
  }

  return false;
}

const FORBIDDEN_HOSTS = new Set([
  "localhost",
  "metadata.google.internal",
  "metadata",
  "instance-data",
]);

export function validateUrlSafety(inputUrl: string): UrlSafetyResult {
  let parsed: URL;
  try {
    parsed = new URL(inputUrl);
  } catch {
    return {
      isValid: false,
      error: "Nieprawidłowy format adresu URL.",
    };
  }

  // Dozwolone wyłącznie protokoły http oraz https
  if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
    return {
      isValid: false,
      error: "Niedozwolony protokół. Dozwolone są wyłącznie http:// oraz https://",
    };
  }

  const rawHost = parsed.hostname.toLowerCase().trim();

  if (!rawHost) {
    return {
      isValid: false,
      error: "Brak nazwy hosta w podanym adresie URL.",
    };
  }

  // Usunięcie nawiasów kwadratowych dla IPv6 (np. [::1] -> ::1)
  const cleanHost =
    rawHost.startsWith("[") && rawHost.endsWith("]")
      ? rawHost.slice(1, -1)
      : rawHost;

  // Sprawdzenie znanych nazw lokalnych i metadanych
  if (
    FORBIDDEN_HOSTS.has(cleanHost) ||
    cleanHost.endsWith(".localhost") ||
    cleanHost.endsWith(".internal") ||
    cleanHost.endsWith(".local") ||
    cleanHost.endsWith(".lan") ||
    cleanHost.endsWith(".corp")
  ) {
    return {
      isValid: false,
      error: "Podany adres wskazuje na sieć wewnętrzną, lokalną lub metadane chmurowe.",
    };
  }

  // Sprawdzenie adresów IPv4
  if (isPrivateOrReservedIPv4(cleanHost)) {
    return {
      isValid: false,
      error: "Podany adres URL wskazuje na prywatny lub zastrzeżony adres IP.",
    };
  }

  // Sprawdzenie adresów IPv6
  if (cleanHost.includes(":") && isPrivateOrReservedIPv6(cleanHost)) {
    return {
      isValid: false,
      error: "Podany adres URL wskazuje na prywatny lub zastrzeżony adres IPv6.",
    };
  }

  // Domena publiczna musi zawierać co najmniej jedną kropkę (np. sklep.pl, amazon.com)
  // i nie może zaczynać się ani kończyć kropką
  if (!cleanHost.includes(".") && !cleanHost.includes(":")) {
    return {
      isValid: false,
      error: "Podana nazwa domeny jest nieprawidłowa (wymagana domena najwyższego poziomu).",
    };
  }

  if (cleanHost.startsWith(".") || cleanHost.endsWith(".")) {
    return {
      isValid: false,
      error: "Nieprawidłowy format nazwy hosta.",
    };
  }

  return { isValid: true };
}
