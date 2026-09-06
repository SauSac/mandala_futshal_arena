"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export type TournamentState = {
  success: boolean;
  error: string | null;
  tournamentId: string | null;
};

type BracketMatch = {
  treeIndex: number;
  round: number;
  matchNumber: number;
  player1Id: string | null;
  player2Id: string | null;
};

type BracketNode = {
  count: number;
  playerId: string | null;
  matchTreeIndex: number | null;
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

  const { data: profile, error } = await supabase
    .from("profiles")
    .select("role, is_suspended")
    .eq("id", user.id)
    .single();

  if (
    error ||
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

function nextPowerOfTwo(value: number) {
  let size = 1;

  while (size < value) {
    size *= 2;
  }

  return size;
}

/*
 * Creates a fixed knockout bracket.
 *
 * Important:
 * - A subtree containing one player = bye.
 * - A subtree containing multiple players but only one
 *   non-empty branch does NOT create a fake matchup.
 * - Only nodes where BOTH sides contain players become matches.
 *
 * This correctly handles:
 * 2, 3, 4, 5, 6, 7, 8... players.
 */
function buildBracketMatches(playerIds: string[]) {
  const bracketSize = nextPowerOfTwo(playerIds.length);
  const totalRounds = Math.log2(bracketSize);

  const slots: (string | null)[] =
    Array(bracketSize).fill(null);

  for (let i = 0; i < playerIds.length; i++) {
    slots[i] = playerIds[i];
  }

  const matches: BracketMatch[] = [];

  function build(
    currentSlots: (string | null)[],
    depth: number,
    treeIndex: number,
  ): BracketNode {
    /*
     * Leaf.
     */
    if (currentSlots.length === 1) {
      return {
        count: currentSlots[0] ? 1 : 0,
        playerId: currentSlots[0],
        matchTreeIndex: null,
      };
    }

    const half = currentSlots.length / 2;

    const left = build(
      currentSlots.slice(0, half),
      depth + 1,
      treeIndex * 2,
    );

    const right = build(
      currentSlots.slice(half),
      depth + 1,
      treeIndex * 2 + 1,
    );

    const count = left.count + right.count;

    /*
     * Empty subtree.
     */
    if (count === 0) {
      return {
        count: 0,
        playerId: null,
        matchTreeIndex: null,
      };
    }

    /*
     * Exactly one player.
     *
     * This entire subtree is a BYE.
     *
     * Do not create a matchup.
     */
    if (count === 1) {
      return {
        count: 1,
        playerId:
          left.playerId ??
          right.playerId,
        matchTreeIndex:
          left.matchTreeIndex ??
          right.matchTreeIndex,
      };
    }

    /*
     * More than one player.
     *
     * Only create a matchup if BOTH branches
     * contain players.
     *
     * This is what prevents fake BYE vs BYE
     * or Player vs BYE matches.
     */
    if (left.count > 0 && right.count > 0) {
      const round =
        totalRounds - depth;

      const nodesInRound =
        Math.pow(2, depth);

      const matchNumber =
        treeIndex -
        nodesInRound +
        1;

      matches.push({
        treeIndex,
        round,
        matchNumber,
        player1Id:
          left.count === 1
            ? left.playerId
            : null,
        player2Id:
          right.count === 1
            ? right.playerId
            : null,
      });

      return {
        count,
        playerId: null,
        matchTreeIndex: treeIndex,
      };
    }

    /*
     * Only one branch contains players.
     *
     * No matchup is created here.
     *
     * The existing subtree simply continues
     * toward the next real matchup.
     */
    if (left.count > 0) {
      return {
        count,
        playerId: null,
        matchTreeIndex:
          left.matchTreeIndex,
      };
    }

    return {
      count,
      playerId: null,
      matchTreeIndex:
        right.matchTreeIndex,
    };
  }

  build(slots, 0, 1);

  matches.sort(
    (a, b) =>
      a.round - b.round ||
      a.matchNumber - b.matchNumber,
  );

  return {
    bracketSize,
    totalRounds,
    matches,
  };
}

/*
 * Find the nearest real matchup above a matchup.
 *
 * This handles branches where one or more rounds
 * contain no actual matchup because of byes.
 */
function findParentMatchTreeIndex(
  treeIndex: number,
  matchTreeIndexes: Set<number>,
) {
  let current = treeIndex;

  while (current > 1) {
    current = Math.floor(current / 2);

    if (matchTreeIndexes.has(current)) {
      return current;
    }
  }

  return null;
}

/*
 * Determine whether a child matchup feeds
 * player slot 1 or player slot 2 of its parent.
 */
function getParentSlot(
  childTreeIndex: number,
  parentTreeIndex: number,
) {
  let current = childTreeIndex;

  while (
    Math.floor(current / 2) !==
    parentTreeIndex
  ) {
    current = Math.floor(current / 2);
  }

  return current % 2 === 0 ? 1 : 2;
}

export async function createAndPairTournament(
  _previousState: TournamentState,
  formData: FormData,
): Promise<TournamentState> {
  const name = String(
    formData.get("name") ?? "",
  ).trim();

  const description =
    String(
      formData.get("description") ?? "",
    ).trim() || null;

  if (!name) {
    return {
      success: false,
      error: "Tournament name is required.",
      tournamentId: null,
    };
  }

  const {
    supabase,
    user,
    error: authError,
  } = await verifyDeveloper();

  if (!user) {
    return {
      success: false,
      error: authError,
      tournamentId: null,
    };
  }

  const now =
    new Date().toISOString();

  /*
   * Find players with an active,
   * approved registration.
   */
  const {
    data: registrations,
    error: registrationError,
  } = await supabase
    .from("player_registrations")
    .select("player_id")
    .eq(
      "payment_status",
      "approved",
    )
    .lte("starts_at", now)
    .gte("expires_at", now);

  if (registrationError) {
    return {
      success: false,
      error:
        registrationError.message,
      tournamentId: null,
    };
  }

  let playerIds = Array.from(
    new Set(
      (registrations ?? []).map(
        (row) => row.player_id,
      ),
    ),
  );

  if (playerIds.length < 2) {
    return {
      success: false,
      error:
        "At least 2 active registered players are required.",
      tournamentId: null,
    };
  }

  /*
   * Randomize players.
   */
  for (
    let i =
      playerIds.length - 1;
    i > 0;
    i--
  ) {
    const j = Math.floor(
      Math.random() * (i + 1),
    );

    [
      playerIds[i],
      playerIds[j],
    ] = [
      playerIds[j],
      playerIds[i],
    ];
  }

  const {
    bracketSize,
    totalRounds,
    matches,
  } =
    buildBracketMatches(
      playerIds,
    );

  /*
   * Create tournament.
   *
   * It is immediately active because
   * players should be able to see it.
   */
  const {
    data: tournament,
    error: tournamentError,
  } = await supabase
    .from("tournaments")
    .insert({
      name,
      description,
      status: "active",
      created_by: user.id,
    })
    .select("id")
    .single();

  if (
    tournamentError ||
    !tournament
  ) {
    return {
      success: false,
      error:
        tournamentError?.message ||
        "Failed to create tournament.",
      tournamentId: null,
    };
  }

  /*
   * Store tournament players.
   */
  const tournamentPlayers =
    playerIds.map(
      (playerId, index) => ({
        tournament_id:
          tournament.id,
        player_id:
          playerId,
        bracket_position:
          index + 1,
      }),
    );

  const {
    error: playersError,
  } = await supabase
    .from("tournament_players")
    .insert(
      tournamentPlayers,
    );

  if (playersError) {
    await supabase
      .from("tournaments")
      .delete()
      .eq(
        "id",
        tournament.id,
      );

    return {
      success: false,
      error:
        playersError.message,
      tournamentId: null,
    };
  }

  /*
   * Insert all real matchups.
   */
  let insertedMatches: {
    id: string;
    round: number;
    match_number: number;
  }[] = [];

  if (matches.length > 0) {
    const {
      data,
      error: matchupError,
    } = await supabase
      .from("matchups_1v1")
      .insert(
        matches.map(
          (match) => ({
            tournament_id:
              tournament.id,
            player1_id:
              match.player1Id,
            player2_id:
              match.player2Id,
            round:
              match.round,
            match_number:
              match.matchNumber,
            status:
              "pending",
            created_by:
              user.id,
          }),
        ),
      )
      .select(
        "id, round, match_number",
      );

    if (
      matchupError ||
      !data
    ) {
      await supabase
        .from(
          "tournament_players",
        )
        .delete()
        .eq(
          "tournament_id",
          tournament.id,
        );

      await supabase
        .from("tournaments")
        .delete()
        .eq(
          "id",
          tournament.id,
        );

      return {
        success: false,
        error:
          matchupError?.message ||
          "Failed to create tournament matches.",
        tournamentId: null,
      };
    }

    insertedMatches = data;
  }

  /*
   * Build a lookup:
   *
   * treeIndex -> database matchup ID
   */
  const treeIndexToDatabaseId =
    new Map<number, string>();

  for (
    const match of matches
  ) {
    const inserted =
      insertedMatches.find(
        (item) =>
          item.round ===
            match.round &&
          item.match_number ===
            match.matchNumber,
      );

    if (inserted) {
      treeIndexToDatabaseId.set(
        match.treeIndex,
        inserted.id,
      );
    }
  }

  const actualMatchTreeIndexes =
    new Set(
      matches.map(
        (match) =>
          match.treeIndex,
      ),
    );

  /*
   * Connect every matchup to the
   * nearest REAL parent matchup.
   *
   * This correctly handles byes.
   */
  for (
    const match of matches
  ) {
    const currentId =
      treeIndexToDatabaseId.get(
        match.treeIndex,
      );

    if (!currentId) {
      continue;
    }

    const parentTreeIndex =
      findParentMatchTreeIndex(
        match.treeIndex,
        actualMatchTreeIndexes,
      );

    if (
      parentTreeIndex === null
    ) {
      /*
       * This is the final.
       */
      continue;
    }

    const parentId =
      treeIndexToDatabaseId.get(
        parentTreeIndex,
      );

    if (!parentId) {
      continue;
    }

    const nextSlot =
      getParentSlot(
        match.treeIndex,
        parentTreeIndex,
      );

    const {
      error: linkError,
    } = await supabase
      .from("matchups_1v1")
      .update({
        next_matchup_id:
          parentId,
        next_matchup_slot:
          nextSlot,
      })
      .eq(
        "id",
        currentId,
      );

    if (linkError) {
      console.error(
        "Failed to link matchup:",
        linkError.message,
      );
    }
  }

  /*
   * Audit log.
   */
  await supabase
    .from("audit_logs")
    .insert({
      actor_id: user.id,
      action:
        "create_tournament",
      metadata: {
        tournament_id:
          tournament.id,
        tournament_name:
          name,
        player_count:
          playerIds.length,
        bracket_size:
          bracketSize,
        total_rounds:
          totalRounds,
        matchup_count:
          matches.length,
      },
    });

  revalidatePath(
    "/developer/tournaments",
  );

  revalidatePath(
    "/developer/dashboard",
  );

  revalidatePath(
    "/dashboard/tournaments",
  );

  return {
    success: true,
    error: null,
    tournamentId:
      tournament.id,
  };
}

export async function resolveMatchupWinner(
  matchupId: string,
  winnerId: string,
) {
  const {
    supabase,
    user,
    error: authError,
  } = await verifyDeveloper();

  if (!user) {
    return {
      success: false,
      error: authError,
    };
  }

  /*
   * Get matchup.
   */
  const {
    data: matchup,
    error: matchupError,
  } = await supabase
    .from("matchups_1v1")
    .select(
      `
      id,
      tournament_id,
      player1_id,
      player2_id,
      round,
      match_number,
      status,
      next_matchup_id,
      next_matchup_slot
      `,
    )
    .eq("id", matchupId)
    .single();

  if (
    matchupError ||
    !matchup
  ) {
    return {
      success: false,
      error: "Matchup not found.",
    };
  }

  if (
    matchup.status ===
    "completed"
  ) {
    return {
      success: false,
      error:
        "This matchup has already been completed.",
    };
  }

  /*
   * Both players must be known.
   */
  if (
    !matchup.player1_id ||
    !matchup.player2_id
  ) {
    return {
      success: false,
      error:
        "This matchup is not ready yet.",
    };
  }

  /*
   * Winner must be one of the
   * actual players.
   */
  if (
    winnerId !==
      matchup.player1_id &&
    winnerId !==
      matchup.player2_id
  ) {
    return {
      success: false,
      error:
        "Winner must be one of the two players.",
    };
  }

  /*
   * Resolve matchup.
   */
  const {
    data: updated,
    error: updateError,
  } = await supabase
    .from("matchups_1v1")
    .update({
      winner_id:
        winnerId,
      status:
        "completed",
    })
    .eq(
      "id",
      matchupId,
    )
    .eq(
      "status",
      "pending",
    )
    .select("id")
    .maybeSingle();

  if (updateError) {
    return {
      success: false,
      error:
        updateError.message,
    };
  }

  if (!updated) {
    return {
      success: false,
      error:
        "Matchup was already resolved.",
    };
  }

  /*
   * Final matchup:
   * no next matchup means this is
   * the championship match.
   */
  if (
    !matchup.next_matchup_id
  ) {
    const {
      error: tournamentError,
    } = await supabase
      .from("tournaments")
      .update({
        status:
          "completed",
        champion_id:
          winnerId,
      })
      .eq(
        "id",
        matchup.tournament_id,
      )
      .neq(
        "status",
        "completed",
      );

    if (tournamentError) {
      return {
        success: false,
        error:
          tournamentError.message,
      };
    }
  } else {
    /*
     * Advance winner to the exact
     * bracket slot determined when
     * the tournament was created.
     */
    const {
      data: nextMatch,
      error: nextMatchError,
    } = await supabase
      .from("matchups_1v1")
      .select(
        `
        id,
        player1_id,
        player2_id,
        status
        `,
      )
      .eq(
        "id",
        matchup.next_matchup_id,
      )
      .single();

    if (
      nextMatchError ||
      !nextMatch
    ) {
      return {
        success: false,
        error:
          "Next matchup could not be found.",
      };
    }

    const update: {
      player1_id?: string;
      player2_id?: string;
    } = {};

    if (
      matchup.next_matchup_slot ===
        1 &&
      !nextMatch.player1_id
    ) {
      update.player1_id =
        winnerId;
    }

    if (
      matchup.next_matchup_slot ===
        2 &&
      !nextMatch.player2_id
    ) {
      update.player2_id =
        winnerId;
    }

    if (
      Object.keys(update)
        .length > 0
    ) {
      const {
        error: advanceError,
      } = await supabase
        .from("matchups_1v1")
        .update(update)
        .eq(
          "id",
          nextMatch.id,
        );

      if (advanceError) {
        return {
          success: false,
          error:
            advanceError.message,
        };
      }
    }
  }

  /*
   * Audit log.
   */
  await supabase
    .from("audit_logs")
    .insert({
      actor_id: user.id,
      action:
        "resolve_matchup_winner",
      metadata: {
        matchup_id:
          matchupId,
        winner_id:
          winnerId,
        tournament_id:
          matchup.tournament_id,
      },
    });

  revalidatePath(
    "/developer/tournaments",
  );

  revalidatePath(
    "/dashboard/tournaments",
  );

  return {
    success: true,
    error: null,
  };
}