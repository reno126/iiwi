import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { getClientIdentity, hashAbuseKey } from "@/lib/abuse/clientIdentity";

describe("trusted client identity", () => {
  beforeEach(() => {
    vi.stubEnv("VERCEL", "");
    vi.stubEnv("ABUSE_TRUSTED_IP_HEADER", "");
  });
  afterEach(() => vi.unstubAllEnvs());

  it("ignores client supplied forwarding headers without a trusted proxy", () => {
    const headers = new Headers({
      "x-forwarded-for": "8.8.8.8",
      "x-real-ip": "1.1.1.1",
    });
    expect(getClientIdentity(headers)).toBe(getClientIdentity(new Headers()));
  });

  it("uses the explicitly configured single address header", () => {
    vi.stubEnv("ABUSE_TRUSTED_IP_HEADER", "x-client-ip");
    expect(getClientIdentity(new Headers({ "x-client-ip": "8.8.8.8" }))).toBe(
      hashAbuseKey("8.8.8.8"),
    );
  });

  it.each(["8.8.8.8, 1.1.1.1", "garbage", "", "fe80::1%eth0"])(
    "shares the fallback bucket for invalid addresses: %s",
    (address) => {
      vi.stubEnv("ABUSE_TRUSTED_IP_HEADER", "x-client-ip");
      expect(getClientIdentity(new Headers({ "x-client-ip": address }))).toBe(
        getClientIdentity(new Headers()),
      );
    },
  );

  it("uses the platform supplied address only on Vercel", () => {
    vi.stubEnv("VERCEL", "1");
    expect(
      getClientIdentity(
        new Headers({
          "x-vercel-forwarded-for": "8.8.8.8",
          "x-forwarded-for": "1.1.1.1",
        }),
      ),
    ).toBe(hashAbuseKey("8.8.8.8"));
  });

  it.each(["::ffff:8.8.8.8", "0:0:0:0:0:ffff:808:808"])(
    "unifies mapped and dotted IPv4: %s",
    (address) => {
      vi.stubEnv("ABUSE_TRUSTED_IP_HEADER", "x-client-ip");
      expect(getClientIdentity(new Headers({ "x-client-ip": address }))).toBe(
        hashAbuseKey("8.8.8.8"),
      );
    },
  );

  it("groups equivalent IPv6 forms and rotating addresses within a /64", () => {
    vi.stubEnv("ABUSE_TRUSTED_IP_HEADER", "x-client-ip");
    const firstIdentity = getClientIdentity(
      new Headers({ "x-client-ip": "2001:db8:1234:5678::1" }),
    );
    expect(
      getClientIdentity(
        new Headers({ "x-client-ip": "2001:0DB8:1234:5678:0:0:0:ffff" }),
      ),
    ).toBe(firstIdentity);
    expect(
      getClientIdentity(
        new Headers({ "x-client-ip": "2001:db8:1234:5679::1" }),
      ),
    ).not.toBe(firstIdentity);
  });
});
