"use client";

import { useActionState } from "react";
import { createPlayerByDeveloper } from "@/app/actions/developer";

const initialState = {
  success: false,
  error: "",
  userId: null as string | null,
};

export default function AddPlayersForm() {
  const [state, formAction, pending] = useActionState(
    createPlayerByDeveloper,
    initialState
  );

  return (
    <form action={formAction} className="grid gap-4 md:grid-cols-4">
      <input
        name="fullName"
        type="text"
        placeholder="Full name"
        required
        className="rounded-xl border border-gray-700 bg-gray-950 px-4 py-3 text-sm text-white outline-none placeholder:text-gray-600 focus:border-yellow-500"
      />

      <input
        name="email"
        type="email"
        placeholder="Email"
        required
        className="rounded-xl border border-gray-700 bg-gray-950 px-4 py-3 text-sm text-white outline-none placeholder:text-gray-600 focus:border-yellow-500"
      />

      <input
        name="password"
        type="password"
        placeholder="Password"
        required
        minLength={6}
        className="rounded-xl border border-gray-700 bg-gray-950 px-4 py-3 text-sm text-white outline-none placeholder:text-gray-600 focus:border-yellow-500"
      />

      <button
        type="submit"
        disabled={pending}
        className="rounded-xl bg-yellow-500 px-4 py-3 text-sm font-semibold text-black transition hover:bg-yellow-400 disabled:cursor-not-allowed disabled:opacity-50"
      >
        {pending ? "Creating..." : "Add Player"}
      </button>

      {state.error && (
        <p className="md:col-span-4 text-sm text-red-400">
          {state.error}
        </p>
      )}

      {state.success && (
        <p className="md:col-span-4 text-sm text-green-400">
          Player created successfully.
        </p>
      )}
    </form>
  );
}