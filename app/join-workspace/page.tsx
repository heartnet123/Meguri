import React from 'react';
import Link from 'next/link';

export default function JoinWorkspacePage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-neutral-50 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8 bg-white p-8 rounded-2xl shadow-xl border border-neutral-200">
        <div className="text-center">
          <div className="mx-auto h-12 w-12 rounded-full bg-neutral-100 flex items-center justify-center mb-4">
            <iconify-icon icon="lucide:building-2" width="24" height="24" className="text-neutral-600"></iconify-icon>
          </div>
          <h2 className="text-3xl font-medium tracking-tight text-neutral-900">Join Workspace</h2>
          <p className="mt-2 text-sm text-neutral-500">
            You&apos;ve been invited to join <span className="font-semibold text-neutral-900">Acme Bakery</span>
          </p>
        </div>
        
        <div className="mt-8 space-y-6">
          <div className="bg-neutral-50 rounded-lg p-4 border border-neutral-200">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-full bg-neutral-200 flex items-center justify-center text-neutral-600 font-medium">
                JD
              </div>
              <div>
                <p className="text-sm font-medium text-neutral-900">Invited by John Doe</p>
                <p className="text-xs text-neutral-500">john@acmebakery.com</p>
              </div>
            </div>
          </div>

          <form className="space-y-6" action="#" method="POST">
            <div className="space-y-4">
              <div>
                <label htmlFor="full-name" className="block text-sm font-medium text-neutral-700">
                  Your Full Name
                </label>
                <input
                  id="full-name"
                  name="name"
                  type="text"
                  required
                  className="mt-1 appearance-none relative block w-full px-3 py-2 border border-neutral-300 placeholder-neutral-500 text-neutral-900 rounded-lg focus:outline-none focus:ring-2 focus:ring-neutral-900 focus:border-neutral-900 focus:z-10 sm:text-sm"
                  placeholder="Jane Smith"
                />
              </div>
              <div>
                <label htmlFor="password" className="block text-sm font-medium text-neutral-700">
                  Create Password
                </label>
                <input
                  id="password"
                  name="password"
                  type="password"
                  required
                  className="mt-1 appearance-none relative block w-full px-3 py-2 border border-neutral-300 placeholder-neutral-500 text-neutral-900 rounded-lg focus:outline-none focus:ring-2 focus:ring-neutral-900 focus:border-neutral-900 focus:z-10 sm:text-sm"
                  placeholder="••••••••"
                />
              </div>
            </div>

            <div>
              <Link
                href="/dashboard"
                className="group relative w-full flex justify-center py-2.5 px-4 border border-transparent text-sm font-medium rounded-lg text-white bg-teal-600 hover:bg-teal-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-teal-600 shadow-sm transition-colors"
              >
                Accept Invitation
              </Link>
            </div>
          </form>
        </div>
        
        <p className="mt-6 text-center text-sm text-neutral-600">
          Not you?{' '}
          <Link href="/login" className="font-medium text-neutral-900 hover:underline">
            Sign in with a different account
          </Link>
        </p>
      </div>
    </div>
  );
}
