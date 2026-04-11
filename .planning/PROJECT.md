# SmartStock

## What This Is

A production-ready, self-serve inventory and demand-planning product tailored for cafés, bakeries, and small retailers. It helps businesses manage stock locally and integrates AI for forecasting and purchase planning.

## Core Value

Empowering small retail owners with reliable inventory tracking and intelligent reorder suggestions to prevent stockouts and cut down on wastage.

## Requirements

### Validated

- ✓ **F-05 Deployability baseline** — App runs locally, TS errors contained.
- ✓ **F-01 Auth/workspace bootstrap** — Basic auth and workspace creation, tenant isolation.
- ✓ **F-02 Inventory operations** — Full stock CRUD, adjustments, wastage recording, stock movement history.
- ✓ **F-03 Sales + recipe deduction** — Product-to-recipe links, auto-deduction on sales.

### Active

- [ ] **F-06 Supplier/PO flow** — Supplier management, draft/send POs, receive/update stock.
- [ ] **F-04 Forecast/reorder engine v1** — AI/Data snapshots, 7/14/30-day forecast windows, reorder logic with lead times.
- [ ] **F-07 Alert inbox** — Actionable inbox for warnings/anomalies with resolution tools.
- [ ] **F-09 Self-serve onboarding** — Guided first-value flow and demo workspace.
- [ ] **F-08 Reports/export** — Valuation, wastage, sales, and forecast accuracy CSVs.
- [ ] **F-10 Multi-location support** — Scoped inventory, transfers, mobile count UI.
- [ ] **F-11 Integrations** — POS inbound syncs, accounting outbound exports.

### Out of Scope

- [ ] **F-13 AI Copilot** — Kept as future vision; prioritize UI/core workflows now.
- [ ] **F-12 Event-Sourced / Microservices Rewrite** — Do not start unless throughput or scale inherently break the Convex monolith.

## Context

- **Tech Stack Environment**: Built closely coupling Next.js 15 (App Router) and Convex Backend + Better Auth.
- **Workflow State**: The primitive operational database (CRUD inventory, sales deduction) is largely validated and built. Next major jumps move from operational recording toward intelligence (POs, forecasting, reporting).

## Constraints

- **Tech**: Stay on Next.js + Convex. Avoid microservices.
- **Process**: Feature is only done when validated, documented, and safe.
- **Sequence**: Ship the operational workflow first, then forecasting, then scale.

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| Next.js + Convex | Accelerates DX by giving serverless DB reactively | — Pending |
| Build op workflows before AI | AI forecasting needs clean, reliable data generation first | — Pending |

## Evolution

This document evolves at phase transitions and milestone boundaries.

**After each phase transition** (via `/gsd-transition`):
1. Requirements invalidated? → Move to Out of Scope with reason
2. Requirements validated? → Move to Validated with phase reference
3. New requirements emerged? → Add to Active
4. Decisions to log? → Add to Key Decisions
5. "What This Is" still accurate? → Update if drifted

**After each milestone** (via `/gsd-complete-milestone`):
1. Full review of all sections
2. Core Value check — still the right priority?
3. Audit Out of Scope — reasons still valid?
4. Update Context with current state

---
*Last updated: 2026-04-11 after initialization*
