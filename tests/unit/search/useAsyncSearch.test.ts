import { act, renderHook } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { useAsyncSearch } from "@/components/search/useAsyncSearch";

describe("useAsyncSearch request lifecycle", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.clearAllTimers();
    vi.useRealTimers();
  });

  describe.each(["clearSearch", "resetResults"] as const)(
    "%s",
    (resetAction) => {
      it.each(["success", "failure"] as const)(
        "ignores a late %s after resetting",
        async (outcome) => {
          const pendingSearch = Promise.withResolvers<string[]>();
          const searchAction = vi.fn().mockReturnValue(pendingSearch.promise);
          const { result } = renderHook(() =>
            useAsyncSearch({
              searchAction,
              defaultValue: "Sony",
              debounceMs: 200,
            }),
          );

          await act(async () => {
            await vi.advanceTimersByTimeAsync(200);
          });
          expect(searchAction).toHaveBeenCalledWith("Sony");

          act(() => {
            result.current[resetAction]();
          });
          await act(async () => {
            if (outcome === "success") {
              pendingSearch.resolve(["Old result"]);
            } else {
              pendingSearch.reject(new Error("Old search failed"));
            }
          });
          if (resetAction === "clearSearch") {
            act(() => {
              result.current.setQueryValue("Sony");
            });
          }

          expect(result.current.results).toEqual([]);
          expect(result.current.hasSearched).toBe(false);
          expect(result.current.lastSearchedQuery).toBe("");
          expect(result.current.error).toBeNull();
        },
      );

      it("cancels a search that is still waiting for the debounce", async () => {
        const searchAction = vi.fn().mockResolvedValue(["Old result"]);
        const { result } = renderHook(() =>
          useAsyncSearch({
            searchAction,
            defaultValue: "Sony",
            debounceMs: 200,
          }),
        );

        act(() => {
          result.current[resetAction]();
        });
        await act(async () => {
          await vi.advanceTimersByTimeAsync(200);
        });

        expect(searchAction).not.toHaveBeenCalled();
        expect(result.current.results).toEqual([]);
        expect(result.current.hasSearched).toBe(false);
      });
    },
  );

  it("ignores a pending response after a controlled query is cleared", async () => {
    const pendingSearch = Promise.withResolvers<string[]>();
    const searchAction = vi.fn().mockReturnValue(pendingSearch.promise);
    const { result, rerender } = renderHook(
      ({ value }) =>
        useAsyncSearch({
          searchAction,
          value,
          debounceMs: 200,
        }),
      { initialProps: { value: "Sony" } },
    );

    await act(async () => {
      await vi.advanceTimersByTimeAsync(200);
    });
    rerender({ value: "" });
    await act(async () => {
      pendingSearch.resolve(["Old result"]);
    });
    rerender({ value: "Sony" });

    expect(result.current.results).toEqual([]);
    expect(result.current.hasSearched).toBe(false);
    expect(result.current.lastSearchedQuery).toBe("");
  });

  it("keeps the latest results when requests resolve out of order", async () => {
    const earlierSearch = Promise.withResolvers<string[]>();
    const latestSearch = Promise.withResolvers<string[]>();
    const searchAction = vi
      .fn()
      .mockReturnValueOnce(earlierSearch.promise)
      .mockReturnValueOnce(latestSearch.promise);
    const { result } = renderHook(() =>
      useAsyncSearch({
        searchAction,
        defaultValue: "Sony",
        debounceMs: 200,
      }),
    );

    await act(async () => {
      await vi.advanceTimersByTimeAsync(200);
    });
    act(() => {
      result.current.setQueryValue("Keychron");
    });
    await act(async () => {
      await vi.advanceTimersByTimeAsync(200);
      latestSearch.resolve(["Latest result"]);
    });
    await act(async () => {
      earlierSearch.resolve(["Old result"]);
    });

    expect(result.current.results).toEqual(["Latest result"]);
    expect(result.current.lastSearchedQuery).toBe("Keychron");
    expect(result.current.error).toBeNull();
  });
});
