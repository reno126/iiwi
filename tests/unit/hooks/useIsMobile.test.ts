import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useIsMobile } from "@/hooks/useIsMobile";

describe("hooks/useIsMobile", () => {
  let listeners: ((event: MediaQueryListEvent) => void)[] = [];
  let matchesValue = false;
  let currentQuery = "";

  beforeEach(() => {
    listeners = [];
    matchesValue = false;
    currentQuery = "";

    window.matchMedia = vi.fn().mockImplementation((query: string) => {
      currentQuery = query;
      return {
        matches: matchesValue,
        media: query,
        onchange: null,
        addListener: vi.fn(),
        removeListener: vi.fn(),
        addEventListener: vi.fn(
          (event: string, callback: (event: MediaQueryListEvent) => void) => {
            if (event === "change") {
              listeners.push(callback);
            }
          },
        ),
        removeEventListener: vi.fn(
          (event: string, callback: (event: MediaQueryListEvent) => void) => {
            if (event === "change") {
              listeners = listeners.filter((l) => l !== callback);
            }
          },
        ),
        dispatchEvent: vi.fn(),
      };
    });
  });

  it("queries (max-width: 767px) by default and returns true when viewport matches mobile", () => {
    matchesValue = true;

    const { result } = renderHook(() => useIsMobile());

    expect(window.matchMedia).toHaveBeenCalledWith("(max-width: 767px)");
    expect(result.current).toBe(true);
  });

  it("returns false when viewport does not match mobile breakpoint", () => {
    matchesValue = false;

    const { result } = renderHook(() => useIsMobile());

    expect(window.matchMedia).toHaveBeenCalledWith("(max-width: 767px)");
    expect(result.current).toBe(false);
  });

  it("supports custom breakpoint parameter", () => {
    matchesValue = true;

    const { result } = renderHook(() => useIsMobile(1024));

    expect(window.matchMedia).toHaveBeenCalledWith("(max-width: 1023px)");
    expect(result.current).toBe(true);
  });

  it("reacts dynamically to change events and updates returned state", () => {
    matchesValue = false;

    const { result } = renderHook(() => useIsMobile());
    expect(result.current).toBe(false);

    act(() => {
      matchesValue = true;
      for (const listener of listeners) {
        listener({ matches: true, media: currentQuery } as MediaQueryListEvent);
      }
    });

    expect(result.current).toBe(true);

    act(() => {
      matchesValue = false;
      for (const listener of listeners) {
        listener({
          matches: false,
          media: currentQuery,
        } as MediaQueryListEvent);
      }
    });

    expect(result.current).toBe(false);
  });

  it("removes event listener when hook unmounts", () => {
    const { unmount } = renderHook(() => useIsMobile());
    expect(listeners).toHaveLength(1);

    unmount();
    expect(listeners).toHaveLength(0);
  });
});
