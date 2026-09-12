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

    expect(
      screen.getByText("Pobrano wszystkie potrzebne dane produktu")
    ).toBeInTheDocument();
    expect(
      screen.getByText(
        "Poniższe dane możesz sprawdzić i dowolnie edytować przed dodaniem opinii."
      )
    ).toBeInTheDocument();

    // Verify error and warning banners are not shown
    expect(
      screen.queryByText("Nie udało się pobrać danych")
    ).not.toBeInTheDocument();
    expect(
      screen.queryByText("Udało się pobrać część danych")
    ).not.toBeInTheDocument();
  });

  it("renders Case 1 when name, imageUrl, and shop are scraped", () => {
    render(
      <ScrapeNoticeBanner
        mode="scraped_success"
        scrapedFields={["name", "imageUrl", "shop"]}
      />
    );

    expect(
      screen.getByText("Uzupełnij brakujące dane i dodaj swoją opinię")
    ).toBeInTheDocument();
    expect(
      screen.getByText(
        "Udało się pobrać część danych"
      )
    ).toBeInTheDocument();
  });

  it("renders Case 2 (no data scraped - scraped_failed mode): error banner", () => {
    render(
      <ScrapeNoticeBanner
        mode="scraped_failed"
        errorMessage="Błąd serwera"
      />
    );

    expect(
      screen.getByText("Nie udało się pobrać danych")
    ).toBeInTheDocument();
    expect(
      screen.getByText("Uzupełnij brakujące dane i dodaj swoją opinię")
    ).toBeInTheDocument();
  });

  it("renders Case 2 (no data scraped - empty scrapedFields): error banner", () => {
    render(
      <ScrapeNoticeBanner
        mode="scraped_success"
        scrapedFields={[]}
      />
    );

    expect(
      screen.getByText("Nie udało się pobrać danych")
    ).toBeInTheDocument();
    expect(
      screen.getByText("Uzupełnij brakujące dane i dodaj swoją opinię")
    ).toBeInTheDocument();
  });

  it("renders Case 3 (partial data - only name scraped): warning banner", () => {
    render(
      <ScrapeNoticeBanner
        mode="scraped_success"
        scrapedFields={["name"]}
      />
    );

    expect(
      screen.getByText("Udało się pobrać część danych")
    ).toBeInTheDocument();
    expect(
      screen.getByText("Uzupełnij brakujące dane i dodaj swoją opinię")
    ).toBeInTheDocument();
  });

  it("renders Case 3 (partial data - only imageUrl scraped): warning banner", () => {
    render(
      <ScrapeNoticeBanner
        mode="scraped_success"
        scrapedFields={["imageUrl"]}
      />
    );

    expect(
      screen.getByText("Udało się pobrać część danych")
    ).toBeInTheDocument();
    expect(
      screen.getByText("Uzupełnij brakujące dane i dodaj swoją opinię")
    ).toBeInTheDocument();
  });

  it("renders Case 3 (partial data - name and shop scraped, but no image): warning banner", () => {
    render(
      <ScrapeNoticeBanner
        mode="scraped_success"
        scrapedFields={["name", "shop"]}
      />
    );

    expect(
      screen.getByText("Udało się pobrać część danych")
    ).toBeInTheDocument();
    expect(
      screen.getByText("Uzupełnij brakujące dane i dodaj swoją opinię")
    ).toBeInTheDocument();
  });
});
