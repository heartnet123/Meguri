<div align="center">
  <img width="1200" height="475" alt="Meguri SmartStock banner" src="https://i.ibb.co/Nn9cp10p/hf-20260408-134813-9867711d-1240-40a9-b050-a393ba0687f8.png" />

  # Meguri (SmartStock)

  *The complete operational backbone for recipe-based businesses, inventory management, and smart retail.*

  [![TypeScript](https://img.shields.io/badge/TypeScript-5.9-blue?style=flat-square&logo=typescript&logoColor=white)](https://www.typescriptlang.org)
  [![Next.js](https://img.shields.io/badge/Next.js-15.4-black?style=flat-square&logo=next.js)](https://nextjs.org)
  [![Convex](https://img.shields.io/badge/Convex-1.35-ee3424?style=flat-square&logo=convex)](https://convex.dev)
  [![Better Auth](https://img.shields.io/badge/Better_Auth-1.5.3-purple?style=flat-square)](https://better-auth.com)
  [![Google Gemini](https://img.shields.io/badge/Google_Gemini-AI-8E75B2?style=flat-square&logo=google)](https://ai.google.dev)
  [![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-v4-06B6D4?style=flat-square&logo=tailwindcss)](https://tailwindcss.com)
  [![Vitest](https://img.shields.io/badge/Vitest-4.1-6E9F18?style=flat-square&logo=vitest)](https://vitest.dev)

  ⭐ If you like this project, star it on GitHub — it helps a lot!

  [Overview](#overview) • [Key Features](#key-features) • [Architecture](#architecture) • [Getting Started](#getting-started) • [Environment Variables](#environment-variables) • [Development Commands](#development-commands)

</div>

---

## Overview

**Meguri (SmartStock)** is a self-serve operational management platform built for cafés, bakeries, restaurants, and small retail businesses. It bridges the gap between raw inventory tracking, multi-ingredient recipe yields, point-of-sale sales execution, and predictive demand replenishment.

Traditional inventory management systems often track items in isolation without accounting for recipe consumption, supplier lead times, or unexpected demand spikes. SmartStock solves this by offering a real-time, multi-tenant backend that automatically recalculates inventory levels upon sale, triggers automated purchase order recommendations, and leverages Google Gemini AI for predictive demand forecasting.

> [!NOTE]
> **Serverless & Real-Time Foundation**
> SmartStock is built on top of [Next.js 15 App Router](https://nextjs.org) and [Convex](https://convex.dev), providing instant real-time data sync across all connected clients without polling or manual page refreshes.

---

## Key Features

- **Recipe-Based Stock Deduction**: Automatically deducts raw ingredients from inventory whenever a recipe product or bundle is sold, supporting custom batch yields and raw material mappings.
- **AI-Powered Demand Forecasting**: Uses Google Gemini (`@google/genai`) to analyze anonymized historical sales trends and predict inventory demand over 7, 14, and 30-day horizons with confidence scoring and fallback logic.
- **Multi-Tenant Workspaces & Role-Based Access (RBAC)**: Secure workspace isolation powered by Better Auth (`better-auth`) and Convex adapters, supporting Owner, Admin, Manager, Staff, and Viewer role tiers.
- **Automated Purchase & Reorder Planning**: Converts low stock alerts and predictive demand forecasts directly into structured Purchase Order recommendations linked to supplier lead times.
- **Supplier & Purchase Order Lifecycle**: Complete vendor directory management, supplier ratings, lead-time tracking, and end-to-end PO status tracking (`Draft` → `Sent` → `Pending` → `Received` → `Cancelled`).
- **Real-Time Priority Alert Center**: Automated alert engine flagging low stock levels, demand anomalies, price variations, and supplier delays across `Critical`, `High`, `Medium`, and `Low` severity levels.
- **Point-of-Sale (POS) & Sales Tracking**: Flexible sales transaction recording across cash, credit card, mobile payment, and invoice methods with instant margin and profit metrics.
- **Immutable Stock Movement Ledger**: Comprehensive audit trail capturing all deliveries, sales deductions, manual adjustments, wastage, transfers, and archive events.

---

## Architecture

SmartStock follows a modern serverless architecture separating client presentation, edge middleware protection, real-time database state, and AI inference.

```text
┌─────────────────────────────────────────────────────────────────────────────┐
│                           Next.js 15 Frontend                               │
│            (App Router, Tailwind CSS v4, Lucide React, Motion)              │
└──────────────────────────────────────┬──────────────────────────────────────┘
                                       │
                    ┌──────────────────┴──────────────────┐
                    ▼                                     ▼
      ┌───────────────────────────┐         ┌───────────────────────────┐
      │   Better Auth API Routes  │         │   Convex Real-Time API    │
      │    `/api/auth/[...all]`   │         │ (Queries, Mutations, HTTP)│
      └─────────────┬─────────────┘         └─────────────┬─────────────┘
                    │                                     │
                    └──────────────────┬──────────────────┘
                                       ▼
    ┌───────────────────────────────────────────────────────────────────┐
    │                      Convex Database Layer                        │
    │  Workspaces │ Users │ Inventory │ Recipes │ Sales │ POs │ Alerts  │
    └──────────────────────────────────┬────────────────────────────────┘
                                       │
                                       ▼
    ┌───────────────────────────────────────────────────────────────────┐
    │                     Google Gemini AI Services                     │
    │        `aiForecastingLogic.ts` - Structured Demand Analysis       │
    └───────────────────────────────────────────────────────────────────┘
```

> [!TIP]
> **Data Privacy in AI Workflows**
> Sales data passed to Google Gemini for demand forecasting is anonymized prior to model invocation (`anonymizeSalesData`), ensuring no sensitive customer or personal data leaves your workspace environment.

### Codebase Organization

```text
smartstock/
├── app/                      # Next.js App Router (Pages, Layouts & Components)
│   ├── (auth)/               # Login & Registration authentication routes
│   ├── (main)/               # Authenticated workspace dashboard & operational views
│   │   ├── alerts/           # Real-time alert center
│   │   ├── dashboard/        # Executive overview & KPIs
│   │   ├── forecasting/      # AI demand prediction & snapshots
│   │   ├── inventory/        # Raw material & stock ledger
│   │   ├── purchase-planning/# Reorder recommendations & PO creation
│   │   ├── recipes/          # Recipe composition & ingredient yields
│   │   ├── sales/            # POS transaction recording
│   │   └── suppliers/        # Vendor directory & lead-time tracking
│   └── api/auth/             # Better Auth Next.js route handlers
├── convex/                   # Backend database schema, mutations, queries & AI logic
│   ├── schema.ts             # Complete Convex database schema definitions
│   ├── betterAuth/           # Convex Better Auth database adapter & plugin logic
│   ├── aiForecastingLogic.ts # Zod schema & anonymization logic for Gemini API
│   ├── forecasting.ts        # AI demand forecasting mutations & queries
│   └── inventory.ts          # Core stock management & ledger operations
├── lib/                      # Shared client & server utilities, auth instances
├── tests/                    # Vitest test suite (edge-runtime & Convex testing)
└── public/                   # Static assets & favicon
```

---

## Getting Started

Follow these steps to set up SmartStock on your local machine.

### Prerequisites

Ensure you have the following installed:

- **Node.js**: v20.0.0 or higher
- **npm** or **bun**: Package manager
- **Convex Account**: Free tier account at [convex.dev](https://convex.dev)
- **Google Gemini API Key**: Obtainable from [Google AI Studio](https://aistudio.google.com/)

### Installation

1. **Clone the repository**:
   ```bash
   git clone https://github.com/heartnet123/Meguri.git
   cd Meguri
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Configure Environment Variables**:
   Copy the example environment file:
   ```bash
   cp .env.example .env.local
   ```
   Fill in your deployment credentials and API keys in `.env.local` (see [Environment Variables](#environment-variables)).

4. **Initialize Convex Backend**:
   Run the Convex development server to push schema and generate client code:
   ```bash
   npx convex dev
   ```

5. **Start Next.js Development Server**:
   In a separate terminal tab:
   ```bash
   npm run dev
   ```
   Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## Environment Variables

Configure the following environment variables in `.env.local`:

| Variable | Required | Description | Default / Example |
| :--- | :---: | :--- | :--- |
| `GEMINI_API_KEY` | Yes | Google Gemini API key for AI demand forecasting | `AIzaSy...` |
| `SITE_URL` | Yes | Public application URL used for auth redirects | `http://localhost:3000` |
| `NEXT_PUBLIC_SITE_URL` | Yes | Client-side mirror of `SITE_URL` | `http://localhost:3000` |
| `NEXT_PUBLIC_CONVEX_URL` | Yes | Convex deployment URL for client connection | `https://your-app.convex.cloud` |
| `CONVEX_DEPLOYMENT` | Yes | Convex deployment reference ID | `dev:your-app` |
| `NEXT_PUBLIC_CONVEX_SITE_URL` | Yes | Convex HTTP actions endpoint | `https://your-app.convex.site` |

> [!IMPORTANT]
> Keep your `GEMINI_API_KEY` and backend tokens confidential. Never commit `.env.local` or secret keys to source control.

---

## Development Commands

Use the following npm scripts during development and testing:

```bash
# Start local development server
npm run dev

# Run TypeScript type check
npm run typecheck

# Run ESLint validation
npm run lint

# Execute Vitest test suite
npm test

# Build production distribution
npm run build

# Start production server
npm run start
```
