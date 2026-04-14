'use client';

import Link from 'next/link';
import Image from 'next/image';
import { ReactNode, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { useWorkspaceId, useWorkspaceLoading } from '@/app/providers/WorkspaceProvider';

const navItems = [
  { href: '/dashboard', icon: 'solar:widget-5-bold-duotone', label: 'Overview' },
  { href: '/inventory', icon: 'solar:box-bold-duotone', label: 'Inventory' },
  { href: '/products', icon: 'solar:document-text-bold-duotone', label: 'Recipes & BOM' },
  { href: '/sales', icon: 'solar:chart-square-bold-duotone', label: 'Sales Registry' },
  { href: '/forecasting', icon: 'solar:graph-up-bold-duotone', label: 'AI Forecasting' },
  { href: '/purchase-planning', icon: 'solar:cart-large-bold-duotone', label: 'Procurement' },
  { href: '/suppliers', icon: 'solar:users-group-two-rounded-bold-duotone', label: 'Supply Chain' },
  { href: '/alerts', icon: 'solar:bell-bing-bold-duotone', label: 'Alerts Hub' },
  { href: '/reports', icon: 'solar:document-bold-duotone', label: 'Analytical Suite' },
  { href: '/settings', icon: 'solar:settings-bold-duotone', label: 'Configuration' },
];

function NavList({ onItemClick }: { onItemClick?: () => void }) {
  return (
    <div className="space-y-1.5 px-3">
      {navItems.map((item) => (
        <NavItem key={item.href} href={item.href} icon={item.icon} label={item.label} onClick={onItemClick} />
      ))}
    </div>
  );
}

export default function MainLayout({ children }: { children: ReactNode }) {
  const router = useRouter();
  const workspaceId = useWorkspaceId();
  const isWorkspaceLoading = useWorkspaceLoading();
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  // Redirect to onboarding if no workspace found after loading
  if (!isWorkspaceLoading && !workspaceId) {
    if (typeof window !== 'undefined') {
      router.push('/onboarding');
    }
    return null;
  }

  if (isWorkspaceLoading) {
    return (
      <div className="min-h-screen bg-subtle flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <iconify-icon icon="solar:refresh-circle-bold-duotone" width="48" height="48" className="animate-spin text-accent" />
          <p className="text-[10px] font-black uppercase tracking-[0.2em] text-muted animate-pulse">Synchronizing Engine</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-subtle flex selection:bg-accent/10 selection:text-accent">
      {/* Skip to main content */}
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-[100] focus:px-6 focus:py-3 focus:bg-surface focus:border focus:border-accent/20 focus:rounded-2xl focus:text-sm focus:font-bold focus:text-foreground focus:shadow-2xl"
      >
        Skip to Intelligence
      </a>

      {/* Mobile nav backdrop */}
      {mobileNavOpen && (
        <div
          className="fixed inset-0 bg-background/80 backdrop-blur-md z-40 md:hidden animate-in fade-in duration-300"
          aria-hidden="true"
          onClick={() => setMobileNavOpen(false)}
        />
      )}

      {/* Mobile nav drawer */}
      <aside
        id="mobile-nav"
        aria-label="Mobile navigation"
        className={`fixed inset-y-0 left-0 w-72 bg-surface border-r border-border flex flex-col z-50 transition-all duration-500 ease-in-out md:hidden shadow-2xl ${
          mobileNavOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="h-20 flex items-center justify-between px-6 shrink-0">
          <Link href="/" className="font-sans font-black tracking-[-0.04em] text-xl text-foreground flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-accent flex items-center justify-center shadow-lg shadow-accent/20">
              <div className="w-3 h-3 rounded-sm bg-white rotate-45" />
            </div>
            SMARTSTOCK
          </Link>
          <button
            onClick={() => setMobileNavOpen(false)}
            aria-label="Close navigation menu"
            className="w-10 h-10 flex items-center justify-center text-muted hover:text-foreground rounded-2xl hover:bg-surface-raised transition-all active:scale-90"
          >
            <iconify-icon icon="solar:close-circle-bold-duotone" width="24" height="24" aria-hidden="true"></iconify-icon>
          </button>
        </div>
        <nav className="flex-1 overflow-y-auto py-6 scrollbar-hide">
          <NavList onItemClick={() => setMobileNavOpen(false)} />
        </nav>
        <div className="p-6 border-t border-border/50">
           <div className="p-4 rounded-2xl bg-surface-raised/50 border border-border/50 flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-accent/10 border border-accent/10 flex items-center justify-center text-accent">
                <iconify-icon icon="solar:crown-minimalistic-bold-duotone" width="20" height="20" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[10px] font-black uppercase tracking-widest text-foreground truncate">Enterprise Plan</p>
                <p className="text-[9px] font-bold text-muted truncate">Active for 483 days</p>
              </div>
           </div>
        </div>
      </aside>

      {/* Desktop Sidebar */}
      <aside
        className="w-72 bg-surface border-r border-border flex-col hidden md:flex sticky top-0 h-screen"
        aria-label="Main navigation"
      >
        <div className="h-20 flex items-center px-8 shrink-0">
          <Link href="/" className="font-sans font-black tracking-[-0.04em] text-xl text-foreground flex items-center gap-3 group">
            <div className="w-9 h-9 rounded-xl bg-accent flex items-center justify-center shadow-lg shadow-accent/20 transition-transform group-hover:rotate-12">
              <div className="w-3.5 h-3.5 rounded-sm bg-white rotate-45" />
            </div>
            SMARTSTOCK
          </Link>
        </div>
        <nav className="flex-1 overflow-y-auto py-8 scrollbar-hide">
          <NavList />
        </nav>
        <div className="p-6 border-t border-border/50">
           <button className="w-full p-4 rounded-2xl bg-surface-raised/50 border border-border/50 flex items-center gap-3 hover:bg-surface-raised transition-all group">
              <div className="w-10 h-10 rounded-xl bg-accent/10 border border-accent/10 flex items-center justify-center text-accent group-hover:scale-110 transition-transform">
                <iconify-icon icon="solar:crown-minimalistic-bold-duotone" width="22" height="22" />
              </div>
              <div className="flex-1 min-w-0 text-left">
                <p className="text-[10px] font-black uppercase tracking-widest text-foreground truncate">Enterprise Plan</p>
                <p className="text-[9px] font-bold text-muted truncate">Full Access Mode</p>
              </div>
           </button>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Topbar */}
        <header className="h-20 bg-surface/80 backdrop-blur-md border-b border-border/50 flex items-center justify-between px-6 sm:px-10 sticky top-0 z-30">
          <div className="flex items-center gap-6">
            <button
              className="md:hidden text-muted hover:text-foreground transition-all p-2 rounded-2xl hover:bg-surface-raised active:scale-90"
              onClick={() => setMobileNavOpen(true)}
              aria-label="Open navigation menu"
              aria-expanded={mobileNavOpen}
              aria-controls="mobile-nav"
            >
              <iconify-icon icon="solar:hamburger-menu-bold-duotone" width="24" height="24" aria-hidden="true"></iconify-icon>
            </button>
            <div className="hidden lg:flex items-center gap-3 p-1.5 bg-surface-raised/50 rounded-2xl border border-border/50">
               <button className="px-4 py-1.5 rounded-xl bg-surface border border-border shadow-sm text-[10px] font-black uppercase tracking-widest text-foreground">Operational</button>
               <button className="px-4 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest text-muted hover:text-foreground transition-colors">Strategic</button>
            </div>
          </div>
          <div className="flex items-center gap-5">
            <div className="relative hidden xl:block">
              <iconify-icon
                icon="solar:magnifer-linear"
                width="18"
                height="18"
                className="absolute left-4 top-1/2 -translate-y-1/2 text-muted pointer-events-none"
                aria-hidden="true"
              ></iconify-icon>
              <input
                type="search"
                placeholder="Deep Intelligence Search..."
                aria-label="Search"
                className="pl-11 pr-5 py-2.5 bg-surface-raised/50 border border-border/50 rounded-2xl text-[11px] font-bold tracking-tight text-foreground focus:outline-none focus-visible:ring-2 focus-visible:ring-accent/20 focus:border-accent/40 w-72 transition-all placeholder:text-muted/40"
              />
            </div>
            <div className="flex items-center gap-2">
              <button
                className="relative text-muted hover:text-foreground transition-all p-2.5 rounded-2xl hover:bg-surface-raised active:scale-90"
                aria-label="Notifications, 1 unread"
              >
                <iconify-icon icon="solar:bell-bold-duotone" width="24" height="24" aria-hidden="true"></iconify-icon>
                <span className="absolute top-2.5 right-2.5 w-2 h-2 bg-red-500 rounded-full border-2 border-surface animate-ping" aria-hidden="true"></span>
                <span className="absolute top-2.5 right-2.5 w-2 h-2 bg-red-500 rounded-full border-2 border-surface" aria-hidden="true"></span>
              </button>
              <button
                className="text-muted hover:text-foreground transition-all p-2.5 rounded-2xl hover:bg-surface-raised active:scale-90"
                aria-label="Command Menu"
              >
                <iconify-icon icon="solar:command-bold-duotone" width="24" height="24" aria-hidden="true"></iconify-icon>
              </button>
            </div>
            <div className="w-px h-8 bg-border/50 mx-2 hidden sm:block" />
            <Link
              href="/profile"
              className="group flex items-center gap-3 p-1 rounded-2xl hover:bg-surface-raised transition-all"
              aria-label="Your identity"
            >
              <div className="w-10 h-10 rounded-xl bg-surface-raised border border-border overflow-hidden shadow-sm group-hover:border-accent/30 transition-all">
                <Image
                  src="https://picsum.photos/seed/user/100/100"
                  alt="Identity Avatar"
                  className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                  width={40}
                  height={40}
                  priority
                />
              </div>
              <div className="hidden sm:block text-left">
                <p className="text-[10px] font-black uppercase tracking-widest text-foreground leading-tight">Jane Smith</p>
                <p className="text-[9px] font-bold text-muted">Store Manager</p>
              </div>
            </Link>
          </div>
        </header>

        {/* Page Content */}
        <main id="main-content" className="flex-1 p-6 sm:p-10 lg:p-12 overflow-y-auto" tabIndex={-1}>
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
      className={`flex items-center gap-4 px-5 py-3.5 rounded-2xl text-[10px] font-black uppercase tracking-[0.15em] transition-all group ${
        isActive
          ? 'bg-accent text-white shadow-xl shadow-accent/20 scale-[1.02]'
          : 'text-muted/60 hover:bg-surface-raised hover:text-foreground'
      }`}
    >
      <iconify-icon 
        icon={icon} 
        width="22" 
        height="22" 
        aria-hidden="true"
        className={`shrink-0 transition-transform group-hover:scale-110 ${isActive ? 'text-white' : 'text-muted/30 group-hover:text-accent'}`}
      ></iconify-icon>
      <span className="truncate">{label}</span>
      {isActive && (
        <div className="ml-auto w-1.5 h-1.5 rounded-full bg-white shadow-[0_0_8px_white]" />
      )}
    </Link>
  );
}
