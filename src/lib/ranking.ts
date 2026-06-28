// Pure ranking computation — no DB imports

export const BASE_POINTS: Record<number, number> = {
  1: 50,
  2: 35,
  3: 25,
  4: 18,
  5: 12,
  6: 8,
  7: 5,
  8: 3,
};
export const TAIL_POINTS = 1;
export const MAX_RESULTS = 6; // melhores N resultados contam por época

// Multiplier based on draw size: 8 pairs = ×1.0; 16 ≈ ×1.30; 32 ≈ ×1.60
export function sizeMultiplier(nPairs: number): number {
  return 1 + Math.log10(Math.max(nPairs, 8) / 8);
}

export function pointsForPosition(position: number, nPairs: number): number {
  const base = BASE_POINTS[position] ?? TAIL_POINTS;
  return Math.max(1, Math.round(base * sizeMultiplier(nPairs)));
}

type SimpleMatch = {
  round: number;
  groupNumber: number | null;
  pair1Id: string | null;
  pair2Id: string | null;
  score1: number | null;
  score2: number | null;
  winnerId: string | null;
  completedAt: Date | null;
};

export type SimpleReg = {
  id: string;
  player1Id: string;
  player2Id: string | null;
};

function groupStandings(
  matches: SimpleMatch[],
  regIds: string[]
): [string, { wins: number; balance: number }][] {
  const totals: Record<string, { wins: number; balance: number }> = {};
  for (const id of regIds) totals[id] = { wins: 0, balance: 0 };
  for (const m of matches.filter((m) => m.completedAt)) {
    if (m.pair1Id && totals[m.pair1Id] !== undefined) {
      totals[m.pair1Id].balance += (m.score1 ?? 0) - (m.score2 ?? 0);
      if ((m.score1 ?? 0) > (m.score2 ?? 0)) totals[m.pair1Id].wins++;
    }
    if (m.pair2Id && totals[m.pair2Id] !== undefined) {
      totals[m.pair2Id].balance += (m.score2 ?? 0) - (m.score1 ?? 0);
      if ((m.score2 ?? 0) > (m.score1 ?? 0)) totals[m.pair2Id].wins++;
    }
  }
  return Object.entries(totals).sort(
    ([, a], [, b]) => b.wins - a.wins || b.balance - a.balance
  );
}

function eliminationPositions(matches: SimpleMatch[]): Map<string, number> {
  const map = new Map<string, number>();
  const completed = matches.filter((m) => m.completedAt && m.winnerId);
  if (completed.length === 0) return map;

  const maxRound = Math.max(...completed.map((m) => m.round));

  for (let r = maxRound; r >= 1; r--) {
    const roundMatches = completed.filter((m) => m.round === r);
    if (r === maxRound) {
      // Final: winner = 1st, loser = 2nd
      for (const m of roundMatches) {
        if (m.winnerId && !map.has(m.winnerId)) map.set(m.winnerId, 1);
        const loserId = m.winnerId === m.pair1Id ? m.pair2Id : m.pair1Id;
        if (loserId && !map.has(loserId)) map.set(loserId, 2);
      }
    } else {
      // Each earlier round: losers get position 2^(maxRound-r) + 1
      const pos = Math.pow(2, maxRound - r) + 1;
      for (const m of roundMatches) {
        const loserId = m.winnerId === m.pair1Id ? m.pair2Id : m.pair1Id;
        if (loserId && !map.has(loserId)) map.set(loserId, pos);
      }
    }
  }
  return map;
}

function nonStopPositions(
  matches: SimpleMatch[],
  registrations: SimpleReg[]
): Map<string, number> {
  const map = new Map<string, number>();
  const completed = matches.filter((m) => m.completedAt);
  const finalsMatches = completed.filter((m) => m.groupNumber === 0);
  const hasFinals = finalsMatches.length > 0;

  if (!hasFinals) {
    // Single pool or multi-group without finals phase
    const allRegIds = registrations.map((r) => r.id);
    groupStandings(completed, allRegIds).forEach(([regId], idx) =>
      map.set(regId, idx + 1)
    );
  } else {
    // Finals → positions 1..k
    const finalistIds = new Set<string>();
    for (const m of finalsMatches) {
      if (m.pair1Id) finalistIds.add(m.pair1Id);
      if (m.pair2Id) finalistIds.add(m.pair2Id);
    }
    const finalistRegIds = [...finalistIds];
    groupStandings(finalsMatches, finalistRegIds).forEach(([regId], idx) =>
      map.set(regId, idx + 1)
    );
    const k = finalistRegIds.length;

    // Non-finalists → ranked by group phase performance, offset by k
    const groupMatches = completed.filter(
      (m) => m.groupNumber !== null && m.groupNumber !== 0
    );
    const nonFinalistIds = registrations
      .map((r) => r.id)
      .filter((id) => !finalistIds.has(id));
    groupStandings(groupMatches, nonFinalistIds).forEach(([regId], idx) =>
      map.set(regId, k + idx + 1)
    );
  }
  return map;
}

export type RankingEntry = { memberId: string; points: number; position: number };

export function computeRankingEntries(
  format: "ELIMINATION" | "NON_STOP",
  matches: SimpleMatch[],
  registrations: SimpleReg[]
): RankingEntry[] {
  const nPairs = registrations.length;
  const positions =
    format === "ELIMINATION"
      ? eliminationPositions(matches)
      : nonStopPositions(matches, registrations);

  const result: RankingEntry[] = [];
  for (const [regId, position] of positions.entries()) {
    const reg = registrations.find((r) => r.id === regId);
    if (!reg) continue;
    const pts = pointsForPosition(position, nPairs);
    result.push({ memberId: reg.player1Id, points: pts, position });
    if (reg.player2Id) result.push({ memberId: reg.player2Id, points: pts, position });
  }
  return result;
}
