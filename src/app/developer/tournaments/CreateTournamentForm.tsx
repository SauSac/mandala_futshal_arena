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
  champion_id: string | null;
  created_at: string;
  matchups_1v1: Matchup[];
};

export default async function DeveloperTournamentsPage() {
  const supabase = await createClient();

  // --------------------------------------------------
  // AUTHENTICATE DEVELOPER
  // --------------------------------------------------

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/developer/login");
  }

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

  // --------------------------------------------------
  // FETCH TOURNAMENTS
  // --------------------------------------------------

  const { data: tournaments, error } = await supabase
    .from("tournaments")
    .select(`
      id,
      name,
      description,
      status,
      champion_id,
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

  // --------------------------------------------------
  // ERROR
  // --------------------------------------------------

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

  // --------------------------------------------------
  // NORMALIZE SUPABASE RELATIONSHIPS
  // --------------------------------------------------

  const safeTournaments: Tournament[] = (tournaments ?? []).map(
    (tournament) => ({
      id: tournament.id,
      name: tournament.name,
      description: tournament.description,
      status: tournament.status,
      champion_id: tournament.champion_id,
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
      <div className="mx-auto max-w-7xl">

        {/* ==================================================
            HEADER
        ================================================== */}

        <div className="mb-8 flex flex-col gap-4 border-b border-gray-800 pb-5 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">
              1v1 Tournament Management
            </h1>

            <p className="mt-1 text-sm text-gray-400">
              Create fixed knockout brackets and manually
              record match winners.
            </p>
          </div>

          <a
            href="/developer/dashboard"
            className="w-fit rounded-xl bg-gray-800 px-4 py-2 text-xs font-medium transition hover:bg-gray-700"
          >
            Back to Dashboard
          </a>
        </div>

        {/* ==================================================
            CREATE TOURNAMENT
        ================================================== */}

        <div className="mb-10 rounded-2xl border border-gray-800 bg-gray-900 p-6">
          <h2 className="mb-1 text-lg font-semibold">
            Start New Tournament
          </h2>

          <p className="mb-5 text-sm text-gray-500">
            Players are randomly selected from currently active
            registrations. The bracket is randomized only once.
          </p>

          <CreateTournamentForm />
        </div>

        {/* ==================================================
            TOURNAMENT LIST
        ================================================== */}

        <div className="space-y-8">

          {safeTournaments.length === 0 ? (
            <div className="rounded-2xl border border-gray-800 bg-gray-900 p-10 text-center">
              <p className="text-sm text-gray-500">
                No tournaments created yet.
              </p>
            </div>
          ) : (
            safeTournaments.map((tournament) => {

              // Find champion information
              const champion = tournament.champion_id
                ? tournament.matchups_1v1
                    .flatMap((match) => [
                      match.player1,
                      match.player2,
                    ])
                    .find(
                      (player) =>
                        player?.id === tournament.champion_id
                    ) ?? null
                : null;

              const rounds = Array.from(
                new Set(
                  tournament.matchups_1v1.map(
                    (match) => match.round
                  )
                )
              ).sort((a, b) => a - b);

              return (
                <div
                  key={tournament.id}
                  className="rounded-2xl border border-gray-800 bg-gray-900 p-6"
                >

                  {/* ==================================================
                      TOURNAMENT HEADER
                  ================================================== */}

                  <div className="mb-6 flex flex-col gap-4 border-b border-gray-800 pb-5 sm:flex-row sm:items-center sm:justify-between">

                    <div>
                      <h3 className="text-xl font-bold">
                        {tournament.name}
                      </h3>

                      <p className="mt-1 text-xs text-gray-400">
                        {tournament.description ||
                          "No description"}
                      </p>

                      <p className="mt-2 text-[11px] text-gray-600">
                        Created{" "}
                        {new Date(
                          tournament.created_at
                        ).toLocaleString()}
                      </p>
                    </div>

                    <span
                      className={`w-fit rounded-full border px-3 py-1 text-xs font-semibold uppercase tracking-wider ${
                        tournament.status === "completed"
                          ? "border-emerald-500/20 bg-emerald-500/10 text-emerald-400"
                          : tournament.status === "active"
                            ? "border-blue-500/20 bg-blue-500/10 text-blue-400"
                            : "border-gray-700 bg-gray-800 text-gray-400"
                      }`}
                    >
                      {tournament.status}
                    </span>
                  </div>

                  {/* ==================================================
                      CHAMPION
                  ================================================== */}

                  {tournament.status === "completed" &&
                    tournament.champion_id && (
                      <div className="mb-8 rounded-2xl border border-yellow-500/20 bg-yellow-500/5 p-5 text-center">
                        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-yellow-500">
                          Tournament Champion
                        </p>

                        <p className="mt-2 text-2xl font-bold text-yellow-400">
                          🏆{" "}
                          {champion?.full_name ||
                            "Champion"}
                        </p>

                        {champion?.email && (
                          <p className="mt-1 text-xs text-gray-500">
                            {champion.email}
                          </p>
                        )}
                      </div>
                    )}

                  {/* ==================================================
                      MATCHUPS
                  ================================================== */}

                  {tournament.matchups_1v1.length === 0 ? (
                    <p className="text-xs text-gray-500">
                      No matchups generated.
                    </p>
                  ) : (
                    <div className="space-y-10">

                      {rounds.map((round) => {

                        const roundMatches =
                          tournament.matchups_1v1
                            .filter(
                              (match) =>
                                match.round === round
                            )
                            .sort(
                              (a, b) =>
                                a.match_number -
                                b.match_number
                            );

                        const maxRound =
                          Math.max(...rounds);

                        const isFinal =
                          round === maxRound;

                        return (
                          <div key={round}>

                            {/* ROUND TITLE */}

                            <div className="mb-4 flex items-center gap-3">
                              <div className="h-px flex-1 bg-gray-800" />

                              <h4 className="text-xs font-bold uppercase tracking-[0.2em] text-gray-500">
                                {isFinal
                                  ? "Final"
                                  : `Round ${round}`}
                              </h4>

                              <div className="h-px flex-1 bg-gray-800" />
                            </div>

                            {/* MATCHES */}

                            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">

                              {roundMatches.map((match) => {

                                const completed =
                                  match.status ===
                                  "completed";

                                const player1 =
                                  match.player1;

                                const player2 =
                                  match.player2;

                                const hasBothPlayers =
                                  !!player1 &&
                                  !!player2;

                                const player1Winner =
                                  match.winner_id ===
                                  player1?.id;

                                const player2Winner =
                                  match.winner_id ===
                                  player2?.id;

                                return (
                                  <div
                                    key={match.id}
                                    className={`rounded-xl border p-4 ${
                                      completed
                                        ? "border-gray-800 bg-gray-950"
                                        : "border-blue-500/20 bg-gray-950"
                                    }`}
                                  >

                                    {/* MATCH HEADER */}

                                    <div className="mb-4 flex items-center justify-between text-xs">
                                      <span className="text-gray-500">
                                        Match #
                                        {
                                          match.match_number
                                        }
                                      </span>

                                      <span
                                        className={
                                          completed
                                            ? "font-medium text-emerald-400"
                                            : "font-medium text-amber-400"
                                        }
                                      >
                                        {completed
                                          ? "Completed"
                                          : "Waiting"}
                                      </span>
                                    </div>

                                    {/* PLAYER 1 */}

                                    <div
                                      className={`rounded-lg border p-3 ${
                                        player1Winner
                                          ? "border-emerald-500 bg-emerald-500/10"
                                          : "border-gray-800 bg-gray-900"
                                      }`}
                                    >
                                      {player1 ? (
                                        <>
                                          <p
                                            className={`text-sm ${
                                              player1Winner
                                                ? "font-bold text-emerald-300"
                                                : "text-white"
                                            }`}
                                          >
                                            {player1.full_name ||
                                              "Unnamed Player"}
                                          </p>

                                          {player1.email && (
                                            <p className="mt-1 truncate text-[10px] text-gray-500">
                                              {player1.email}
                                            </p>
                                          )}
                                        </>
                                      ) : (
                                        <p className="text-sm italic text-gray-600">
                                          Waiting for player
                                        </p>
                                      )}
                                    </div>

                                    {/* VS */}

                                    <div className="my-2 text-center text-[10px] font-bold tracking-widest text-gray-700">
                                      VS
                                    </div>

                                    {/* PLAYER 2 */}

                                    <div
                                      className={`rounded-lg border p-3 ${
                                        player2Winner
                                          ? "border-emerald-500 bg-emerald-500/10"
                                          : "border-gray-800 bg-gray-900"
                                      }`}
                                    >
                                      {player2 ? (
                                        <>
                                          <p
                                            className={`text-sm ${
                                              player2Winner
                                                ? "font-bold text-emerald-300"
                                                : "text-white"
                                            }`}
                                          >
                                            {player2.full_name ||
                                              "Unnamed Player"}
                                          </p>

                                          {player2.email && (
                                            <p className="mt-1 truncate text-[10px] text-gray-500">
                                              {player2.email}
                                            </p>
                                          )}
                                        </>
                                      ) : (
                                        <p className="text-sm italic text-gray-600">
                                          Waiting for player
                                        </p>
                                      )}
                                    </div>

                                    {/* ==================================================
                                        WINNER CONTROLS
                                    ================================================== */}

                                    {!completed &&
                                      hasBothPlayers && (
                                        <div className="mt-4 flex gap-2 border-t border-gray-900 pt-3">

                                          {/* PLAYER 1 WINNER */}

                                          <form
                                            action={async () => {
                                              "use server";

                                              if (
                                                player1
                                              ) {
                                                await resolveMatchupWinner(
                                                  match.id,
                                                  player1.id
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
                                              {player1.full_name ||
                                                "Player 1"}
                                            </button>
                                          </form>

                                          {/* PLAYER 2 WINNER */}

                                          <form
                                            action={async () => {
                                              "use server";

                                              if (
                                                player2
                                              ) {
                                                await resolveMatchupWinner(
                                                  match.id,
                                                  player2.id
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
                                              {player2.full_name ||
                                                "Player 2"}
                                            </button>
                                          </form>
                                        </div>
                                      )}

                                    {/* ==================================================
                                        WAITING STATE
                                    ================================================== */}

                                    {!completed &&
                                      !hasBothPlayers && (
                                        <div className="mt-4 border-t border-gray-900 pt-3 text-center">
                                          <p className="text-[11px] text-gray-600">
                                            Waiting for the
                                            previous match
                                            to determine the
                                            opponent.
                                          </p>
                                        </div>
                                      )}

                                    {/* ==================================================
                                        COMPLETED STATE
                                    ================================================== */}

                                    {completed && (
                                      <div className="mt-4 border-t border-gray-900 pt-3 text-center">
                                        <p className="text-xs font-semibold text-emerald-400">
                                          ✓ Winner Decided
                                        </p>
                                      </div>
                                    )}

                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}