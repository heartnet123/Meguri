# Concerns

- The forecasting logic (`forecasting.ts`) depends heavily on data formats passing between the UI, Convex, and Google GenAI. Any changes to data modeling for sales mapping or stock will violently break recommendations if schemas misalign.
- The project utilizes `firebase-tools` but the primary backend is Convex. This dual setup might lead to deployment fragmentation.
- The Better Auth integration needs to rigorously validate `workspace` isolation. Since it's an inventory management app, tenant boundaries must be strictly enforced across all Convex queries and mutations.
