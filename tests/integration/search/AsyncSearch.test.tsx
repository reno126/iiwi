import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, fireEvent, act } from "@testing-library/react";
import {
  AsyncSearch,
  ASYNC_SEARCH_MESSAGES,
} from "@/app/opinie/dodaj/_components/AsyncSearch";

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

function createAsyncSearchDriver() {
  return {
    input: () => screen.getByRole("combobox"),
    queryInput: () => screen.queryByRole("combobox"),
    listbox: () =>
      screen.getByRole("listbox", {
        name: ASYNC_SEARCH_MESSAGES.resultsAriaLabel,
      }),
    queryListbox: () =>
      screen.queryByRole("listbox", {
        name: ASYNC_SEARCH_MESSAGES.resultsAriaLabel,
      }),
    options: () => screen.getAllByRole("option"),
    clearButton: () =>
      screen.getByRole("button", {
        name: ASYNC_SEARCH_MESSAGES.clearAriaLabel,
      }),
    queryClearButton: () =>
      screen.queryByRole("button", {
        name: ASYNC_SEARCH_MESSAGES.clearAriaLabel,
      }),
    loadingIndicator: () =>
      screen.getByLabelText(ASYNC_SEARCH_MESSAGES.loadingAriaLabel),
    queryLoadingIndicator: () =>
      screen.queryByLabelText(ASYNC_SEARCH_MESSAGES.loadingAriaLabel),
    type(val: string) {
      fireEvent.change(this.input(), { target: { value: val } });
    },
    clear() {
      fireEvent.click(this.clearButton());
    },
    pressArrowDown() {
      fireEvent.keyDown(this.input(), { key: "ArrowDown" });
    },
    pressEnter() {
      fireEvent.keyDown(this.input(), { key: "Enter" });
    },
  };
}

