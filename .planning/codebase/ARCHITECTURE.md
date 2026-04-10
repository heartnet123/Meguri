# Architecture

The application is structured as a fullstack TypeScript monolith split between the frontend and a serverless backend.

## Frontend
- Built on Next.js 15 using the App Router (`app/` directory).
- Uses React 19 features with server and client components.
- State and data fetching are handled by Convex hooks (via reactive queries).

## Backend
- Powered by Convex. The `convex/` directory contains all backend logic.
- **Data Model**: Defined in `convex/schema.ts` (with Better Auth schema in `convex/betterAuth/schema.ts`).
- **Core Entities**: Inventory, Products, Purchase Planning, Sales, Workspaces, Users, Alerts, Forecasting.
- Functions are split into queries (read-only) and mutations (write-enabled). Internal functions reside in individual files.

## Authentication
- Better Auth hooks into the Convex backend for session management and user identities, securing both API routes and client views.
