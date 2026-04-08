interface SettingsSection {
  id: string;
  title: string;
  description: string;
  icon: string;
}

export default function SettingsPage() {
  const sections: SettingsSection[] = [
    { id: 'profile', title: 'My Profile', description: 'Manage your personal information and preferences.', icon: 'solar:user-linear' },
    { id: 'workspace', title: 'Workspace Settings', description: 'Configure company details, locations, and business hours.', icon: 'solar:buildings-linear' },
    { id: 'notifications', title: 'Notifications', description: 'Choose how and when you want to be alerted.', icon: 'solar:bell-linear' },
    { id: 'team', title: 'Team & Roles', description: 'Manage team members and their access permissions.', icon: 'solar:shield-user-linear' },
    { id: 'integrations', title: 'Integrations', description: 'Connect with POS systems, accounting software, and more.', icon: 'solar:database-linear' },
    { id: 'billing', title: 'Billing & Subscription', description: 'Manage your plan, payment methods, and invoices.', icon: 'solar:card-linear' },
  ];

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-medium tracking-tight text-neutral-900">Settings</h1>
        <p className="text-sm text-neutral-500 mt-1">Manage your account settings and preferences.</p>
      </div>

      <div className="bg-white border border-neutral-200 rounded-xl shadow-sm overflow-hidden">
        <div className="divide-y divide-neutral-100">
          {sections.map((section) => (
            <button key={section.id} className="w-full flex items-center p-4 hover:bg-neutral-50/50 transition-colors text-left group focus:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-neutral-900">
              <div className="w-10 h-10 rounded-lg bg-neutral-50 flex items-center justify-center border border-neutral-100 flex-shrink-0 mr-4 group-hover:bg-white group-hover:border-neutral-200 transition-colors">
                <iconify-icon icon={section.icon} width="20" height="20" className="text-neutral-500" aria-hidden="true"></iconify-icon>
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="text-sm font-medium text-neutral-900">{section.title}</h3>
                <p className="text-sm text-neutral-500 truncate">{section.description}</p>
              </div>
              <div className="flex-shrink-0 ml-4">
                <iconify-icon icon="solar:alt-arrow-right-linear" width="20" height="20" className="text-neutral-400 group-hover:text-teal-600 transition-colors" aria-hidden="true"></iconify-icon>
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
