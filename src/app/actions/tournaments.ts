"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export type TournamentState = {
  success: boolean;
  error: string | null;
  tournamentId: string | null;
};

async function verifyDeveloper() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return {
      supabase,
      user: null,
      error: "You must be logged in.",
    };
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
    return {
      supabase,
      user: null,
      error: "Unauthorized. Developer access required.",
    };
  }

  return {
    supabase,
    user,
    error: null,
  };
}

export async function createAndPairTournament(
  formData: FormData
): Promise<TournamentState> {
  const name = String(formData.get("name") ?? "").trim();
  const description =
    String(formData.get("description") ?? "").trim() || null;

  if (!name) {
    return {
      success: false,
      error: "Tournament name is required.",
      tournamentId: null,
    };
  }

  const { supabase, user, error: authError } = await verifyDeveloper();

  if (!user) {
    return {
      success: false,
      error: authError,
      tournamentId: null,
    };
  }

  /*
   * Get currently active registered players.
   */
  const now = new Date().toISOString();

  const { data: registrations, error: registrationError } =
    await supabase
      .from("player_registrations")
      .select("player_id")
      .eq("payment_status", "approved")
      .lte("starts_at", now)
      .gte("expires_at", now);

  if (registrationError) {
    return {
      success: false,
      error: registrationError.message,
      tournamentId: null,
    };
  }

  /*
   * Remove duplicate players.
   */
  const playerIds = Array.from(
    new Set((registrations ?? []).map((row) => row.player_id))
  );

  if (playerIds.length < 2) {
    return {
      success: false,
      error: "At least 2 active registered players are required.",
      tournamentId: null,
    };
  }

  /*
   * Randomly shuffle players.
   */
  for (let i = playerIds.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));

    [playerIds[i], playerIds[j]] = [playerIds[j], playerIds[i]];
  }

  /*
   * Create tournament.
   */
  const { data: tournament, error: tournamentError } =
    await supabase
      .from("tournaments")
      .insert({
        name,
        description,
        status: "draft",
        created_by: user.id,
      })
      .select("id")
      .single();

  if (tournamentError || !tournament) {
    return {
      success: false,
      error:
        tournamentError?.message ||
        "Failed to create tournament.",
      tournamentId: null,
    };
  }

  /*
   * Add players to tournament.
   */
  const tournamentPlayers = playerIds.map((playerId) => ({
    tournament_id: tournament.id,
    player_id: playerId,
  }));

  const { error: playersError } = await supabase
    .from("tournament_players")
    .insert(tournamentPlayers);

  if (playersError) {
    return {
      success: false,
      error: playersError.message,
      tournamentId: null,
    };
  }

  /*
   * Create Round 1 matchups.
   *
   * If there is an odd number of players,
   * the final player receives a bye.
   */
  const matchups = [];

  for (let i = 0; i + 1 < playerIds.length; i += 2) {
    matchups.push({
      tournament_id: tournament.id,
      player1_id: playerIds[i],
      player2_id: playerIds[i + 1],
      round: 1,
      match_number: i / 2 + 1,
      status: "pending",
      created_by: user.id,
    });
  }

  if (matchups.length > 0) {
    const { error: matchupError } = await supabase
      .from("matchups_1v1")
      .insert(matchups);

    if (matchupError) {
      return {
        success: false,
        error: matchupError.message,
        tournamentId: null,
      };
    }
  }

  /*
   * Audit log.
   */
  await supabase.from("audit_logs").insert({
    actor_id: user.id,
    action: "create_tournament",
    metadata: {
      tournament_id: tournament.id,
      tournament_name: name,
      player_count: playerIds.length,
      matchup_count: matchups.length,
    },
  });

  revalidatePath("/developer/tournaments");
  revalidatePath("/developer/dashboard");

  return {
    success: true,
    error: null,
    tournamentId: tournament.id,
  };
}

export async function resolveMatchupWinner(
  matchupId: string,
  winnerId: string
) {
  const { supabase, user, error: authError } =
    await verifyDeveloper();

  if (!user) {
    return {
      success: false,
      error: authError,
    };
  }

  const { data: matchup, error: matchupError } = await supabase
    .from("matchups_1v1")
    .select("id, player1_id, player2_id, status")
    .eq("id", matchupId)
    .single();

  if (matchupError || !matchup) {
    return {
      success: false,
      error: "Matchup not found.",
    };
  }

  if (matchup.status === "completed") {
    return {
      success: false,
      error: "This matchup has already been completed.",
    };
  }

  if (
    winnerId !== matchup.player1_id &&
    winnerId !== matchup.player2_id
  ) {
    return {
      success: false,
      error: "Winner must be one of the two players.",
    };
  }

  const { error: updateError } = await supabase
    .from("matchups_1v1")
    .update({
      winner_id: winnerId,
      status: "completed",
    })
    .eq("id", matchupId)
    .eq("status", "pending");

  if (updateError) {
    return {
      success: false,
      error: updateError.message,
    };
  }

  await supabase.from("audit_logs").insert({
    actor_id: user.id,
    action: "resolve_matchup_winner",
    metadata: {
      matchup_id: matchupId,
      winner_id: winnerId,
    },
  });

  revalidatePath("/developer/tournaments");

  return {
    success: true,
    error: null,
  };
}