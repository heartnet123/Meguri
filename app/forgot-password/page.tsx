import React from 'react';
import Link from 'next/link';

export default function ForgotPasswordPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-neutral-50 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8 bg-white p-8 rounded-2xl shadow-xl border border-neutral-200">
        <div className="text-center">
          <h2 className="text-3xl font-medium tracking-tight text-neutral-900">Reset your password</h2>
          <p className="mt-2 text-sm text-neutral-500">
            Enter your email and we&apos;ll send you a link to reset your password.
          </p>
        </div>
        <form className="mt-8 space-y-6" action="#" method="POST">
          <div className="space-y-4">
            <div>
              <label htmlFor="email-address" className="block text-sm font-medium text-neutral-700">
                Email address
              </label>
              <input
                id="email-address"
                name="email"
                type="email"
                autoComplete="email"
                required
                className="mt-1 appearance-none relative block w-full px-3 py-2 border border-neutral-300 placeholder-neutral-500 text-neutral-900 rounded-lg focus:outline-none focus:ring-2 focus:ring-neutral-900 focus:border-neutral-900 focus:z-10 sm:text-sm"
                placeholder="you@example.com"
              />
            </div>
          </div>

          <div>
            <button
              type="submit"
              className="group relative w-full flex justify-center py-2.5 px-4 border border-transparent text-sm font-medium rounded-lg text-white bg-neutral-900 hover:bg-neutral-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-neutral-900 shadow-sm transition-colors"
            >
              Send reset link
            </button>
          </div>
        </form>
        
        <p className="mt-6 text-center text-sm text-neutral-600">
          Remember your password?{' '}
          <Link href="/login" className="font-medium text-neutral-900 hover:underline">
            Back to login
          </Link>
        </p>
      </div>
    </div>
  );
}
