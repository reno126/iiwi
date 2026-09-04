import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, fireEvent, act } from "@testing-library/react";
import { AsyncSearch } from "@/components/AsyncSearch";

interface TestProduct {
  id: string;
  name: string;
  code?: string;
  price?: number;
}

const mockProducts: TestProduct[] = [
  { id: "1", name: "Słuchawki bezprzewodowe Sony", code: "SONY-01", price: 799 },
  { id: "2", name: "Słuchawki douszne JBL", code: "JBL-02", price: 299 },
  { id: "3", name: "Klawiatura mechaniczna Keychron", code: "KEY-03", price: 450 },
];

describe("components/AsyncSearch (Generic Search Component)", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.clearAllTimers();
    vi.useRealTimers();
  });

  it("renders search input without any start/submit button", () => {
    const mockAction = vi.fn().mockResolvedValue([]);
    render(<AsyncSearch<TestProduct> searchAction={mockAction} />);

    const input = screen.getByRole("combobox");
    expect(input).toBeInTheDocument();
    expect(input).toHaveAttribute("placeholder", "Szukaj (min. 3 znaki)...");

    // Must NOT have a search start button
    expect(screen.queryByRole("button", { name: /szukaj/i })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /search/i })).not.toBeInTheDocument();
  });

  it("does not trigger search when query length is less than 3 characters", async () => {
    const mockAction = vi.fn().mockResolvedValue(mockProducts);
    render(<AsyncSearch<TestProduct> searchAction={mockAction} minChars={3} debounceMs={300} />);

    const input = screen.getByRole("combobox");

    // Type 2 characters
    fireEvent.change(input, { target: { value: "Sł" } });

    // Fast-forward past debounce
    act(() => {
      vi.advanceTimersByTime(500);
    });

    expect(mockAction).not.toHaveBeenCalled();
    expect(screen.queryByRole("listbox")).not.toBeInTheDocument();
    expect(screen.getByText(/wpisz jeszcze co najmniej 1 znak/i)).toBeInTheDocument();
  });

  it("triggers search after minChars (3) and debounce timeout, displaying results", async () => {
    const mockAction = vi.fn().mockResolvedValue(mockProducts);
    render(
      <AsyncSearch<TestProduct>
        searchAction={mockAction}
        minChars={3}
        debounceMs={300}
        getItemLabel={(item) => `${item.name} (${item.code})`}
      />
    );

    const input = screen.getByRole("combobox");

    fireEvent.change(input, { target: { value: "Słu" } });

    // Before debounce completes, searchAction should not be called yet
    expect(mockAction).not.toHaveBeenCalled();

    // Advance debounce time
    await act(async () => {
      vi.advanceTimersByTime(300);
    });

    expect(mockAction).toHaveBeenCalledTimes(1);
    expect(mockAction).toHaveBeenCalledWith("Słu");

    // Results list should appear below input
    const listbox = screen.getByRole("listbox");
    expect(listbox).toBeInTheDocument();

    const options = screen.getAllByRole("option");
    expect(options).toHaveLength(3);
    expect(options[0]).toHaveTextContent("Słuchawki bezprzewodowe Sony (SONY-01)");
    expect(options[1]).toHaveTextContent("Słuchawki douszne JBL (JBL-02)");
  });

  it("handles next-safe-action response format ({ data: T[] })", async () => {
    const mockAction = vi.fn().mockResolvedValue({ data: mockProducts.slice(0, 1) });
    render(<AsyncSearch<TestProduct> searchAction={mockAction} minChars={3} debounceMs={200} />);

    const input = screen.getByRole("combobox");
    fireEvent.change(input, { target: { value: "Sony" } });

    await act(async () => {
      vi.advanceTimersByTime(200);
    });

    expect(mockAction).toHaveBeenCalledWith("Sony");
    const options = screen.getAllByRole("option");
    expect(options).toHaveLength(1);
    expect(options[0]).toHaveTextContent("Słuchawki bezprzewodowe Sony");
  });

  it("displays loading/searching indicator while search is pending", async () => {
    let resolvePromise: (val: TestProduct[]) => void;
    const pendingPromise = new Promise<TestProduct[]>((resolve) => {
      resolvePromise = resolve;
    });
    const mockAction = vi.fn().mockReturnValue(pendingPromise);

    render(<AsyncSearch<TestProduct> searchAction={mockAction} minChars={3} debounceMs={150} />);

    const input = screen.getByRole("combobox");
    fireEvent.change(input, { target: { value: "Sony" } });

    // Advance to fire the async action
    act(() => {
      vi.advanceTimersByTime(150);
    });

    // Loading card and spinner should be visible
    expect(screen.getByText("Wyszukiwanie wyników...")).toBeInTheDocument();

    // Resolve the promise
    await act(async () => {
      resolvePromise!(mockProducts.slice(0, 1));
    });

    // Loading indicator is replaced with results
    expect(screen.queryByText("Wyszukiwanie wyników...")).not.toBeInTheDocument();
    expect(screen.getByText("Słuchawki bezprzewodowe Sony")).toBeInTheDocument();
  });

  it("displays zero result state when query returns no items", async () => {
    const mockAction = vi.fn().mockResolvedValue([]);
    render(
      <AsyncSearch<TestProduct>
        searchAction={mockAction}
        minChars={3}
        debounceMs={200}
        emptyTitle="Brak produktów"
      />
    );

    const input = screen.getByRole("combobox");
    fireEvent.change(input, { target: { value: "Nieistniejący" } });

    await act(async () => {
      vi.advanceTimersByTime(200);
    });

    expect(mockAction).toHaveBeenCalledWith("Nieistniejący");

    // Zero result state should be rendered
    expect(screen.getByText("Brak produktów")).toBeInTheDocument();
    expect(
      screen.getByText(/nie znaleziono żadnych wyników dla frazy „Nieistniejący”/i)
    ).toBeInTheDocument();
  });

  it("displays clear button ('X') when query is non-empty and resets state when clicked", async () => {
    const mockAction = vi.fn().mockResolvedValue(mockProducts);
    render(<AsyncSearch<TestProduct> searchAction={mockAction} minChars={3} debounceMs={200} />);

    const input = screen.getByRole("combobox");

    // Clear button should not exist initially
    expect(
      screen.queryByRole("button", { name: "Wyczyść wyszukiwanie" })
    ).not.toBeInTheDocument();

    // Enter query
    fireEvent.change(input, { target: { value: "Słuchawki" } });

    // Clear button should now be visible
    const clearButton = screen.getByRole("button", { name: "Wyczyść wyszukiwanie" });
    expect(clearButton).toBeInTheDocument();

    await act(async () => {
      vi.advanceTimersByTime(200);
    });

    expect(screen.getByRole("listbox")).toBeInTheDocument();

    // Click clear button
    fireEvent.click(clearButton);

    // Input must be cleared and results removed
    expect(input).toHaveValue("");
    expect(screen.queryByRole("listbox")).not.toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: "Wyczyść wyszukiwanie" })
    ).not.toBeInTheDocument();
  });

  it("invokes onResultSelect when a result item is clicked", async () => {
    const mockAction = vi.fn().mockResolvedValue(mockProducts);
    const onSelect = vi.fn();

    render(
      <AsyncSearch<TestProduct>
        searchAction={mockAction}
        onResultSelect={onSelect}
        minChars={3}
        debounceMs={200}
      />
    );

    const input = screen.getByRole("combobox");
    fireEvent.change(input, { target: { value: "Słuchawki" } });

    await act(async () => {
      vi.advanceTimersByTime(200);
    });

    const options = screen.getAllByRole("option");
    fireEvent.click(options[1]); // Click JBL

    expect(onSelect).toHaveBeenCalledTimes(1);
    expect(onSelect).toHaveBeenCalledWith(mockProducts[1]);
  });

  it("supports keyboard navigation with ArrowDown, ArrowUp, and Enter selection", async () => {
    const mockAction = vi.fn().mockResolvedValue(mockProducts);
    const onSelect = vi.fn();

    render(
      <AsyncSearch<TestProduct>
        searchAction={mockAction}
        onResultSelect={onSelect}
        minChars={3}
        debounceMs={200}
      />
    );

    const input = screen.getByRole("combobox");
    fireEvent.change(input, { target: { value: "Słuchawki" } });

    await act(async () => {
      vi.advanceTimersByTime(200);
    });

    const options = screen.getAllByRole("option");

    // Arrow down to first item
    fireEvent.keyDown(input, { key: "ArrowDown" });
    expect(options[0]).toHaveAttribute("aria-selected", "true");

    // Arrow down to second item
    fireEvent.keyDown(input, { key: "ArrowDown" });
    expect(options[1]).toHaveAttribute("aria-selected", "true");
    expect(options[0]).toHaveAttribute("aria-selected", "false");

    // Press Enter to select
    fireEvent.keyDown(input, { key: "Enter" });
    expect(onSelect).toHaveBeenCalledWith(mockProducts[1]);
  });

  it("supports custom renderItem and getKey props", async () => {
    const mockAction = vi.fn().mockResolvedValue(mockProducts.slice(0, 1));

    render(
      <AsyncSearch<TestProduct>
        searchAction={mockAction}
        minChars={3}
        debounceMs={100}
        getKey={(item) => item.id}
        renderItem={(item, isHighlighted) => (
          <div data-testid="custom-item">
            <span>{item.name}</span>
            <span>{item.price} zł</span>
            {isHighlighted && <span>[WYBRANY]</span>}
          </div>
        )}
      />
    );

    const input = screen.getByRole("combobox");
    fireEvent.change(input, { target: { value: "Sony" } });

    await act(async () => {
      vi.advanceTimersByTime(100);
    });

    const customItem = screen.getByTestId("custom-item");
    expect(customItem).toBeInTheDocument();
    expect(customItem).toHaveTextContent("Słuchawki bezprzewodowe Sony");
    expect(customItem).toHaveTextContent("799 zł");
  });

  it("renders cleanly with pure generic string arrays (Search<string>)", async () => {
    const mockStrings = ["Jabłko", "Banan", "Pomarańcza"];
    const mockAction = vi.fn().mockResolvedValue(mockStrings);
    const onSelect = vi.fn();

    render(
      <AsyncSearch<string>
        searchAction={mockAction}
        onResultSelect={onSelect}
        minChars={3}
        debounceMs={150}
      />
    );

    const input = screen.getByRole("combobox");
    fireEvent.change(input, { target: { value: "Owoce" } });

    await act(async () => {
      vi.advanceTimersByTime(150);
    });

    expect(screen.getByText("Jabłko")).toBeInTheDocument();
    expect(screen.getByText("Banan")).toBeInTheDocument();

    fireEvent.click(screen.getByText("Pomarańcza"));
    expect(onSelect).toHaveBeenCalledWith("Pomarańcza");
  });
});
