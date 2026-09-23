<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

# TrueReview (iiwi) - Agent Guidelines & Architecture Manual

This document is the single source of truth for all AI agents and developers working on the TrueReview (`iiwi`) codebase. Follow all rules, architectural principles, and conventions defined below without exception.

---

## 1. Project Overview & Tech Stack

- **Framework:** Next.js 16 (App Router), React 19, TypeScript (ESM, `"type": "module"`).
- **Database & ORM:** PostgreSQL, Prisma (`@prisma/client`, `@prisma/adapter-pg`).
- **Server Actions:** `next-safe-action` (v8) with `safeActionUserCtx` and Standard Schema (Zod).
- **Authentication:** NextAuth v4 (Google OAuth + Credentials with bcryptjs).
- **Styling:** Tailwind CSS v4, Base UI / shadcn.
- **Forms & Validation:** React Hook Form + Zod (`@hookform/resolvers/zod`).
- **Testing:** Vitest 4, React Testing Library, `@testing-library/user-event`, Playwright.

---

## 2. Standard Development & Verification Commands

Always run verification commands before completing any task:

- `npm run typecheck` - TypeScript type checking (`tsc --noEmit`). Must pass with 0 errors.
- `npm run lint` - ESLint verification (`eslint`). Must pass with 0 errors/warnings.
- `npm run test:unit` - Unit test suite (`vitest run tests/unit`).
- `npm run test:integration` - Integration test suite (`vitest run tests/integration`).
- `npm run test` - All unit and integration tests combined.
- `npm run test:e2e` - Playwright end-to-end tests.
- `npm run prisma:generate` - Regenerate Prisma client.
- `npm run prisma:migrate` - Apply database migrations in development.

---

## 3. Code Cleanliness & "Self-Descriptive Code" (Zero Comments Policy)

The codebase strictly follows a **Zero Comments Policy**:

1. **No Code Comments:**

   - Do not use comments in any source code, component, utility, or test file.
   - Code must read like natural language and be 100% self-descriptive through expressive naming.

2. **Named Functions over Anonymous Blocks:**

   - Inside `useEffect` or complex handlers, wrap logic in clear named functions instead of anonymous closures or procedural blocks, 
   e.g.`scrollToReviewFormIfDraftExists()`

3. **Named Predicates over Procedural Logic:**
   - Replace complex regexes, IP ranges, or any complex conditional checks with named boolean predicate functions, 
   e.g. `isLoopbackIPv4()`, `compareShopsByCandidatePriority()`

4. **Strict Prohibition of Single-Letter & Cryptic Identifiers:**
   - **Zero Single-Letter Variables:** Strictly forbidden to declare or use single-letter variable names (e.g. `const d = ...`, `const p = ...`, `const r = ...`, `(e) => ...`) for domain models, draft objects, state, entities, handlers, or parameters.
   - **Domain-Descriptive Naming:** All identifiers must explicitly communicate their domain meaning and identity (e.g. `savedDraft` instead of `d`, `product` instead of `p`, `rating` instead of `r`, `event` instead of `e`, `actionResult` instead of `res`).
   - **Allowed Exception:** Pure numeric counters in standard for-loops (`for (let i = 0; i < length; i++)`) where the index carries zero business or domain meaning. Everywhere else, full descriptive naming is strictly mandatory.

---

## 4. Component Architecture, Reuse & Separation of Concerns (SoC)

1. **Component Hierarchy & Directory Structure:**
   - **`components/ui/` (Design System Primitives):**
     - Low-level, domain-agnostic presentation primitives built on Base UI and shadcn.
     - Covers layout structure, typography, navigation, form controls, overlays, and feedback/status.
     - Strictly presentational and reusable across any domain. Contains zero business logic, server actions, or database calls.
   - **`components/<domain>/` (Shared Domain Components):**
     - Reusable feature blocks and composite domain components consumed across more than one route (e.g. `components/reviews/`, `components/products/`).
     - Constructed by composing `components/ui/` primitives with domain models, formatters, and client handlers.
   - **`app/**/_components/` (Route-Specific Components):**
     - View orchestrators, composite sections, and subcomponents exclusive to a single page or route (e.g. `app/login/_components/SignIn.tsx`, `app/produkty/_components/ProductListItemCard.tsx`).
     - Strictly forbidden to import across different page directories.

