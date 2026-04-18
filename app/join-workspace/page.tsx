'use client';

import React, { useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { useQuery, useMutation, useConvexAuth } from 'convex/react';
import Link from 'next/link';
import { api } from '@/convex/_generated/api';

export default function JoinWorkspacePage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { isAuthenticated, isLoading: authLoading } = useConvexAuth();

  const token = searchParams.get('token') ?? '';

  const invitation = useQuery(
    api.invitations.getByToken,
    token ? { token } : 'skip',
  );

  const acceptInvitation = useMutation(api.invitations.accept);

  const [isAccepting, setIsAccepting] = useState(false);
  const [error, setError] = useState('');

  const handleAccept = async () => {
    if (!token) return;
    setIsAccepting(true);
    setError('');

    try {
      await acceptInvitation({ token });
      router.push('/dashboard');
    } catch (err: any) {
      setError(err.data ?? err.message ?? 'Failed to accept invitation.');
      setIsAccepting(false);
    }
  };

  const inviterInitials = invitation?.inviterName
    .split(' ')
    .map((w: string) => w[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();

  const shell = (children: React.ReactNode) => (
    <div className="min-h-screen bg-subtle px-4 py-10 sm:px-6 lg:px-8">
      <div className="mx-auto flex min-h-[calc(100vh-5rem)] max-w-lg items-center">
        <div className="w-full rounded-2xl border border-border bg-surface p-6 shadow-sm sm:p-8">
          {children}
        </div>
      </div>
    </div>
  );

  if (!token) {
    return shell(
      <div className="space-y-6 text-center">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-danger-subtle text-danger">
          <iconify-icon icon="solar:danger-triangle-bold-duotone" width="24" height="24" aria-hidden="true" />
        </div>
        <div className="space-y-2">
          <h2 className="text-xl font-semibold tracking-tight text-foreground">Invalid invitation link</h2>
          <p className="text-sm text-muted">
            This link is missing a valid invitation token. Ask your workspace administrator to send a new invite.
          </p>
        </div>
        <Link
          href="/login"
          className="inline-flex items-center justify-center rounded-xl bg-accent px-5 py-2.5 text-sm font-medium text-accent-fg transition-colors hover:opacity-95 focus:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-surface"
        >
          Go to sign in
        </Link>
      </div>,
    );
  }

  if (authLoading || invitation === undefined) {
    return shell(
      <div className="flex flex-col items-center gap-3 py-8 text-center">
        <iconify-icon icon="solar:refresh-circle-bold-duotone" width="40" height="40" className="animate-spin text-accent" aria-hidden="true" />
        <p className="text-sm text-muted">Loading invitation…</p>
      </div>,
    );
  }

  if (invitation === null) {
    return shell(
      <div className="space-y-6 text-center">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-warning-subtle text-warning">
          <iconify-icon icon="solar:clock-circle-bold-duotone" width="24" height="24" aria-hidden="true" />
        </div>
        <div className="space-y-2">
          <h2 className="text-xl font-semibold tracking-tight text-foreground">Invitation expired or invalid</h2>
          <p className="text-sm text-muted">
            This invitation may have expired, been cancelled, or already been used. Ask your workspace administrator for a new link.
          </p>
        </div>
        <Link
          href="/login"
          className="inline-flex items-center justify-center rounded-xl bg-accent px-5 py-2.5 text-sm font-medium text-accent-fg transition-colors hover:opacity-95 focus:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-surface"
        >
          Go to sign in
        </Link>
      </div>,
    );
  }

  const content = (
    <div className="space-y-6">
      <div className="space-y-3 text-center">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-surface-raised text-muted">
          <iconify-icon icon="solar:buildings-bold-duotone" width="24" height="24" aria-hidden="true" />
        </div>
        <div className="space-y-2">
          <p className="text-xs font-medium uppercase tracking-[0.18em] text-muted">Workspace invitation</p>
          <h2 className="text-2xl font-semibold tracking-tight text-foreground">Join {invitation.workspaceName}</h2>
          <p className="text-sm text-muted">
            You&apos;ve been invited as <span className="font-medium text-foreground capitalize">{invitation.role}</span>
          </p>
        </div>
      </div>

      <div className="rounded-2xl border border-border bg-subtle p-4">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-accent-subtle text-sm font-semibold text-accent">
            {inviterInitials}
          </div>
          <div className="min-w-0">
            <p className="text-sm font-medium text-foreground">Invited by {invitation.inviterName}</p>
            <p className="truncate text-xs text-muted">{invitation.inviterEmail}</p>
          </div>
        </div>
      </div>

      {error && (
        <div className="rounded-2xl border border-danger/20 bg-danger-subtle px-4 py-3">
          <p className="text-sm font-medium text-danger">{error}</p>
        </div>
      )}

      <button
        onClick={handleAccept}
        disabled={isAccepting}
        className="flex w-full items-center justify-center rounded-xl bg-accent px-4 py-3 text-sm font-medium text-accent-fg transition-colors hover:opacity-95 focus:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-surface disabled:cursor-not-allowed disabled:opacity-60"
      >
        {isAccepting ? 'Joining workspace…' : 'Accept invitation'}
      </button>

      <p className="text-center text-sm text-muted">
        Not the right account?{' '}
        <Link href="/login" className="font-medium text-foreground underline-offset-4 hover:underline">
          Sign in with a different account
        </Link>
      </p>
    </div>
  );

  return shell(content);
}
