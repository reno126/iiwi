import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { ComboboxResponsive } from "@/components/ui/combobox-responsive";
import { SHOP_SELECTOR_MESSAGES } from "@/app/opinie/dodaj/_components/shopSelectorMessages";
import * as useMobileHook from "@/hooks/useIsMobile";

interface TestItem {
  id: string;
  name: string;
  logo?: string;
}

const TEST_PLACEHOLDER = "Wybierz sklep...";

const testItems: TestItem[] = [
  { id: "shop-1", name: "Media Expert", logo: "/mediaexpert.png" },
  { id: "shop-2", name: "Biedronka", logo: "/biedronka.png" },
  { id: "shop-3", name: "Allegro", logo: "/allegro.png" },
];

describe("components/ui/combobox-responsive", () => {
  it("renders trigger with default placeholder when no item is selected", () => {
    render(
      <ComboboxResponsive<TestItem>
        items={testItems}
        getItemValue={(item) => item.id}
        getItemLabel={(item) => item.name}
        placeholder={TEST_PLACEHOLDER}
        renderItem={(item) => <span>{item.name}</span>}
      />,
    );

    expect(screen.getByRole("combobox")).toBeInTheDocument();
    expect(screen.getByText(TEST_PLACEHOLDER)).toBeInTheDocument();
  });

  it("renders trigger with selected item name when value is provided", () => {
    render(
      <ComboboxResponsive<TestItem>
        items={testItems}
        value="shop-1"
        getItemValue={(item) => item.id}
        getItemLabel={(item) => item.name}
        placeholder={TEST_PLACEHOLDER}
        renderItem={(item) => <span>{item.name}</span>}
      />,
    );

    expect(screen.getByText("Media Expert")).toBeInTheDocument();
  });

  it("renders custom trigger via renderTrigger prop", () => {
    render(
      <ComboboxResponsive<TestItem>
        items={testItems}
        value="shop-2"
        getItemValue={(item) => item.id}
        getItemLabel={(item) => item.name}
        renderItem={(item) => <span>{item.name}</span>}
        renderTrigger={(selectedItem) => (
          <span data-testid="custom-trigger">Sklep: {selectedItem?.name}</span>
        )}
      />,
    );

    expect(screen.getByTestId("custom-trigger")).toHaveTextContent(
      "Sklep: Biedronka",
    );
  });

  it("opens popover on desktop and displays all items using renderItem", async () => {
    render(
      <ComboboxResponsive<TestItem>
        items={testItems}
        getItemValue={(item) => item.id}
        getItemLabel={(item) => item.name}
        placeholder={TEST_PLACEHOLDER}
        renderItem={(item, isSelected) => (
          <span data-testid={`item-${item.id}`}>
            {item.name} {isSelected ? "(wybrany)" : ""}
          </span>
        )}
      />,
    );

    const trigger = screen.getByRole("combobox");
    fireEvent.click(trigger);

    expect(await screen.findByTestId("item-shop-1")).toHaveTextContent(
      "Media Expert",
    );
    expect(screen.getByTestId("item-shop-2")).toHaveTextContent("Biedronka");
    expect(screen.getByTestId("item-shop-3")).toHaveTextContent("Allegro");
  });

  it("calls onValueChange when an item is selected", async () => {
    const handleChange = vi.fn();
    render(
      <ComboboxResponsive<TestItem>
        items={testItems}
        getItemValue={(item) => item.id}
        getItemLabel={(item) => item.name}
        onValueChange={handleChange}
        placeholder={TEST_PLACEHOLDER}
        renderItem={(item) => <span>{item.name}</span>}
      />,
    );

    fireEvent.click(screen.getByRole("combobox"));
    const option = await screen.findByText("Biedronka");
    fireEvent.click(option);

    expect(handleChange).toHaveBeenCalledWith("shop-2", testItems[1]);
  });

  it("opens full-screen Dialog with dialogTitle on mobile", async () => {
    vi.spyOn(useMobileHook, "useIsMobile").mockReturnValue(true);

    render(
      <ComboboxResponsive<TestItem>
        items={testItems}
        getItemValue={(item) => item.id}
        getItemLabel={(item) => item.name}
        placeholder={TEST_PLACEHOLDER}
        dialogTitle={SHOP_SELECTOR_MESSAGES.dialogTitleSelect}
        renderItem={(item) => <span>{item.name}</span>}
      />,
    );

    const trigger = screen.getByRole("combobox");
    fireEvent.click(trigger);

    expect(
      await screen.findByText(SHOP_SELECTOR_MESSAGES.dialogTitleSelect),
    ).toBeInTheDocument();
    expect(screen.getByText("Biedronka")).toBeInTheDocument();
  });
});