2. **Base UI & shadcn First Policy (Strict Anti-Duplication):**
   - **Zero Ad-Hoc HTML:** Strictly forbidden to write ad-hoc HTML + Tailwind (`<div className="...">`, `<span className="...">`, raw `<button>`) for any UI role that maps to a design system primitive (containers, cards, dividers, headings, dialogs, dropdowns, tooltips, alert banners, loading spinners, skeletons, empty states, badges, buttons, form controls).
   - **Primitive Selection & Generation Workflow:**
     1. **Audit `components/ui/` first:** Always inspect existing primitives in `components/ui/` before building any UI element.
     2. **Add from registry if missing:** If no existing primitive covers the requirement, check the official shadcn / Base UI registry and install it via `npx shadcn add <component>`.
     3. **Compose over custom HTML:** Construct domain and route-level components by composing these primitives to ensure consistent design tokens, keyboard navigation, and accessibility contracts.

3. **Component Decomposition (> 100 Lines Rule):**
   - Keep components focused and maintainable. Any component approaching or exceeding 100 lines must be audited for decomposition:
     - Extract stateful logic, network requests, debouncing, and timers into custom hooks (e.g. `useAsyncSearch`, `useProductScrape`, `useAuthGatedSubmit`).
     - Extract distinct presentation blocks into atomic subcomponents (e.g. `SearchInputBar`, `SearchResultsList`, `SearchEmptyState`).
     - Keep the parent component as a clean, declarative orchestrator.

4. **Component Colocation Rules:**
   - **Page-Specific Components:** Place components specific to a single route inside a local `_components/` directory within that route (e.g. `app/login/_components/SignIn.tsx`, `app/produkty/_components/ProductListItemCard.tsx`).
   - **Shared Components:** Only general-purpose primitives used across multiple routes belong in the root `components/` directory (e.g. `components/search/`, `components/reviews/`, `components/ui/`).
   - **Direct Imports & No Barrel Re-Exports:** Avoid creating intermediate or redundant barrel `index.ts` files that merely re-export components across layers. Components must be imported directly from their defining module paths.

5. **Component Template & Props Rules:**
   - **Components with Props:**
     - Define props using `interface ComponentNameProps`.
     - Export using `export function ComponentName({ prop }: ComponentNameProps)`.
   - **Components without Props:**
     - Strictly forbidden to define empty interfaces (e.g. `interface PageProps {}`) or pass `{}: PageProps`.
     - Omit the interface and props argument completely:
       `export function Page() { ... }`

6. **Accessible-First & Testable Component Contract (ARIA & Semantic Roles):**
   - **W3C ARIA Roles for Custom & Evaluated Widgets:**
     - Any custom UI component or widget representing a recognizable semantic pattern (e.g. rating, progress bar, meter, status indicator, radio group) that does not map directly to a native interactive HTML element (`<button>`, `<input>`, `<select>`) must declare an explicit W3C ARIA `role` (e.g. `role="meter"`, `role="progressbar"`, `role="radiogroup"`, `role="status"`).
   - **Standard State & Value ARIA Attributes:**
     - Components must expose their domain values and states through standard ARIA attributes:
       - **Numeric & Range Values:** For ratings, meters, and progress: `aria-valuenow`, `aria-valuemin`, `aria-valuemax`, and optional `aria-valuetext`.
       - **Interactive States:** `aria-expanded`, `aria-selected`, `aria-checked`, `aria-disabled`.
       - **Accessible Identification:** Meaningful `aria-label` or `aria-labelledby` referencing an exported messages dictionary.
     - **Goal:** Components must be testable strictly via semantic accessibility contracts (e.g. `getByRole("meter")`, `toHaveAccessibleName(...)`, `toHaveAttribute("aria-valuenow", ...)`) without inspecting internal markup, CSS classes, or text nodes.
   - **Visual & Sub-Element States via `data-*` Attributes:**
     - Strictly forbidden to rely on styling classes (e.g. `.fill-amber-400`, `.active`) as indicators of state or as test targets.
     - Sub-element states (e.g. filled vs empty stars, active steps, current tabs) must be exposed via explicit `data-state` or `data-*` attributes (e.g. `data-state="filled" | "empty"`, `data-size="sm"`).
     - Tests must assert states using `toHaveAttribute("data-state", ...)` or `data-state` selectors.
   - **Single Source of Truth for Accessible Labels (`*_MESSAGES`):**
     - All dynamic or static `aria-label` generators and formatted values must be exported in a dedicated messages dictionary (e.g. `STAR_RATING_MESSAGES`, `RATING_INPUT_MESSAGES`) from the component file.
     - Tests must import and reference these dictionary functions/constants to prevent magic strings and duplicate literals.

