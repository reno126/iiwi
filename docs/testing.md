# Testing Standards & Conventions

## 1. Accessible Contract Testing
- Query elements by accessible semantic roles: `screen.getByRole("button")`, `screen.getByRole("meter")`.
- Assert accessible states: `toBeDisabled()`, `toHaveAccessibleName(...)`, `toHaveAttribute("aria-valuenow", ...)`, `toHaveAttribute("data-state", "filled")`.
- Strictly forbidden to query styling classes (`.form-item`, `.card-title`) or component slots (`[data-slot]`).

## 2. Single Source of Truth for Error Messages (No Magic Literals)
- Validation errors and UI copy:
  - Export validation error dictionaries from schemas (e.g. `PRODUCT_ERRORS`, `REVIEW_ERRORS`).
  - Export accessible UI text and label generators from components (e.g. `STAR_RATING_MESSAGES`).
  - In assertions, reference imported dictionary constants instead of raw magic strings.
- *Allowed Exception:* Local mock test data created within the test arrangement (`arrange`) may be asserted directly as literals in `assert` (e.g. `<Component name="Stone" />; expect(screen.getByText("Stone")).toBeInTheDocument()`).

## 3. Direct Server Action Testing
- Test `next-safe-action` server actions directly as async functions.
- Assert `result.data`, `result.serverError`, and `result.validationErrors` without spinning up HTTP servers.

## 4. Hook Testing
- Isolate stateful hooks using `renderHook` from `@testing-library/react`.
- Use fake timers (`vi.useFakeTimers()`) to verify delay thresholds and timer cleanups.
