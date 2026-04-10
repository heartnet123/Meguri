# Structure

```
e:\smartstock\
├── app/                  # Next.js App Router root
│   ├── (main)/           # Main authenticated pages
│   ├── api/              # API routes
│   ├── components/       # Shared React components
│   ├── login/            # Authentication: Login
│   ├── register/         # Authentication: Registration
│   ├── forgot-password/  # Authentication: Password Recovery
│   ├── join-workspace/   # Workspace Management
│   ├── onboarding/       # User Onboarding
│   ├── providers/        # React Context Providers
│   ├── layout.tsx        # Root layout
│   └── page.tsx          # Root page
├── convex/               # Convex Backend
│   ├── betterAuth/       # Auth logic
│   ├── schema.ts         # Database schema
│   ├── forecasting.ts    # AI Forecasting logic
│   ├── inventory.ts      # Inventory logic
│   ├── products.ts       # Products logic
│   ├── sales.ts          # Sales logic
│   └── workspaces.ts     # Workspace management logic
├── lib/                  # Shared utilities (e.g., auth-client.ts)
├── hooks/                # Custom React hooks
└── tests/                # Testing directory
```
