'use client';

import { useState } from 'react';
import { useQuery, useMutation, useConvexAuth } from 'convex/react';
import Link from 'next/link';
import { api } from '@/convex/_generated/api';
import { useWorkspaceId } from '@/app/providers/WorkspaceProvider';
import { Id } from '@/convex/_generated/dataModel';

const ROLE_LABELS: Record<string, string> = {
  owner: 'เจ้าของ',
  admin: 'ผู้ดูแลระบบ',
  manager: 'ผู้จัดการ',
  staff: 'พนักงาน',
  viewer: 'ผู้ดู',
};

const ROLE_COLORS: Record<string, string> = {
  owner: 'bg-amber-100 text-amber-800 border-amber-200',
  admin: 'bg-indigo-100 text-indigo-800 border-indigo-200',
  manager: 'bg-teal-100 text-teal-800 border-teal-200',
  staff: 'bg-neutral-100 text-neutral-600 border-neutral-200',
  viewer: 'bg-neutral-50 text-neutral-400 border-neutral-200',
};

function getInitials(name: string) {
  return name
    .split(' ')
    .map((w) => w[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();
}

type AssignableRole = 'admin' | 'manager' | 'staff' | 'viewer';

export default function TeamSettingsPage() {
  const { isAuthenticated } = useConvexAuth();
  const workspaceId = useWorkspaceId();
  const args = workspaceId && isAuthenticated ? { workspaceId } : 'skip';

  const me = useQuery(api.users.me);
  const workspaces = useQuery(api.workspaces.myWorkspaces);
  const members = useQuery(api.users.listByWorkspace, args);
  const invitations = useQuery(api.invitations.listByWorkspace, args);
  const createInvitation = useMutation(api.invitations.create);
  const cancelInvitation = useMutation(api.invitations.cancel);
  const removeMember = useMutation(api.workspaces.removeMember);
  const changeMemberRole = useMutation(api.workspaces.changeMemberRole);

  // Current user's role in this workspace
  const myRole = workspaces?.find((w) => w._id === workspaceId)?.role;
  const canManage = myRole === 'owner' || myRole === 'admin';

  const [email, setEmail] = useState('');
  const [role, setRole] = useState<AssignableRole>('staff');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Track which member is having role changed inline
  const [editingMemberId, setEditingMemberId] = useState<string | null>(null);
  const [pendingRole, setPendingRole] = useState<AssignableRole>('staff');

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!workspaceId || !email.trim()) return;

    setIsSubmitting(true);
    setError('');
    setSuccess('');

    try {
      await createInvitation({ workspaceId, email: email.trim().toLowerCase(), role });
      setSuccess(`ส่งคำเชิญไปที่ ${email} แล้ว`);
      setEmail('');
    } catch (err: any) {
      setError(err.data ?? err.message ?? 'ส่งคำเชิญไม่สำเร็จ');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancel = async (invitationId: Id<'invitations'>) => {
    try {
      await cancelInvitation({ invitationId });
    } catch (err: any) {
      setError(err.data ?? err.message ?? 'ยกเลิกคำเชิญไม่สำเร็จ');
    }
  };

  const handleRemoveMember = async (userId: Id<'users'>, name: string) => {
    if (!workspaceId) return;
    if (!confirm(`ต้องการลบ ${name} ออกจากเวิร์กสเปซนี้ใช่ไหม?`)) return;
    try {
      await removeMember({ workspaceId, userId });
    } catch (err: any) {
      setError(err.data ?? err.message ?? 'ลบสมาชิกไม่สำเร็จ');
    }
  };

  const handleStartRoleEdit = (memberId: string, currentRole: string) => {
    setEditingMemberId(memberId);
    setPendingRole(currentRole as AssignableRole);
  };

  const handleSaveRole = async (userId: Id<'users'>) => {
    if (!workspaceId) return;
    try {
      await changeMemberRole({ workspaceId, userId, newRole: pendingRole });
      setEditingMemberId(null);
    } catch (err: any) {
      setError(err.data ?? err.message ?? 'เปลี่ยนบทบาทไม่สำเร็จ');
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
          aria-label="กลับไปยังการตั้งค่า"
        >
          <iconify-icon icon="solar:arrow-left-linear" width="20" height="20" aria-hidden="true" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">การจัดการทีม</h1>
          <p className="text-sm text-muted mt-1">จัดการสมาชิกในทีมและส่งคำเชิญเข้าร่วม</p>
        </div>
      </div>

      {/* Error / Success banners */}
      {error && (
        <div className="px-4 py-3 bg-red-50 border border-red-200 rounded-xl">
          <p className="text-sm text-red-700 font-medium">{error}</p>
        </div>
      )}
      {success && (
        <div className="px-4 py-3 bg-emerald-50 border border-emerald-200 rounded-xl">
          <p className="text-sm text-emerald-700 font-medium">{success}</p>
        </div>
      )}

      {/* Invite Form — only shown to owner/admin */}
      {canManage && (
        <div className="bg-surface border border-border rounded-2xl shadow-sm p-6">
          <h2 className="text-sm font-bold uppercase tracking-widest text-muted/60 mb-4">เชิญสมาชิกใหม่เข้าทีม</h2>
          <form onSubmit={handleInvite} className="flex flex-col sm:flex-row gap-3">
            <div className="flex-1">
              <label htmlFor="invite-email" className="sr-only">ที่อยู่อีเมล</label>
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
              <label htmlFor="invite-role" className="sr-only">บทบาท</label>
              <select
                id="invite-role"
                value={role}
                onChange={(e) => setRole(e.target.value as AssignableRole)}
                className="w-full px-4 py-2.5 bg-surface border border-border rounded-xl text-sm font-medium text-foreground focus:outline-none focus:ring-2 focus:ring-accent/10"
              >
                {myRole === 'owner' && <option value="admin">ผู้ดูแลระบบ</option>}
                <option value="manager">ผู้จัดการ</option>
                <option value="staff">พนักงาน</option>
                <option value="viewer">ผู้ดู</option>
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
                  กำลังส่ง...
                </>
              ) : (
                <>
                  <iconify-icon icon="solar:letter-bold-duotone" width="16" height="16" aria-hidden="true" />
                  ส่งคำเชิญ
                </>
              )}
            </button>
          </form>
        </div>
      )}

      {/* Pending Invitations */}
      {pendingInvitations && pendingInvitations.length > 0 && (
        <div className="bg-surface border border-border rounded-2xl shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-border bg-surface-raised/30">
            <h2 className="text-sm font-bold uppercase tracking-widest text-muted/60">
              คำเชิญที่รอการตอบรับ
              <span className="ml-2 text-xs bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full font-medium normal-case tracking-normal">
                {pendingInvitations.length}
              </span>
            </h2>
          </div>
          <div className="divide-y divide-border">
            {pendingInvitations.map((inv) => (
              <div key={inv._id} className="px-6 py-4 flex items-center justify-between gap-4">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-9 h-9 rounded-full bg-amber-100 flex items-center justify-center text-amber-600 shrink-0">
                    <iconify-icon icon="solar:clock-circle-bold-duotone" width="18" height="18" aria-hidden="true" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-foreground truncate">{inv.email}</p>
                    <p className="text-xs text-muted">
                      เชิญในบทบาท {ROLE_LABELS[inv.role]} โดย {inv.inviterName}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3 shrink-0">
                  <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest border ${ROLE_COLORS[inv.role] ?? ROLE_COLORS.staff}`}>
                    {ROLE_LABELS[inv.role]}
                  </span>
                  {canManage && (
                    <button
                      onClick={() => handleCancel(inv._id)}
                      className="text-xs font-medium text-muted hover:text-red-600 transition-colors px-3 py-1.5 rounded-lg hover:bg-red-50"
                    >
                      ยกเลิก
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Team Members */}
      <div className="bg-surface border border-border rounded-2xl shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-border bg-surface-raised/30">
          <h2 className="text-sm font-bold uppercase tracking-widest text-muted/60">
            สมาชิกที่ใช้งานอยู่
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
            {members.map((member) => {
              const isMe = me?._id === member._id;
              const isOwner = member.role === 'owner';
              const isEditing = editingMemberId === member._id;
              // Admin cannot manage owners or other admins
              const canEdit = canManage && !isOwner && !(myRole === 'admin' && member.role === 'admin');
              const canRemove = canEdit && !isMe;

              return (
                <div key={member._id} className="px-6 py-4 flex items-center justify-between gap-4 group hover:bg-surface-raised/30 transition-colors">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-10 h-10 rounded-full bg-accent-subtle flex items-center justify-center text-sm font-semibold text-accent shrink-0">
                      {getInitials(member.name)}
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-foreground truncate">
                        {member.name}
                        {isMe && <span className="ml-1.5 text-xs text-muted">(คุณ)</span>}
                      </p>
                      <p className="text-xs text-muted truncate">{member.email}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    {/* Role display / inline editor */}
                    {isEditing ? (
                      <div className="flex items-center gap-2">
                        <select
                          value={pendingRole}
                          onChange={(e) => setPendingRole(e.target.value as AssignableRole)}
                          className="px-3 py-1.5 bg-surface border border-border rounded-lg text-xs font-medium text-foreground focus:outline-none focus:ring-2 focus:ring-accent/10"
                          aria-label="เลือกบทบาทใหม่"
                        >
                          {myRole === 'owner' && <option value="admin">ผู้ดูแลระบบ</option>}
                          <option value="manager">ผู้จัดการ</option>
                          <option value="staff">พนักงาน</option>
                          <option value="viewer">ผู้ดู</option>
                        </select>
                        <button
                          onClick={() => handleSaveRole(member._id as Id<'users'>)}
                          className="px-3 py-1.5 text-xs font-bold text-white bg-accent rounded-lg hover:bg-accent/90 transition-colors"
                        >
                          บันทึก
                        </button>
                        <button
                          onClick={() => setEditingMemberId(null)}
                          className="px-3 py-1.5 text-xs font-medium text-muted hover:text-foreground rounded-lg hover:bg-subtle transition-colors"
                        >
                          ยกเลิก
                        </button>
                      </div>
                    ) : (
                      <>
                        <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest border ${ROLE_COLORS[member.role] ?? ROLE_COLORS.staff}`}>
                          {ROLE_LABELS[member.role] ?? member.role}
                        </span>
                        {canEdit && (
                          <button
                            onClick={() => handleStartRoleEdit(member._id, member.role)}
                            className="opacity-0 group-hover:opacity-100 text-xs font-medium text-muted hover:text-accent transition-all px-2 py-1.5 rounded-lg hover:bg-accent-subtle"
                            aria-label={`เปลี่ยนบทบาทของ ${member.name}`}
                          >
                            <iconify-icon icon="solar:pen-bold-duotone" width="14" height="14" aria-hidden="true" />
                          </button>
                        )}
                        {canRemove && (
                          <button
                            onClick={() => handleRemoveMember(member._id as Id<'users'>, member.name)}
                            className="opacity-0 group-hover:opacity-100 text-xs font-medium text-muted hover:text-red-600 transition-all px-2 py-1.5 rounded-lg hover:bg-red-50"
                            aria-label={`ลบ ${member.name} ออกจากทีม`}
                          >
                            <iconify-icon icon="solar:trash-bin-trash-bold-duotone" width="14" height="14" aria-hidden="true" />
                          </button>
                        )}
                      </>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="px-6 py-12 text-center text-sm text-muted">ไม่พบสมาชิกในทีม</div>
        )}
      </div>

      {/* Info footer for viewers */}
      {!canManage && (
        <div className="rounded-xl border border-border bg-surface px-5 py-4 text-sm text-muted">
          <p>คุณสามารถดูรายชื่อสมาชิกในทีมได้ แต่ต้องการสิทธิ์ผู้ดูแลระบบหรือเจ้าของเพื่อเชิญหรือแก้ไขสมาชิก</p>
        </div>
      )}
    </div>
  );
}
