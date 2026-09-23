import { describe, it, expect } from "vitest";
import { render } from "@testing-library/react";
import { ResponsiveDateTime } from "@/components/ui/responsive-date-time";

describe("components/ui/responsive-date-time", () => {
  const testDate = new Date(2026, 8, 7, 12, 35);

  it("renders time element with ISO dateTime attribute and responsive mobile and desktop spans with time", () => {
    const { container } = render(<ResponsiveDateTime date={testDate} />);

    const timeElement = container.querySelector("time");
    expect(timeElement).toBeInTheDocument();
    expect(timeElement).toHaveAttribute("dateTime", testDate.toISOString());

    const mobileSpan = timeElement?.querySelector(".sm\\:hidden");
    const desktopSpan = timeElement?.querySelector(".hidden.sm\\:inline");

    expect(mobileSpan).toBeInTheDocument();
    expect(mobileSpan).toHaveTextContent("7 wrz 2026, 12:35");

    expect(desktopSpan).toBeInTheDocument();
    expect(desktopSpan).toHaveTextContent("7 września 2026, 12:35");
  });

  it("renders date-only without time when includeTime is false", () => {
    const { container } = render(
      <ResponsiveDateTime date={testDate} includeTime={false} />,
    );

    const timeElement = container.querySelector("time");
    expect(timeElement).toBeInTheDocument();

    const mobileSpan = timeElement?.querySelector(".sm\\:hidden");
    const desktopSpan = timeElement?.querySelector(".hidden.sm\\:inline");

    expect(mobileSpan).toHaveTextContent("7 wrz 2026");
    expect(desktopSpan).toHaveTextContent("7 września 2026");
  });
});
