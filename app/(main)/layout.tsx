import Link from 'next/link';
import { ReactNode } from 'react';

export default function MainLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-neutral-50 flex">
      {/* Sidebar */}
      <aside className="w-64 bg-white border-r border-neutral-200 flex-col hidden md:flex sticky top-0 h-screen">
        <div className="h-16 flex items-center px-6 border-b border-neutral-200 shrink-0">
          <Link href="/" className="font-sans font-medium tracking-tighter text-lg text-neutral-900">SMARTSTOCK</Link>
        </div>
        <nav className="flex-1 overflow-y-auto py-4 px-3 space-y-1">
          <NavItem href="/dashboard" icon="solar:widget-5-linear" label="Dashboard" />
          <NavItem href="/inventory" icon="solar:box-linear" label="Inventory" />
          <NavItem href="/products" icon="solar:document-text-linear" label="Products & BOM" />
          <NavItem href="/sales" icon="solar:chart-square-linear" label="Sales" />
          <NavItem href="/forecasting" icon="solar:graph-up-linear" label="Forecasting" />
          <NavItem href="/purchase-planning" icon="solar:cart-large-linear" label="Purchase Planning" />
          <NavItem href="/suppliers" icon="solar:users-group-two-rounded-linear" label="Suppliers" />
          <NavItem href="/alerts" icon="solar:bell-bing-linear" label="Alerts" />
          <NavItem href="/reports" icon="solar:document-linear" label="Reports" />
          <NavItem href="/settings" icon="solar:settings-linear" label="Settings" />
        </nav>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Topbar */}
        <header className="h-16 bg-white border-b border-neutral-200 flex items-center justify-between px-4 sm:px-6 lg:px-8 sticky top-0 z-10">
          <div className="flex items-center gap-4">
            <button className="md:hidden text-neutral-500 hover:text-neutral-900">
              <iconify-icon icon="solar:hamburger-menu-linear" width="24" height="24"></iconify-icon>
            </button>
            <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 bg-neutral-100 rounded-lg border border-neutral-200 cursor-pointer hover:bg-neutral-200 transition-colors">
              <iconify-icon icon="solar:shop-linear" width="18" height="18" className="text-neutral-500"></iconify-icon>
              <span className="text-sm font-medium text-neutral-700">Main Store (BKK)</span>
              <iconify-icon icon="solar:alt-arrow-down-linear" width="16" height="16" className="text-neutral-500"></iconify-icon>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="relative hidden md:block">
              <iconify-icon icon="solar:magnifer-linear" width="18" height="18" className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400"></iconify-icon>
              <input type="text" placeholder="Search..." className="pl-9 pr-4 py-1.5 bg-neutral-100 border border-neutral-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-neutral-900/20 w-64 transition-shadow" />
            </div>
            <button className="relative text-neutral-500 hover:text-neutral-900 transition-colors">
              <iconify-icon icon="solar:bell-linear" width="24" height="24"></iconify-icon>
              <span className="absolute top-0 right-0 w-2 h-2 bg-red-500 rounded-full border border-white"></span>
            </button>
            <div className="w-8 h-8 rounded-full bg-neutral-200 border border-neutral-300 overflow-hidden cursor-pointer">
              <img src="https://picsum.photos/seed/user/100/100" alt="User" className="w-full h-full object-cover" />
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8">
          {children}
        </main>
      </div>
    </div>
  );
}

function NavItem({ href, icon, label }: { href: string, icon: string, label: string }) {
  // Simple active state logic for demo purposes
  // In a real app, use usePathname from next/navigation
  return (
    <Link href={href} className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors text-neutral-600 hover:bg-neutral-100 hover:text-neutral-900`}>
      <iconify-icon icon={icon} width="20" height="20" className="text-neutral-500"></iconify-icon>
      {label}
    </Link>
  );
}
