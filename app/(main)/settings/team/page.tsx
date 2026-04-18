'use client';

import { useState } from 'react';
import { useQuery, useMutation, useConvexAuth } from 'convex/react';
import Link from 'next/link';
import { api } from '@/convex/_generated/api';
import { useWorkspaceId } from '@/app/providers/WorkspaceProvider';

const ROLE_LABELS: Record<string, string> = {
  owner: 'Owner',
  admin: 'Admin',
  manager: 'Manager',
  staff: 'Staff',
};

const ROLE_COLORS: Record<string, string> = {
  owner: 'bg-amber-100 text-amber-800 border-amber-200',
  admin: 'bg-indigo-100 text-indigo-800 border-indigo-200',
  manager: 'bg-teal-100 text-teal-800 border-teal-200',
  staff: 'bg-neutral-100 text-neutral-600 border-neutral-200',
};

function getInitials(name: string) {
  return name
    .split(' ')
    .map((w) => w[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();
}

export default function TeamSettingsPage() {
  const { isAuthenticated } = useConvexAuth();
  const workspaceId = useWorkspaceId();
  const args = workspaceId && isAuthenticated ? { workspaceId } : 'skip';

  const members = useQuery(api.users.listByWorkspace, args);
  const invitations = useQuery(api.invitations.listByWorkspace, args);
  const createInvitation = useMutation(api.invitations.create);
  const cancelInvitation = useMutation(api.invitations.cancel);

  const [email, setEmail] = useState('');
  const [role, setRole] = useState<'admin' | 'manager' | 'staff'>('staff');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!workspaceId || !email.trim()) return;

    setIsSubmitting(true);
    setError('');
    setSuccess('');

    try {
      await createInvitation({ workspaceId, email: email.trim().toLowerCase(), role });
      setSuccess(`Invitation sent to ${email}`);
      setEmail('');
    } catch (err: any) {
      setError(err.data ?? err.message ?? 'Failed to send invitation.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancel = async (invitationId: any) => {
    try {
      await cancelInvitation({ invitationId });
    } catch (err: any) {
      setError(err.data ?? err.message ?? 'Failed to cancel invitation.');
    }
  };

  const pendingInvitations = invitations?.filter(
    (inv) => inv.status === 'pending' && !inv.isExpired,
  );

  const isLoading = workspaceId !== undefined && (members === undefined || invitations === undefined);

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in duration-500">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Link
          href="/settings"
          className="p-2 text-muted hover:text-foreground rounded-lg hover:bg-surface-raised transition-colors"
          aria-label="Back to settings"
        >
          <iconify-icon icon="solar:arrow-left-linear" width="20" height="20" aria-hidden="true" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">Team Governance</h1>
          <p className="text-sm text-muted mt-1">Manage members and send invitations.</p>
        </div>
      </div>

      {/* Invite Form */}
      <div className="bg-surface border border-border rounded-2xl shadow-sm p-6">
        <h2 className="text-sm font-bold uppercase tracking-widest text-muted/60 mb-4">Invite a Team Member</h2>
        <form onSubmit={handleInvite} className="flex flex-col sm:flex-row gap-3">
          <div className="flex-1">
            <label htmlFor="invite-email" className="sr-only">Email address</label>
            <input
              id="invite-email"
              type="email"
              required
              value={email}
              onChange={(e) => { setEmail(e.target.value); setError(''); setSuccess(''); }}
              placeholder="colleague@example.com"
              className="w-full px-4 py-2.5 text-sm bg-surface border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-accent/10 focus:border-accent transition-all placeholder:text-muted/40 text-foreground"
            />
          </div>
          <div>
            <label htmlFor="invite-role" className="sr-only">Role</label>
            <select
              id="invite-role"
              value={role}
              onChange={(e) => setRole(e.target.value as any)}
              className="w-full px-4 py-2.5 bg-surface border border-border rounded-xl text-sm font-medium text-foreground focus:outline-none focus:ring-2 focus:ring-accent/10"
            >
              <option value="admin">Admin</option>
              <option value="manager">Manager</option>
              <option value="staff">Staff</option>
            </select>
          </div>
          <button
            type="submit"
            disabled={isSubmitting || !email.trim()}
            className="inline-flex items-center justify-center gap-2 px-5 py-2.5 text-sm font-bold text-white bg-accent rounded-xl hover:bg-accent/90 transition-all shadow-lg shadow-accent/20 disabled:opacity-50 disabled:cursor-not-allowed shrink-0"
          >
            {isSubmitting ? (
              <>
                <iconify-icon icon="solar:loading-linear" width="16" height="16" className="animate-spin" aria-hidden="true" />
                Sending...
              </>
            ) : (
              <>
                <iconify-icon icon="solar:letter-bold-duotone" width="16" height="16" aria-hidden="true" />
                Send Invite
              </>
            )}
          </button>
        </form>

        {error && (
          <div className="mt-3 px-4 py-2.5 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-sm text-red-700 font-medium">{error}</p>
          </div>
        )}
        {success && (
          <div className="mt-3 px-4 py-2.5 bg-emerald-50 border border-emerald-200 rounded-lg">
            <p className="text-sm text-emerald-700 font-medium">{success}</p>
          </div>
        )}
      </div>

      {/* Pending Invitations */}
      {pendingInvitations && pendingInvitations.length > 0 && (
        <div className="bg-surface border border-border rounded-2xl shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-border bg-surface-raised/30">
            <h2 className="text-sm font-bold uppercase tracking-widest text-muted/60">
              Pending Invitations
              <span className="ml-2 text-xs bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full font-medium normal-case tracking-normal">
                {pendingInvitations.length}
              </span>
            </h2>
          </div>
          <div className="divide-y divide-border">
            {pendingInvitations.map((inv) => (
              <div key={inv._id} className="px-6 py-4 flex items-center justify-between">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-9 h-9 rounded-full bg-amber-100 flex items-center justify-center text-amber-600 shrink-0">
                    <iconify-icon icon="solar:clock-circle-bold-duotone" width="18" height="18" aria-hidden="true" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-foreground truncate">{inv.email}</p>
                    <p className="text-xs text-muted">
                      Invited as {ROLE_LABELS[inv.role]} by {inv.inviterName}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => handleCancel(inv._id)}
                  className="text-xs font-medium text-muted hover:text-red-600 transition-colors px-3 py-1.5 rounded-lg hover:bg-red-50 shrink-0"
                >
                  Cancel
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Team Members */}
      <div className="bg-surface border border-border rounded-2xl shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-border bg-surface-raised/30">
          <h2 className="text-sm font-bold uppercase tracking-widest text-muted/60">
            Active Members
            {members && (
              <span className="ml-2 text-xs bg-accent-subtle text-accent px-2 py-0.5 rounded-full font-medium normal-case tracking-normal">
                {members.length}
              </span>
            )}
          </h2>
        </div>

        {isLoading ? (
          <div className="divide-y divide-border">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="px-6 py-4 flex items-center gap-4 animate-pulse">
                <div className="w-10 h-10 rounded-full bg-surface-raised" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 w-1/3 bg-surface-raised rounded" />
                  <div className="h-3 w-1/4 bg-surface-raised rounded" />
                </div>
              </div>
            ))}
          </div>
        ) : members && members.length > 0 ? (
          <div className="divide-y divide-border">
            {members.map((member) => (
              <div key={member._id} className="px-6 py-4 flex items-center justify-between group hover:bg-surface-raised/30 transition-colors">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-10 h-10 rounded-full bg-accent-subtle flex items-center justify-center text-sm font-semibold text-accent shrink-0">
                    {getInitials(member.name)}
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-foreground truncate">{member.name}</p>
                    <p className="text-xs text-muted truncate">{member.email}</p>
                  </div>
                </div>
                <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest border ${ROLE_COLORS[member.role] ?? ROLE_COLORS.staff}`}>
                  {ROLE_LABELS[member.role] ?? member.role}
                </span>
              </div>
            ))}
          </div>
        ) : (
          <div className="px-6 py-12 text-center text-sm text-muted">No team members found.</div>
        )}
      </div>
    </div>
  );
}
