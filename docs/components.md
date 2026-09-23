# Component Architecture & Accessible Contracts

## 1. Component Hierarchy & Organization
- `components/ui/`: Low-level, domain-agnostic presentation primitives built on Base UI and shadcn. Contains zero business logic, server actions, or database queries.
- `components/<domain>/`: Shared domain blocks and composite components consumed across multiple routes (e.g. `components/reviews/`, `components/products/`).
- `app/**/_components/`: Route-specific components exclusive to a single page or route. Strictly forbidden to import across different page directories.
- Avoid intermediate or redundant barrel `index.ts` files; components must be imported directly from their defining module paths.

## 2. Base UI & shadcn First Policy
- Strictly forbidden to write ad-hoc HTML for UI roles mapping to design system primitives (containers, cards, dividers, headings, dialogs, dropdowns, tooltips, alert banners, loading spinners, skeletons, empty states, badges, buttons, form controls).
- Audit `components/ui/` first; install missing primitives from registry via `pnpm dlx shadcn add <component>`.
- *Allowed Exception:* Raw native HTML elements (`<button>`, `<div>`, `<input>`) are permitted exclusively when implementing custom accessible ARIA widgets with explicit W3C ARIA roles (e.g. `RatingInput`, `StarRating`) where generic design system primitives cannot be applied.

## 3. Component Decomposition (> 100 Lines)
- Any component approaching or exceeding 100 lines must be audited for decomposition:
  - Extract stateful logic, network requests, debouncing, and timers into custom hooks.
  - Extract distinct presentation blocks into atomic subcomponents.
  - Keep the parent component as a declarative orchestrator.

## 4. Component Templates & Props
- Components with props:
  - Define props using `interface ComponentNameProps`.
  - Export using `export function ComponentName({ prop }: ComponentNameProps)`.
- Components without props:
  - Strictly forbidden to define empty interfaces (e.g. `interface PageProps {}`) or pass `{}: PageProps`.
  - Omit the interface and props argument completely: `export function Page()`.

## 5. Accessible-First & Testable Contracts (ARIA & Semantic Roles)
- Custom widgets (ratings, meters, progress, status, radio groups) must declare an explicit W3C ARIA `role` (e.g. `role="meter"`, `role="progressbar"`, `role="radiogroup"`, `role="radio"`).
- Expose values and states via standard ARIA attributes (`aria-valuenow`, `aria-valuemin`, `aria-valuemax`, `aria-checked`, `aria-expanded`).
- Sub-element states (e.g. filled vs. empty stars, active steps, current tabs) must be exposed via explicit `data-state` or `data-*` attributes (`data-state="filled" | "empty"`, `data-size="sm"`), never via styling classes.
- Export all dynamic/static `aria-label` generators in dedicated `*_MESSAGES` dictionaries from the component file.
