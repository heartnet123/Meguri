'use client';

import Link from 'next/link';
import { ReactNode, useState } from 'react';
import { usePathname } from 'next/navigation';

const navItems = [
  { href: '/dashboard', icon: 'solar:widget-5-linear', label: 'Dashboard' },
  { href: '/inventory', icon: 'solar:box-linear', label: 'Inventory' },
  { href: '/products', icon: 'solar:document-text-linear', label: 'Products & Recipes' },
  { href: '/sales', icon: 'solar:chart-square-linear', label: 'Sales' },
  { href: '/forecasting', icon: 'solar:graph-up-linear', label: 'Forecasting' },
  { href: '/purchase-planning', icon: 'solar:cart-large-linear', label: 'Purchase Planning' },
  { href: '/suppliers', icon: 'solar:users-group-two-rounded-linear', label: 'Suppliers' },
  { href: '/alerts', icon: 'solar:bell-bing-linear', label: 'Alerts' },
  { href: '/reports', icon: 'solar:document-linear', label: 'Reports' },
  { href: '/settings', icon: 'solar:settings-linear', label: 'Settings' },
];

function NavList({ onItemClick }: { onItemClick?: () => void }) {
  return (
    <>
      {navItems.map((item) => (
        <NavItem key={item.href} href={item.href} icon={item.icon} label={item.label} onClick={onItemClick} />
      ))}
    </>
  );
}