describe("app/opinie/dodaj/_components/AsyncSearch", () => {
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
    const driver = createAsyncSearchDriver();

    expect(driver.input()).toBeInTheDocument();
    expect(driver.input()).toHaveAttribute(
      "placeholder",
      ASYNC_SEARCH_MESSAGES.defaultPlaceholder,
    );
    expect(screen.queryByRole("button")).not.toBeInTheDocument();
  });

  it("does not trigger search when query length is less than 3 characters", async () => {
    const mockAction = vi.fn().mockResolvedValue(mockProducts);
    render(
      <AsyncSearch<TestProduct>
        searchAction={mockAction}
        minChars={3}
        debounceMs={300}
      />,
    );
    const driver = createAsyncSearchDriver();

    driver.type("Sł");

    act(() => {
      vi.advanceTimersByTime(500);
    });

    expect(mockAction).not.toHaveBeenCalled();
    expect(driver.queryListbox()).not.toBeInTheDocument();
    expect(
      screen.getByText(ASYNC_SEARCH_MESSAGES.minCharsHint(1)),
    ).toBeInTheDocument();
  });

  it("triggers search after minChars (3) and debounce timeout, displaying results", async () => {
    const mockAction = vi.fn().mockResolvedValue(mockProducts);
    render(
      <AsyncSearch<TestProduct>
        searchAction={mockAction}
        minChars={3}
        debounceMs={300}
        getItemLabel={(item) => `${item.name} (${item.code})`}
      />,
    );
    const driver = createAsyncSearchDriver();

    driver.type("Słu");

    expect(mockAction).not.toHaveBeenCalled();

    await act(async () => {
      vi.advanceTimersByTime(300);
    });

    expect(mockAction).toHaveBeenCalledTimes(1);
    expect(mockAction).toHaveBeenCalledWith("Słu");

    expect(driver.listbox()).toBeInTheDocument();

    const options = driver.options();
    expect(options).toHaveLength(3);
    expect(options[0]).toHaveTextContent(
      "Słuchawki bezprzewodowe Sony (SONY-01)",
    );
    expect(options[1]).toHaveTextContent("Słuchawki douszne JBL (JBL-02)");
  });

  it("handles next-safe-action response format ({ data: T[] })", async () => {
    const mockAction = vi
      .fn()
      .mockResolvedValue({ data: mockProducts.slice(0, 1) });
    render(
      <AsyncSearch<TestProduct>
        searchAction={mockAction}
        minChars={3}
        debounceMs={200}
      />,
    );
    const driver = createAsyncSearchDriver();

    driver.type("Sony");

    await act(async () => {
      vi.advanceTimersByTime(200);
    });

    expect(mockAction).toHaveBeenCalledWith("Sony");
    const options = driver.options();
    expect(options).toHaveLength(1);
    expect(options[0]).toHaveTextContent("Słuchawki bezprzewodowe Sony");
  });

  it("displays loading/searching indicator while search is pending", async () => {
    let resolvePromise: (val: TestProduct[]) => void;
    const pendingPromise = new Promise<TestProduct[]>((resolve) => {
      resolvePromise = resolve;
    });
    const mockAction = vi.fn().mockReturnValue(pendingPromise);

    render(
      <AsyncSearch<TestProduct>
        searchAction={mockAction}
        minChars={3}
        debounceMs={150}
      />,
    );
    const driver = createAsyncSearchDriver();

    driver.type("Sony");

    act(() => {
      vi.advanceTimersByTime(150);
    });

    expect(driver.loadingIndicator()).toBeInTheDocument();

    await act(async () => {
      resolvePromise!(mockProducts.slice(0, 1));
    });

    expect(driver.queryLoadingIndicator()).not.toBeInTheDocument();
    expect(screen.getByText("Słuchawki bezprzewodowe Sony")).toBeInTheDocument();
  });

  it("displays zero result state when query returns no items", async () => {
    const mockAction = vi.fn().mockResolvedValue([]);
    const customEmptyTitle = "Brak produktów";
    render(
      <AsyncSearch<TestProduct>
        searchAction={mockAction}
        minChars={3}
        debounceMs={200}
        emptyTitle={customEmptyTitle}
      />,
    );
    const driver = createAsyncSearchDriver();

    driver.type("Nieistniejący");

    await act(async () => {
      vi.advanceTimersByTime(200);
    });

    expect(mockAction).toHaveBeenCalledWith("Nieistniejący");

    expect(screen.getByText(customEmptyTitle)).toBeInTheDocument();
    expect(
      screen.getByText(
        ASYNC_SEARCH_MESSAGES.defaultEmptyDescription("Nieistniejący"),
      ),
    ).toBeInTheDocument();
  });

  it("displays clear button ('X') when query is non-empty and resets state when clicked", async () => {
    const mockAction = vi.fn().mockResolvedValue(mockProducts);
    render(
      <AsyncSearch<TestProduct>
        searchAction={mockAction}
        minChars={3}
        debounceMs={200}
      />,
    );
    const driver = createAsyncSearchDriver();

    expect(driver.queryClearButton()).not.toBeInTheDocument();

    driver.type("Słuchawki");

    expect(driver.clearButton()).toBeInTheDocument();

    await act(async () => {
      vi.advanceTimersByTime(200);
    });

    expect(driver.listbox()).toBeInTheDocument();

    driver.clear();

    expect(driver.input()).toHaveValue("");
    expect(driver.queryListbox()).not.toBeInTheDocument();
    expect(driver.queryClearButton()).not.toBeInTheDocument();
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
      />,
    );
    const driver = createAsyncSearchDriver();

    driver.type("Słuchawki");

    await act(async () => {
      vi.advanceTimersByTime(200);
    });

    const options = driver.options();
    fireEvent.click(options[1]);

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
      />,
    );
    const driver = createAsyncSearchDriver();

    driver.type("Słuchawki");

    await act(async () => {
      vi.advanceTimersByTime(200);
    });

    const options = driver.options();

    driver.pressArrowDown();
    expect(options[0]).toHaveAttribute("aria-selected", "true");

    driver.pressArrowDown();
    expect(options[1]).toHaveAttribute("aria-selected", "true");
    expect(options[0]).toHaveAttribute("aria-selected", "false");

    driver.pressEnter();
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
          <article>
            <span>{item.name}</span>
            <span>{item.price} zł</span>
            {isHighlighted && <span>[WYBRANY]</span>}
          </article>
        )}
      />,
    );
    const driver = createAsyncSearchDriver();

    driver.type("Sony");

    await act(async () => {
      vi.advanceTimersByTime(100);
    });

    const customItem = screen.getByRole("article");
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
      />,
    );
    const driver = createAsyncSearchDriver();

    driver.type("Owoce");

    await act(async () => {
      vi.advanceTimersByTime(150);
    });

    expect(screen.getByText("Jabłko")).toBeInTheDocument();
    expect(screen.getByText("Banan")).toBeInTheDocument();

    fireEvent.click(screen.getByText("Pomarańcza"));
    expect(onSelect).toHaveBeenCalledWith("Pomarańcza");
  });
});
