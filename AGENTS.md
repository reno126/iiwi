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

   - Inside `useEffect` or complex handlers, wrap logic in clear named functions instead of anonymous closures or procedural blocks:
     - `scrollToReviewFormIfDraftExists()`
     - `focusDescriptionFieldIfRequested()`
     - `executeDebouncedSearch()`

3. **Named Predicates over Procedural Logic:**
   - Replace complex regexes, IP ranges, or conditional checks with named boolean predicate functions:
     - `isLoopbackIPv4()`
     - `isPrivateRFC1918()`
     - `stripLeadingWww()`
     - `ensureHttpProtocolPrefix()`
     - `compareShopsByCandidatePriority()`

---

## 4. Component Architecture, Reuse & Separation of Concerns (SoC)

1. **Component Reuse & shadcn UI First Policy (Anti-Duplication):**

   - **The Golden Rule:** Never write ad-hoc HTML + Tailwind (`<div className="...">`, `<span className="...">`, raw `<button>`) for ANY element that fulfills a recognized UI role. If a primitive exists in `components/ui/` (or in the shadcn registry), you MUST use it.
   - **Audit Existing Components First:** When creating or extending any feature, always check `components/` (and the current route's `_components/`) to reuse existing components before writing custom UI markup.
   - **Shadcn UI Generation over Custom Primitives:** If no existing project component fits, check the available shadcn UI component registry before building custom primitives. Prefer generating or adding an official shadcn/base-ui component (`npx shadcn add <component>`).
   - **Strictly Banned Ad-Hoc HTML Patterns (by Category):**
     - _Containers & Structure:_
       - **Cards / Boxes / Panels:** Strictly forbidden to write ad-hoc markup like `<div className="flex flex-col items-center justify-center p-4 rounded-xl border bg-white ...">` to build a card or boxed container. Always import and use `<Card>` from `@/components/ui/card`.
       - **Dividers:** Do not write `<div className="h-[1px] w-full bg-border" />` — use `<Separator>` from `@/components/ui/separator`.
       - **Scroll Areas:** Do not write `<div className="overflow-y-auto max-h-...">` — use `<ScrollArea>` from `@/components/ui/scroll-area`.
       - **Tabs:** Do not write manual button strips with active index state — use `<Tabs>` from `@/components/ui/tabs`.
       - **Collapsibles:** Do not write manual `useState` toggling a content div — use `<Collapsible>` from `@/components/ui/collapsible`.
     - _Overlays & Popups (Zero Custom Overlay Markup):_
       - **Modals & Dialogs:** Strictly forbidden to write `<div className="fixed inset-0 bg-black/50...">` with manual z-index or event listeners — use `<Dialog>`, `<Sheet>`, or `<Drawer>` from `@/components/ui/`.
       - **Dropdowns & Context Menus:** Do not write manual `absolute mt-2` popups with local state — use `<DropdownMenu>` from `@/components/ui/dropdown-menu`.
       - **Popovers & Float Content:** Use `<Popover>` from `@/components/ui/popover`.
       - **Hover Tooltips:** Do not write CSS `group-hover:visible` hacks — use `<Tooltip>` from `@/components/ui/tooltip`.
     - _Feedback, States & Status:_
       - **Alerts & Error Banners:** Do not write `<div className="p-3 rounded-lg bg-destructive/10 border ...">` — use `<Alert>` from `@/components/ui/alert`.
       - **Loading Spinners:** Do not write inline SVGs with `animate-spin` or CSS border spinners — use `<Spinner>` from `@/components/ui/spinner`.
       - **Skeletons:** Do not write ad-hoc `<div className="animate-pulse bg-muted ...">` — use `<Skeleton>` from `@/components/ui/skeleton`.
       - **Empty States:** Use `<Empty>` from `@/components/ui/empty` instead of hand-crafted empty state boxes.
       - **Badges / Pills / Tags:** Do not write custom rounded-full spans — use `<Badge>` from `@/components/ui/badge`.
       - **Progress Bars:** Do not write nested divs with inline percentage widths — use `<Progress>` from `@/components/ui/progress`.
     - _Actions, Inputs & Identity:_
       - **Buttons:** Do not write custom `<button className="...">` or `<a className="...">` — use `<Button>` or `<Link className={buttonVariants()}>` from `@/components/ui/button`.
       - **Form Controls:** Do not write raw unstyled HTML form elements with ad-hoc classes — use `<Input>`, `<Textarea>`, `<Checkbox>`, `<RadioGroup>`, `<Select>`, and `<Label>` from `@/components/ui/`.
       - **User Avatars & Initials:** Do not write custom rounded-full image/initials divs — use `<Avatar>` from `@/components/ui/avatar`.

2. **Offline Inventory of UI Components & Primitives:**

   - **Already Installed in Project (`components/ui/`):**
     - _Layout & Structure:_ `Card` (`card.tsx`), `Separator` (`separator.tsx`), `ScrollArea` (`scroll-area.tsx`), `Collapsible` (`collapsible.tsx`), `Tabs` (`tabs.tsx`)
     - _Forms & Inputs:_ `Button` (`button.tsx`), `Input` (`input.tsx`), `Textarea` (`textarea.tsx`), `Checkbox` (`checkbox.tsx`), `RadioGroup` (`radio-group.tsx`), `Select` (`select.tsx`), `Label` (`label.tsx`), `Field` (`field.tsx`), `FormFieldCard` (`form-field-card.tsx`), `ComboboxResponsive` (`combobox-responsive.tsx`), `Command` (`command.tsx`)
     - _Feedback & Overlays:_ `Dialog` (`dialog.tsx`), `Drawer` (`drawer.tsx`), `Sheet` (`sheet.tsx`), `Popover` (`popover.tsx`), `Tooltip` (`tooltip.tsx`), `DropdownMenu` (`dropdown-menu.tsx`), `Alert` (`alert.tsx`), `Badge` (`badge.tsx`), `Avatar` (`avatar.tsx`), `Empty` (`empty.tsx`), `Progress` (`progress.tsx`), `Skeleton` (`skeleton.tsx`), `Spinner` (`spinner.tsx`)
   - **Available in shadcn Registry (Install via `npx shadcn add <name>`):**
     - `accordion`, `alert-dialog`, `aspect-ratio`, `breadcrumb`, `calendar`, `carousel`, `chart`, `context-menu`, `hover-card`, `input-otp`, `menubar`, `navigation-menu`, `pagination`, `resizable`, `sidebar`, `slider`, `sonner`, `switch`, `table`, `toggle`, `toggle-group`.

3. **Component Decomposition (> 100 Lines Rule):**

   - Keep components focused and maintainable. Any component approaching or exceeding 100 lines must be audited for decomposition:
     - Extract stateful logic, network requests, debouncing, and timers into custom hooks (e.g. `useAsyncSearch`, `useProductUrlScraper`, `useAuthGatedSubmit`).
     - Extract distinct presentation blocks into atomic subcomponents (e.g. `SearchInputBar`, `SearchResultsList`, `SearchEmptyState`).
     - Keep the parent component as a clean, declarative orchestrator.

4. **Component Colocation Rules:**

   - **Page-Specific Components:** Place components specific to a single route inside a local `_components/` directory within that route (e.g. `app/login/_components/SignIn.tsx`, `app/produkty/_components/ProductListItemCard.tsx`).
   - **Shared Components:** Only general-purpose primitives used across multiple routes belong in the root `components/` directory (e.g. `components/search/`, `components/reviews/`, `components/ui/`).

5. **Component Template & Props Rules:**
   - **Components with Props:**
     - Define props using `interface ComponentNameProps`.
     - Export using `export function ComponentName({ prop }: ComponentNameProps)`.
   - **Components without Props:**
     - Strictly forbidden to define empty interfaces (e.g. `interface PageProps {}`) or pass `{}: PageProps`.
     - Omit the interface and props argument completely:
       `export function Page() { ... }`

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

---

## 6. Zod Schema & Validation Conventions

1. **Domain File Separation:**

   - Split schemas into dedicated domain files in `schemas/` (e.g. `schemas/product.ts`, `schemas/review.ts`, `schemas/login.ts`, `schemas/register.ts`, `schemas/shop.ts`).
   - Avoid monolithic schema files.

2. **Naming Conventions:**
   - **Schema Constants (Values):** Always use `camelCase` ending with `Schema` (e.g. `productCreateSchema`, `reviewCreateSchema`, `loginSchema`). PascalCase schema constants are strictly forbidden.
   - **Inferred Types:** Always use `PascalCase` ending with `Input` (e.g. `ProductCreateInput`, `ReviewCreateInput`, `LoginInput`).

---

## 7. Testing Standards & Conventions

1. **Single Source of Truth for Error Messages & Text (No Magic Literals):**

   - Never duplicate hardcoded string literals across test files.
   - Export validation error dictionaries from schemas (e.g. `PRODUCT_ERRORS`, `REVIEW_ERRORS`, `REGISTER_ERRORS`, `LOGIN_ERRORS`, `AUTH_ERROR_MESSAGES`).
   - In assertions, always reference these imported dictionary constants instead of raw magic strings.

2. **Feature-Driven & Accessible Contract Testing:**

   - Test user-observable behavior and accessibility contracts rather than CSS classes, internal slots, or implementation details.
   - Prefer querying elements by accessible semantic roles:
     - `screen.getByRole("button", { name: /zaloguj/i })`
     - `screen.getByRole("textbox", { name: /e-mail/i })`
     - `screen.getByRole("navigation", { name: /nawigacja stronami/i })`
   - Assert accessible states: `toBeDisabled()`, `toHaveAttribute("aria-current", "page")`, `toHaveAttribute("aria-disabled", "true")`.
   - Never query styling classes (`.form-item`, `.card-title`) or component slots (`[data-slot]`).

3. **Direct Server Action Testing (`safe-action-testing`):**

   - Test `next-safe-action` server actions directly as async functions.
   - Assert `result.data`, `result.serverError`, and `result.validationErrors` without spinning up HTTP servers.

4. **Hook Testing via `renderHook`:**
   - Isolate stateful hooks (`useAuthGatedSubmit`, `useProductScrape`, `useIsMobile`) using `renderHook` from `@testing-library/react`.
   - Use fake timers (`vi.useFakeTimers()`) to verify delay thresholds and timer cleanups.

---

## 8. Tailwind CSS v4 & Styling Standards

1. **Dynamic Numeric Scale over Arbitrary Bracket Syntax:**

   - Use Tailwind v4 native dynamic numeric scales for all spacing, sizing, layout, and positioning (e.g. `p-4`, `max-w-2xl`, `size-5`, `gap-3`).
   - Avoid arbitrary bracket syntax (e.g. `p-[16px]`, `w-[320px]`).

2. **Semantic Design Tokens:**
   - Always use semantic color classes (`bg-background`, `text-foreground`, `text-muted-foreground`, `border-border`, `text-primary`) to ensure dark/light theme consistency.

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
