# TrueReview (`iiwi`) - \*Working name

**Prawdziwe, całkowicie niezależne opinie o produktach.**  
100% independent product review platform for Polish customers. Built with Next.js 16, React 19, and Tailwind CSS v4.

[![Live Demo](https://img.shields.io/badge/Live%20Demo-iiwi.vercel.app-0070f3?style=for-the-badge&logo=vercel)](https://iiwi.vercel.app)
[![Next.js](https://img.shields.io/badge/Next.js-16.3-black?style=for-the-badge&logo=next.js)](https://nextjs.org/)
[![React](https://img.shields.io/badge/React-19.2-61dafb?style=for-the-badge&logo=react)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.9-3178c6?style=for-the-badge&logo=typescript)](https://www.typescriptlang.org/)
[![pnpm](https://img.shields.io/badge/pnpm-10-F69220?style=for-the-badge&logo=pnpm&logoColor=white)](https://pnpm.io/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-v4-38bdf8?style=for-the-badge&logo=tailwindcss)](https://tailwindcss.com/)
[![Prisma](https://img.shields.io/badge/Prisma-7.1-2d3748?style=for-the-badge&logo=prisma)](https://www.prisma.io/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-16-336791?style=for-the-badge&logo=postgresql)](https://www.postgresql.org/)
[![Vitest](https://img.shields.io/badge/Vitest-4.1-729b1b?style=for-the-badge&logo=vitest)](https://vitest.dev/)
[![Playwright](https://img.shields.io/badge/Playwright-1.6-45ba4b?style=for-the-badge&logo=playwright)](https://playwright.dev/)

---

## 🌐 Live Instance

Explore the working application preview at:  
👉 **[https://iiwi.vercel.app](https://iiwi.vercel.app)** (for now, Polish GUI only)

---

## 🎯 General Project Aim

Most modern product reviews are hosted directly on vendor or marketplace platforms (e.g., Allegro, Amazon, brand stores), where they are often subject to merchant filtering, promotional bias, sponsored placements, or vendor-curated moderation.

**TrueReview (`iiwi`)** was conceived to solve this problem by establishing a **central, merchant-agnostic review hub**:

- **100% Independent Opinions:** Reviews are disconnected from vendor commercial interests and store affiliate pressures.
- **Cross-Store Unification:** Products are cataloged and reviewed regardless of whether they were bought at physical brick-and-mortar retailers or online shops.
- **Authentic Consumer Community:** Transparent rating aggregation (weighted averages, distribution counts) where every consumer's voice has equal standing.

---

## ✨ Main Features

### 1. Unified Product & Review Onboarding (`/opinie/dodaj`)

- **Combined Form Experience:** An ergonomic, single-screen workflow where users can search for existing catalog items or create a brand-new product simultaneously while drafting their review.
- **Dynamic Field Status Indicators:** Real-time feedback badges indicating required versus optional fields as the user fills out information.

### 2. Intelligent Product Metadata Scraper & Auto-Fill

- **One-Click URL Extraction:** Paste a product URL from supported e-commerce stores (e.g., Media Expert, RTV Euro AGD, Allegro, etc.) to automatically extract:
  - Product Name (cleaned of SEO titles, marketing suffixes, and vendor wrappers).
  - High-Resolution Product Image URL (filtering out placeholders, SVGs, and tracking pixels).
  - Barcode / EAN / GTIN / SKU code directly from structured Schema.org JSON-LD microdata.
- **Enterprise-Grade SSRF Protection:** Strict IP range and protocol validation blocking private RFC-1918 addresses, loopbacks, link-local metadata endpoints, and internal network scans.
- **Resilient Proxy Integration:** Optional ZenRows web scraper integration with anti-bot bypass and geo-proxy support for JavaScript-rendered stores.

### 3. Auth-Gated Submission with Seamless Draft Persistence

- **Zero Initial Friction:** Users can start writing their review immediately without an account.
- **TTL Local Storage Persistence:** The form automatically caches drafts locally with expiration (`DEFAULT_TTL_MS`).
- **Seamless Auth Callback Loop:** If unauthenticated upon submission, the user is redirected to sign in or register (via Google OAuth or Credentials). Upon successful authentication, they return directly to their pre-filled draft, which is automatically submitted and cleared.

### 4. High-Performance Search & Autocomplete

- **Asynchronous Search:** Powered by React 19 `useTransition` and `useDeferredValue` for responsive, non-blocking main-thread input.
- **Accessible Combobox:** Fully keyboard-navigable (`ArrowUp`, `ArrowDown`, `Enter`, `Escape`), compliant with WAI-ARIA `combobox` / `listbox` specifications.

### 5. Mobile-First Ergonomics & Core Web Vitals (CWV)

- **Field Island Architecture:** Form controls grouped into self-contained visual "islands" (`bg-card`, rounded borders, comfortable padding) to optimize readability and thumb ergonomics on small screens.
- **Touch Targets ($\ge 48\text{px}$):** Mobile touch targets meet accessibility standards.
- **Zero iOS Safari Auto-Zoom:** Input text sizes configured to prevent unwanted automatic viewport zooming.
- **Optimized CWV Metrics:** Zero layout shifts (CLS < 0.1), pre-sized skeleton loaders, and sub-2.5s LCP through critical image prioritization and font preloading.

### 6. Next.js Caching & On-Demand Revalidation

- **Incremental Static Regeneration (ISR):** Core catalog and product detail routes (`/`, `/produkty`, `/produkty/[id]`) implement route-segment caching (`export const revalidate = 60`) to serve lightning-fast, cached responses while reducing database overhead.
- **Targeted Cache Invalidation:** Server Actions (`productWithReviewCreate`, `reviewCreate`) invoke granular on-demand cache purges via `revalidatePath("/produkty")`, `revalidatePath("/produkty/[id]")`, and `updateTag("products-count")`, ensuring instant data synchronization when new reviews or products are posted.

---

## 🛠️ Tech Stack

| Layer                  | Technology                   | Key Capabilities & Highlights                                               |
| :--------------------- | :--------------------------- | :-------------------------------------------------------------------------- |
| **Framework**          | **Next.js 16** (App Router)  | Server Components, Streaming `<Suspense>`, Server Actions, Route Handlers   |
| **UI Library**         | **React 19**                 | `useTransition`, `useDeferredValue`, `useActionState`, Actions API          |
| **Language**           | **TypeScript 5.9** (ESM)     | Strict mode, Zero-Assertion Policy (`typescript-avoid-type-assertions`)     |
| **Styling**            | **Tailwind CSS v4**          | Dynamic numeric scale, CSS design tokens, `tw-animate-css`                  |
| **Primitives**         | **Base UI & Radix UI**       | Accessible headless primitives (`@base-ui/react`, `cmdk`, `lucide-react`)   |
| **Forms & Validation** | **React Hook Form + Zod v4** | Uncontrolled inputs, `@hookform/resolvers/zod`, domain-separated schemas    |
| **Server Actions**     | **`next-safe-action` (v8)**  | Type-safe action client with Standard Schema and context middleware         |
| **Authentication**     | **NextAuth v4**              | Google OAuth provider, Credentials provider with `bcryptjs`, Prisma adapter |
| **Database & ORM**     | **PostgreSQL + Prisma 7**    | Relational data model with `@prisma/adapter-pg` driver adapter              |
| **Web Scraping**       | **Cheerio + ZenRows**        | Schema.org JSON-LD parsing, OpenGraph extraction, SSRF security guards      |

---

## 🧪 Testing Suite & Quality Assurance

TrueReview maintains a comprehensive multi-layer automated testing pipeline:

```
tests/
├── unit/                 # 41 test suites (252 tests)
│   ├── auth/             # useAuthGatedSubmit, useEnsureAuthenticated
│   ├── hooks/            # useIsMobile, useProductScrape
│   ├── scraper/          # zenrowsClient
│   ├── storage/          # ttlStorage, reviewDraftStorage
│   └── *.test.ts(x)      # StarRating, ResponsiveDateTime, FormFieldCard, ProductAtomicFields, formatters, etc.
├── integration/          # 27 test suites (141 tests)
│   ├── api/              # Route handlers (registration, auth)
│   ├── auth/             # Register, SignIn, SignOut
│   ├── dashboard/        # Dashboard
│   ├── home/             # HomePage
│   ├── navigation/       # TopMenu
│   ├── products/         # ProductDetails, CombinedProductReviewForm, ProductFields, catalog, creations
│   ├── reviews/          # reviewCreate
│   ├── search/           # AsyncSearch
│   ├── serverActions/    # productsGet, productGetById, recentReviewsGet, reconstructRatings, etc.
│   └── ui/               # ComboboxResponsive
└── e2e/                  # Playwright browser automation
    ├── helpers/          # Test drivers, authentication helpers, database cleanup
    └── specs/            # Full end-to-end user journeys (review creation, auth redirection)
```

### Testing Capabilities

- **Accessible Contract Testing:** Tests query elements strictly via accessible semantic roles (`screen.getByRole`) and assert on accessible states (`toBeDisabled()`, `toHaveAttribute("aria-selected")`) rather than CSS classes or DOM internals.
- **Direct Server Action Testing:** Actions built with `next-safe-action` are tested directly as async functions, asserting `result.data`, `result.serverError`, and `result.validationErrors` without spin-up HTTP overhead.
- **Mock Service Worker (MSW) & Vitest:** Reliable external API simulation and timer control (`vi.useFakeTimers()`).

---

## 🚀 Getting Started & Local Setup

### Prerequisites

- **Node.js:** `>= 20.0.0`
- **Package Manager:** `pnpm` (`>= 9.0.0`)
- **Database:** Running PostgreSQL instance (local or hosted, e.g., Supabase, Neon)

### 1. Clone the Repository

```bash
git clone https://github.com/reno126/iiwi.git
cd iiwi
```

### 2. Install Dependencies

```bash
pnpm install
```

### 3. Configure Environment Variables

Create a `.env.local` file in the project root:

```env
# Database connection
DATABASE_URL="postgresql://user:password@localhost:5432/iiwi_db?schema=public"

# NextAuth configuration
NEXTAUTH_SECRET="your-secure-random-secret-key"
NEXTAUTH_URL="http://localhost:3000"

# Google OAuth (Optional for local credentials-only testing)
GOOGLE_CLIENT_ID="your-google-client-id"
GOOGLE_CLIENT_SECRET="your-google-client-secret"

# Optional ZenRows Scraper API Key (for proxy web scraping)
ZENROWS_API_KEY=""
```

### 4. Initialize Database

```bash
# Generate Prisma Client
pnpm prisma:generate

# Apply migrations
pnpm prisma:migrate

# Seed popular stores/merchants
pnpm shops:seed
```

### 5. Start Development Server

```bash
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000) to view the application.

---

## 🤖 AI Agents & Architecture Guidelines (`AGENTS.md`)

This repository strictly enforces coding standards and architectural principles following **Progressive Disclosure** rooted in [`AGENTS.md`](./AGENTS.md). The root guide defines universal core rules, while specialized domain manuals reside in [`docs/`](./docs):

### Universal Core Rules
- **AST Architecture Verification:** Enforced via `pnpm verify:rules` (`scripts/verifyAgentRules.ts`) with 0 tolerance for violations.
- **Zero Comments Policy:** Strictly forbidden to use any inline comments in source code, components, utilities, or test files. Enforced by AST.
- **Zero Single-Letter Identifiers:** Descriptive domain naming mandatory everywhere (e.g. `savedDraft`, `product`, `actionResult`). Pure loop counters (`i`) are the only exception.

### Specialized Architecture Manuals
- [**Component Architecture & ARIA Contracts**](./docs/components.md) — Base UI / shadcn first, colocation (`_components`), props templates, accessible contracts (`role="meter"`, `data-state`).
- [**Forms, State & Schemas**](./docs/forms-and-state.md) — React Hook Form + Zod, `useState` elimination, context value memoization, auth drafts.
- [**Styling, Mobile & Performance**](./docs/styling-and-performance.md) — Tailwind v4 dynamic scale, mobile field islands, Core Web Vitals (LCP, CLS, INP, FCP).
- [**Testing Standards**](./docs/testing.md) — Accessible semantic testing, error dictionaries, server action testing, hook testing.

---

## 📜 Available Scripts

| Command                    | Description                                                   |
| :------------------------- | :------------------------------------------------------------ |
| `pnpm dev`                 | Starts the Next.js development server with Turbopack          |
| `pnpm build`               | Builds the production application                             |
| `pnpm start`               | Starts the production server                                  |
| `pnpm verify:rules`        | Verifies AGENTS.md architectural rules and AST conventions    |
| `pnpm typecheck`           | Runs TypeScript type checking (`tsc --noEmit`)                |
| `pnpm lint`                | Runs ESLint verification                                      |
| `pnpm test`                | Runs the full Vitest suite (all unit and integration tests)   |
| `pnpm test:unit`           | Runs only unit tests                                          |
| `pnpm test:integration`    | Runs only integration tests                                   |
| `pnpm test:e2e`            | Runs Playwright end-to-end browser tests                      |
| `pnpm prisma:migrate`      | Applies development database migrations                       |
| `pnpm prisma:studio`       | Launches interactive Prisma Studio database viewer            |
| `pnpm shops:seed`          | Seeds default physical and online stores into the database    |
| `pnpm ratings:reconstruct` | Recalculates and synchronizes aggregate product review scores |

---

## 📄 License

Private repository. All rights reserved.
