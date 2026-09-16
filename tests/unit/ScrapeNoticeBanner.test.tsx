import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { ScrapeNoticeBanner } from "@/app/opinie/dodaj/_components/ScrapeNoticeBanner";

describe("ScrapeNoticeBanner", () => {
  it("renders Case 1 (all data scraped): static success banner", () => {
    render(
      <ScrapeNoticeBanner
        mode="scraped_success"
        scrapedFields={["name", "imageUrl", "code", "shop"]}
      />
    );

    const alert = screen.getByRole("alert");
    expect(alert).toHaveTextContent(/pobrano wszystkie potrzebne dane produktu/i);
    expect(alert).toHaveTextContent(
      /poniższe dane możesz sprawdzić i dowolnie edytować przed dodaniem opinii/i
    );
    expect(alert).not.toHaveTextContent(/nie udało się pobrać danych/i);
    expect(alert).not.toHaveTextContent(/udało się pobrać część danych/i);
  });

  it("renders Case 1 when name, imageUrl, and shop are scraped", () => {
    render(
      <ScrapeNoticeBanner
        mode="scraped_success"
        scrapedFields={["name", "imageUrl", "shop"]}
      />
    );

    const alert = screen.getByRole("alert");
    expect(alert).toHaveTextContent(/udało się pobrać część danych/i);
    expect(alert).toHaveTextContent(
      /uzupełnij brakujące dane i dodaj swoją opinię/i
    );
  });

  it("renders Case 2 (no data scraped - scraped_failed mode): error banner", () => {
    render(
      <ScrapeNoticeBanner
        mode="scraped_failed"
        errorMessage="Błąd serwera"
      />
    );

    const alert = screen.getByRole("alert");
    expect(alert).toHaveTextContent(/nie udało się pobrać danych/i);
    expect(alert).toHaveTextContent(
      /uzupełnij brakujące dane i dodaj swoją opinię/i
    );
  });

  it("renders Case 2 (no data scraped - empty scrapedFields): error banner", () => {
    render(
      <ScrapeNoticeBanner
        mode="scraped_success"
        scrapedFields={[]}
      />
    );

    const alert = screen.getByRole("alert");
    expect(alert).toHaveTextContent(/nie udało się pobrać danych/i);
    expect(alert).toHaveTextContent(
      /uzupełnij brakujące dane i dodaj swoją opinię/i
    );
  });

  it("renders Case 3 (partial data - only name scraped): warning banner", () => {
    render(
      <ScrapeNoticeBanner
        mode="scraped_success"
        scrapedFields={["name"]}
      />
    );

    const alert = screen.getByRole("alert");
    expect(alert).toHaveTextContent(/udało się pobrać część danych/i);
    expect(alert).toHaveTextContent(
      /uzupełnij brakujące dane i dodaj swoją opinię/i
    );
  });

  it("renders Case 3 (partial data - only imageUrl scraped): warning banner", () => {
    render(
      <ScrapeNoticeBanner
        mode="scraped_success"
        scrapedFields={["imageUrl"]}
      />
    );

    const alert = screen.getByRole("alert");
    expect(alert).toHaveTextContent(/udało się pobrać część danych/i);
    expect(alert).toHaveTextContent(
      /uzupełnij brakujące dane i dodaj swoją opinię/i
    );
  });

  it("renders Case 3 (partial data - name and shop scraped, but no image): warning banner", () => {
    render(
      <ScrapeNoticeBanner
        mode="scraped_success"
        scrapedFields={["name", "shop"]}
      />
    );

    const alert = screen.getByRole("alert");
    expect(alert).toHaveTextContent(/udało się pobrać część danych/i);
    expect(alert).toHaveTextContent(
      /uzupełnij brakujące dane i dodaj swoją opinię/i
    );
  });
});
