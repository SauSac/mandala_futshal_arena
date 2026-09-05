'use client'

import { useState } from 'react'
import { registerPlayer } from '@/app/actions/auth'
import Link from 'next/link'

export default function RegisterPage() {
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    const formData = new FormData(e.currentTarget)
    const result = await registerPlayer(formData)

    if (result?.error) {
      setError(result.error)
      setLoading(false)
    }
  }

  return (
    <div className="flex min-h-screen w-full bg-white font-sans">
      {/* Form Section */}
      <div className="flex w-full flex-col justify-center px-8 sm:px-16 lg:w-1/2 lg:px-24 xl:px-32">
        <div className="mx-auto w-full max-w-md">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-extrabold tracking-tight text-gray-950 sm:text-4xl">
              PLAYER REGISTRATION
            </h1>
            <p className="mt-2 text-sm text-gray-500">
              Join the multi-arena platform. Standard registration fee: <span className="font-semibold text-gray-900">Rs. 40</span>
            </p>
          </div>

          {/* Error Banner */}
          {error && (
            <div className="mb-4 rounded-xl bg-red-50 p-3 text-sm text-red-600 border border-red-200">
              {error}
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-900 mb-1.5">
                Full Name
              </label>
              <input
                name="fullName"
                type="text"
                required
                placeholder="John Doe"
                className="w-full rounded-xl border border-gray-200 bg-gray-50/50 px-4 py-3.5 text-sm text-gray-900 placeholder:text-gray-400 focus:border-red-500 focus:bg-white focus:outline-none transition-all"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-900 mb-1.5">
                Email
              </label>
              <input
                name="email"
                type="email"
                required
                placeholder="player@example.com"
                className="w-full rounded-xl border border-gray-200 bg-gray-50/50 px-4 py-3.5 text-sm text-gray-900 placeholder:text-gray-400 focus:border-red-500 focus:bg-white focus:outline-none transition-all"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-900 mb-1.5">
                Password
              </label>
              <input
                name="password"
                type="password"
                required
                placeholder="••••••••"
                className="w-full rounded-xl border border-gray-200 bg-gray-50/50 px-4 py-3.5 text-sm text-gray-900 placeholder:text-gray-400 focus:border-red-500 focus:bg-white focus:outline-none transition-all"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-900 mb-1.5">
                Payment Method
              </label>
              <select
                name="paymentMethod"
                className="w-full rounded-xl border border-gray-200 bg-gray-50/50 px-4 py-3.5 text-sm text-gray-900 focus:border-red-500 focus:bg-white focus:outline-none transition-all"
              >
                <option value="offline">Offline Payment (Requires Developer Approval)</option>
                <option value="online">Online Payment Gateway</option>
              </select>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-xl bg-red-600 py-3.5 text-sm font-semibold text-white shadow-lg shadow-red-500/25 hover:bg-red-700 active:scale-[0.99] transition-all disabled:opacity-50 mt-2"
            >
              {loading ? 'Processing Registration...' : 'Register & Pay Rs. 40'}
            </button>
          </form>

          {/* Footer link */}
          <p className="mt-8 text-center text-sm text-gray-500">
            Already have an account?{' '}
            <Link href="/auth/login" className="font-semibold text-red-600 hover:underline">
              Sign in
            </Link>
          </p>
        </div>
      </div>

      {/* Decorative Right Column */}
      <div className="hidden w-1/2 bg-gray-100 lg:flex items-center justify-center p-12">
        <div className="text-center max-w-md">
          <h2 className="text-2xl font-bold text-gray-900 mb-3">Multi-Arena Futsal Network</h2>
          <p className="text-gray-600 text-sm">
            Register once to access arenas, form teams, book slots seamlessly, and compete in individual 1-vs-1 matchups.
          </p>
        </div>
      </div>
    </div>
  )
}