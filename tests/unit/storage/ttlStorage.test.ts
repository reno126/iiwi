import { describe, it, expect, beforeEach, vi } from "vitest";
import {
  setItemWithTtl,
  getItemWithTtl,
  removeItemWithTtl,
  DEFAULT_TTL_MS,
} from "@/lib/storage/ttlStorage";

describe("lib/storage/ttlStorage", () => {
  beforeEach(() => {
    window.localStorage.clear();
    vi.restoreAllMocks();
  });

  it("stores and retrieves a value within TTL", () => {
    const key = "test_key";
    const data = { name: "Sony Headphones", rating: 5 };

    const success = setItemWithTtl(key, data, 1000);
    expect(success).toBe(true);

    const retrieved = getItemWithTtl<typeof data>(key);
    expect(retrieved).toEqual(data);
  });

  it("returns null and cleans up expired values", () => {
    const key = "expired_key";
    const data = { foo: "bar" };

    const originalNow = Date.now;
    let mockedTime = 1000000;
    Date.now = vi.fn(() => mockedTime);

    setItemWithTtl(key, data, 5000);

    expect(getItemWithTtl(key)).toEqual(data);

    mockedTime = 1005001;
    expect(getItemWithTtl(key)).toBeNull();

    expect(window.localStorage.getItem(key)).toBeNull();

    Date.now = originalNow;
  });

  it("removes a key via removeItemWithTtl", () => {
    const key = "to_remove";
    setItemWithTtl(key, "some value");
    expect(getItemWithTtl(key)).toBe("some value");

    removeItemWithTtl(key);
    expect(getItemWithTtl(key)).toBeNull();
    expect(window.localStorage.getItem(key)).toBeNull();
  });

  it("handles corrupted JSON in localStorage gracefully without throwing", () => {
    const key = "corrupt_key";
    window.localStorage.setItem(key, "invalid-json{}}");

    const result = getItemWithTtl(key);
    expect(result).toBeNull();
    expect(window.localStorage.getItem(key)).toBeNull();
  });

  it("uses DEFAULT_TTL_MS (1 hour) when no ttlMs provided", () => {
    const key = "default_ttl";
    const originalNow = Date.now;
    const mockedTime = 1000000;
    Date.now = vi.fn(() => mockedTime);

    setItemWithTtl(key, "value");

    const raw = JSON.parse(window.localStorage.getItem(key)!);
    expect(raw.expiresAt).toBe(mockedTime + DEFAULT_TTL_MS);

    Date.now = originalNow;
  });
});
