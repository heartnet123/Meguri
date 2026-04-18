'use client';

import Link from 'next/link';
import { ReactNode, useMemo, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { useMutation, useQuery } from 'convex/react';
import { api } from '@/convex/_generated/api';
import { useWorkspaceId, useWorkspaceLoading } from '@/app/providers/WorkspaceProvider';
import { useTheme } from '@/app/providers/ThemeProvider';

type NavItemConfig = {
  href: string;
  icon: string;
  label: string;
};

type CurrentUser = {
  _id: string;
  name: string;
  email: string;
  role: 'owner' | 'admin' | 'manager' | 'staff';
};

const primaryNavItems: NavItemConfig[] = [
  { href: '/dashboard', icon: 'solar:widget-5-bold-duotone', label: 'Overview' },
  { href: '/inventory', icon: 'solar:box-bold-duotone', label: 'Inventory' },
  { href: '/sellable-items', icon: 'solar:bag-smile-bold-duotone', label: 'Sellable Items' },
  { href: '/recipes', icon: 'solar:layers-minimalistic-bold-duotone', label: 'Recipes' },
  { href: '/sales', icon: 'solar:chart-square-bold-duotone', label: 'Sales' },
  { href: '/forecasting', icon: 'solar:graph-up-bold-duotone', label: 'Forecasting' },
  { href: '/purchase-planning', icon: 'solar:cart-large-bold-duotone', label: 'Procurement' },
];

const secondaryNavItems: NavItemConfig[] = [
  { href: '/suppliers', icon: 'solar:users-group-two-rounded-bold-duotone', label: 'Suppliers' },
  { href: '/alerts', icon: 'solar:bell-bing-bold-duotone', label: 'Alerts' },
  { href: '/reports', icon: 'solar:document-bold-duotone', label: 'Reports' },
  { href: '/settings', icon: 'solar:settings-bold-duotone', label: 'Settings' },
];

function NavSection({ label, items, onItemClick }: { label: string; items: NavItemConfig[]; onItemClick?: () => void; }) {
  return (
    <div className="space-y-2">
      <p className="px-4 text-xs font-medium uppercase tracking-[0.18em] text-muted">{label}</p>
      <div className="space-y-1">
        {items.map((item) => (
          <NavItem key={item.href} href={item.href} icon={item.icon} label={item.label} onClick={onItemClick} />
        ))}
      </div>
    </div>
  );
}

function NavList({ onItemClick }: { onItemClick?: () => void }) {
  return (
    <div className="space-y-8 px-4">
      <NavSection label="Core" items={primaryNavItems} onItemClick={onItemClick} />
      <NavSection label="Admin" items={secondaryNavItems} onItemClick={onItemClick} />
    </div>
  );
}

export default function MainLayout({ children }: { children: ReactNode }) {
  const router = useRouter();
  const workspaceId = useWorkspaceId();
  const isWorkspaceLoading = useWorkspaceLoading();
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [workspaceMenuOpen, setWorkspaceMenuOpen] = useState(false);

  const currentWorkspace = useQuery(api.workspaces.myWorkspace);
  const workspaces = useQuery(api.workspaces.myWorkspaces);
  const currentUser = useQuery(api.users.me) as CurrentUser | null | undefined;
  const switchWorkspace = useMutation(api.workspaces.switchWorkspace);
  const { theme, toggleTheme } = useTheme();

  const workspaceLabel = useMemo(() => {
    if (!currentWorkspace) return 'No workspace selected';
    return currentWorkspace.name;
  }, [currentWorkspace]);

  const profileInitials = useMemo(() => {
    if (!currentUser?.name) return 'SS';
    const parts = currentUser.name.split(/\s+/).filter(Boolean);
    return parts.slice(0, 2).map((part) => part[0]?.toUpperCase() ?? '').join('') || 'SS';
  }, [currentUser]);

  const profileRoleLabel = useMemo(() => {
    if (!currentUser?.role) return 'Account';
    return currentUser.role.replace('_', ' ');
  }, [currentUser]);

  if (!isWorkspaceLoading && !workspaceId) {
    if (typeof window !== 'undefined') {
      router.push('/onboarding');
    }
    return null;
  }

  if (isWorkspaceLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-subtle">
        <div className="flex flex-col items-center gap-3">
          <iconify-icon icon="solar:refresh-circle-bold-duotone" width="40" height="40" className="animate-spin text-accent" />
          <p className="text-xs font-medium uppercase tracking-[0.18em] text-muted">Loading workspace</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-subtle text-foreground selection:bg-accent/10 selection:text-foreground">
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[100] focus:rounded-xl focus:bg-surface focus:px-4 focus:py-2 focus:text-sm focus:font-medium focus:text-foreground focus:shadow-lg"
      >
        Skip to content
      </a>

      {mobileNavOpen && (
        <div
          className="fixed inset-0 z-40 bg-background/60 md:hidden"
          aria-hidden="true"
          onClick={() => setMobileNavOpen(false)}
        />
      )}

      <aside
        id="mobile-nav"
        aria-label="Mobile navigation"
        className={`fixed inset-y-0 left-0 z-50 flex w-72 flex-col border-r border-border bg-surface transition-transform duration-300 md:hidden ${
          mobileNavOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="flex h-[4.5rem] items-center justify-between border-b border-border px-5">
          <Brand />
          <button type="button" onClick={() => setMobileNavOpen(false)} aria-label="Close navigation menu" className="flex h-10 w-10 items-center justify-center rounded-xl text-muted transition-colors hover:bg-surface-raised hover:text-foreground">
            <iconify-icon icon="solar:close-circle-bold-duotone" width="22" height="22" aria-hidden="true" />
          </button>
        </div>
        <nav className="flex-1 overflow-y-auto py-6">
          <NavList onItemClick={() => setMobileNavOpen(false)} />
        </nav>
      </aside>

      <aside className="sticky top-0 hidden h-screen w-64 flex-col border-r border-border bg-surface md:flex" aria-label="Main navigation">
        <div className="flex h-[4.5rem] items-center border-b border-border px-6">
          <Brand />
        </div>
        <nav className="flex-1 overflow-y-auto py-6">
          <NavList />
        </nav>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-30 flex min-h-16 items-center justify-between gap-4 border-b border-border bg-subtle/95 px-6 py-3 backdrop-blur sm:px-8 lg:px-10">
          <div className="flex min-w-0 items-center gap-3">
            <button type="button" className="flex h-10 w-10 items-center justify-center rounded-xl text-muted transition-colors hover:bg-surface hover:text-foreground md:hidden" onClick={() => setMobileNavOpen(true)} aria-label="Open navigation menu" aria-expanded={mobileNavOpen} aria-controls="mobile-nav">
              <iconify-icon icon="solar:hamburger-menu-bold-duotone" width="22" height="22" aria-hidden="true" />
            </button>

            <div className="relative min-w-0">
              <button type="button" onClick={() => setWorkspaceMenuOpen((open) => !open)} className="flex max-w-[16rem] items-center gap-3 rounded-xl border border-border bg-surface px-3 py-2 text-left transition-colors hover:bg-surface-raised" aria-haspopup="menu" aria-expanded={workspaceMenuOpen}>
                <div className="flex h-9 w-9 items-center justify-center rounded-full bg-accent-subtle text-sm font-semibold text-accent">{currentWorkspace?.name?.slice(0, 2).toUpperCase() ?? 'WS'}</div>
                <div className="min-w-0">
                  <p className="truncate text-xs font-medium uppercase tracking-[0.16em] text-muted">Current workspace</p>
                  <p className="truncate text-sm font-semibold text-foreground">{workspaceLabel}</p>
                </div>
                <iconify-icon icon="solar:alt-arrow-down-bold-duotone" width="18" height="18" aria-hidden="true" className="text-muted" />
              </button>

              {workspaceMenuOpen && (
                <div className="absolute left-0 top-[calc(100%+0.5rem)] z-50 w-80 overflow-hidden rounded-2xl border border-border bg-surface shadow-xl">
                  <div className="border-b border-border px-4 py-3">
                    <p className="text-xs font-medium uppercase tracking-[0.16em] text-muted">Switch workspace</p>
                    <p className="mt-1 text-sm text-muted">Choose where you want to work.</p>
                  </div>
                  <div className="max-h-72 overflow-y-auto p-2">
                    {workspaces === undefined ? (
                      <div className="space-y-2 p-2">
                        <div className="h-12 animate-pulse rounded-xl bg-subtle" />
                        <div className="h-12 animate-pulse rounded-xl bg-subtle" />
                      </div>
                    ) : workspaces.length === 0 ? (
                      <p className="px-3 py-4 text-sm text-muted">No additional workspaces available.</p>
                    ) : (
                      workspaces.map((workspace) => {
                        const active = workspaceId === workspace._id;
                        return (
                          <button key={workspace._id} type="button" onClick={async () => {
                            if (active) return;
                            await switchWorkspace({ workspaceId: workspace._id });
                            setWorkspaceMenuOpen(false);
                            router.refresh();
                          }} className={`flex w-full items-start gap-3 rounded-xl px-3 py-3 text-left transition-colors ${active ? 'bg-accent-subtle' : 'hover:bg-subtle'}`}>
                            <div className={`mt-0.5 flex h-9 w-9 items-center justify-center rounded-full text-sm font-semibold ${active ? 'bg-accent text-accent-fg' : 'bg-surface-raised text-muted'}`}>
                              {workspace.name.slice(0, 2).toUpperCase()}
                            </div>
                            <div className="min-w-0 flex-1">
                              <p className="truncate text-sm font-semibold text-foreground">{workspace.name}</p>
                              <p className="mt-1 text-xs text-muted capitalize">{workspace.role} · {workspace.plan} plan</p>
                            </div>
                            {active && <span className="mt-2 h-2.5 w-2.5 rounded-full bg-accent" aria-hidden="true" />}
                          </button>
                        );
                      })
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button type="button" onClick={toggleTheme} className="flex h-10 items-center gap-2 rounded-xl border border-border bg-surface px-3 text-sm font-medium text-foreground transition-colors hover:bg-surface-raised" aria-label={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}>
              <iconify-icon icon={theme === 'dark' ? 'solar:sun-2-bold-duotone' : 'solar:moon-bold-duotone'} width="18" height="18" aria-hidden="true" className="text-accent" />
              <span className="hidden sm:inline">{theme === 'dark' ? 'Light' : 'Dark'} mode</span>
            </button>

            <Link href="/profile" className="flex shrink-0 items-center gap-3 rounded-xl px-3 py-2 transition-colors hover:bg-surface" aria-label="Open profile">
              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-accent-subtle text-sm font-semibold text-accent">{profileInitials}</div>
              <div className="hidden text-left sm:block">
                <p className="text-sm font-semibold leading-none text-foreground">{currentUser?.name ?? 'Loading profile'}</p>
                <p className="mt-1 text-xs leading-none text-muted capitalize">{profileRoleLabel}</p>
              </div>
            </Link>
          </div>
        </header>

        <main id="main-content" className="flex-1 overflow-y-auto px-6 py-8 sm:px-8 lg:px-10" tabIndex={-1}>
          {children}
        </main>
      </div>
    </div>
  );
}

function Brand() {
  return (
    <Link href="/dashboard" className="flex items-center gap-3 text-foreground">
      <div className="flex h-9 w-9 items-center justify-center rounded-xl border border-border bg-surface-raised">
        <div className="h-3 w-3 rounded-sm bg-accent" />
      </div>
      <div>
        <p className="font-display text-base font-semibold tracking-tight">Smartstock</p>
        <p className="text-xs text-muted">Retail operations</p>
      </div>
    </Link>
  );
}

function NavItem({ href, icon, label, onClick }: { href: string; icon: string; label: string; onClick?: () => void; }) {
  const pathname = usePathname();
  const isActive = pathname === href;

  return (
    <Link href={href} onClick={onClick} aria-current={isActive ? 'page' : undefined} className={`flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium transition-colors ${isActive ? 'bg-accent-subtle text-foreground' : 'text-muted hover:bg-surface-raised hover:text-foreground'}`}>
      <iconify-icon icon={icon} width="20" height="20" aria-hidden="true" className={isActive ? 'text-accent' : 'text-muted'} />
      <span className="truncate">{label}</span>
      {isActive && <span className="ml-auto h-2 w-2 rounded-full bg-accent" aria-hidden="true" />}
    </Link>
  );
}
