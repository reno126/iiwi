import { beforeEach, describe, expect, it, vi } from "vitest";

const { lookup } = vi.hoisted(() => ({ lookup: vi.fn() }));
vi.mock("node:dns", () => ({ default: { promises: { lookup } } }));

import {
  SSRF_ERRORS,
  validateResolvedIpSafety,
  validateUrlSafety,
  validateUrlSafetyAsync,
} from "@/lib/scraper/ssrfProtection";

const blockedMappedAddresses = [
  "::ffff:127.0.0.1",
  "::ffff:7f00:1",
  "0:0:0:0:0:ffff:127.0.0.1",
  "0000:0000:0000:0000:0000:FFFF:7F00:0001",
  "::ffff:10.0.0.1",
  "::ffff:a00:1",
  "::ffff:172.16.0.1",
  "::ffff:ac10:1",
  "::ffff:192.168.1.1",
  "::ffff:c0a8:101",
  "::ffff:169.254.169.254",
  "::ffff:a9fe:a9fe",
  "::ffff:0.0.0.0",
  "::ffff:100.64.0.1",
  "::ffff:192.0.0.1",
  "::ffff:192.0.2.1",
  "::ffff:198.18.0.1",
  "::ffff:198.51.100.1",
  "::ffff:203.0.113.1",
  "::ffff:224.0.0.1",
  "::ffff:255.255.255.255",
];

beforeEach(() => lookup.mockReset());

describe("IPv4-mapped IPv6 safety", () => {
  it.each(blockedMappedAddresses)(
    "rejects a mapped private or reserved address: %s",
    (address) => {
      expect(validateResolvedIpSafety(address, 6)).toBe(false);
      expect(validateResolvedIpSafety(address)).toBe(false);
      expect(validateUrlSafety(`https://[${address}]/`)).toEqual({
        isValid: false,
        error: SSRF_ERRORS.privateOrReservedIPv6,
      });
    },
  );

  it.each(blockedMappedAddresses)(
    "rejects domains with a mapped private DNS answer: %s",
    async (address) => {
      lookup.mockResolvedValue([
        { address: "93.184.216.34", family: 4 },
        { address, family: 6 },
      ]);
      expect(await validateUrlSafetyAsync("https://shop.example/item")).toEqual(
        {
          isValid: false,
          error: SSRF_ERRORS.dnsRebindingPrivateIp,
        },
      );
    },
  );

  it.each([
    "::ffff:8.8.8.8",
    "::ffff:808:808",
    "0000:0000:0000:0000:0000:ffff:0808:0808",
    "::ffff:93.184.216.34",
    "2606:4700:4700::1111",
  ])(
    "continues accepting public IPv6 and mapped public IPv4: %s",
    async (address) => {
      expect(validateResolvedIpSafety(address, 6)).toBe(true);
      expect(validateResolvedIpSafety(address)).toBe(true);
      expect(validateUrlSafety(`https://[${address}]/`).isValid).toBe(true);
      lookup.mockResolvedValue([{ address, family: 6 }]);
      expect(
        (await validateUrlSafetyAsync("https://shop.example/item")).isValid,
      ).toBe(true);
    },
  );

  it.each([
    { address: "not-an-ip", family: 4 },
    { address: "999.1.1.1", family: 4 },
    { address: "::ffff:127.0.0.1", family: 4 },
    { address: "::ffff:8.8.8.8", family: 4 },
    { address: "8.8.8.8", family: 6 },
    { address: "8.8.8.8", family: 0 },
  ])(
    "fails closed for malformed or mismatched DNS records: $address / $family",
    ({ address, family }) => {
      expect(validateResolvedIpSafety(address, family)).toBe(false);
    },
  );
});
