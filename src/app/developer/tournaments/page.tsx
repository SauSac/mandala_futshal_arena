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

  // =====================================================
  // 1. AUTHENTICATE DEVELOPER
  // =====================================================

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/developer/login");
  }

  // =====================================================
  // 2. VERIFY DEVELOPER ROLE
  // =====================================================

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

  // =====================================================
  // 3. FETCH TOURNAMENTS
  // =====================================================

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
    .order("created_at", {
      ascending: false,
    });

  if (error) {
    return (
      <div className="min-h-screen bg-gray-950 p-6 text-white lg:p-10">
        <div className="mx-auto max-w-7xl">

          <div className="rounded-3xl border border-red-900 bg-gray-900 p-8">
            <h1 className="text-xl font-bold">
              Failed to load tournaments
            </h1>

            <p className="mt-2 text-sm text-red-400">
              {error.message}
            </p>
          </div>

        </div>
      </div>
    );
  }

  // =====================================================
  // 4. NORMALIZE SUPABASE RELATIONSHIPS
  // =====================================================

  const safeTournaments: Tournament[] =
    (tournaments ?? []).map((tournament) => ({
      id: tournament.id,
      name: tournament.name,
      description: tournament.description,
      status: tournament.status,
      champion_id: tournament.champion_id,
      created_at: tournament.created_at,

      matchups_1v1: (
        tournament.matchups_1v1 ?? []
      )
        .map((matchup) => ({
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
        }))
        .sort((a, b) => {
          if (a.round !== b.round) {
            return a.round - b.round;
          }

          return (
            a.match_number -
            b.match_number
          );
        }),
    }));

  // =====================================================
  // 5. HELPERS
  // =====================================================

  const playerName = (
    player: Player | null,
  ) => {
    if (!player) return null;

    return (
      player.full_name ||
      player.email ||
      "Player"
    );
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString(
      "en-NP",
      {
        year: "numeric",
        month: "short",
        day: "numeric",
      },
    );
  };

  const getRoundName = (
    round: number,
    tournament: Tournament,
  ) => {
    const maxRound = Math.max(
      ...tournament.matchups_1v1.map(
        (match) => match.round,
      ),
      1,
    );

    if (round === maxRound) {
      return "Final";
    }

    if (round === maxRound - 1) {
      return "Semi-final";
    }

    if (round === maxRound - 2) {
      return "Quarter-final";
    }

    return `Round ${round}`;
  };

  // =====================================================
  // 6. PAGE
  // =====================================================

  return (
    <div className="min-h-screen bg-gray-950 font-sans text-white">

      {/* =================================================
          NAVBAR
      ================================================== */}

      <header className="sticky top-0 z-30 border-b border-gray-800 bg-gray-950/95 backdrop-blur">

        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-5 sm:px-6">

          <div className="flex items-center gap-3">

            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-white text-xs font-bold text-black">
              FA
            </div>

            <div>
              <p className="text-sm font-bold">
                Futsal Arena
              </p>

              <p className="hidden text-[10px] text-gray-500 sm:block">
                Developer Portal
              </p>
            </div>

          </div>

          <div className="flex items-center gap-3">

            <span className="hidden rounded-full border border-gray-800 bg-gray-900 px-3 py-1.5 text-[10px] font-bold uppercase tracking-wide text-gray-400 sm:block">
              Developer
            </span>

            <a
              href="/developer/dashboard"
              className="rounded-xl border border-gray-800 bg-gray-900 px-4 py-2 text-xs font-semibold text-gray-300 transition hover:bg-gray-800"
            >
              Dashboard
            </a>

          </div>

        </div>

      </header>

      {/* =================================================
          MAIN
      ================================================== */}

      <main className="mx-auto max-w-7xl px-5 py-8 sm:px-6 lg:py-10">

        {/* =================================================
            PAGE HEADER
        ================================================== */}

        <section className="mb-8">

          <div className="flex flex-col justify-between gap-5 lg:flex-row lg:items-end">

            <div>

              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-gray-500">
                Competition Management
              </p>

              <h1 className="mt-2 text-3xl font-bold tracking-tight">
                1v1 Tournaments
              </h1>

              <p className="mt-2 max-w-2xl text-sm leading-relaxed text-gray-400">
                Create tournaments, review generated brackets,
                record match winners, and manage tournament
                progression.
              </p>

            </div>

            <div className="rounded-2xl border border-gray-800 bg-gray-900 px-5 py-4">

              <p className="text-[10px] font-semibold uppercase tracking-wide text-gray-500">
                Total tournaments
              </p>

              <p className="mt-1 text-2xl font-bold">
                {safeTournaments.length}
              </p>

            </div>

          </div>

        </section>

        {/* =================================================
            CREATE TOURNAMENT
        ================================================== */}

        <section className="mb-10">

          <div className="mb-4">

            <p className="text-xs font-semibold uppercase tracking-wider text-gray-500">
              Tournament Setup
            </p>

            <h2 className="mt-1 text-xl font-bold">
              Create Tournament
            </h2>

          </div>

          <div className="rounded-3xl border border-gray-800 bg-gray-900 p-6 shadow-xl sm:p-8">

            <div className="mb-6">

              <h3 className="font-semibold text-white">
                Generate a new 1v1 competition
              </h3>

              <p className="mt-1 text-sm leading-relaxed text-gray-500">
                The system will randomly select players with
                active registrations and generate the tournament
                bracket.
              </p>

            </div>

            <CreateTournamentForm />

          </div>

        </section>

        {/* =================================================
            TOURNAMENT LIST
        ================================================== */}

        <section>

          <div className="mb-4">

            <p className="text-xs font-semibold uppercase tracking-wider text-gray-500">
              Tournament Control
            </p>

            <h2 className="mt-1 text-xl font-bold">
              All Tournaments
            </h2>

          </div>

          {safeTournaments.length === 0 ? (

            <div className="rounded-3xl border border-gray-800 bg-gray-900 p-10 text-center">

              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-gray-800 text-2xl">
                🏆
              </div>

              <h3 className="mt-5 font-semibold">
                No tournaments yet
              </h3>

              <p className="mt-1 text-sm text-gray-500">
                Create your first tournament above.
              </p>

            </div>

          ) : (

            <div className="space-y-8">

              {safeTournaments.map(
                (tournament) => {

                  const matches =
                    tournament.matchups_1v1;

                  const maxRound = Math.max(
                    ...matches.map(
                      (match) =>
                        match.round,
                    ),
                    1,
                  );

                  const completedMatches =
                    matches.filter(
                      (match) =>
                        match.status ===
                        "completed",
                    ).length;

                  const champion =
                    tournament.champion_id
                      ? matches
                          .flatMap(
                            (match) => [
                              match.player1,
                              match.player2,
                            ],
                          )
                          .find(
                            (player) =>
                              player?.id ===
                              tournament.champion_id,
                          )
                      : null;

                  return (
                    <article
                      key={tournament.id}
                      className="overflow-hidden rounded-3xl border border-gray-800 bg-gray-900 shadow-xl"
                    >

                      {/* =================================
                          TOURNAMENT HEADER
                      ================================== */}

                      <div className="border-b border-gray-800 p-6 sm:p-8">

                        <div className="flex flex-col justify-between gap-5 lg:flex-row lg:items-start">

                          <div>

                            <div className="flex flex-wrap items-center gap-2">

                              <span
                                className={`rounded-full px-3 py-1 text-[10px] font-bold uppercase tracking-wide ${
                                  tournament.status ===
                                  "completed"
                                    ? "bg-gray-800 text-gray-400"
                                    : "bg-emerald-950 text-emerald-400"
                                }`}
                              >
                                {tournament.status}
                              </span>

                              <span className="text-xs text-gray-600">
                                Created{" "}
                                {formatDate(
                                  tournament.created_at,
                                )}
                              </span>

                            </div>

                            <h3 className="mt-3 text-2xl font-bold">
                              {tournament.name}
                            </h3>

                            {tournament.description && (
                              <p className="mt-2 max-w-2xl text-sm leading-relaxed text-gray-400">
                                {
                                  tournament.description
                                }
                              </p>
                            )}

                          </div>

                          {/* Stats */}

                          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">

                            <div className="rounded-2xl border border-gray-800 bg-gray-950 p-4">

                              <p className="text-[10px] font-semibold uppercase tracking-wide text-gray-600">
                                Matches
                              </p>

                              <p className="mt-1 text-lg font-bold">
                                {
                                  matches.length
                                }
                              </p>

                            </div>

                            <div className="rounded-2xl border border-gray-800 bg-gray-950 p-4">

                              <p className="text-[10px] font-semibold uppercase tracking-wide text-gray-600">
                                Completed
                              </p>

                              <p className="mt-1 text-lg font-bold">
                                {
                                  completedMatches
                                }
                              </p>

                            </div>

                            <div className="col-span-2 rounded-2xl border border-gray-800 bg-gray-950 p-4 sm:col-span-1">

                              <p className="text-[10px] font-semibold uppercase tracking-wide text-gray-600">
                                Rounds
                              </p>

                              <p className="mt-1 text-lg font-bold">
                                {maxRound}
                              </p>

                            </div>

                          </div>

                        </div>

                        {/* Champion */}

                        {tournament.status ===
                          "completed" &&
                          champion && (
                            <div className="mt-6 rounded-2xl border border-amber-900/60 bg-amber-950/30 p-5">

                              <p className="text-[10px] font-bold uppercase tracking-[0.15em] text-amber-500">
                                Tournament Champion
                              </p>

                              <p className="mt-2 text-lg font-bold text-amber-300">
                                🏆{" "}
                                {playerName(
                                  champion,
                                )}
                              </p>

                            </div>
                          )}

                      </div>

                      {/* =================================
                          BRACKET
                      ================================== */}

                      <div className="p-6 sm:p-8">

                        <div className="mb-5 flex items-center justify-between">

                          <div>

                            <p className="text-xs font-semibold uppercase tracking-wider text-gray-600">
                              Bracket
                            </p>

                            <h4 className="mt-1 font-bold">
                              Match Control
                            </h4>

                          </div>

                        </div>

                        {matches.length ===
                        0 ? (

                          <div className="rounded-2xl border border-gray-800 bg-gray-950 p-6 text-center text-sm text-gray-500">
                            No matchups have been
                            generated.
                          </div>

                        ) : (

                          <div className="space-y-8">

                            {Array.from(
                              {
                                length:
                                  maxRound,
                              },
                              (_, index) =>
                                index + 1,
                            ).map(
                              (round) => {

                                const roundMatches =
                                  matches.filter(
                                    (
                                      match,
                                    ) =>
                                      match.round ===
                                      round,
                                  );

                                if (
                                  roundMatches.length ===
                                  0
                                ) {
                                  return null;
                                }

                                return (
                                  <div
                                    key={
                                      round
                                    }
                                  >

                                    <div className="mb-3 flex items-center gap-3">

                                      <span className="text-xs font-bold uppercase tracking-wider text-gray-500">
                                        {getRoundName(
                                          round,
                                          tournament,
                                        )}
                                      </span>

                                      <div className="h-px flex-1 bg-gray-800" />

                                    </div>

                                    <div className="grid gap-4 md:grid-cols-2">

                                      {roundMatches.map(
                                        (
                                          match,
                                        ) => {

                                          const player1 =
                                            playerName(
                                              match.player1,
                                            );

                                          const player2 =
                                            playerName(
                                              match.player2,
                                            );

                                          const ready =
                                            !!match.player1 &&
                                            !!match.player2;

                                          const completed =
                                            match.status ===
                                            "completed";

                                          return (
                                            <div
                                              key={
                                                match.id
                                              }
                                              className="rounded-2xl border border-gray-800 bg-gray-950 p-5"
                                            >

                                              {/* Match header */}

                                              <div className="flex items-center justify-between">

                                                <div>

                                                  <p className="text-xs font-bold text-gray-300">
                                                    Match #
                                                    {
                                                      match.match_number
                                                    }
                                                  </p>

                                                  <p className="mt-0.5 text-[10px] text-gray-600">
                                                    Round{" "}
                                                    {
                                                      match.round
                                                    }
                                                  </p>

                                                </div>

                                                <span
                                                  className={`rounded-full px-3 py-1 text-[10px] font-bold uppercase ${
                                                    completed
                                                      ? "bg-gray-800 text-gray-500"
                                                      : ready
                                                        ? "bg-blue-950 text-blue-400"
                                                        : "bg-amber-950 text-amber-400"
                                                  }`}
                                                >
                                                  {completed
                                                    ? "Completed"
                                                    : ready
                                                      ? "Ready"
                                                      : "Waiting"}
                                                </span>

                                              </div>

                                              {/* Players */}

                                              <div className="mt-5 space-y-2">

                                                <PlayerRow
                                                  label="Player 1"
                                                  name={
                                                    player1
                                                  }
                                                  winner={
                                                    match.winner_id ===
                                                    match.player1?.id
                                                  }
                                                />

                                                <div className="text-center text-[10px] font-bold text-gray-700">
                                                  VS
                                                </div>

                                                <PlayerRow
                                                  label="Player 2"
                                                  name={
                                                    player2
                                                  }
                                                  winner={
                                                    match.winner_id ===
                                                    match.player2?.id
                                                  }
                                                />

                                              </div>

                                              {/* Winner controls */}

                                              {!completed &&
                                                ready && (
                                                  <div className="mt-5 border-t border-gray-800 pt-4">

                                                    <p className="mb-3 text-[10px] font-semibold uppercase tracking-wider text-gray-600">
                                                      Record Winner
                                                    </p>

                                                    <div className="grid gap-2 sm:grid-cols-2">

                                                      <form
                                                        action={async () => {
                                                          "use server";

                                                          await resolveMatchupWinner(
                                                            match.id,
                                                            match.player1!.id,
                                                          );
                                                        }}
                                                      >
                                                        <button
                                                          type="submit"
                                                          className="w-full rounded-xl border border-gray-700 bg-gray-900 px-3 py-3 text-xs font-semibold text-gray-300 transition hover:border-emerald-700 hover:bg-emerald-950 hover:text-emerald-400"
                                                        >
                                                          {player1}
                                                          {" "}
                                                          Won
                                                        </button>
                                                      </form>

                                                      <form
                                                        action={async () => {
                                                          "use server";

                                                          await resolveMatchupWinner(
                                                            match.id,
                                                            match.player2!.id,
                                                          );
                                                        }}
                                                      >
                                                        <button
                                                          type="submit"
                                                          className="w-full rounded-xl border border-gray-700 bg-gray-900 px-3 py-3 text-xs font-semibold text-gray-300 transition hover:border-emerald-700 hover:bg-emerald-950 hover:text-emerald-400"
                                                        >
                                                          {player2}
                                                          {" "}
                                                          Won
                                                        </button>
                                                      </form>

                                                    </div>

                                                  </div>
                                                )}

                                              {/* Waiting */}

                                              {!completed &&
                                                !ready && (
                                                  <div className="mt-5 rounded-xl border border-amber-900/40 bg-amber-950/20 p-3 text-center text-[11px] text-amber-500">
                                                    Waiting for
                                                    the
                                                    previous
                                                    match to
                                                    determine
                                                    the
                                                    opponent.
                                                  </div>
                                                )}

                                              {/* Winner */}

                                              {completed &&
                                                match.winner_id && (
                                                  <div className="mt-5 rounded-xl border border-emerald-900/50 bg-emerald-950/20 p-3 text-center">

                                                    <p className="text-[10px] font-bold uppercase tracking-wider text-emerald-600">
                                                      Winner
                                                    </p>

                                                    <p className="mt-1 text-sm font-bold text-emerald-400">
                                                      ✓{" "}
                                                      {match.winner_id ===
                                                      match.player1?.id
                                                        ? player1
                                                        : player2}
                                                    </p>

                                                  </div>
                                                )}

                                            </div>
                                          );
                                        },
                                      )}

                                    </div>

                                  </div>
                                );
                              },
                            )}

                          </div>

                        )}

                      </div>

                    </article>
                  );
                },
              )}

            </div>

          )}

        </section>

      </main>

    </div>
  );
}

/* =========================================================
   PLAYER ROW
========================================================= */

function PlayerRow({
  label,
  name,
  winner,
}: {
  label: string;
  name: string | null;
  winner: boolean;
}) {
  return (
    <div
      className={`rounded-xl border p-3 ${
        winner
          ? "border-emerald-800 bg-emerald-950/30"
          : "border-gray-800 bg-gray-900"
      }`}
    >

      <div className="flex items-center justify-between gap-3">

        <div>

          <p className="text-[9px] font-semibold uppercase tracking-wide text-gray-600">
            {label}
          </p>

          <p
            className={`mt-1 text-sm font-semibold ${
              winner
                ? "text-emerald-400"
                : name
                  ? "text-gray-200"
                  : "text-gray-600"
            }`}
          >
            {name || "Waiting for player"}
          </p>

        </div>

        {winner && (
          <span className="text-sm">
            🏆
          </span>
        )}

      </div>

    </div>
  );
}