import * as React from "react";

const MOBILE_BREAKPOINT = 768;

export function useIsMobile(breakpoint = MOBILE_BREAKPOINT): boolean {
  const subscribe = React.useCallback(
    (callback: () => void) => {
      const mql = window.matchMedia(`(max-width: ${breakpoint - 1}px)`);
      mql.addEventListener("change", callback);
      return () => {
        mql.removeEventListener("change", callback);
      };
    },
    [breakpoint]
  );

  const getSnapshot = React.useCallback(() => {
    return window.matchMedia(`(max-width: ${breakpoint - 1}px)`).matches;
  }, [breakpoint]);

  const getServerSnapshot = React.useCallback(() => {
    return false;
  }, []);

  return React.useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}
