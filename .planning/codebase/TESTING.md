# Testing

## Current Setup
- A `tests/` directory exists, but currently no major test runner (like Jest or Playwright) is visible in the `package.json` dependencies.
- Linting is managed via ESLint (`eslint.config.mjs`) and Next.js config.
- TypeScript compilation acts as a static typing check (`ts_errors.txt` suggests TypeScript error monitoring).

## Recommendations
- Implement unit tests for complex backend logic (invoking Convex functions) using standard testing frameworks adapted for Convex.
- Enable end-to-end (E2E) UI tests relying on mocked state or a robust staging environment.
