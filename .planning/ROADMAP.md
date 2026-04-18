# Roadmap

> **Goal:** turn SmartStock into a production-ready, self-serve inventory and demand-planning product for cafés, bakeries, and small retailers.

## Phase 1: MVP Foundation & Deployability
**Goal:** Ensure the app deploys safely and core auth/DB features act as a solid skeleton.
- [x] F-05 Deployability & Quality Baseline (Linting, Environment, Demo)
- [x] F-01 Real Auth + Workspace Bootstrap (Better Auth, multi-tenancy)

***

## Phase 2: Operations & Data Deductions
**Goal:** Finalize the manual inventory workflows and automated tracking via recipe linkages.
- [x] F-02 Complete Inventory Operations (CRUD, Adjustments, Wastage)
- [x] F-03 Sales Capture with Recipe/BOM Deduction (Automated decrements, Margin Visibility)

***

## Phase 3: Suppliers & Forecasting Engine
**Goal:** Hook purchasing into the system dynamically utilizing the AI engine.
- [ ] F-06 Supplier and Purchase-Order Workflow (Drafts, Receipts, Auto-Stock)
  - [x] Supplier directory and vendor performance view
  - [ ] Draft purchase orders, send flow, and receipt handling
  - [ ] PO receipt auto-increments inventory stock
- [ ] F-04 Forecasting + Reorder Engine v1 (7/14/30 snapshots, algorithm suggestions)
  - [x] Forecasting dashboard with 7/14/30-day views
  - [x] Purchase planning recommendations with accept/dismiss actions
  - [ ] Confidence flags and warning quality signals fully wired into reorder workflow

***

## Phase 4: Workflow Streamlining
**Goal:** Support triaging of anomalies and smooth adoption for new users via onboarding.
- [ ] F-07 Alert Inbox and Anomaly Triage (Resolution tracking, anomaly flags)
  - [x] Alert inbox UI with filters, assignment, resolve, and reopen flows
  - [ ] Broader anomaly coverage and production-grade alert generation polish
- [ ] F-09 Self-Serve Onboarding and Demo Workspace (First-value flow, sample data)
  - [x] Workspace bootstrap onboarding flow
  - [ ] Demo workspace/sample data and transition-to-live flow

***

## Phase 5: Scale & Export
**Goal:** Support larger operations via multi-location and exporting.
- [ ] F-08 Reports and Export Pack (Valuation, CSV dump)
- [ ] F-10 Multi-Location and Mobile Count Support (Transfers, App views)
- [ ] F-11 Integrations Hub for POS, Ecommerce, and Accounting (Syncs)

***

## Phase 99: Future
**Goal:** Theoretical roadmap entries explicitly deferred.
- [ ] F-13 In-Product AI Operations Copilot
- [ ] F-12 Event-Sourced / Microservices Rewrite
