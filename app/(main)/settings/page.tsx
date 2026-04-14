interface SettingsSection {
  id: string;
  title: string;
  description: string;
  icon: string;
}

export default function SettingsPage() {
  const sections: SettingsSection[] = [
    { id: 'profile', title: 'Identity & Access', description: 'Manage your personal profile and authentication credentials.', icon: 'solar:user-bold-duotone' },
    { id: 'workspace', title: 'Global Workspace', description: 'Configure organization metadata, physical locations, and regional overrides.', icon: 'solar:buildings-bold-duotone' },
    { id: 'notifications', title: 'Intelligence Alerts', description: 'Fine-tune your delivery channels for critical inventory events.', icon: 'solar:bell-bold-duotone' },
    { id: 'team', title: 'Team Governance', description: 'Orchestrate member permissions and hierarchical access tiers.', icon: 'solar:shield-user-bold-duotone' },
    { id: 'integrations', title: 'External Ecosystem', description: 'Synchronize with external POS, ERP, and logistics infrastructure.', icon: 'solar:database-bold-duotone' },
    { id: 'billing', title: 'Financial Tier', description: 'Analyze your active subscription, payment cycle, and fiscal history.', icon: 'solar:card-bold-duotone' },
  ];

  return (
    <div className="max-w-4xl mx-auto space-y-12 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="space-y-2">
        <h1 className="text-3xl font-black tracking-tight text-foreground">Global Configuration</h1>
        <p className="text-[11px] font-black uppercase tracking-[0.2em] text-muted leading-relaxed">System-wide parameters & administrative overrides</p>
      </div>

      <div className="bg-surface border border-border shadow-2xl shadow-black/5 rounded-[2rem] overflow-hidden">
        <div className="divide-y divide-border/50">
          {sections.map((section) => (
            <button 
              key={section.id} 
              className="w-full flex items-center p-8 hover:bg-surface-raised/50 transition-all text-left group focus:outline-none relative overflow-hidden"
            >
              <div className="w-16 h-16 rounded-2xl bg-surface-raised border border-border flex items-center justify-center flex-shrink-0 mr-6 group-hover:scale-110 group-hover:border-accent/30 group-hover:bg-accent/5 transition-all duration-500 shadow-sm">
                <iconify-icon 
                  icon={section.icon} 
                  width="28" 
                  height="28" 
                  className="text-muted/60 group-hover:text-accent transition-colors" 
                  aria-hidden="true"
                ></iconify-icon>
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-foreground mb-1.5 transition-colors group-hover:text-accent">{section.title}</h3>
                <p className="text-sm text-muted font-medium line-clamp-1 leading-relaxed opacity-80">{section.description}</p>
              </div>
              <div className="flex-shrink-0 ml-8 group-hover:translate-x-2 transition-transform duration-500">
                <div className="w-10 h-10 rounded-full bg-surface-raised border border-border flex items-center justify-center group-hover:border-accent/20 group-hover:bg-accent/5">
                  <iconify-icon 
                    icon="solar:alt-arrow-right-linear" 
                    width="20" 
                    height="20" 
                    className="text-muted/40 group-hover:text-accent transition-colors" 
                    aria-hidden="true"
                  ></iconify-icon>
                </div>
              </div>
              {/* Subtle hover indicator */}
              <div className="absolute left-0 top-0 bottom-0 w-1 bg-accent scale-y-0 group-hover:scale-y-100 transition-transform duration-500 origin-center" />
            </button>
          ))}
        </div>
      </div>
      
      {/* Footer Info */}
      <div className="flex items-center justify-center gap-2 pt-4">
        <iconify-icon icon="solar:shield-check-bold-duotone" width="16" height="16" className="text-success" />
        <span className="text-[9px] font-black uppercase tracking-widest text-muted">Enterprise Secured Deployment — Version 2.4.1</span>
      </div>
    </div>
  );
}
