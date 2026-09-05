import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";

type Player = {
  id: string;
  full_name: string | null;
  email: string | null;
};

type Matchup = {
  id: string;
  round: number;
  match_number: number;
  status: "pending" | "ongoing" | "completed" | "cancelled";
  winner_id: string | null;
  player1: Player | null;
  player2: Player | null;
};

type Tournament = {
  id: string;
  name: string;
  description: string | null;
  status: "draft" | "active" | "completed" | "cancelled";
  champion_id: string | null;
  created_at: string;
  matchups_1v1: Matchup[];
};

type Registration = {
  payment_status: "pending" | "approved" | "rejected";
  starts_at: string | null;
  expires_at: string | null;
};

export default async function PlayerTournamentsPage() {
  const supabase = await createClient();

  // =====================================================
  // 1. AUTHENTICATION
  // =====================================================

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/auth/login");
  }

  // =====================================================
  // 2. PLAYER PROFILE
  // =====================================================

  const { data: profile } = await supabase
    .from("profiles")
    .select("id, full_name, email, role, is_suspended")
    .eq("id", user.id)
    .single();

  if (!profile || profile.role !== "player") {
    redirect("/auth/login");
  }

  // =====================================================
  // 3. REGISTRATION STATUS
  // =====================================================

  const { data: registration } = await supabase
    .from("player_registrations")
    .select(
      "payment_status, starts_at, expires_at",
    )
    .eq("player_id", user.id)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle<Registration>();

  const now = new Date();

  const isActive =
    registration?.payment_status === "approved" &&
    !!registration.starts_at &&
    !!registration.expires_at &&
    new Date(registration.starts_at) <= now &&
    new Date(registration.expires_at) > now &&
    !profile.is_suspended;

  // =====================================================
  // 4. BLOCK INACTIVE PLAYERS
  // =====================================================

  if (!isActive) {
    return (
      <div className="min-h-screen bg-gray-50 font-sans text-gray-900">

        <header className="border-b border-gray-200 bg-white">
          <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-5 sm:px-6">

            <Link
              href="/dashboard"
              className="flex items-center gap-3"
            >
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-black text-xs font-bold text-white">
                FA
              </div>

              <div>
                <p className="text-sm font-bold">
                  Futsal Arena
                </p>

                <p className="hidden text-[10px] text-gray-400 sm:block">
                  Player Portal
                </p>
              </div>
            </Link>

            <Link
              href="/dashboard"
              className="rounded-xl border border-gray-200 px-4 py-2 text-xs font-semibold text-gray-700 hover:bg-gray-50"
            >
              Dashboard
            </Link>

          </div>
        </header>

        <main className="mx-auto flex min-h-[calc(100vh-4rem)] max-w-2xl items-center justify-center px-5 py-10">

          <div className="w-full rounded-3xl border border-amber-200 bg-white p-8 text-center shadow-sm">

            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-amber-50 text-2xl">
              🏆
            </div>

            <h1 className="mt-5 text-xl font-bold text-gray-900">
              Competitions unavailable
            </h1>

            <p className="mt-2 text-sm leading-relaxed text-gray-500">
              You need an active player membership before you can
              access 1v1 competitions.
            </p>

            {profile.is_suspended ? (
              <p className="mt-4 rounded-2xl bg-red-50 p-3 text-xs font-medium text-red-700">
                Your account is currently suspended.
              </p>
            ) : (
              <Link
                href="/dashboard"
                className="mt-6 inline-flex rounded-xl bg-black px-5 py-3 text-xs font-semibold text-white hover:bg-gray-800"
              >
                Return to Dashboard
              </Link>
            )}

          </div>

        </main>
      </div>
    );
  }

  // =====================================================
  // 5. FETCH ACTIVE / COMPLETED TOURNAMENTS
  // =====================================================

  const { data: tournaments, error } = await supabase
    .from("tournaments")
    .select(
      `
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
      `,
    )
    .in("status", ["active", "completed"])
    .order("created_at", { ascending: false });

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="mx-auto max-w-5xl rounded-3xl border border-red-200 bg-white p-8">
          <h1 className="text-xl font-bold text-gray-900">
            Failed to load competitions
          </h1>

          <p className="mt-2 text-sm text-red-500">
            {error.message}
          </p>
        </div>
      </div>
    );
  }

  // =====================================================
  // 6. NORMALIZE SUPABASE RELATIONSHIPS
  // =====================================================

  const safeTournaments: Tournament[] =
    (tournaments ?? []).map((tournament) => ({
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
        }),
      ),
    }));

  // =====================================================
  // 7. FIND PLAYER'S MATCHES
  // =====================================================

  const myMatches = safeTournaments.flatMap(
    (tournament) =>
      tournament.matchups_1v1
        .filter(
          (match) =>
            match.player1?.id === user.id ||
            match.player2?.id === user.id,
        )
        .map((match) => ({
          tournament,
          match,
        })),
  );

  // =====================================================
  // 8. HELPERS
  // =====================================================

  const getPlayerName = (player: Player | null) => {
    if (!player) return null;

    return player.full_name || player.email || "Player";
  };

  const getOpponent = (match: Matchup) => {
    if (match.player1?.id === user.id) {
      return match.player2;
    }

    if (match.player2?.id === user.id) {
      return match.player1;
    }

    return null;
  };

  const getRoundName = (
    match: Matchup,
    tournament: Tournament,
  ) => {
    const maxRound = Math.max(
      ...tournament.matchups_1v1.map(
        (m) => m.round,
      ),
    );

    if (match.round === maxRound) {
      return "Final";
    }

    if (match.round === maxRound - 1) {
      return "Semi-final";
    }

    return `Round ${match.round}`;
  };

  // =====================================================
  // 9. PAGE
  // =====================================================

  return (
    <div className="min-h-screen bg-gray-50 font-sans text-gray-900">

      {/* =================================================
          NAVBAR
      ================================================== */}

      <header className="sticky top-0 z-30 border-b border-gray-200 bg-white/95 backdrop-blur">

        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-5 sm:px-6">

          <Link
            href="/dashboard"
            className="flex items-center gap-3"
          >
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-black text-xs font-bold text-white">
              FA
            </div>

            <div>
              <p className="text-sm font-bold tracking-tight">
                Futsal Arena
              </p>

              <p className="hidden text-[10px] font-medium text-gray-400 sm:block">
                Player Portal
              </p>
            </div>
          </Link>

          <Link
            href="/dashboard"
            className="rounded-xl border border-gray-200 bg-white px-4 py-2 text-xs font-semibold text-gray-700 transition hover:bg-gray-50"
          >
            Dashboard
          </Link>

        </div>
      </header>

      {/* =================================================
          MAIN
      ================================================== */}

      <main className="mx-auto max-w-7xl px-5 py-8 sm:px-6 lg:py-10">

        {/* HEADER */}

        <section className="mb-8">

          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-gray-400">
            Competition Center
          </p>

          <h1 className="mt-2 text-3xl font-bold tracking-tight text-gray-900">
            1v1 Competitions
          </h1>

          <p className="mt-2 max-w-2xl text-sm leading-relaxed text-gray-500">
            View your individual matchups, track tournament
            progress, and see competition results.
          </p>

        </section>

        {/* =================================================
            MY MATCHES
        ================================================== */}

        <section className="mb-10">

          <div className="mb-4 flex items-end justify-between">

            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-gray-400">
                Your Matches
              </p>

              <h2 className="mt-1 text-xl font-bold text-gray-900">
                My 1v1 Matchups
              </h2>
            </div>

            <div className="rounded-full bg-gray-100 px-3 py-1 text-xs font-semibold text-gray-600">
              {myMatches.length}{" "}
              {myMatches.length === 1
                ? "match"
                : "matches"}
            </div>

          </div>

          {myMatches.length === 0 ? (

            <div className="rounded-3xl border border-gray-200 bg-white p-8 text-center shadow-sm">

              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-gray-50 text-xl">
                ⚽
              </div>

              <h3 className="mt-4 font-semibold text-gray-900">
                No matches yet
              </h3>

              <p className="mt-1 text-sm text-gray-500">
                You are not currently assigned to a tournament
                matchup.
              </p>

            </div>

          ) : (

            <div className="space-y-4">

              {myMatches.map(({ tournament, match }) => {

                const opponent = getOpponent(match);

                const iWon =
                  match.winner_id === user.id;

                const opponentWon =
                  !!match.winner_id &&
                  match.winner_id !== user.id;

                const waitingForOpponent =
                  !opponent;

                return (
                  <div
                    key={match.id}
                    className="rounded-3xl border border-gray-200 bg-white p-6 shadow-sm"
                  >

                    <div className="flex flex-col justify-between gap-5 md:flex-row md:items-center">

                      {/* MATCH INFO */}

                      <div>

                        <div className="flex flex-wrap items-center gap-2">

                          <span className="rounded-full bg-gray-100 px-3 py-1 text-[10px] font-bold uppercase tracking-wide text-gray-600">
                            {getRoundName(
                              match,
                              tournament,
                            )}
                          </span>

                          <span className="text-xs text-gray-400">
                            Match #{match.match_number}
                          </span>

                        </div>

                        <h3 className="mt-3 text-lg font-bold text-gray-900">
                          {tournament.name}
                        </h3>

                        <p className="mt-1 text-xs text-gray-400">
                          Round {match.round}
                        </p>

                      </div>

                      {/* STATUS */}

                      <div>

                        {match.status ===
                        "completed" ? (
                          iWon ? (
                            <span className="rounded-full border border-emerald-200 bg-emerald-50 px-4 py-2 text-xs font-bold text-emerald-700">
                              ✓ You Won
                            </span>
                          ) : opponentWon ? (
                            <span className="rounded-full border border-red-200 bg-red-50 px-4 py-2 text-xs font-bold text-red-700">
                              Match Lost
                            </span>
                          ) : (
                            <span className="rounded-full bg-gray-100 px-4 py-2 text-xs font-semibold text-gray-500">
                              Completed
                            </span>
                          )
                        ) : waitingForOpponent ? (
                          <span className="rounded-full border border-amber-200 bg-amber-50 px-4 py-2 text-xs font-semibold text-amber-700">
                            Waiting for Opponent
                          </span>
                        ) : (
                          <span className="rounded-full border border-blue-200 bg-blue-50 px-4 py-2 text-xs font-semibold text-blue-700">
                            Upcoming
                          </span>
                        )}

                      </div>

                    </div>

                    {/* PLAYERS */}

                    <div className="mt-6 grid items-center gap-3 sm:grid-cols-[1fr_auto_1fr]">

                      {/* PLAYER 1 */}

                      <div
                        className={`rounded-2xl border p-4 ${
                          match.player1?.id ===
                          user.id
                            ? "border-black bg-gray-50"
                            : "border-gray-100 bg-white"
                        }`}
                      >

                        <p className="text-[10px] font-semibold uppercase tracking-wide text-gray-400">
                          Player 1
                        </p>

                        <p className="mt-1 font-semibold text-gray-900">
                          {getPlayerName(
                            match.player1,
                          ) ||
                            "Waiting for player"}
                        </p>

                        {match.winner_id ===
                          match.player1?.id && (
                          <p className="mt-1 text-[10px] font-bold text-emerald-600">
                            Winner
                          </p>
                        )}

                      </div>

                      <div className="text-center text-xs font-bold text-gray-300">
                        VS
                      </div>

                      {/* PLAYER 2 */}

                      <div
                        className={`rounded-2xl border p-4 ${
                          match.player2?.id ===
                          user.id
                            ? "border-black bg-gray-50"
                            : "border-gray-100 bg-white"
                        }`}
                      >

                        <p className="text-[10px] font-semibold uppercase tracking-wide text-gray-400">
                          Player 2
                        </p>

                        <p className="mt-1 font-semibold text-gray-900">
                          {getPlayerName(
                            match.player2,
                          ) ||
                            "Waiting for player"}
                        </p>

                        {match.winner_id ===
                          match.player2?.id && (
                          <p className="mt-1 text-[10px] font-bold text-emerald-600">
                            Winner
                          </p>
                        )}

                      </div>

                    </div>

                  </div>
                );
              })}

            </div>
          )}

        </section>

        {/* =================================================
            AVAILABLE TOURNAMENTS
        ================================================== */}

        <section>

          <div className="mb-4">

            <p className="text-xs font-semibold uppercase tracking-wider text-gray-400">
              Competitions
            </p>

            <h2 className="mt-1 text-xl font-bold text-gray-900">
              Tournaments
            </h2>

          </div>

          {safeTournaments.length === 0 ? (

            <div className="rounded-3xl border border-gray-200 bg-white p-8 text-center shadow-sm">

              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-gray-50 text-xl">
                🏆
              </div>

              <h3 className="mt-4 font-semibold text-gray-900">
                No tournaments available
              </h3>

              <p className="mt-1 text-sm text-gray-500">
                There are currently no active or completed
                tournaments available.
              </p>

            </div>

          ) : (

            <div className="grid gap-5 md:grid-cols-2">

              {safeTournaments.map((tournament) => {

                const tournamentMatches =
                  tournament.matchups_1v1;

                const playerIsInTournament =
                  tournamentMatches.some(
                    (match) =>
                      match.player1?.id ===
                        user.id ||
                      match.player2?.id ===
                        user.id,
                  );

                const completedMatches =
                  tournamentMatches.filter(
                    (match) =>
                      match.status ===
                      "completed",
                  ).length;

                const champion =
                  tournament.champion_id
                    ? tournamentMatches
                        .flatMap((match) => [
                          match.player1,
                          match.player2,
                        ])
                        .find(
                          (player) =>
                            player?.id ===
                            tournament.champion_id,
                        )
                    : null;

                return (
                  <div
                    key={tournament.id}
                    className="rounded-3xl border border-gray-200 bg-white p-6 shadow-sm"
                  >

                    {/* TOP */}

                    <div className="flex items-start justify-between gap-4">

                      <div>

                        <div className="flex items-center gap-2">

                          <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-amber-50 text-lg">
                            🏆
                          </div>

                          <span
                            className={`rounded-full px-3 py-1 text-[10px] font-bold uppercase tracking-wide ${
                              tournament.status ===
                              "completed"
                                ? "bg-gray-100 text-gray-600"
                                : "bg-emerald-50 text-emerald-700"
                            }`}
                          >
                            {tournament.status}
                          </span>

                        </div>

                        <h3 className="mt-4 text-lg font-bold text-gray-900">
                          {tournament.name}
                        </h3>

                      </div>

                      {playerIsInTournament && (
                        <span className="shrink-0 rounded-full bg-black px-3 py-1 text-[10px] font-bold text-white">
                          Participating
                        </span>
                      )}

                    </div>

                    {/* DESCRIPTION */}

                    {tournament.description && (
                      <p className="mt-3 text-sm leading-relaxed text-gray-500">
                        {tournament.description}
                      </p>
                    )}

                    {/* STATS */}

                    <div className="mt-6 grid grid-cols-2 gap-3">

                      <div className="rounded-2xl bg-gray-50 p-4">

                        <p className="text-[10px] font-semibold uppercase tracking-wide text-gray-400">
                          Matches
                        </p>

                        <p className="mt-1 text-lg font-bold text-gray-900">
                          {completedMatches}/
                          {tournamentMatches.length}
                        </p>

                      </div>

                      <div className="rounded-2xl bg-gray-50 p-4">

                        <p className="text-[10px] font-semibold uppercase tracking-wide text-gray-400">
                          Status
                        </p>

                        <p className="mt-1 text-sm font-bold capitalize text-gray-900">
                          {tournament.status}
                        </p>

                      </div>

                    </div>

                    {/* CHAMPION */}

                    {tournament.status ===
                      "completed" &&
                      champion && (
                        <div className="mt-4 rounded-2xl border border-amber-200 bg-amber-50 p-4">

                          <p className="text-[10px] font-bold uppercase tracking-wide text-amber-600">
                            Tournament Champion
                          </p>

                          <p className="mt-1 font-bold text-amber-900">
                            🏆{" "}
                            {getPlayerName(
                              champion,
                            )}
                          </p>

                        </div>
                      )}

                    {/* PARTICIPATION */}

                    {playerIsInTournament && (
                      <div className="mt-4 rounded-2xl bg-gray-50 p-4 text-xs text-gray-600">
                        Your matchups are shown in the{" "}
                        <strong>
                          My 1v1 Matchups
                        </strong>{" "}
                        section above.
                      </div>
                    )}

                  </div>
                );
              })}

            </div>

          )}

        </section>

        {/* =================================================
            FOOTER
        ================================================== */}

        <footer className="mt-12 border-t border-gray-200 pt-6 text-center">

          <p className="text-xs text-gray-400">
            Futsal Arena Player Portal
          </p>

        </footer>

      </main>
    </div>
  );
}