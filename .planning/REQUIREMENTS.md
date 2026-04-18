# Requirements

## v1 Requirements

### Authentication
- [x] **AUTH-01**: User can sign up, sign in, and sign out via Better Auth.
- [x] **AUTH-02**: First user can automatically create a workspace.
- [x] **AUTH-03**: User can invite additional users to a workspace.
- [x] **AUTH-04**: Workspace-level access control blocks cross-workspace data.

### Inventory
- [x] **INV-01**: User can create, edit, and archive inventory items.
- [x] **INV-02**: User can adjust stock levels and record wastage manually.
- [x] **INV-03**: System tracks historical stock movements.
- [x] **INV-04**: System flags low-stock statuses dynamically.
- [x] **INV-05**: Ensure role-based permissions enforce who can edit stock.

### Sales & Deductions
- [x] **SALE-01**: User can link products to a recipe/BOM (Bill of Materials).
- [x] **SALE-02**: Completing a sale automatically deducts corresponding ingredients.
- [x] **SALE-03**: Warning prevents sale if stock is insufficient.
- [x] **SALE-04**: Stock movements have traceability back to the parent sale.
- [x] **SALE-05**: Present visible margin and stock impacts directly in the sales UI.

### Suppliers & POs
- [x] **PO-01**: Basic supplier profile management.
- [x] **PO-02**: User can create and review purchase planning recommendations.
- [ ] **PO-03**: User can mark PO as sent and record receipt (including partials).
- [ ] **PO-04**: Receiving a PO automatically updates local inventory stock.

### Forecasting
- [x] **FORE-01**: System generates forecast snapshots from recent sales.
- [x] **FORE-02**: System calculates reorder recommendations utilizing lead times.
- [x] **FORE-03**: Produce 7, 14, and 30-day forecast windows.
- [ ] **FORE-04**: Provide manual refresh and show AI confidence/warning flags on the dashboard.

### Alerts
- [x] **WARN-01**: Aggregate stock levels and anomalies into an actionable Alert Inbox.
- [x] **WARN-02**: Allow filtering by severity/status and taking resolution notes.

### Onboarding
- [x] **ONB-01**: Guided flow for workspace bootstrap and first-run setup.
- [ ] **ONB-02**: Ability to seamlessly transition from demo data to live production space.

## v2 Requirements

### Reports
- [ ] **REP-01**: Stock valuation, sales by product, and wastage metrics.
- [ ] **REP-02**: Supplier performance analysis.
- [ ] **REP-03**: CSV export for all grid tables.

### Multi-Location
- [ ] **LOC-01**: Scoped inventory by location with stock transfer flows.
- [ ] **LOC-02**: Mobile-friendly, barcode-assisted count workflow for store-front counting.

### Integrations
- [ ] **INT-01**: One inbound sync template (POS / Ecommerce).
- [ ] **INT-02**: One outbound export routine (Accounting software).

## Out of Scope

- **AI Copilot** (Natural Language Operations): Kept out of scoping until the core UX flows are functionally mature. Avoid adding AI bloat before DB maturity.
- **Microservices Rewrite**: Strictly forbidden right now unless performance degrades substantially, requiring separation.

## Traceability

*(To be populated by ROADMAP phase matching)*
