# Conventions

- **TypeScript Strictness**: Interfaces should be rigorously typed.
- **Styling**: Tailwind utility classes should be logically grouped using `clsx` and `twMerge`.
- **Backend Flow**: Always put database logic into `convex/` functions. Do not interact directly with a standard relational DB; use Convex's API.
- **Authentication**: Validate permissions at the frontend boundary and enforce at the backend via AuthContext / Convex Auth parameters.
- **UI Components**: Place isolated, reusable view logic in `app/components`.
- **Forecasting/AI**: Encapsulate AI calling into specific Convex Actions / logic wrappers (e.g., `forecasting.ts`).