export default function MainLayout({ children }: { children: ReactNode }) {
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  return (
    <div className="min-h-screen bg-neutral-50 flex">
      {/* Skip to main content */}
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-[100] focus:px-4 focus:py-2 focus:bg-white focus:border focus:border-neutral-900 focus:rounded-lg focus:text-sm focus:font-medium focus:text-neutral-900 focus:shadow-lg"
      >
        Skip to main content
      </a>

      {/* Mobile nav backdrop */}
      {mobileNavOpen && (
        <div
          className="fixed inset-0 bg-black/40 z-40 md:hidden"
          aria-hidden="true"
          onClick={() => setMobileNavOpen(false)}
        />
      )}

      {/* Mobile nav drawer */}
      <aside
        id="mobile-nav"
        aria-label="Mobile navigation"
        className={`fixed inset-y-0 left-0 w-64 bg-white border-r border-neutral-200 flex flex-col z-50 transition-transform duration-200 md:hidden ${
          mobileNavOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="h-16 flex items-center justify-between px-6 border-b border-neutral-200 shrink-0">
          <Link href="/" className="font-sans font-medium tracking-tighter text-lg text-neutral-900 flex items-center gap-2">
            <span className="inline-block w-2.5 h-2.5 rounded-sm bg-teal-500 shrink-0" aria-hidden="true"></span>
            SMARTSTOCK
          </Link>
          <button
            onClick={() => setMobileNavOpen(false)}
            aria-label="Close navigation menu"
            className="p-1 text-neutral-500 hover:text-neutral-900 rounded-lg hover:bg-neutral-100 transition-colors"
          >
            <iconify-icon icon="solar:close-circle-linear" width="24" height="24" aria-hidden="true"></iconify-icon>
          </button>
        </div>
        <nav className="flex-1 overflow-y-auto py-4 px-3 space-y-1">
          <NavList onItemClick={() => setMobileNavOpen(false)} />
        </nav>
      </aside>

      {/* Desktop Sidebar */}
      <aside
        className="w-64 bg-white border-r border-neutral-200 flex-col hidden md:flex sticky top-0 h-screen"
        aria-label="Main navigation"
      >
        <div className="h-16 flex items-center px-6 border-b border-neutral-200 shrink-0">
          <Link href="/" className="font-sans font-medium tracking-tighter text-lg text-neutral-900 flex items-center gap-2">
            <span className="inline-block w-2.5 h-2.5 rounded-sm bg-teal-500 shrink-0" aria-hidden="true"></span>
            SMARTSTOCK
          </Link>
        </div>
        <nav className="flex-1 overflow-y-auto py-4 px-3 space-y-1">
          <NavList />
        </nav>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Topbar */}
        <header className="h-16 bg-white border-b border-neutral-200 flex items-center justify-between px-4 sm:px-6 lg:px-8 sticky top-0 z-10">
          <div className="flex items-center gap-4">
            <button
              className="md:hidden text-neutral-500 hover:text-neutral-900 transition-colors p-1 rounded-lg hover:bg-neutral-100"
              onClick={() => setMobileNavOpen(true)}
              aria-label="Open navigation menu"
              aria-expanded={mobileNavOpen}
              aria-controls="mobile-nav"
            >
              <iconify-icon icon="solar:hamburger-menu-linear" width="24" height="24" aria-hidden="true"></iconify-icon>
            </button>
            <button
              className="hidden sm:flex items-center gap-2 px-3 py-1.5 bg-neutral-100 rounded-lg border border-neutral-200 hover:bg-neutral-200 transition-colors"
              aria-label="Switch store: Main Store BKK"
              aria-haspopup="listbox"
            >
              <iconify-icon icon="solar:shop-linear" width="18" height="18" className="text-neutral-500" aria-hidden="true"></iconify-icon>
              <span className="text-sm font-medium text-neutral-700">Main Store (BKK)</span>
              <iconify-icon icon="solar:alt-arrow-down-linear" width="16" height="16" className="text-neutral-500" aria-hidden="true"></iconify-icon>
            </button>
          </div>
          <div className="flex items-center gap-4">
            <div className="relative hidden md:block">
              <iconify-icon
                icon="solar:magnifer-linear"
                width="18"
                height="18"
                className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400 pointer-events-none"
                aria-hidden="true"
              ></iconify-icon>
              <input
                type="search"
                placeholder="Search..."
                aria-label="Search"
                className="pl-9 pr-4 py-1.5 bg-neutral-100 border border-neutral-200 rounded-lg text-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-neutral-900 w-64 transition-shadow"
              />
            </div>
            <button
              className="relative text-neutral-500 hover:text-neutral-900 transition-colors p-1 rounded-lg hover:bg-neutral-100"
              aria-label="Notifications, 1 unread"
            >
              <iconify-icon icon="solar:bell-linear" width="24" height="24" aria-hidden="true"></iconify-icon>
              <span className="absolute top-0.5 right-0.5 w-2 h-2 bg-red-500 rounded-full border border-white" aria-hidden="true"></span>
            </button>
            <Link
              href="/profile"
              className="w-8 h-8 rounded-full bg-neutral-200 border border-neutral-300 overflow-hidden block hover:ring-2 hover:ring-neutral-400 hover:ring-offset-1 transition-shadow focus:outline-none focus-visible:ring-2 focus-visible:ring-neutral-900 focus-visible:ring-offset-1"
              aria-label="Your profile"
            >
              <img
                src="https://picsum.photos/seed/user/100/100"
                alt="User profile picture"
                className="w-full h-full object-cover"
                width={32}
                height={32}
              />
            </Link>
          </div>
        </header>

        {/* Page Content */}
        <main id="main-content" className="flex-1 p-4 sm:p-6 lg:p-8" tabIndex={-1}>
          {children}
        </main>
      </div>
    </div>
  );
}

function NavItem({
  href,
  icon,
  label,
  onClick,
}: {
  href: string;
  icon: string;
  label: string;
  onClick?: () => void;
}) {
  const pathname = usePathname();
  const isActive = pathname === href;
  return (
    <Link
      href={href}
      onClick={onClick}
      aria-current={isActive ? 'page' : undefined}
      className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
        isActive
          ? 'bg-teal-50 text-teal-700'
          : 'text-neutral-600 hover:bg-neutral-100 hover:text-neutral-900'
      }`}
    >
      <iconify-icon icon={icon} width="20" height="20" aria-hidden="true"></iconify-icon>
      {label}
    </Link>
  );
}
