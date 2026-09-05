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
  const [state, formAction, pending] = useActionState<
    TournamentState,
    FormData
  >(
    async (_previousState, formData) => {
      return await createAndPairTournament(formData);
    },
    initialState
  );

  return (
    <form action={formAction} className="grid gap-4">
      <div>
        <label
          htmlFor="name"
          className="mb-2 block text-sm font-medium"
        >
          Tournament Name
        </label>

        <input
          id="name"
          name="name"
          type="text"
          required
          placeholder="Summer 1v1 Championship"
          className="w-full rounded-lg border px-4 py-3"
        />
      </div>

      <div>
        <label
          htmlFor="description"
          className="mb-2 block text-sm font-medium"
        >
          Description
        </label>

        <textarea
          id="description"
          name="description"
          rows={3}
          placeholder="Tournament description..."
          className="w-full rounded-lg border px-4 py-3"
        />
      </div>

      {state.error && (
        <p className="rounded-lg bg-red-100 px-4 py-3 text-sm text-red-700">
          {state.error}
        </p>
      )}

      {state.success && (
        <p className="rounded-lg bg-green-100 px-4 py-3 text-sm text-green-700">
          Tournament created successfully.
        </p>
      )}

      <button
        type="submit"
        disabled={pending}
        className="rounded-lg bg-black px-5 py-3 font-medium text-white disabled:opacity-50"
      >
        {pending ? "Creating..." : "Create Tournament"}
      </button>
    </form>
  );
}