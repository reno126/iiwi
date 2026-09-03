import { describe, it, expect } from "vitest";
import { cn } from "@/lib/shadcn/utils";

describe("lib/shadcn/utils cn()", () => {
  it("merges basic class names", () => {
    expect(cn("px-2", "py-1")).toBe("px-2 py-1");
  });

  it("filters out falsy conditions correctly", () => {
    expect(cn("btn", false && "hidden", null, undefined, "", "btn-primary")).toBe(
      "btn btn-primary",
    );
  });

  it("resolves conflicting Tailwind classes properly with tailwind-merge", () => {
    // Later class overrides earlier conflicting class
    expect(cn("px-4 py-2", "px-6")).toBe("py-2 px-6");
    expect(cn("bg-red-500", "bg-blue-500")).toBe("bg-blue-500");
    expect(cn("text-sm", "text-lg")).toBe("text-lg");
  });

  it("handles conditional object syntax", () => {
    expect(
      cn("base-class", {
        "is-active": true,
        "is-disabled": false,
      }),
    ).toBe("base-class is-active");
  });

  it("returns empty string when called with no arguments", () => {
    expect(cn()).toBe("");
  });
});
