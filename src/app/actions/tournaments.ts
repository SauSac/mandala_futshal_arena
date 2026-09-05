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
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) return { supabase, user: null, error: "You must be logged in." };

  const { data: profile } = await supabase
    .from("profiles")
    .select("role, is_suspended")
    .eq("id", user.id)
    .single();

  if (!profile || profile.role !== "developer" || profile.is_suspended) {
    return {
      supabase,
      user: null,
      error: "Unauthorized. Developer access required.",
    };
  }

  return { supabase, user, error: null };
}

function nextPowerOfTwo(n: number) {
  let value = 1;
  while (value < n) value *= 2;
  return value;
}

type TreeNode = {
  count: number;
  player: string | null;
};

/**
 * Builds a fixed binary knockout bracket.
 *
 * - A subtree with 0 players disappears.
 * - A subtree with exactly 1 player is a bye and that player is propagated upward.
 * - A subtree with 2+ players becomes a real matchup.
 *
 * This means the database never contains a fake BYE-vs-BYE match. A later-round
 * matchup may initially have one known player and one empty slot; the empty slot
 * is filled when the other branch produces its winner.
 */
function buildBracket(
  slots: (string | null)[],
  round: number,
  matchNumber: number,
  onMatch: (match: {
    round: number;
    matchNumber: number;
    player1Id: string | null;
    player2Id: string | null;
  }) => void,
): TreeNode {
  if (slots.length === 1) {
    return { count: slots[0] ? 1 : 0, player: slots[0] ?? null };
  }

  const half = slots.length / 2;
  const left = buildBracket(slots.slice(0, half), round - 1, matchNumber * 2 - 1, onMatch);
  const right = buildBracket(slots.slice(half), round - 1, matchNumber * 2, onMatch);
  const count = left.count + right.count;

  if (count === 0) return { count: 0, player: null };

  if (count === 1) {
    return { count: 1, player: left.player ?? right.player };
  }

  onMatch({
    round,
    matchNumber,
    player1Id: left.player,
    player2Id: right.player,
  });

  return { count, player: null };
}

function buildBracketMatches(playerIds: string[]) {
  const size = nextPowerOfTwo(playerIds.length);
  const slots: (string | null)[] = Array(size).fill(null);

  for (let i = 0; i < playerIds.length; i++) slots[i] = playerIds[i];

  const matches: {
    round: number;
    matchNumber: number;
    player1Id: string | null;
    player2Id: string | null;
  }[] = [];

  const rounds = Math.log2(size);
  buildBracket(slots, rounds, 1, (match) => matches.push(match));
  matches.sort((a, b) => a.round - b.round || a.matchNumber - b.matchNumber);

  return { size, matches };
}

export async function createAndPairTournament(
  formData: FormData,
): Promise<TournamentState> {
  const name = String(formData.get("name") ?? "").trim();
  const description = String(formData.get("description") ?? "").trim() || null;

  if (!name) {
    return { success: false, error: "Tournament name is required.", tournamentId: null };
  }

  const { supabase, user, error: authError } = await verifyDeveloper();
  if (!user) return { success: false, error: authError, tournamentId: null };

  const now = new Date().toISOString();
  const { data: registrations, error: registrationError } = await supabase
    .from("player_registrations")
    .select("player_id")
    .eq("payment_status", "approved")
    .lte("starts_at", now)
    .gte("expires_at", now);

  if (registrationError) {
    return { success: false, error: registrationError.message, tournamentId: null };
  }

  const playerIds = Array.from(new Set((registrations ?? []).map((row) => row.player_id)));

  if (playerIds.length < 2) {
    return {
      success: false,
      error: "At least 2 active registered players are required.",
      tournamentId: null,
    };
  }

  for (let i = playerIds.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [playerIds[i], playerIds[j]] = [playerIds[j], playerIds[i]];
  }

  const { size, matches } = buildBracketMatches(playerIds);

  const { data: tournament, error: tournamentError } = await supabase
    .from("tournaments")
    .insert({ name, description, status: "draft", created_by: user.id })
    .select("id")
    .single();

  if (tournamentError || !tournament) {
    return {
      success: false,
      error: tournamentError?.message || "Failed to create tournament.",
      tournamentId: null,
    };
  }

  const tournamentPlayers = playerIds.map((playerId, index) => ({
    tournament_id: tournament.id,
    player_id: playerId,
    bracket_position: index + 1,
  }));

  const { error: playersError } = await supabase
    .from("tournament_players")
    .insert(tournamentPlayers);

  if (playersError) {
    await supabase.from("tournaments").delete().eq("id", tournament.id);
    return { success: false, error: playersError.message, tournamentId: null };
  }

  if (matches.length) {
    const { error: matchupError } = await supabase.from("matchups_1v1").insert(
      matches.map((match) => ({
        tournament_id: tournament.id,
        player1_id: match.player1Id,
        player2_id: match.player2Id,
        round: match.round,
        match_number: match.matchNumber,
        status: "pending",
        created_by: user.id,
      })),
    );

    if (matchupError) {
      await supabase.from("tournament_players").delete().eq("tournament_id", tournament.id);
      await supabase.from("tournaments").delete().eq("id", tournament.id);
      return { success: false, error: matchupError.message, tournamentId: null };
    }
  }

  await supabase.from("audit_logs").insert({
    actor_id: user.id,
    action: "create_tournament",
    metadata: {
      tournament_id: tournament.id,
      tournament_name: name,
      player_count: playerIds.length,
      bracket_size: size,
      matchup_count: matches.length,
    },
  });

  revalidatePath("/developer/tournaments");
  revalidatePath("/developer/dashboard");

  return { success: true, error: null, tournamentId: tournament.id };
}

