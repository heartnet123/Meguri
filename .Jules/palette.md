## 2024-04-19 - Accessibility on Dialogs and Pagination
**Learning:** Found multiple instances where `iconify-icon` was used inside interactive `<button>` elements (for dialog close and pagination next/prev) but screen readers wouldn't know the button's intent because it lacked a visible label and ARIA equivalent. In addition, the icon itself was visible to accessibility APIs, creating noise.
**Action:** Always add `aria-label` to the parent `<button>` describing the interaction and `aria-hidden="true"` on the visual `<iconify-icon>` to keep the DOM semantically clean.
