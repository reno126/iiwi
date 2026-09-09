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
    expect(result).not.toBeNull();
    expect(result?.imageUrl).toBeNull();
    expect(result?.name).toBe("Produkt Bez Zdjęcia");
  });

  it("successfully extracts metadata even when no valid image is found (best-effort)", () => {
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
    expect(result).not.toBeNull();
    expect(result?.imageUrl).toBeNull();
    expect(result?.name).toBe("Produkt bez zdjęć");
    expect(result?.code).toBeNull();
  });

  it("returns null when no metadata (image, name, or code) can be extracted", () => {
    const html = `
      <!DOCTYPE html>
      <html>
        <body>
          <div>Nic tutaj nie ma</div>
        </body>
      </html>
    `;

    const result = extractProductMetadata(html, "https://store.com/item");
    expect(result).toBeNull();
  });

  it("extracts imageUrl from itemprop='image' when image uses srcset or data-srcset without src (Biedronka pattern)", () => {
    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>Pano wafle ryżowe wieloziarniste 100 g - sklep biedronka.pl</title>
        </head>
        <body>
          <picture>
            <source media="(min-width: 1200px)" srcset="https://zakupy.biedronka.pl/dw/image/v2/img_large.jpg?sw=424&sh=424" />
            <img
              class="lazy"
              itemprop="image"
              data-srcset="https://zakupy.biedronka.pl/dw/image/v2/img_large.jpg?sw=424&sh=424"
              srcset="https://zakupy.biedronka.pl/dw/image/v2/img_large.jpg?sw=424&sh=424"
              alt="Pano_Pano Wafle ryżowe wieloziarniste 100 g_1"
            />
          </picture>
        </body>
      </html>
    `;

    const result = extractProductMetadata(
      html,
      "https://zakupy.biedronka.pl/pl/pano-wafle-ryzowe-wieloziarniste-100-g.html"
    );
    expect(result).not.toBeNull();
    expect(result?.imageUrl).toBe(
      "https://zakupy.biedronka.pl/dw/image/v2/img_large.jpg?sw=424&sh=424"
    );
    expect(result?.name).toBe("Pano wafle ryżowe wieloziarniste 100 g");
  });

  it("extracts imageUrl from data-zoom-bg gallery elements (Demandware / Salesforce CC pattern)", () => {
    const html = `
      <!DOCTYPE html>
      <html>
        <body>
          <div class="carousel-product">
            <div class="carousel-product__item-inner" data-zoom-bg="https://cdn.store.pl/zoom/product_hi_res.jpg?sw=1000">
              <picture>
                <img class="lazy" alt="Produkt" />
              </picture>
            </div>
          </div>
          <h1 class="product-name">Kawa Ziarnista 1kg</h1>
        </body>
      </html>
    `;

    const result = extractProductMetadata(html, "https://cdn.store.pl/kawa");
    expect(result).not.toBeNull();
    expect(result?.imageUrl).toBe("https://cdn.store.pl/zoom/product_hi_res.jpg?sw=1000");
    expect(result?.name).toBe("Kawa Ziarnista 1kg");
  });

  it("successfully extracts metadata from the real Biedronka dump (tmp/scrapes)", async () => {
    const fs = await import("fs");
    const path = await import("path");
    const dumpPath = path.resolve(process.cwd(), "tmp", "scrapes", "zakupy.biedronka.pl_last_zenrows.html");

    if (fs.existsSync(dumpPath)) {
      const html = fs.readFileSync(dumpPath, "utf-8");
      const result = extractProductMetadata(
        html,
        "https://zakupy.biedronka.pl/pl/pano-wafle-ryzowe-wieloziarniste-100-g.html"
      );

      expect(result).not.toBeNull();
      expect(result?.imageUrl).toBeDefined();
      expect(result?.imageUrl).toContain("zakupy.biedronka.pl");
      expect(result?.name).toBe("Pano Wafle ryżowe wieloziarniste 100 g");
      expect(result?.code).toBe("0000021113");
    }
  });
});
