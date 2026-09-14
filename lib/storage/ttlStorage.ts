export interface StorageItemWithTtl<T> {
  value: T;
  expiresAt: number;
}

/** Default TTL: 1 hour in milliseconds */
export const DEFAULT_TTL_MS = 60 * 60 * 1000;

/**
 * Stores a value in localStorage with an expiration timestamp.
 *
 * @param key - The localStorage key
 * @param value - The value to serialize and store
 * @param ttlMs - Time to live in milliseconds (defaults to 1 hour)
 * @returns boolean indicating whether storage succeeded
 */
export function setItemWithTtl<T>(
  key: string,
  value: T,
  ttlMs: number = DEFAULT_TTL_MS
): boolean {
  if (typeof window === "undefined" || !window.localStorage) {
    return false;
  }

  try {
    const item: StorageItemWithTtl<T> = {
      value,
      expiresAt: Date.now() + ttlMs,
    };
    window.localStorage.setItem(key, JSON.stringify(item));
    return true;
  } catch (error) {
    console.warn(`[ttlStorage] Failed to set key "${key}":`, error);
    return false;
  }
}

/**
 * Retrieves a value from localStorage, verifying its TTL.
 * If expired or invalid, removes the item and returns null.
 *
 * @param key - The localStorage key
 * @returns The stored value or null if expired, missing, or error
 */
export function getItemWithTtl<T>(key: string): T | null {
  if (typeof window === "undefined" || !window.localStorage) {
    return null;
  }

  try {
    const raw = window.localStorage.getItem(key);
    if (!raw) {
      return null;
    }

    const item: StorageItemWithTtl<T> = JSON.parse(raw);

    if (typeof item?.expiresAt !== "number" || Date.now() > item.expiresAt) {
      window.localStorage.removeItem(key);
      return null;
    }

    return item.value;
  } catch (error) {
    console.warn(`[ttlStorage] Failed to read key "${key}":`, error);
    try {
      window.localStorage.removeItem(key);
    } catch {
      // ignore secondary errors during cleanup
    }
    return null;
  }
}

/**
 * Removes a key from localStorage.
 *
 * @param key - The localStorage key to remove
 */
export function removeItemWithTtl(key: string): void {
  if (typeof window === "undefined" || !window.localStorage) {
    return;
  }

  try {
    window.localStorage.removeItem(key);
  } catch (error) {
    console.warn(`[ttlStorage] Failed to remove key "${key}":`, error);
  }
}