---

## 5. Form & State Management Patterns

1. **React Hook Form + Zod:**

   - All interactive forms must use React Hook Form (`useForm`) integrated with `zodResolver(schema)`.

2. **Elimination of Redundant `useState`:**

   - Input values: Use uncontrolled inputs with `{...register("fieldName")}`.
   - Submission state: Use `formState.isSubmitting`. Do not manage manual `isSubmitting` state.
   - Server / API errors: Map server errors into `setError("root", { message })` and render `errors.root?.message`.

3. **React 19 `useTransition` for External Async Triggers:**

   - For asynchronous triggers outside form submission (e.g. Google OAuth `signIn`, scrape initiation), use React 19 `useTransition` instead of manual `useState` loading flags.

4. **Auth-Gated Submit & Draft Persistence:**
   - Form submission requiring authentication must follow the `useAuthGatedSubmit` + `reviewDraftStorage` pattern:
     - Check authentication via `useEnsureAuthenticated`.
     - If unauthenticated, save current form state to `localStorage` with TTL and redirect to `/login?callbackUrl=...`.
     - On login or registration, the return URL restores the user to their form draft.
     - Automatically intercept 401 unauthorized errors, refresh the session, and retry the action once before failing.
     - Clear the draft upon successful submission.

5. **Reference Stability & Context Hygiene:**
   - **Context Value Memoization:** Every object or array passed as the `value` prop to a `<Context.Provider>` must be memoized using `useMemo` (or sourced from a memoized hook return). Never pass inline unmemoized object literals (`value={{ ... }}` or `value={form}`).
   - **Action Handler Stability:** All callbacks exposed via context or passed as props to memoized components (`React.memo`) must be wrapped in `useCallback` with complete dependency arrays.
   - **Custom Hook Return Memoization:** When a custom hook exposes multiple handlers and state objects for consumption by context providers or memoized children, its return object must be wrapped in `useMemo`.
   - **No Inline Closures for Memoized Children:** Never pass inline arrow functions `() => ...` or fresh object references to components wrapped in `React.memo()`.

---

## 6. Zod Schema & Validation Conventions

1. **Domain File Separation:**

   - Split schemas into dedicated domain files in `schemas/` (e.g. `schemas/product.ts`, `schemas/review.ts`).
   - Avoid monolithic schema files.

2. **Naming Conventions:**
   - **Schema Constants (Values):** Always use `camelCase` ending with `Schema` (e.g. `productCreateSchema`, `reviewCreateSchema`). PascalCase schema constants are strictly forbidden.
   - **Inferred Types:** Always use `PascalCase` ending with `Input` (e.g. `ProductCreateInput`, `ReviewCreateInput`).

---

## 7. Testing Standards & Conventions

1. **Single Source of Truth for Error Messages & Text (No Magic Literals):**

   - Never duplicate hardcoded string literals across test files.
   - Export validation error dictionaries from schemas (e.g. `PRODUCT_ERRORS`, `REVIEW_ERRORS`).
   - In assertions, always reference these imported dictionary constants instead of raw magic strings.

2. **Feature-Driven & Accessible Contract Testing:**

   - Test user-observable behavior and accessibility contracts rather than CSS classes, internal slots, or implementation details.
   - Prefer querying elements by accessible semantic roles:
     - `screen.getByRole("button")`
   - If needed, narrow quering by imported dictionary constants, e.g. `getByLabelText(REVIEW_FIELDS_MESSAGES.descriptionLabel)`. The exception case is when the literal is created by test (as arrange) and when is expected in assert part. E.g. `<Component name="Stone"/>; expect(screen.getByText("Stone")).toBeInTheDocument();`
   - Assert accessible states: `toBeDisabled()`, `toHaveAttribute("aria-current", "page")`, `toHaveAttribute("aria-disabled", "true")`.
   - Never query styling classes (`.form-item`, `.card-title`) or component slots (`[data-slot]`).

