'use client';

import React, { Suspense, useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { authClient } from '@/lib/auth-client';

// Separated because useSearchParams() requires a Suspense boundary in App Router
function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  // Middleware attaches ?redirect=<path> whenever an unauthenticated user hits a protected route.
  // We honour that so deep-linking (e.g. /dashboard) survives the login round-trip.
  const redirectTo = searchParams.get('redirect') ?? '/select-workspace';

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    const form = e.currentTarget;
    const email = (form.elements.namedItem('email') as HTMLInputElement).value;
    const password = (form.elements.namedItem('password') as HTMLInputElement).value;

    const { error: authError } = await authClient.signIn.email({
      email,
      password,
      callbackURL: redirectTo,
    });

    setIsLoading(false);

    if (authError) {
      setError(authError.message ?? 'เข้าสู่ระบบไม่สำเร็จ กรุณาลองอีกครั้ง');
    } else {
      router.push(redirectTo);
    }
  };

  return (
    <form onSubmit={handleSubmit} noValidate className="mt-8 space-y-6">
      {error && (
        <div role="alert" className="p-3 rounded-lg bg-danger-subtle border border-danger/20 text-sm text-danger">
          {error}
        </div>
      )}

      <div className="space-y-4">
        <div>
          <label htmlFor="email" className="block text-sm font-medium text-foreground">
            อีเมล
          </label>
          <input
            id="email"
            name="email"
            type="email"
            autoComplete="email"
            required
            className="mt-1 appearance-none block w-full px-3 py-2 border border-border placeholder-muted-fg text-foreground rounded-lg focus:outline-none focus-visible:ring-2 focus-visible:ring-foreground focus-visible:border-foreground sm:text-sm"
            placeholder="name@example.com"
          />
        </div>
        <div>
          <label htmlFor="password" className="block text-sm font-medium text-foreground">
            รหัสผ่าน
          </label>
          <input
            id="password"
            name="password"
            type="password"
            autoComplete="current-password"
            required
            minLength={8}
            className="mt-1 appearance-none block w-full px-3 py-2 border border-border placeholder-muted-fg text-foreground rounded-lg focus:outline-none focus-visible:ring-2 focus-visible:ring-foreground focus-visible:border-foreground sm:text-sm"
            placeholder="••••••••"
          />
        </div>
      </div>

      <button
        type="submit"
        disabled={isLoading}
        id="sign-in-btn"
        className="w-full flex justify-center py-2.5 px-4 border border-transparent text-sm font-medium rounded-lg text-accent-fg bg-accent hover:bg-accent/90 focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-accent shadow-sm transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
        aria-busy={isLoading}
      >
        {isLoading ? 'กำลังเข้าสู่ระบบ…' : 'เข้าสู่ระบบ'}
      </button>
    </form>
  );
}

export default function LoginPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8 bg-surface p-8 rounded-2xl shadow-xl border border-border">
        <div className="text-center">
          <h1 className="text-3xl font-medium tracking-tight text-foreground">ยินดีต้อนรับกลับ</h1>
          <p className="mt-2 text-sm text-muted">ลงชื่อเข้าใช้บัญชี SmartStock ของคุณ</p>
        </div>

        {/* Suspense required by Next.js App Router for useSearchParams */}
        <Suspense fallback={<div className="h-48 animate-pulse rounded-xl bg-subtle" />}>
          <LoginForm />
        </Suspense>

        <p className="mt-2 text-center text-sm text-muted">
          ยังไม่มีบัญชีใช่ไหม?{' '}
          <Link href="/register" className="font-medium text-accent hover:text-accent/80 hover:underline">
            สมัครสมาชิก
          </Link>
        </p>
      </div>
    </div>
  );
}
