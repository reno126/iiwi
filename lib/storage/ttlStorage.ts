export interface StorageItemWithTtl<T> {
  value: T;
  expiresAt: number;
}

export const DEFAULT_TTL_MS = 60 * 60 * 1000;

function isExpired<T>(item: StorageItemWithTtl<T>): boolean {
  return typeof item?.expiresAt !== "number" || Date.now() > item.expiresAt;
}

export function setItemWithTtl<T>(
  key: string,
  value: T,
  ttlMs: number = DEFAULT_TTL_MS,
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

    if (isExpired(item)) {
      window.localStorage.removeItem(key);
      return null;
    }

    return item.value;
  } catch (error) {
    console.warn(`[ttlStorage] Failed to read key "${key}":`, error);
    try {
      window.localStorage.removeItem(key);
    } catch {
      return null;
    }
    return null;
  }
}

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
