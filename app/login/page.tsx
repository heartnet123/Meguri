import React from 'react';
import Link from 'next/link';

export default function LoginPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-neutral-50 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8 bg-white p-8 rounded-2xl shadow-xl border border-neutral-200">
        <div className="text-center">
          <h2 className="text-3xl font-medium tracking-tight text-neutral-900">Welcome back</h2>
          <p className="mt-2 text-sm text-neutral-500">
            Sign in to your SmartStock account
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
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-neutral-700">
                Password
              </label>
              <input
                id="password"
                name="password"
                type="password"
                autoComplete="current-password"
                required
                className="mt-1 appearance-none relative block w-full px-3 py-2 border border-neutral-300 placeholder-neutral-500 text-neutral-900 rounded-lg focus:outline-none focus:ring-2 focus:ring-neutral-900 focus:border-neutral-900 focus:z-10 sm:text-sm"
                placeholder="••••••••"
              />
            </div>
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <input
                id="remember-me"
                name="remember-me"
                type="checkbox"
                className="h-4 w-4 text-neutral-900 focus:ring-neutral-900 border-neutral-300 rounded"
              />
              <label htmlFor="remember-me" className="ml-2 block text-sm text-neutral-900">
                Remember me
              </label>
            </div>

            <div className="text-sm">
              <a href="#" className="font-medium text-neutral-600 hover:text-neutral-900">
                Forgot your password?
              </a>
            </div>
          </div>

          <div>
            <Link
              href="/dashboard"
              className="group relative w-full flex justify-center py-2.5 px-4 border border-transparent text-sm font-medium rounded-lg text-white bg-neutral-900 hover:bg-neutral-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-neutral-900 shadow-sm transition-colors"
            >
              Sign in
            </Link>
          </div>
        </form>
        
        <div className="mt-6">
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-neutral-300" />
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2 bg-white text-neutral-500">Or continue with</span>
            </div>
          </div>

          <div className="mt-6 grid grid-cols-2 gap-3">
            <div>
              <a
                href="#"
                className="w-full inline-flex justify-center py-2 px-4 border border-neutral-300 rounded-lg shadow-sm bg-white text-sm font-medium text-neutral-500 hover:bg-neutral-50"
              >
                <span className="sr-only">Sign in with Google</span>
                <iconify-icon icon="logos:google-icon" width="20" height="20"></iconify-icon>
              </a>
            </div>
            <div>
              <a
                href="#"
                className="w-full inline-flex justify-center py-2 px-4 border border-neutral-300 rounded-lg shadow-sm bg-white text-sm font-medium text-neutral-500 hover:bg-neutral-50"
              >
                <span className="sr-only">Sign in with Apple</span>
                <iconify-icon icon="logos:apple" width="20" height="20"></iconify-icon>
              </a>
            </div>
          </div>
        </div>
        
        <p className="mt-2 text-center text-sm text-neutral-600">
          Don&apos;t have an account?{' '}
          <Link href="/register" className="font-medium text-neutral-900 hover:underline">
            Sign up
          </Link>
        </p>
      </div>
    </div>
  );
}
