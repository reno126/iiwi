import { describe, it, expect } from "vitest";
import { extractProductMetadata } from "@/lib/scraper/extractMetadata";

describe("lib/scraper/extractMetadata", () => {
  const baseUrl = "https://www.sklep.pl/p/3222380/ladowarka-scienna/";

  it("extracts imageUrl and metadata from Open Graph and Twitter tags", () => {
    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta property="og:image" content="https://cdn.sklep.pl/img/charger.jpg" />
          <meta property="og:title" content="Ładowarka Sieciowa USB-C 20W - Sklep Online" />
          <title>Ładowarka Sieciowa USB-C 20W | Najlepsze Ceny</title>
        </head>
        <body>
          <h1>Ładowarka Sieciowa USB-C 20W</h1>
        </body>
      </html>
    `;

    const result = extractProductMetadata(html, baseUrl);
    expect(result).not.toBeNull();
    expect(result?.imageUrl).toBe("https://cdn.sklep.pl/img/charger.jpg");
    expect(result?.name).toBe("Ładowarka Sieciowa USB-C 20W");
    expect(result?.code).toBe("3222380"); // wyciągnięte z URL
  });

  it("extracts image, clean name and code from JSON-LD Schema.org", () => {
    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <script type="application/ld+json">
            {
              "@context": "https://schema.org/",
              "@type": "Product",
              "name": "Sony WH-1000XM5",
              "image": [
                "https://example.com/images/sony-xm5-front.jpg",
                "https://example.com/images/sony-xm5-side.jpg"
              ],
              "gtin13": "5099206103734",
              "sku": "SONY-XM5-BLK"
            }
          </script>
        </head>
        <body>
          <h1>Sony WH-1000XM5 - Oficjalny Sklep</h1>
        </body>
      </html>
    `;

    const result = extractProductMetadata(html, "https://example.com/item/1");
    expect(result).not.toBeNull();
    expect(result?.imageUrl).toBe("https://example.com/images/sony-xm5-front.jpg");
    expect(result?.name).toBe("Sony WH-1000XM5");
    expect(result?.code).toBe("5099206103734");
  });

  it("extracts from JSON-LD with @graph array", () => {
    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <script type="application/ld+json">
            {
              "@context": "https://schema.org",
              "@graph": [
                {
                  "@type": "WebSite",
                  "name": "Sklep"
                },
                {
                  "@type": "Product",
                  "name": "Klawiatura Mechaniczna RGB",
                  "image": {
                    "@type": "ImageObject",
                    "url": "/media/keyboard.png"
                  },
                  "sku": "KB-RGB-01"
                }
              ]
            }
          </script>
        </head>
        <body></body>
      </html>
    `;

    const result = extractProductMetadata(html, "https://sklep.pl/products/keyboard");
    expect(result).not.toBeNull();
    expect(result?.imageUrl).toBe("https://sklep.pl/media/keyboard.png");
    expect(result?.name).toBe("Klawiatura Mechaniczna RGB");
    expect(result?.code).toBe("KB-RGB-01");
  });

  it("extracts from HTML5 microdata (itemprop)", () => {
    const html = `
      <!DOCTYPE html>
      <html>
        <body>
          <div itemscope itemtype="https://schema.org/Product">
            <h1 itemprop="name">Myszka Bezprzewodowa M720</h1>
            <img itemprop="image" src="//cdn.shop.com/m720.jpg" alt="Myszka" />
            <span itemprop="gtin13">4012345678901</span>
          </div>
        </body>
      </html>
    `;

    const result = extractProductMetadata(html, "https://shop.com/item");
    expect(result).not.toBeNull();
    expect(result?.imageUrl).toBe("https://cdn.shop.com/m720.jpg");
    expect(result?.name).toBe("Myszka Bezprzewodowa M720");
    expect(result?.code).toBe("4012345678901");
  });

  it("falls back to DOM selectors when meta tags and JSON-LD are missing", () => {
    const html = `
      <!DOCTYPE html>
      <html>
        <body>
          <main>
            <h1>Monitor Gamingowy 27 cali</h1>
            <div data-testid="product-image-container">
              <img src="/static/monitor-main.jpg" alt="Monitor" />
            </div>
            <table class="specifications">
              <tr>
                <td>Kod produktu:</td>
                <td>MON-27-QHD</td>
              </tr>
            </table>
          </main>
        </body>
      </html>
    `;

    const result = extractProductMetadata(html, "https://store.com/electronics/monitor");
    expect(result).not.toBeNull();
    expect(result?.imageUrl).toBe("https://store.com/static/monitor-main.jpg");
    expect(result?.name).toBe("Monitor Gamingowy 27 cali");
    expect(result?.code).toBe("MON-27-QHD");
  });

  it("ignores logos, favicons, banners and SVG images in DOM fallback", () => {
    const html = `
      <!DOCTYPE html>
      <html>
        <body>
          <header>
            <img src="/logo.svg" alt="Logo sklepu" />
            <img src="/banner-promo.png" alt="Baner" />
          </header>
          <article>
            <h1>Produkt Bez Zdjęcia</h1>
          </article>
        </body>
      </html>
    `;

    const result = extractProductMetadata(html, "https://store.com/item");
    expect(result).toBeNull();
  });

  it("returns null when no valid image is found (critical condition 4a)", () => {
    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>Tylko tekst</title>
        </head>
        <body>
          <h1>Produkt bez zdjęć</h1>
        </body>
      </html>
    `;

    const result = extractProductMetadata(html, "https://store.com/item");
    expect(result).toBeNull();
  });
});
