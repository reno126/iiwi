import { describe, it, expect } from "vitest";
import { validateUrlSafety } from "@/lib/scraper/ssrfProtection";

describe("lib/scraper/ssrfProtection", () => {
  it("accepts valid public HTTP and HTTPS URLs", () => {
    const validUrls = [
      "https://www.action.com/pl-pl/p/3222380/ladowarka-scienna-usb-c-sologic/",
      "https://allegro.pl/oferta/sluchawki-bezprzewodowe-123456",
      "https://mediaexpert.pl/telewizory-i-rtv/telewizory/telewizor-samsung",
      "http://example.com/product/1",
      "https://cdn.shop.co.uk/images/item.png",
    ];

    for (const url of validUrls) {
      const result = validateUrlSafety(url);
      expect(result.isValid).toBe(true);
      expect(result.error).toBeUndefined();
    }
  });

  it("blocks localhost and loopback addresses", () => {
    const blockedUrls = [
      "http://localhost",
      "http://localhost:3000/api",
      "http://sub.localhost:8080",
      "http://127.0.0.1",
      "http://127.0.0.1:5000",
      "http://127.12.34.56",
      "http://0.0.0.0",
      "http://[::1]",
      "http://[::1]:3000",
    ];

    for (const url of blockedUrls) {
      const result = validateUrlSafety(url);
      expect(result.isValid).toBe(false);
      expect(result.error).toBeDefined();
    }
  });

  it("blocks cloud metadata services", () => {
    const metadataUrls = [
      "http://169.254.169.254/latest/meta-data/",
      "http://169.254.169.254:80",
      "http://metadata.google.internal/computeMetadata/v1/",
      "http://metadata",
      "http://instance-data",
    ];

    for (const url of metadataUrls) {
      const result = validateUrlSafety(url);
      expect(result.isValid).toBe(false);
      expect(result.error).toBeDefined();
    }
  });

  it("blocks private IPv4 RFC 1918 addresses", () => {
    const privateIps = [
      "http://10.0.0.1",
      "http://10.254.0.5:8080",
      "http://172.16.0.1",
      "http://172.25.10.20",
      "http://172.31.255.255",
      "http://192.168.0.1",
      "http://192.168.1.100:8000",
    ];

    for (const url of privateIps) {
      const result = validateUrlSafety(url);
      expect(result.isValid).toBe(false);
      expect(result.error).toBeDefined();
    }
  });

  it("blocks private / internal domain names", () => {
    const internalUrls = [
      "http://intranet.local",
      "http://backend.internal",
      "http://router.lan",
      "http://service.corp",
      "http://internal-server",
    ];

    for (const url of internalUrls) {
      const result = validateUrlSafety(url);
      expect(result.isValid).toBe(false);
      expect(result.error).toBeDefined();
    }
  });

  it("blocks non-HTTP protocols", () => {
    const invalidProtocols = [
      "ftp://ftp.example.com/file.jpg",
      "file:///etc/passwd",
      "javascript:alert(1)",
      "data:text/html,<h1>Hello</h1>",
      "gopher://gopher.floodgap.com",
    ];

    for (const url of invalidProtocols) {
      const result = validateUrlSafety(url);
      expect(result.isValid).toBe(false);
      expect(result.error).toBeDefined();
    }
  });

  it("blocks invalid URL strings", () => {
    const invalidUrls = ["not-a-url", "://missing-scheme", "http://", ""];

    for (const url of invalidUrls) {
      const result = validateUrlSafety(url);
      expect(result.isValid).toBe(false);
      expect(result.error).toBeDefined();
    }
  });
});
