import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { resolveMatchupWinner } from "@/app/actions/tournaments";
import CreateTournamentForm from "./CreateTournamentForm";

type Player = {
  id: string;
  full_name: string | null;
  email: string | null;
};

type Matchup = {
  id: string;
  round: number;
  match_number: number;
  status: string;
  winner_id: string | null;
  player1: Player | null;
  player2: Player | null;
};

type Tournament = {
  id: string;
  name: string;
  description: string | null;
  status: string;
  created_at: string;
  matchups_1v1: Matchup[];
};

export default async function DeveloperTournamentsPage() {
  const supabase = await createClient();

  // Authenticate developer
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/developer/login");
  }

  // Verify developer account
  const { data: profile } = await supabase
    .from("profiles")
    .select("role, is_suspended")
    .eq("id", user.id)
    .single();

  if (
    !profile ||
    profile.role !== "developer" ||
    profile.is_suspended
  ) {
    redirect("/developer/login");
  }

  // Fetch tournaments and matchups
  const { data: tournaments, error } = await supabase
    .from("tournaments")
    .select(`
      id,
      name,
      description,
      status,
      created_at,
      matchups_1v1 (
        id,
        round,
        match_number,
        status,
        winner_id,
        player1:player1_id (
          id,
          full_name,
          email
        ),
        player2:player2_id (
          id,
          full_name,
          email
        )
      )
    `)
    .order("created_at", { ascending: false });

  if (error) {
    return (
      <div className="min-h-screen bg-gray-950 p-8 text-white">
        <div className="mx-auto max-w-6xl">
          <h1 className="text-xl font-bold">
            Failed to load tournaments
          </h1>

          <p className="mt-2 text-sm text-red-400">
            {error.message}
          </p>
        </div>
      </div>
    );
  }

  /*
   * Supabase can return relationship joins as arrays.
   *
   * Normalize player1/player2 here so the rest of the
   * application can safely treat them as single players.
   */
  const safeTournaments: Tournament[] = (tournaments ?? []).map(
    (tournament) => ({
      id: tournament.id,
      name: tournament.name,
      description: tournament.description,
      status: tournament.status,
      created_at: tournament.created_at,

      matchups_1v1: (tournament.matchups_1v1 ?? []).map(
        (matchup) => ({
          id: matchup.id,
          round: matchup.round,
          match_number: matchup.match_number,
          status: matchup.status,
          winner_id: matchup.winner_id,

          player1: Array.isArray(matchup.player1)
            ? matchup.player1[0] ?? null
            : matchup.player1 ?? null,

          player2: Array.isArray(matchup.player2)
            ? matchup.player2[0] ?? null
            : matchup.player2 ?? null,
        })
      ),
    })
  );

  return (
    <div className="min-h-screen bg-gray-950 p-6 font-sans text-white lg:p-12">
      <div className="mx-auto max-w-6xl">

        {/* Header */}
        <div className="mb-8 flex flex-col gap-4 border-b border-gray-800 pb-5 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">
              1v1 Tournament Management
            </h1>

            <p className="mt-1 text-sm text-gray-400">
              Create random 1v1 brackets and manually record
              match winners.
            </p>
          </div>

          <a
            href="/developer/dashboard"
            className="w-fit rounded-xl bg-gray-800 px-4 py-2 text-xs font-medium transition hover:bg-gray-700"
          >
            Back to Dashboard
          </a>
        </div>

        {/* Create Tournament */}
        <div className="mb-10 rounded-2xl border border-gray-800 bg-gray-900 p-6">
          <h2 className="mb-1 text-lg font-semibold">
            Start New Tournament
          </h2>

          <p className="mb-5 text-sm text-gray-500">
            Players are selected randomly from currently active
            registrations.
          </p>
          <CreateTournamentForm />
        </div>

        {/* Tournament List */}
        <div className="space-y-8">
          {safeTournaments.length === 0 ? (
            <div className="rounded-2xl border border-gray-800 bg-gray-900 p-10 text-center">
              <p className="text-sm text-gray-500">
                No tournaments created yet.
              </p>
            </div>
          ) : (
            safeTournaments.map((tournament) => (
              <div
                key={tournament.id}
                className="rounded-2xl border border-gray-800 bg-gray-900 p-6"
              >
                {/* Tournament Header */}
                <div className="mb-5 flex flex-col gap-3 border-b border-gray-800 pb-4 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <h3 className="text-lg font-bold">
                      {tournament.name}
                    </h3>

                    <p className="mt-1 text-xs text-gray-400">
                      {tournament.description ||
                        "No description"}
                    </p>
                  </div>

                  <span className="w-fit rounded-full border border-emerald-500/20 bg-emerald-500/10 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-emerald-400">
                    {tournament.status}
                  </span>
                </div>

                {/* Matchups */}
                <div>
                  <h4 className="mb-4 text-xs font-semibold uppercase tracking-wider text-gray-400">
                    Matchups
                  </h4>

                  {tournament.matchups_1v1.length === 0 ? (
                    <p className="text-xs text-gray-500">
                      No matchups generated.
                    </p>
                  ) : (
                    <div className="grid gap-4 md:grid-cols-2">
                      {[...tournament.matchups_1v1]
                        .sort(
                          (a, b) =>
                            a.round - b.round ||
                            a.match_number -
                              b.match_number
                        )
                        .map((match) => {
                          const completed =
                            match.status === "completed";

                          const player1Winner =
                            match.winner_id ===
                            match.player1?.id;

                          const player2Winner =
                            match.winner_id ===
                            match.player2?.id;

                          return (
                            <div
                              key={match.id}
                              className="rounded-xl border border-gray-800 bg-gray-950 p-4"
                            >
                              {/* Match Information */}
                              <div className="mb-3 flex items-center justify-between text-xs">
                                <span className="text-gray-400">
                                  Round {match.round} · Match{" "}
                                  #{match.match_number}
                                </span>

                                <span
                                  className={
                                    completed
                                      ? "font-medium text-emerald-400"
                                      : "font-medium text-amber-400"
                                  }
                                >
                                  {match.status}
                                </span>
                              </div>

                              {/* Players */}
                              <div className="flex items-center gap-2">
                                {/* Player 1 */}
                                <div
                                  className={`flex-1 rounded-lg border p-3 text-sm ${
                                    player1Winner
                                      ? "border-emerald-500 bg-emerald-500/10 font-bold text-emerald-300"
                                      : "border-gray-800 bg-gray-900 text-white"
                                  }`}
                                >
                                  <p>
                                    {match.player1
                                      ?.full_name ||
                                      "Player 1"}
                                  </p>

                                  {match.player1?.email && (
                                    <p className="mt-1 truncate text-[10px] text-gray-500">
                                      {match.player1.email}
                                    </p>
                                  )}
                                </div>

                                <span className="text-xs font-bold text-gray-600">
                                  VS
                                </span>

                                {/* Player 2 */}
                                <div
                                  className={`flex-1 rounded-lg border p-3 text-sm ${
                                    player2Winner
                                      ? "border-emerald-500 bg-emerald-500/10 font-bold text-emerald-300"
                                      : "border-gray-800 bg-gray-900 text-white"
                                  }`}
                                >
                                  <p>
                                    {match.player2
                                      ?.full_name ||
                                      "Player 2"}
                                  </p>

                                  {match.player2?.email && (
                                    <p className="mt-1 truncate text-[10px] text-gray-500">
                                      {match.player2.email}
                                    </p>
                                  )}
                                </div>
                              </div>

                              {/* Winner Controls */}
                              {!completed ? (
                                <div className="mt-4 flex gap-2 border-t border-gray-900 pt-3">
                                  {/* Player 1 Winner */}
                                  <form
                                    action={async () => {
                                      "use server";

                                      if (
                                        match.player1
                                      ) {
                                        await resolveMatchupWinner(
                                          match.id,
                                          match.player1.id
                                        );
                                      }
                                    }}
                                    className="flex-1"
                                  >
                                    <button
                                      type="submit"
                                      className="w-full rounded-lg bg-gray-800 px-3 py-2 text-xs font-medium text-gray-300 transition hover:bg-emerald-600 hover:text-white"
                                    >
                                      Winner:{" "}
                                      {match.player1
                                        ?.full_name ||
                                        "Player 1"}
                                    </button>
                                  </form>

                                  {/* Player 2 Winner */}
                                  <form
                                    action={async () => {
                                      "use server";

                                      if (
                                        match.player2
                                      ) {
                                        await resolveMatchupWinner(
                                          match.id,
                                          match.player2.id
                                        );
                                      }
                                    }}
                                    className="flex-1"
                                  >
                                    <button
                                      type="submit"
                                      className="w-full rounded-lg bg-gray-800 px-3 py-2 text-xs font-medium text-gray-300 transition hover:bg-emerald-600 hover:text-white"
                                    >
                                      Winner:{" "}
                                      {match.player2
                                        ?.full_name ||
                                        "Player 2"}
                                    </button>
                                  </form>
                                </div>
                              ) : (
                                <div className="mt-3 border-t border-gray-900 pt-3 text-center text-xs font-semibold text-emerald-400">
                                  Winner Decided 🏆
                                </div>
                              )}
                            </div>
                          );
                        })}
                    </div>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}