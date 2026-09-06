"use client";

import { useActionState } from "react";
import {
  createAndPairTournament,
  type TournamentState,
} from "@/app/actions/tournaments";

const initialState: TournamentState = {
  success: false,
  error: null,
  tournamentId: null,
};

export default function CreateTournamentForm() {
  const [state, formAction, isPending] = useActionState(
    createAndPairTournament,
    initialState,
  );

  return (
    <form action={formAction} className="space-y-5">
      <div>
        <label
          htmlFor="name"
          className="mb-2 block text-sm font-medium text-gray-300"
        >
          Tournament Name
        </label>

        <input
          id="name"
          name="name"
          type="text"
          required
          disabled={isPending}
          placeholder="Enter tournament name"
          className="w-full rounded-xl border border-gray-700 bg-gray-950 px-4 py-3 text-sm text-white outline-none transition placeholder:text-gray-600 focus:border-blue-500 disabled:cursor-not-allowed disabled:opacity-60"
        />
      </div>

      <div>
        <label
          htmlFor="description"
          className="mb-2 block text-sm font-medium text-gray-300"
        >
          Description
          <span className="ml-1 text-xs text-gray-500">
            (Optional)
          </span>
        </label>

        <textarea
          id="description"
          name="description"
          rows={4}
          disabled={isPending}
          placeholder="Enter tournament description"
          className="w-full resize-none rounded-xl border border-gray-700 bg-gray-950 px-4 py-3 text-sm text-white outline-none transition placeholder:text-gray-600 focus:border-blue-500 disabled:cursor-not-allowed disabled:opacity-60"
        />
      </div>

      {state.error && (
        <div className="rounded-xl border border-red-900/50 bg-red-950/30 px-4 py-3 text-sm text-red-400">
          {state.error}
        </div>
      )}

      {state.success && (
        <div className="rounded-xl border border-emerald-900/50 bg-emerald-950/30 px-4 py-3 text-sm text-emerald-400">
          Tournament created successfully.
        </div>
      )}

      <button
        type="submit"
        disabled={isPending}
        className="w-full rounded-xl bg-blue-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-blue-500 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {isPending
          ? "Creating Tournament..."
          : "Create Tournament"}
      </button>
    </form>
  );
}