export async function resolveMatchupWinner(matchupId: string, winnerId: string) {
  const { supabase, user, error: authError } = await verifyDeveloper();
  if (!user) return { success: false, error: authError };

  const { data: matchup, error: matchupError } = await supabase
    .from("matchups_1v1")
    .select("id, tournament_id, player1_id, player2_id, round, match_number, status")
    .eq("id", matchupId)
    .single();

  if (matchupError || !matchup) return { success: false, error: "Matchup not found." };
  if (matchup.status === "completed") return { success: false, error: "This matchup has already been completed." };
  if (!matchup.player1_id || !matchup.player2_id) {
    return { success: false, error: "This matchup is not ready yet." };
  }
  if (winnerId !== matchup.player1_id && winnerId !== matchup.player2_id) {
    return { success: false, error: "Winner must be one of the two players." };
  }

  const { data: updated, error: updateError } = await supabase
    .from("matchups_1v1")
    .update({ winner_id: winnerId, status: "completed" })
    .eq("id", matchupId)
    .eq("status", "pending")
    .select("id")
    .maybeSingle();

  if (updateError) return { success: false, error: updateError.message };
  if (!updated) return { success: false, error: "Matchup was already resolved." };

  const { data: tournament } = await supabase
    .from("tournaments")
    .select("id, status")
    .eq("id", matchup.tournament_id)
    .single();

  if (matchup.round > 0) {
    const nextRound = matchup.round + 1;
    const nextMatchNumber = Math.ceil(matchup.match_number / 2);
    const nextSlot = matchup.match_number % 2 === 1 ? 1 : 2;

    const { data: nextMatch } = await supabase
      .from("matchups_1v1")
      .select("id, player1_id, player2_id, status")
      .eq("tournament_id", matchup.tournament_id)
      .eq("round", nextRound)
      .eq("match_number", nextMatchNumber)
      .maybeSingle();

    if (nextMatch) {
      const update: Record<string, string> = {};
      if (nextSlot === 1 && !nextMatch.player1_id) update.player1_id = winnerId;
      if (nextSlot === 2 && !nextMatch.player2_id) update.player2_id = winnerId;
      if (Object.keys(update).length) {
        await supabase.from("matchups_1v1").update(update).eq("id", nextMatch.id);
      }
    }
  }

  // Final is the last round. When it is completed, store the champion and finish tournament.
  const { data: finalRoundMatches } = await supabase
    .from("matchups_1v1")
    .select("id, round, status, winner_id")
    .eq("tournament_id", matchup.tournament_id)
    .order("round", { ascending: false })
    .order("match_number", { ascending: false });

  const maxRound = Math.max(...(finalRoundMatches ?? []).map((m) => m.round), 0);
  if (matchup.round === maxRound) {
    await supabase
      .from("tournaments")
      .update({ status: "completed", champion_id: winnerId })
      .eq("id", matchup.tournament_id)
      .neq("status", "completed");
  } else if (tournament?.status === "draft") {
    await supabase
      .from("tournaments")
      .update({ status: "active" })
      .eq("id", matchup.tournament_id)
      .eq("status", "draft");
  }

  await supabase.from("audit_logs").insert({
    actor_id: user.id,
    action: "resolve_matchup_winner",
    metadata: { matchup_id: matchupId, winner_id: winnerId },
  });

  revalidatePath("/developer/tournaments");
  return { success: true, error: null };
}
