"use client";

import { useState } from "react";
import Link from "next/link";
import { loginPlayer } from "@/app/actions/auth";

export default function LoginPage() {
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setLoading(true);

    const formData = new FormData(event.currentTarget);

    try {
      const result = await loginPlayer(formData);

      if (result?.error) {
        setError(result.error);
      }
    } catch (err: unknown) {
      setError(
        err instanceof Error
          ? err.message
          : "An unexpected error occurred."
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen grid grid-cols-1 lg:grid-cols-2 font-sans bg-black">
      {/* Left Column: Form Section */}
      <div className="flex flex-col justify-center px-6 py-12 lg:px-20 xl:px-24 bg-white text-gray-900">
        <div className="mx-auto w-full max-w-sm lg:max-w-md">
          <div className="mb-10">
            <span className="inline-block px-3 py-1 mb-4 rounded-full bg-emerald-50 text-emerald-600 text-xs font-semibold tracking-wide uppercase">
              Player Portal
            </span>
            <h1 className="text-3xl font-bold tracking-tight text-gray-900">
              Welcome back
            </h1>
            <p className="mt-2 text-sm text-gray-500">
              Don&apos;t have an active account yet?{" "}
              <Link
                href="/auth/register"
                className="font-semibold text-black underline underline-offset-4 hover:text-emerald-600 transition-colors"
              >
                Register for membership
              </Link>
            </p>
          </div>

          {error && (
            <div className="mb-6 rounded-2xl bg-red-50 p-4 text-sm text-red-600 border border-red-200">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label
                htmlFor="email"
                className="block text-xs font-semibold uppercase tracking-wider text-gray-700 mb-2"
              >
                Email Address
              </label>
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                required
                className="w-full rounded-2xl border border-gray-200 bg-gray-50/50 px-4 py-3.5 text-sm text-gray-900 placeholder:text-gray-400 focus:border-black focus:bg-white focus:outline-none transition-all"
                placeholder="player@example.com"
              />
            </div>

            <div>
              <label
                htmlFor="password"
                className="block text-xs font-semibold uppercase tracking-wider text-gray-700 mb-2"
              >
                Password
              </label>
              <input
                id="password"
                name="password"
                type="password"
                autoComplete="current-password"
                required
                className="w-full rounded-2xl border border-gray-200 bg-gray-50/50 px-4 py-3.5 text-sm text-gray-900 placeholder:text-gray-400 focus:border-black focus:bg-white focus:outline-none transition-all"
                placeholder="••••••••"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-2xl bg-black px-4 py-4 text-sm font-semibold text-white shadow-lg shadow-black/10 transition hover:bg-gray-800 disabled:opacity-50"
            >
              {loading ? "Signing in..." : "Sign In to Dashboard"}
            </button>
          </form>
        </div>
      </div>

      {/* Right Column: Attraction Image / Playground Banner */}
      <div className="relative hidden lg:flex flex-col justify-end p-12 bg-gray-900 overflow-hidden">
        {/* Background Playground Image with Dark Overlay */}
        <div 
          className="absolute inset-0 bg-cover bg-center opacity-60 mix-blend-overlay"
          style={{
            backgroundImage: `url('https://images.unsplash.com/photo-1529900748604-07564a03e7a6?q=80&w=1600&auto=format&fit=crop')`
          }}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent" />

        {/* Content over image */}
        <div className="relative z-10 max-w-lg">
          <div className="h-1.5 w-12 bg-emerald-500 rounded-full mb-6" />
          <blockquote className="text-2xl font-semibold tracking-tight text-white sm:text-3xl">
            &ldquo;Step onto the pitch, book your multi-arena slots instantly, and dominate your matches.&rdquo;
          </blockquote>
          <p className="mt-4 text-sm text-gray-300 font-medium">
            Multi-Arena Football & Futsal Management Platform
          </p>
        </div>
      </div>
    </div>
  );
}