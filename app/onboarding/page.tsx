'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useMutation, useQuery } from 'convex/react';
import { api } from '@/convex/_generated/api';
import Link from 'next/link';

const TIMEZONES = [
  { label: 'กรุงเทพฯ (UTC+7)', value: 'Asia/Bangkok' },
  { label: 'สิงคโปร์ (UTC+8)', value: 'Asia/Singapore' },
  { label: 'โตเกียว (UTC+9)', value: 'Asia/Tokyo' },
  { label: 'ลอนดอน (UTC+0)', value: 'Europe/London' },
  { label: 'นิวยอร์ก (UTC-5)', value: 'America/New_York' },
  { label: 'ลอสแอนเจลิส (UTC-8)', value: 'America/Los_Angeles' },
];

const CURRENCIES = [
  { label: 'THB – บาทไทย', value: 'THB' },
  { label: 'USD – ดอลลาร์สหรัฐ', value: 'USD' },
  { label: 'SGD – ดอลลาร์สิงคโปร์', value: 'SGD' },
  { label: 'GBP – ปอนด์สเตอร์ลิง', value: 'GBP' },
  { label: 'EUR – ยูโร', value: 'EUR' },
  { label: 'JPY – เยนญี่ปุ่น', value: 'JPY' },
];

function slugify(text: string) {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-');
}

export default function OnboardingPage() {
  const router = useRouter();
  const createWorkspace = useMutation(api.workspaces.create);
  const myWorkspaces = useQuery(api.workspaces.myWorkspaces);

  const [name, setName] = useState('');
  const [slug, setSlug] = useState('');
  const [currency, setCurrency] = useState('THB');
  const [timezone, setTimezone] = useState('Asia/Bangkok');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const hasExistingWorkspaces = myWorkspaces && myWorkspaces.length > 0;

  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setName(value);
    setSlug(slugify(value));
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!name.trim() || !slug.trim()) return;

    setError('');
    setIsLoading(true);

    try {
      await createWorkspace({ name: name.trim(), slug, currency, timezone });
      router.replace('/dashboard');
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'ไม่สามารถสร้างเวิร์กสเปซได้';
      setError(message);
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-neutral-50 px-4 sm:px-6 lg:px-8">
      <div className="max-w-lg w-full space-y-8 bg-white p-8 rounded-2xl shadow-xl border border-neutral-200">
        {/* Header */}
        <div className="text-center">
          <div className="mx-auto w-12 h-12 bg-teal-50 rounded-xl flex items-center justify-center mb-4">
            <svg className="w-6 h-6 text-teal-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
            </svg>
          </div>
          <h1 className="text-2xl font-semibold tracking-tight text-neutral-900">
            {hasExistingWorkspaces ? 'สร้างเวิร์กสเปซใหม่' : 'ตั้งค่าเวิร์กสเปซของคุณ'}
          </h1>
          <p className="mt-2 text-sm text-neutral-500">
            ใช้เวลาประมาณ 30 วินาที และคุณสามารถกลับมาเปลี่ยนการตั้งค่าเหล่านี้ภายหลังได้
          </p>
          {hasExistingWorkspaces && (
            <Link
              href="/select-workspace"
              className="inline-flex items-center gap-1 mt-3 text-sm text-teal-600 hover:text-teal-700"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
              กลับไปเลือกเวิร์กสเปซ
            </Link>
          )}
        </div>

        <form onSubmit={handleSubmit} noValidate className="space-y-5">
          {error && (
            <div role="alert" className="p-3 rounded-lg bg-red-50 border border-red-100 text-sm text-red-700">
              {error}
            </div>
          )}

          {/* Business name */}
          <div>
            <label htmlFor="workspace-name" className="block text-sm font-medium text-neutral-700">
              ชื่อธุรกิจ
            </label>
            <input
              id="workspace-name"
              name="name"
              type="text"
              required
              value={name}
              onChange={handleNameChange}
              className="mt-1 block w-full px-3 py-2 border border-neutral-300 placeholder-neutral-400 text-neutral-900 rounded-lg focus:outline-none focus-visible:ring-2 focus-visible:ring-teal-600 sm:text-sm"
              placeholder="เบเกอรีดอกทานตะวัน"
            />
          </div>

          {/* Slug */}
          <div>
            <label htmlFor="workspace-slug" className="block text-sm font-medium text-neutral-700">
              รหัสเวิร์กสเปซ <span className="text-neutral-400 font-normal">(ใช้ในลิงก์คำเชิญ)</span>
            </label>
            <div className="mt-1 flex rounded-lg shadow-sm">
              <span className="inline-flex items-center px-3 rounded-l-lg border border-r-0 border-neutral-300 bg-neutral-50 text-neutral-500 sm:text-sm">
                smartstock.app/
              </span>
              <input
                id="workspace-slug"
                name="slug"
                type="text"
                required
                value={slug}
                onChange={(e) => setSlug(slugify(e.target.value))}
                className="flex-1 block w-full px-3 py-2 border border-neutral-300 rounded-none rounded-r-lg placeholder-neutral-400 text-neutral-900 focus:outline-none focus-visible:ring-2 focus-visible:ring-teal-600 sm:text-sm"
                placeholder="sunflower-bakery"
              />
            </div>
          </div>

          {/* Currency + Timezone */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label htmlFor="currency" className="block text-sm font-medium text-neutral-700">
                สกุลเงิน
              </label>
              <select
                id="currency"
                name="currency"
                value={currency}
                onChange={(e) => setCurrency(e.target.value)}
                className="mt-1 block w-full px-3 py-2 border border-neutral-300 text-neutral-900 bg-white rounded-lg focus:outline-none focus-visible:ring-2 focus-visible:ring-teal-600 sm:text-sm"
              >
                {CURRENCIES.map((c) => (
                  <option key={c.value} value={c.value}>{c.label}</option>
                ))}
              </select>
            </div>
            <div>
              <label htmlFor="timezone" className="block text-sm font-medium text-neutral-700">
                เขตเวลา
              </label>
              <select
                id="timezone"
                name="timezone"
                value={timezone}
                onChange={(e) => setTimezone(e.target.value)}
                className="mt-1 block w-full px-3 py-2 border border-neutral-300 text-neutral-900 bg-white rounded-lg focus:outline-none focus-visible:ring-2 focus-visible:ring-teal-600 sm:text-sm"
              >
                {TIMEZONES.map((tz) => (
                  <option key={tz.value} value={tz.value}>{tz.label}</option>
                ))}
              </select>
            </div>
          </div>

          <button
            type="submit"
            disabled={isLoading || !name.trim() || !slug.trim()}
            id="create-workspace-btn"
            className="w-full flex justify-center py-2.5 px-4 border border-transparent text-sm font-semibold rounded-lg text-white bg-teal-600 hover:bg-teal-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-teal-600 shadow-sm transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
            aria-busy={isLoading}
          >
            {isLoading ? 'กำลังสร้างเวิร์กสเปซ…' : 'สร้างเวิร์กสเปซ →'}
          </button>
        </form>
      </div>
    </div>
  );
}
