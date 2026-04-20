'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { useQuery, useMutation } from 'convex/react';
import { api } from '@/convex/_generated/api';
import Link from 'next/link';

export default function SelectWorkspacePage() {
  const router = useRouter();
  const workspaces = useQuery(api.workspaces.myWorkspaces);
  const pendingInvites = useQuery(api.invitations.getPendingForUser);
  const onboardingState = useQuery(api.users.getOnboardingState);

  const isLoading = workspaces === undefined || pendingInvites === undefined || onboardingState === undefined;

  const handleSelectWorkspace = (workspaceId: string) => {
    localStorage.setItem('smartstock-current-workspace', workspaceId);
    router.push('/dashboard');
  };

  const roleLabel = (role: string) => {
    switch (role) {
      case 'owner': return 'เจ้าของ';
      case 'admin': return 'ผู้ดูแลระบบ';
      case 'manager': return 'ผู้จัดการ';
      case 'staff': return 'พนักงาน';
      case 'viewer': return 'ผู้ดู';
      default: return role;
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-neutral-50">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-teal-200 border-t-teal-600 rounded-full animate-spin" />
          <p className="text-sm text-neutral-500">กำลังโหลด...</p>
        </div>
      </div>
    );
  }

  const hasWorkspaces = workspaces && workspaces.length > 0;
  const hasInvites = pendingInvites && pendingInvites.length > 0;

  return (
    <div className="min-h-screen bg-neutral-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="text-center mb-10">
          <div className="mx-auto w-12 h-12 bg-teal-50 rounded-xl flex items-center justify-center mb-4">
            <svg className="w-6 h-6 text-teal-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
            </svg>
          </div>
          <h1 className="text-2xl font-semibold text-neutral-900">เลือกเวิร์กสเปซของคุณ</h1>
          <p className="mt-2 text-sm text-neutral-500">
            เลือกเวิร์กสเปซที่ต้องการเข้าใช้งาน หรือสร้างเวิร์กสเปซใหม่
          </p>
        </div>

        {/* Pending Invitations Section */}
        {hasInvites && (
          <div className="mb-8">
            <h2 className="text-sm font-medium text-neutral-700 uppercase tracking-wide mb-4">
              คำเชิญที่รออยู่ ({pendingInvites.length})
            </h2>
            <div className="space-y-3">
              {pendingInvites.map((invite) => (
                <div
                  key={invite._id}
                  className="bg-white rounded-xl border border-amber-200 shadow-sm p-4 flex items-center justify-between"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-amber-50 rounded-lg flex items-center justify-center">
                      <svg className="w-5 h-5 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                      </svg>
                    </div>
                    <div>
                      <p className="font-medium text-neutral-900">{invite.workspaceName}</p>
                      <p className="text-sm text-neutral-500">
                        เชิญโดย {invite.inviterName} · บทบาท {roleLabel(invite.role)}
                      </p>
                    </div>
                  </div>
                  <Link
                    href={`/join-workspace?token=${invite.token}`}
                    className="px-4 py-2 bg-amber-600 text-white text-sm font-medium rounded-lg hover:bg-amber-700 transition-colors"
                  >
                    ตอบรับ
                  </Link>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Existing Workspaces Section */}
        {hasWorkspaces && (
          <div className="mb-8">
            <h2 className="text-sm font-medium text-neutral-700 uppercase tracking-wide mb-4">
              เวิร์กสเปซของคุณ
            </h2>
            <div className="space-y-3">
              {workspaces.map((workspace) => (
                <button
                  key={workspace._id}
                  onClick={() => handleSelectWorkspace(workspace._id)}
                  className="w-full bg-white rounded-xl border border-neutral-200 shadow-sm p-4 flex items-center justify-between hover:border-teal-300 hover:shadow-md transition-all text-left"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-teal-50 rounded-lg flex items-center justify-center">
                      <span className="text-teal-600 font-semibold">
                        {workspace.name.slice(0, 2).toUpperCase()}
                      </span>
                    </div>
                    <div>
                      <p className="font-medium text-neutral-900">{workspace.name}</p>
                      <p className="text-sm text-neutral-500">
                        {roleLabel(workspace.role)} · แพ็กเกจ {workspace.plan}
                      </p>
                    </div>
                  </div>
                  <svg className="w-5 h-5 text-neutral-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* No Workplaces State */}
        {!hasWorkspaces && !hasInvites && (
          <div className="bg-white rounded-xl border border-neutral-200 shadow-sm p-8 text-center mb-8">
            <div className="w-16 h-16 bg-neutral-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-neutral-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
              </svg>
            </div>
            <h3 className="text-lg font-medium text-neutral-900 mb-2">ยังไม่มีเวิร์กสเปซ</h3>
            <p className="text-sm text-neutral-500 mb-6">
              คุณยังไม่ได้เป็นสมาชิกของเวิร์กสเปซใด สร้างเวิร์กสเปซใหม่หรือรอคำเชิญจากผู้ดูแลระบบ
            </p>
          </div>
        )}

        {/* Actions */}
        <div className="space-y-3">
          <Link
            href="/onboarding"
            className="flex items-center justify-center gap-2 w-full py-3 px-4 bg-teal-600 text-white font-medium rounded-xl hover:bg-teal-700 transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
            </svg>
            สร้างเวิร์กสเปซใหม่
          </Link>

          <Link
            href="/join-workspace"
            className="flex items-center justify-center gap-2 w-full py-3 px-4 bg-white border border-neutral-300 text-neutral-700 font-medium rounded-xl hover:bg-neutral-50 transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
            </svg>
            เข้าร่วมด้วยรหัสเชิญ
          </Link>
        </div>
      </div>
    </div>
  );
}