3. **Direct Server Action Testing (`safe-action-testing`):**

   - Test `next-safe-action` server actions directly as async functions.
   - Assert `result.data`, `result.serverError`, and `result.validationErrors` without spinning up HTTP servers.

4. **Hook Testing via `renderHook`:**
   - Isolate stateful hooks (e.g. `useProductScrape`, `useIsMobile`) using `renderHook` from `@testing-library/react`.
   - Use fake timers (`vi.useFakeTimers()`) to verify delay thresholds and timer cleanups.

---

## 8. Tailwind CSS v4 & Styling Standards

1. **Dynamic Numeric Scale over Arbitrary Bracket Syntax:**

   - Use Tailwind v4 native dynamic numeric scales for all spacing, sizing, layout, and positioning (e.g. `p-4`, `max-w-2xl`, `size-5`, `gap-3`).
   - Avoid arbitrary bracket syntax (e.g. `p-[16px]`, `w-[320px]`).

2. **Semantic Design Tokens:**
   - Always use semantic color classes (e.g. `bg-background`, `text-foreground`) to ensure dark/light theme consistency.

---

## 9. Core Web Vitals (CWV) & Loading Performance

1. **LCP (< 2.5s) — Prioritize Critical Above-the-Fold Assets:**

   - Mark hero images with `priority` (`next/image`) and preload primary web fonts using `next/font`.
   - Never lazy-load the largest visible element above the fold.
   - Stream slow database queries using React `<Suspense>` boundaries to avoid blocking the initial document paint.

2. **CLS (< 0.1) — Zero Layout Shifts:**

   - Always reserve layout dimensions: define explicit `width`/`height` or CSS `aspect-ratio` on all images, embeds, and dynamic widgets.
   - Provide skeleton loaders that strictly match the final rendered container height (`min-h-*`).
   - Never inject banners, toasts, or dynamic content above existing visible text without user interaction.

3. **INP (< 200ms) — Responsive Main Thread:**

   - Defer non-urgent state updates using React 19 `startTransition` or `useTransition`.
   - Debounce search and high-frequency inputs (150–300ms).
   - Offload heavy transformations and keep click/tap handlers synchronous and lightweight.

4. **FCP (< 1.8s) & Bundle Hygiene:**
   - Avoid barrel-file imports; import utilities and icons directly from subpaths.
   - Dynamically import heavy, non-critical modals and client components (`next/dynamic`).
   - Load analytics, tag managers, and non-essential scripts post-hydration (`after()` or `strategy="afterInteractive"`).

---

## 10. Mobile-First Ergonomics & Form Field Islands

1. **Grouped "Field Islands" for Mobile Ergonomics:**

   - Organize related form fields into distinct, self-contained visual "islands" (card-like containers with `bg-card`, rounded corners, and subtle borders).
   - Divide complex forms into logical islands (e.g. Contact Island, Rating Island, Review Body Island) rather than a continuous wall of inputs.
   - On mobile screens (`< md`), expand islands to full container width (`w-full`) with comfortable internal spacing (`p-4` or `p-5`).

2. **Thumb-Zone & Touch Targets (>= 48px):**

   - Place primary action buttons (Submit, Next, Save) within the natural bottom thumb zone; use sticky bottom bars on mobile where appropriate.
   - Ensure all interactive elements (buttons, checkboxes, select triggers) have a minimum tap target of `48x48px` (`size-12` or `min-h-12`).

3. **iOS Zoom Prevention & Input Ergonomics:**

   - Always set mobile input font size to at least `16px` (`text-base md:text-sm`) to prevent iOS Safari from automatically zooming into the page on focus.
   - Specify appropriate `inputmode` (`numeric`, `email`, `tel`, `url`) and valid `autoComplete` attributes to summon the correct mobile keyboard.

4. **Virtual Keyboard & Viewport Stability:**
   - Avoid fixed-position footers that overlap focused inputs when the virtual keyboard expands.
   - Render error messages directly within the field island without causing unexpected viewport jumping.
