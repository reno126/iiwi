import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { ComboboxResponsive } from "@/components/ui/combobox-responsive";
import * as useMobileHook from "@/hooks/useIsMobile";

interface TestItem {
  id: string;
  name: string;
  logo?: string;
}

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
        getItemValue={(i) => i.id}
        getItemLabel={(i) => i.name}
        placeholder="Wybierz sklep..."
        renderItem={(i) => <span>{i.name}</span>}
      />
    );

    expect(screen.getByRole("combobox")).toBeInTheDocument();
    expect(screen.getByText("Wybierz sklep...")).toBeInTheDocument();
  });

  it("renders trigger with selected item name when value is provided", () => {
    render(
      <ComboboxResponsive<TestItem>
        items={testItems}
        value="shop-1"
        getItemValue={(i) => i.id}
        getItemLabel={(i) => i.name}
        placeholder="Wybierz sklep..."
        renderItem={(i) => <span>{i.name}</span>}
      />
    );

    expect(screen.getByText("Media Expert")).toBeInTheDocument();
  });

  it("renders custom trigger via renderTrigger prop", () => {
    render(
      <ComboboxResponsive<TestItem>
        items={testItems}
        value="shop-2"
        getItemValue={(i) => i.id}
        getItemLabel={(i) => i.name}
        renderItem={(i) => <span>{i.name}</span>}
        renderTrigger={(selectedItem) => (
          <span data-testid="custom-trigger">Sklep: {selectedItem?.name}</span>
        )}
      />
    );

    expect(screen.getByTestId("custom-trigger")).toHaveTextContent("Sklep: Biedronka");
  });

  it("opens popover on desktop and displays all items using renderItem", async () => {
    render(
      <ComboboxResponsive<TestItem>
        items={testItems}
        getItemValue={(i) => i.id}
        getItemLabel={(i) => i.name}
        placeholder="Wybierz sklep..."
        renderItem={(i, isSelected) => (
          <span data-testid={`item-${i.id}`}>
            {i.name} {isSelected ? "(wybrany)" : ""}
          </span>
        )}
      />
    );

    const trigger = screen.getByRole("combobox");
    fireEvent.click(trigger);

    expect(await screen.findByTestId("item-shop-1")).toHaveTextContent("Media Expert");
    expect(screen.getByTestId("item-shop-2")).toHaveTextContent("Biedronka");
    expect(screen.getByTestId("item-shop-3")).toHaveTextContent("Allegro");
  });

  it("calls onValueChange when an item is selected", async () => {
    const handleChange = vi.fn();
    render(
      <ComboboxResponsive<TestItem>
        items={testItems}
        getItemValue={(i) => i.id}
        getItemLabel={(i) => i.name}
        onValueChange={handleChange}
        placeholder="Wybierz sklep..."
        renderItem={(i) => <span>{i.name}</span>}
      />
    );

    fireEvent.click(screen.getByRole("combobox"));
    const option = await screen.findByText("Biedronka");
    fireEvent.click(option);

    expect(handleChange).toHaveBeenCalledWith("shop-2", testItems[1]);
  });

  it("clears selection when clearable is true and clear button is clicked", () => {
    const handleChange = vi.fn();
    render(
      <ComboboxResponsive<TestItem>
        items={testItems}
        value="shop-1"
        getItemValue={(i) => i.id}
        getItemLabel={(i) => i.name}
        onValueChange={handleChange}
        clearable={true}
        renderItem={(i) => <span>{i.name}</span>}
      />
    );

    const clearButton = screen.getByRole("button", { name: "Wyczyść wybór" });
    fireEvent.click(clearButton);

    expect(handleChange).toHaveBeenCalledWith("", undefined);
  });

  it("opens full-screen Dialog with dialogTitle on mobile", async () => {
    vi.spyOn(useMobileHook, "useIsMobile").mockReturnValue(true);

    render(
      <ComboboxResponsive<TestItem>
        items={testItems}
        getItemValue={(i) => i.id}
        getItemLabel={(i) => i.name}
        placeholder="Wybierz sklep..."
        dialogTitle="Wybierz sklep z listy"
        renderItem={(i) => <span>{i.name}</span>}
      />
    );

    const trigger = screen.getByRole("combobox");
    fireEvent.click(trigger);

    expect(await screen.findByText("Wybierz sklep z listy")).toBeInTheDocument();
    expect(screen.getByText("Biedronka")).toBeInTheDocument();
  });
});
