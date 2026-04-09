'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { authClient } from '@/lib/auth-client';

export default function RegisterPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    const form = e.currentTarget;
    const name = (form.elements.namedItem('name') as HTMLInputElement).value;
    const email = (form.elements.namedItem('email') as HTMLInputElement).value;
    const password = (form.elements.namedItem('password') as HTMLInputElement).value;

    const { error: authError } = await authClient.signUp.email({
      name,
      email,
      password,
      callbackURL: '/onboarding',
    });

    setIsLoading(false);

    if (authError) {
      setError(authError.message ?? 'Sign up failed. Please try again.');
    } else {
      router.push('/onboarding');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-neutral-50 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8 bg-white p-8 rounded-2xl shadow-xl border border-neutral-200">
        <div className="text-center">
          <h1 className="text-3xl font-medium tracking-tight text-neutral-900">Create your account</h1>
          <p className="mt-2 text-sm text-neutral-500">
            Start managing your inventory in minutes
          </p>
        </div>

        <form onSubmit={handleSubmit} noValidate className="mt-8 space-y-6">
          {error && (
            <div role="alert" className="p-3 rounded-lg bg-red-50 border border-red-100 text-sm text-red-700">
              {error}
            </div>
          )}

          <div className="space-y-4">
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-neutral-700">
                Full name
              </label>
              <input
                id="name"
                name="name"
                type="text"
                autoComplete="name"
                required
                className="mt-1 appearance-none block w-full px-3 py-2 border border-neutral-300 placeholder-neutral-400 text-neutral-900 rounded-lg focus:outline-none focus-visible:ring-2 focus-visible:ring-neutral-900 sm:text-sm"
                placeholder="Jane Smith"
              />
            </div>
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-neutral-700">
                Email address
              </label>
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                required
                className="mt-1 appearance-none block w-full px-3 py-2 border border-neutral-300 placeholder-neutral-400 text-neutral-900 rounded-lg focus:outline-none focus-visible:ring-2 focus-visible:ring-neutral-900 sm:text-sm"
                placeholder="you@example.com"
              />
            </div>
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-neutral-700">
                Password
              </label>
              <input
                id="password"
                name="password"
                type="password"
                autoComplete="new-password"
                required
                minLength={8}
                className="mt-1 appearance-none block w-full px-3 py-2 border border-neutral-300 placeholder-neutral-400 text-neutral-900 rounded-lg focus:outline-none focus-visible:ring-2 focus-visible:ring-neutral-900 sm:text-sm"
                placeholder="At least 8 characters"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            id="sign-up-btn"
            className="w-full flex justify-center py-2.5 px-4 border border-transparent text-sm font-medium rounded-lg text-white bg-teal-600 hover:bg-teal-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-teal-600 shadow-sm transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
            aria-busy={isLoading}
          >
            {isLoading ? 'Creating account…' : 'Create account'}
          </button>
        </form>

        <p className="mt-2 text-center text-sm text-neutral-600">
          Already have an account?{' '}
          <Link href="/login" className="font-medium text-teal-600 hover:text-teal-700 hover:underline">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}
