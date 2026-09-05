'use client'

import { useState } from 'react'
import { loginDeveloper } from '@/app/actions/developer'

export default function DeveloperLoginPage() {
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    const formData = new FormData(e.currentTarget)
    const result = await loginDeveloper(formData)

    if (result?.error) {
      setError(result.error)
      setLoading(false)
    }
  }

  return (
    <div className="flex min-h-screen w-full items-center justify-center bg-gray-950 font-sans px-4">
      <div className="w-full max-w-md rounded-2xl bg-gray-900 border border-gray-800 p-8 shadow-2xl">
        <div className="mb-6 text-center">
          <span className="inline-block rounded-full bg-red-500/10 px-3 py-1 text-xs font-semibold text-red-400 mb-3 tracking-wide uppercase">
            Restricted Portal
          </span>
          <h1 className="text-2xl font-bold tracking-tight text-white">
            Developer Login
          </h1>
          <p className="mt-1 text-sm text-gray-400">
            Secure multi-arena system administration.
          </p>
        </div>

        {error && (
          <div className="mb-4 rounded-xl bg-red-500/10 p-3 text-sm text-red-400 border border-red-500/20">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-gray-300 uppercase tracking-wider mb-1.5">
              Developer Email
            </label>
            <input
              name="email"
              type="email"
              required
              placeholder="developer@platform.com"
              className="w-full rounded-xl border border-gray-800 bg-gray-950 px-4 py-3 text-sm text-white placeholder:text-gray-600 focus:border-red-500 focus:outline-none transition-all"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-300 uppercase tracking-wider mb-1.5">
              Password
            </label>
            <input
              name="password"
              type="password"
              required
              placeholder="••••••••"
              className="w-full rounded-xl border border-gray-800 bg-gray-950 px-4 py-3 text-sm text-white placeholder:text-gray-600 focus:border-red-500 focus:outline-none transition-all"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-xl bg-red-600 py-3 text-sm font-semibold text-white shadow-lg shadow-red-600/20 hover:bg-red-500 active:scale-[0.99] transition-all disabled:opacity-50 mt-2"
          >
            {loading ? 'Authenticating...' : 'Access Developer Console'}
          </button>
        </form>
      </div>
    </div>
  )
}