import Link from 'next/link';

interface SettingsSection {
  id: string;
  title: string;
  description: string;
  icon: string;
  href?: string;
}

export default function SettingsPage() {
  const sections: SettingsSection[] = [
    { id: 'profile', title: 'Profile', description: 'Update your name, email, and password.', icon: 'solar:user-bold-duotone' },
    { id: 'workspace', title: 'Workspace', description: 'Edit workspace name, locations, and regional settings.', icon: 'solar:buildings-bold-duotone' },
    { id: 'notifications', title: 'Notifications', description: 'Choose which stock alerts you want to receive.', icon: 'solar:bell-bold-duotone' },
    { id: 'team', title: 'Team', description: 'Invite teammates and manage access levels.', icon: 'solar:shield-user-bold-duotone', href: '/settings/team' },
    { id: 'integrations', title: 'Integrations', description: 'Connect POS, ERP, and logistics tools.', icon: 'solar:database-bold-duotone' },
    { id: 'billing', title: 'Billing', description: 'Review your plan, invoices, and payment history.', icon: 'solar:card-bold-duotone' },
  ];

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div className="space-y-2">
        <p className="text-xs font-medium uppercase tracking-[0.18em] text-muted">Settings</p>
        <h1 className="text-3xl font-semibold tracking-tight text-foreground">Workspace settings</h1>
        <p className="max-w-2xl text-sm text-muted">
          Manage account details, workspace configuration, alerts, team access, and billing from one place.
        </p>
      </div>

      <div className="overflow-hidden rounded-2xl border border-border bg-surface shadow-sm">
        <div className="divide-y divide-border-subtle">
          {sections.map((section) => {
            const content = (
              <>
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-subtle text-muted transition-colors group-hover:bg-accent-subtle group-hover:text-accent">
                  <iconify-icon icon={section.icon} width="22" height="22" aria-hidden="true" />
                </div>

                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <h2 className="text-sm font-semibold text-foreground">{section.title}</h2>
                    {section.href && (
                      <span className="rounded-full bg-accent-subtle px-2 py-0.5 text-[10px] font-medium uppercase tracking-[0.14em] text-accent">
                        Manage
                      </span>
                    )}
                  </div>
                  <p className="mt-1 text-sm text-muted">{section.description}</p>
                </div>

                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-subtle text-muted transition-colors group-hover:bg-accent-subtle group-hover:text-accent">
                  <iconify-icon icon="solar:alt-arrow-right-linear" width="18" height="18" aria-hidden="true" />
                </div>
              </>
            );

            if (section.href) {
              return (
                <Link
                  key={section.id}
                  href={section.href}
                  className="group flex w-full items-center gap-4 px-5 py-4 text-left transition-colors hover:bg-subtle focus:outline-none focus-visible:bg-subtle focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-inset sm:px-6"
                >
                  {content}
                </Link>
              );
            }

            return (
              <button
                key={section.id}
                type="button"
                className="group flex w-full items-center gap-4 px-5 py-4 text-left transition-colors hover:bg-subtle focus:outline-none focus-visible:bg-subtle focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-inset sm:px-6"
              >
                {content}
              </button>
            );
          })}
        </div>
      </div>

      <div className="rounded-2xl border border-border bg-surface px-5 py-4 text-sm text-muted shadow-sm sm:flex sm:items-center sm:justify-between">
        <div className="space-y-1">
          <p className="font-medium text-foreground">System status</p>
          <p>Workspace access controls and audit logging are active.</p>
        </div>
        <div className="mt-3 inline-flex items-center gap-2 rounded-full bg-success-subtle px-3 py-1 text-xs font-medium text-success sm:mt-0">
          <iconify-icon icon="solar:shield-check-bold-duotone" width="14" height="14" aria-hidden="true" />
          Protected
        </div>
      </div>
    </div>
  );
}
