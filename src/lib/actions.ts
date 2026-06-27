"use server";

import { auth } from "@clerk/nextjs/server";
import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";

async function requireAdmin() {
  const { userId } = await auth();
  if (!userId) throw new Error("Não autenticado");
  const member = await db.member.findUnique({ where: { clerkId: userId } });
  if (!member || member.role !== "ADMIN") throw new Error("Sem permissão");
  return member;
}

// ── TOURNAMENTS ───────────────────────────────────────────────

export async function createTournament(formData: FormData) {
  await requireAdmin();
  await db.tournament.create({
    data: {
      name: formData.get("name") as string,
      date: new Date(formData.get("date") as string),
      location: formData.get("location") as string,
      format: formData.get("format") as "ELIMINATION" | "NON_STOP",
      category: formData.get("category") as "MIXED" | "MALE" | "FEMALE" | "OPEN",
      maxPairs: Number(formData.get("maxPairs")),
      description: (formData.get("description") as string) || null,
      status: "DRAFT",
    },
  });
  revalidatePath("/admin/torneios");
  revalidatePath("/torneios");
}

export async function updateTournamentStatus(id: string, status: string) {
  await requireAdmin();
  await db.tournament.update({ where: { id }, data: { status: status as never } });
  revalidatePath("/admin/torneios");
  revalidatePath("/torneios");
  revalidatePath(`/admin/torneios/${id}`);
}

export async function deleteTournament(id: string) {
  await requireAdmin();
  await db.tournament.delete({ where: { id } });
  revalidatePath("/admin/torneios");
  revalidatePath("/torneios");
}

// ── REGISTRATIONS ─────────────────────────────────────────────

export async function cancelOwnRegistration(id: string) {
  const { userId } = await auth();
  if (!userId) throw new Error("Não autenticado");
  const member = await db.member.findUnique({ where: { clerkId: userId } });
  if (!member) throw new Error("Perfil não encontrado");

  const reg = await db.registration.findUnique({ where: { id } });
  if (!reg) throw new Error("Inscrição não encontrada");
  if (reg.player1Id !== member.id && reg.player2Id !== member.id) throw new Error("Sem permissão");
  if (reg.status === "CANCELLED") throw new Error("Inscrição já cancelada");

  await db.registration.update({ where: { id }, data: { status: "CANCELLED" } });
  revalidatePath("/dashboard");
  revalidatePath(`/admin/torneios/${reg.tournamentId}`);
}

export async function updateRegistrationStatus(id: string, status: "CONFIRMED" | "CANCELLED" | "PENDING") {
  await requireAdmin();

  if (status === "CONFIRMED") {
    const reg = await db.registration.findUnique({
      where: { id },
      include: { tournament: true },
    });
    if (reg) {
      // Validate no player appears in another confirmed registration
      const playerIds = [reg.player1Id, reg.player2Id].filter(Boolean) as string[];
      const conflict = await db.registration.findFirst({
        where: {
          id: { not: id },
          tournamentId: reg.tournamentId,
          status: "CONFIRMED",
          OR: [
            { player1Id: { in: playerIds } },
            { player2Id: { in: playerIds } },
          ],
        },
        include: { player1: true, player2: true },
      });
      if (conflict) {
        const conflictName = [conflict.player1.name, conflict.player2?.name].filter(Boolean).join(" / ");
        throw new Error(`Jogador já confirmado noutra dupla: ${conflictName}`);
      }
    }
  }

  const reg = await db.registration.update({
    where: { id },
    data: { status },
    include: { tournament: true },
  });
  revalidatePath(`/admin/torneios/${reg.tournamentId}`);
  revalidatePath("/torneios");
}

// ── MEMBERS ───────────────────────────────────────────────────

export async function updateMember(
  id: string,
  data: { memberNumber?: number | null; quotaYear?: number | null; role?: string; level?: string }
) {
  await requireAdmin();
  await db.member.update({ where: { id }, data: data as never });
  revalidatePath("/admin/socios");
  revalidatePath("/ranking");
}

// ── RANKING ───────────────────────────────────────────────────

export async function upsertRankingPoint(memberId: string, tournamentId: string, points: number) {
  await requireAdmin();
  const year = (await db.tournament.findUnique({ where: { id: tournamentId } }))?.date.getFullYear() ?? new Date().getFullYear();
  await db.rankingPoint.upsert({
    where: { memberId_tournamentId: { memberId, tournamentId } },
    create: { memberId, tournamentId, points, year },
    update: { points },
  });
  revalidatePath("/admin/ranking");
  revalidatePath("/ranking");
}

export async function deleteRankingPoint(memberId: string, tournamentId: string) {
  await requireAdmin();
  await db.rankingPoint.delete({
    where: { memberId_tournamentId: { memberId, tournamentId } },
  });
  revalidatePath("/admin/ranking");
  revalidatePath("/ranking");
}

// ── DRAW (sorteio de duplas) ──────────────────────────────────

const LEVEL_SCORE = { BEGINNER: 1, INTERMEDIATE: 2, ADVANCED: 3 } as const;

export async function drawPairs(tournamentId: string) {
  await requireAdmin();

  const tournament = await db.tournament.findUnique({ where: { id: tournamentId } });
  if (!tournament) throw new Error("Torneio não encontrado");

  // Solo registrations only (no partner yet)
  const solos = await db.registration.findMany({
    where: { tournamentId, player2Id: null, status: { not: "CANCELLED" } },
    include: { player1: true },
  });

  if (solos.length < 2) throw new Error("Mínimo de 2 inscrições individuais sem par");

  type Solo = typeof solos[number];

  // Shuffle within groups to introduce randomness
  function shuffle<T>(arr: T[]): T[] {
    return arr.sort(() => Math.random() - 0.5);
  }

  let pairs: [Solo, Solo][] = [];

  if (tournament.category === "MIXED") {
    // For mixed: pair MALE with FEMALE, balance by level (best with worst)
    const males = shuffle(solos.filter((s) => s.player1.gender === "MALE"));
    const females = shuffle(solos.filter((s) => s.player1.gender === "FEMALE"));
    const neutral = shuffle(solos.filter((s) => !s.player1.gender));

    // Sort males DESC, females ASC → pair index i with reversed i
    males.sort((a, b) => LEVEL_SCORE[b.player1.level] - LEVEL_SCORE[a.player1.level]);
    females.sort((a, b) => LEVEL_SCORE[a.player1.level] - LEVEL_SCORE[b.player1.level]);

    const count = Math.min(males.length, females.length);
    for (let i = 0; i < count; i++) {
      pairs.push([males[i], females[i]]);
    }

    // Leftover from gender mismatch + neutrals → pair by level balance
    const leftover = [
      ...males.slice(count),
      ...females.slice(count),
      ...neutral,
    ].sort((a, b) => LEVEL_SCORE[b.player1.level] - LEVEL_SCORE[a.player1.level]);

    for (let i = 0; i < Math.floor(leftover.length / 2); i++) {
      pairs.push([leftover[i], leftover[leftover.length - 1 - i]]);
    }
  } else {
    // Non-mixed: pair best with worst by level
    const sorted = shuffle(solos).sort(
      (a, b) => LEVEL_SCORE[b.player1.level] - LEVEL_SCORE[a.player1.level]
    );
    for (let i = 0; i < Math.floor(sorted.length / 2); i++) {
      pairs.push([sorted[i], sorted[sorted.length - 1 - i]]);
    }
  }

  // Validate no duplicate players across pairs
  const allPlayerIds = pairs.flatMap(([r1, r2]) => [r1.player1.id, r2.player1.id]);
  const uniqueIds = new Set(allPlayerIds);
  if (uniqueIds.size !== allPlayerIds.length) {
    throw new Error("Sorteio resultou em jogadores duplicados — verifique as inscrições");
  }

  // Apply pairs: set player2Id on player1's registration, cancel player2's solo registration
  await db.$transaction(
    pairs.map(([reg1, reg2]) =>
      db.registration.update({
        where: { id: reg1.id },
        data: { player2Id: reg2.player1.id },
      })
    )
  );

  // Cancel the now-merged solo registrations of player2
  const player2RegIds = pairs.map(([, reg2]) => reg2.id);
  await db.registration.updateMany({
    where: { id: { in: player2RegIds } },
    data: { status: "CANCELLED" },
  });

  revalidatePath(`/admin/torneios/${tournamentId}`);
  return pairs.map(([r1, r2]) => ({
    player1: r1.player1.name,
    player2: r2.player1.name,
    level1: r1.player1.level,
    level2: r2.player1.level,
  }));
}

// ── MATCHES ───────────────────────────────────────────────────

export async function resetBracket(tournamentId: string) {
  await requireAdmin();
  await db.match.deleteMany({ where: { tournamentId } });
  revalidatePath(`/admin/torneios/${tournamentId}`);
}

function circleRoundRobin(
  ids: string[],
  totalRounds: number,
  groupNumber: number | null,
  tournamentId: string
) {
  const list = [...ids];
  if (list.length % 2 !== 0) list.push("bye");
  const n = list.length;
  const fixed = list[0];
  const rotating = list.slice(1);
  const courts = n / 2;
  const rounds = Math.min(totalRounds, n - 1);

  const matchData: {
    tournamentId: string;
    round: number;
    position: number;
    court: number;
    groupNumber: number | null;
    pair1Id: string | null;
    pair2Id: string | null;
    winnerId: null;
    completedAt: null;
  }[] = [];

  for (let round = 0; round < rounds; round++) {
    const roundPairs: [string, string][] = [[fixed, rotating[0]]];
    for (let i = 1; i < courts; i++) {
      roundPairs.push([rotating[i], rotating[n - 1 - i]]);
    }
    roundPairs.forEach(([a, b], courtIdx) => {
      if (a === "bye" || b === "bye") return;
      matchData.push({
        tournamentId,
        round: round + 1,
        position: courtIdx + 1,
        court: courtIdx + 1,
        groupNumber,
        pair1Id: a,
        pair2Id: b,
        winnerId: null,
        completedAt: null,
      });
    });
    rotating.unshift(rotating.pop()!);
  }
  return matchData;
}

export async function assignGroups(tournamentId: string) {
  await requireAdmin();
  const tournament = await db.tournament.findUnique({
    where: { id: tournamentId },
    select: { numGroups: true },
  });
  const numGroups = tournament?.numGroups ?? 1;
  if (numGroups <= 1) throw new Error("Este torneio não tem grupos configurados");

  const registrations = await db.registration.findMany({
    where: { tournamentId, status: "CONFIRMED", player2Id: { not: null } },
    orderBy: { createdAt: "asc" },
  });
  if (registrations.length < numGroups) throw new Error("Duplas insuficientes para distribuir pelos grupos");

  // Shuffle and round-robin assign group numbers
  const shuffled = [...registrations].sort(() => Math.random() - 0.5);
  await db.$transaction(
    shuffled.map((reg, i) =>
      db.registration.update({
        where: { id: reg.id },
        data: { groupNumber: (i % numGroups) + 1 },
      })
    )
  );
  revalidatePath(`/admin/torneios/${tournamentId}`);
}

export async function generateNonStopSchedule(tournamentId: string) {
  await requireAdmin();

  await db.match.deleteMany({ where: { tournamentId } });

  const tournament = await db.tournament.findUnique({
    where: { id: tournamentId },
    select: { durationMinutes: true, totalDurationMinutes: true, numGroups: true },
  });

  const numGroups = tournament?.numGroups ?? 1;

  const allRegs = await db.registration.findMany({
    where: { tournamentId, status: "CONFIRMED" },
    orderBy: { createdAt: "asc" },
  });
  if (allRegs.length < 2) throw new Error("Mínimo 2 duplas confirmadas");

  const maxRoundsFromTime =
    tournament?.durationMinutes && tournament?.totalDurationMinutes
      ? Math.floor(tournament.totalDurationMinutes / tournament.durationMinutes)
      : 999;

  let allMatchData: ReturnType<typeof circleRoundRobin> = [];

  if (numGroups > 1) {
    // Validate all pairs have group assigned
    const unassigned = allRegs.filter((r) => !r.groupNumber);
    if (unassigned.length > 0) throw new Error("Distribui as duplas pelos grupos antes de gerar o schedule");

    for (let g = 1; g <= numGroups; g++) {
      const groupIds = allRegs.filter((r) => r.groupNumber === g).map((r) => r.id);
      if (groupIds.length < 2) throw new Error(`Grupo ${g} tem menos de 2 duplas`);
      allMatchData = allMatchData.concat(circleRoundRobin(groupIds, maxRoundsFromTime, g, tournamentId));
    }
  } else {
    const ids = allRegs.map((r) => r.id);
    allMatchData = circleRoundRobin(ids, maxRoundsFromTime, null, tournamentId);
  }

  await db.match.createMany({ data: allMatchData });
  revalidatePath(`/admin/torneios/${tournamentId}`);
}

function computeGroupStandings(groupMatches: { pair1Id: string | null; pair2Id: string | null; score1: number | null; score2: number | null; completedAt: Date | null }[], regIds: string[]) {
  const totals: Record<string, { wins: number; balance: number }> = {};
  for (const id of regIds) totals[id] = { wins: 0, balance: 0 };
  for (const m of groupMatches.filter((m) => m.completedAt)) {
    if (m.pair1Id && totals[m.pair1Id] !== undefined) {
      totals[m.pair1Id].balance += (m.score1 ?? 0) - (m.score2 ?? 0);
      if ((m.score1 ?? 0) > (m.score2 ?? 0)) totals[m.pair1Id].wins++;
    }
    if (m.pair2Id && totals[m.pair2Id] !== undefined) {
      totals[m.pair2Id].balance += (m.score2 ?? 0) - (m.score1 ?? 0);
      if ((m.score2 ?? 0) > (m.score1 ?? 0)) totals[m.pair2Id].wins++;
    }
  }
  return Object.entries(totals).sort(([, a], [, b]) => b.wins - a.wins || b.balance - a.balance);
}

export async function completeGroupPhase(tournamentId: string) {
  await requireAdmin();
  await db.tournament.update({ where: { id: tournamentId }, data: { groupPhaseComplete: true } });
  revalidatePath(`/admin/torneios/${tournamentId}`);
}

export async function reopenGroupPhase(tournamentId: string) {
  await requireAdmin();
  // Also delete finals matches (groupNumber = 0) so they can be regenerated
  await db.match.deleteMany({ where: { tournamentId, groupNumber: 0 } });
  await db.tournament.update({ where: { id: tournamentId }, data: { groupPhaseComplete: false } });
  revalidatePath(`/admin/torneios/${tournamentId}`);
}

export type BracketEntry = { round: number; roundLabel?: string; position: number; label: string; slot1: string; slot2: string };
export type FinalsBracketTemplate = BracketEntry[];

export async function saveFinalsBracket(tournamentId: string, template: BracketEntry[]) {
  await requireAdmin();
  await db.tournament.update({ where: { id: tournamentId }, data: { finalsTemplate: template } });
  revalidatePath(`/admin/torneios/${tournamentId}`);
}

export async function generateFinals(tournamentId: string) {
  await requireAdmin();
  // Delete all existing finals matches (clean slate for round 1)
  await db.match.deleteMany({ where: { tournamentId, groupNumber: 0 } });

  const tournament = await db.tournament.findUnique({
    where: { id: tournamentId },
    select: { durationMinutes: true, totalDurationMinutes: true, numGroups: true, pairsAdvancing: true, finalsTemplate: true },
  });
  const numGroups = tournament?.numGroups ?? 1;
  const pairsAdvancing = tournament?.pairsAdvancing ?? 0;
  if (pairsAdvancing < 1) throw new Error("Este torneio não tem fase final configurada");

  const [allMatches, allRegs] = await Promise.all([
    db.match.findMany({ where: { tournamentId } }),
    db.registration.findMany({ where: { tournamentId, status: "CONFIRMED" } }),
  ]);

  // Build per-group standings to resolve G-slot keys like "G1R1" → registration ID
  const groupStandings: Record<number, string[]> = {};
  for (let g = 1; g <= numGroups; g++) {
    const groupMatches = allMatches.filter((m) => m.groupNumber === g);
    const groupRegIds = allRegs.filter((r) => r.groupNumber === g).map((r) => r.id);
    groupStandings[g] = computeGroupStandings(groupMatches, groupRegIds).map(([id]) => id);
  }

  function resolveGroupSlot(slot: string): string | null {
    const match = slot.match(/^G(\d+)R(\d+)$/);
    if (!match) return null;
    const g = parseInt(match[1]);
    const r = parseInt(match[2]);
    return groupStandings[g]?.[r - 1] ?? null;
  }

  const template = (tournament?.finalsTemplate ?? null) as BracketEntry[] | null;

  let matchData: { tournamentId: string; round: number; position: number; groupNumber: number; label: string | null; pair1Id: string | null; pair2Id: string | null; winnerId: null; completedAt: null }[] = [];

  if (template && template.length > 0) {
    // Only generate the first round (minimum round number in template)
    const minRound = Math.min(...template.map((e) => e.round));
    const round1Entries = template.filter((e) => e.round === minRound);
    for (const entry of round1Entries) {
      const pair1Id = resolveGroupSlot(entry.slot1);
      const pair2Id = resolveGroupSlot(entry.slot2);
      if (!pair1Id || !pair2Id) throw new Error(`Slot inválido ou dupla não encontrada: ${entry.slot1} / ${entry.slot2}`);
      matchData.push({ tournamentId, round: entry.round, position: entry.position, groupNumber: 0, label: entry.label ?? null, pair1Id, pair2Id, winnerId: null, completedAt: null });
    }
  } else {
    // Fallback: auto round-robin among finalists
    const finalists: string[] = [];
    for (let g = 1; g <= numGroups; g++) {
      finalists.push(...(groupStandings[g] ?? []).slice(0, pairsAdvancing));
    }
    if (finalists.length < 2) throw new Error("Não há finalistas suficientes");
    const maxRoundsFromTime =
      tournament?.durationMinutes && tournament?.totalDurationMinutes
        ? Math.floor(tournament.totalDurationMinutes / tournament.durationMinutes)
        : 999;
    const rr = circleRoundRobin(finalists, maxRoundsFromTime, 0, tournamentId);
    matchData = rr.map(({ court: _c, groupNumber, ...m }) => ({ ...m, groupNumber: groupNumber ?? 0, label: null }));
  }

  await db.match.createMany({ data: matchData });
  revalidatePath(`/admin/torneios/${tournamentId}`);
}

export async function advanceFinalsRound(tournamentId: string, completedRound: number) {
  await requireAdmin();
  const tournament = await db.tournament.findUnique({
    where: { id: tournamentId },
    select: { finalsTemplate: true },
  });
  const template = (tournament?.finalsTemplate ?? null) as BracketEntry[] | null;
  const nextRound = completedRound + 1;
  const nextEntries = template?.filter((e) => e.round === nextRound) ?? [];
  if (nextEntries.length === 0) throw new Error(`Não há partidas configuradas para a ronda ${nextRound}`);

  // Get all completed finals matches to resolve W/L slots
  const prevMatches = await db.match.findMany({
    where: { tournamentId, groupNumber: 0, round: completedRound },
  });
  const incomplete = prevMatches.filter((m) => !m.completedAt);
  if (incomplete.length > 0) throw new Error(`Há ${incomplete.length} partida(s) da ronda anterior sem resultado`);

  function resolveSlot(slot: string): string | null {
    const w = slot.match(/^W(\d+)\.(\d+)$/);
    if (w) {
      const m = prevMatches.find((x) => x.round === parseInt(w[1]) && x.position === parseInt(w[2]));
      return m?.winnerId ?? null;
    }
    const l = slot.match(/^L(\d+)\.(\d+)$/);
    if (l) {
      const m = prevMatches.find((x) => x.round === parseInt(l[1]) && x.position === parseInt(l[2]));
      if (!m) return null;
      if (m.winnerId === m.pair1Id) return m.pair2Id;
      if (m.winnerId === m.pair2Id) return m.pair1Id;
      return null;
    }
    return null;
  }

  await db.match.deleteMany({ where: { tournamentId, groupNumber: 0, round: nextRound } });

  const matchData = [];
  for (const entry of nextEntries) {
    const pair1Id = resolveSlot(entry.slot1);
    const pair2Id = resolveSlot(entry.slot2);
    if (!pair1Id || !pair2Id) throw new Error(`Não foi possível resolver os slots ${entry.slot1} / ${entry.slot2} — verifique se todos os resultados estão preenchidos`);
    matchData.push({ tournamentId, round: entry.round, position: entry.position, groupNumber: 0, label: entry.label ?? null, pair1Id, pair2Id, winnerId: null, completedAt: null });
  }

  await db.match.createMany({ data: matchData });
  revalidatePath(`/admin/torneios/${tournamentId}`);
}

export async function assignSeedNumber(regId: string, seedNumber: number | null) {
  await requireAdmin();
  await db.registration.update({ where: { id: regId }, data: { seedNumber } });
  const reg = await db.registration.findUnique({ where: { id: regId }, select: { tournamentId: true } });
  if (reg) revalidatePath(`/admin/torneios/${reg.tournamentId}`);
}

export async function generateBracket(tournamentId: string) {
  await requireAdmin();
  await db.match.deleteMany({ where: { tournamentId } });

  const tournament = await db.tournament.findUnique({
    where: { id: tournamentId },
    select: { finalsTemplate: true },
  });
  const template = (tournament?.finalsTemplate ?? null) as BracketEntry[] | null;

  const registrations = await db.registration.findMany({
    where: { tournamentId, status: "CONFIRMED" },
    orderBy: [{ seedNumber: "asc" }, { createdAt: "asc" }],
  });
  if (registrations.length < 2) throw new Error("Mínimo 2 inscrições confirmadas");

  const matchData: { tournamentId: string; round: number; position: number; label: string | null; pair1Id: string; pair2Id: string | null; winnerId: string | null; completedAt: Date | null }[] = [];

  if (template && template.length > 0) {
    // Template-based bracket: resolve S{n} slots from registrations by seedNumber
    const minRound = Math.min(...template.map(e => e.round));
    const round1 = template.filter(e => e.round === minRound);

    function resolveSeedSlot(slot: string): string | null {
      const m = slot.match(/^S(\d+)$/);
      if (!m) return null;
      const n = parseInt(m[1]);
      // Find registration with seedNumber=n, fallback to position n-1
      return registrations.find(r => r.seedNumber === n)?.id
        ?? registrations[n - 1]?.id
        ?? null;
    }

    for (const entry of round1) {
      const pair1Id = resolveSeedSlot(entry.slot1);
      const pair2Id = entry.slot2 ? resolveSeedSlot(entry.slot2) : null;
      if (!pair1Id) throw new Error(`Cabeça de chave não encontrada: ${entry.slot1}`);
      const bye = !pair2Id;
      matchData.push({
        tournamentId,
        round: entry.round,
        position: entry.position,
        label: entry.label ?? null,
        pair1Id,
        pair2Id,
        winnerId: bye ? pair1Id : null,
        completedAt: bye ? new Date() : null,
      });
    }
  } else {
    // Auto bracket: pair registrations sequentially
    for (let i = 0; i < registrations.length; i += 2) {
      const pair1 = registrations[i];
      const pair2 = registrations[i + 1] ?? null;
      const bye = pair2 === null;
      matchData.push({
        tournamentId,
        round: 1,
        position: Math.floor(i / 2) + 1,
        label: null,
        pair1Id: pair1.id,
        pair2Id: pair2?.id ?? null,
        winnerId: bye ? pair1.id : null,
        completedAt: bye ? new Date() : null,
      });
    }
  }

  await db.match.createMany({ data: matchData });
  revalidatePath(`/admin/torneios/${tournamentId}`);
  revalidatePath(`/torneios/${tournamentId}`);
}

export async function generateNextRound(tournamentId: string) {
  await requireAdmin();

  const allMatches = await db.match.findMany({ where: { tournamentId }, orderBy: [{ round: "desc" }, { position: "asc" }] });
  const maxRound = allMatches[0]?.round ?? 0;
  const currentRound = allMatches.filter((m) => m.round === maxRound);

  if (currentRound.some((m) => !m.completedAt)) throw new Error("Ainda há matches por concluir neste round");
  if (currentRound.length === 1) throw new Error("Torneio já terminado");

  const winners = currentRound.map((m) => m.winnerId).filter(Boolean) as string[];
  const matches = [];
  for (let i = 0; i < winners.length; i += 2) {
    const bye = !winners[i + 1];
    matches.push({
      tournamentId,
      round: maxRound + 1,
      position: Math.floor(i / 2) + 1,
      pair1Id: winners[i],
      pair2Id: winners[i + 1] ?? null,
      winnerId: bye ? winners[i] : null,
      completedAt: bye ? new Date() : null,
    });
  }

  await db.match.createMany({ data: matches });
  revalidatePath(`/admin/torneios/${tournamentId}`);
  revalidatePath(`/torneios/${tournamentId}`);
}

export async function updateMatchResult(matchId: string, score1: number, score2: number) {
  await requireAdmin();
  const match = await db.match.findUnique({ where: { id: matchId } });
  if (!match) throw new Error("Match não encontrado");
  if (!match.pair2Id) throw new Error("Match com bye não pode ter resultado");

  const winnerId = score1 > score2 ? match.pair1Id : match.pair2Id;
  await db.match.update({
    where: { id: matchId },
    data: { score1, score2, winnerId, completedAt: new Date() },
  });
  revalidatePath(`/admin/torneios/${match.tournamentId}`);
  revalidatePath(`/torneios/${match.tournamentId}`);
}

export async function updateNonStopResult(matchId: string, games1: number, games2: number) {
  await requireAdmin();
  const match = await db.match.findUnique({ where: { id: matchId } });
  if (!match) throw new Error("Match não encontrado");

  const winnerId = games1 > games2 ? match.pair1Id : games2 > games1 ? match.pair2Id : null;
  await db.match.update({
    where: { id: matchId },
    data: { score1: games1, score2: games2, winnerId, completedAt: new Date() },
  });
  revalidatePath(`/admin/torneios/${match.tournamentId}`);
}

export async function resetMatch(matchId: string) {
  await requireAdmin();
  const match = await db.match.findUnique({ where: { id: matchId } });
  if (!match) throw new Error("Match não encontrado");

  // Cannot reset if there's a next round that uses this match's winner
  const nextRoundMatch = await db.match.findFirst({
    where: { tournamentId: match.tournamentId, round: match.round + 1, pair1Id: match.winnerId ?? undefined },
  });
  const nextRoundMatch2 = await db.match.findFirst({
    where: { tournamentId: match.tournamentId, round: match.round + 1, pair2Id: match.winnerId ?? undefined },
  });
  if (nextRoundMatch || nextRoundMatch2) throw new Error("Já existe um round seguinte com este resultado");

  await db.match.update({ where: { id: matchId }, data: { score1: null, score2: null, winnerId: null, completedAt: null } });
  revalidatePath(`/admin/torneios/${match.tournamentId}`);
}

// ── COMMUNITY ─────────────────────────────────────────────────

export async function toggleLike(postId: string) {
  const { userId } = await auth();
  if (!userId) throw new Error("Não autenticado");
  const member = await db.member.findUnique({ where: { clerkId: userId } });
  if (!member) throw new Error("Perfil não encontrado");

  const existing = await db.postLike.findUnique({
    where: { postId_memberId: { postId, memberId: member.id } },
  });
  if (existing) {
    await db.postLike.delete({ where: { id: existing.id } });
  } else {
    await db.postLike.create({ data: { postId, memberId: member.id } });
  }
  revalidatePath("/comunidade");
}

export async function createComment(postId: string, content: string) {
  const { userId } = await auth();
  if (!userId) throw new Error("Não autenticado");
  const member = await db.member.findUnique({ where: { clerkId: userId } });
  if (!member) throw new Error("Perfil não encontrado");
  if (!content.trim()) throw new Error("Comentário vazio");

  await db.comment.create({
    data: { postId, authorId: member.id, content: content.trim() },
  });
  revalidatePath("/comunidade");
}

export async function createPost(content: string, photoUrls: string[] = []) {
  const { userId } = await auth();
  if (!userId) throw new Error("Não autenticado");
  const member = await db.member.findUnique({ where: { clerkId: userId } });
  if (!member) throw new Error("Perfil não encontrado");
  await db.post.create({
    data: {
      authorId: member.id,
      type: "COMMUNITY",
      content,
      photos: photoUrls.length > 0
        ? { create: photoUrls.map((url) => ({ url })) }
        : undefined,
    },
  });
  revalidatePath("/comunidade");
}

export async function createAnnouncement(content: string) {
  const admin = await requireAdmin();
  await db.post.create({
    data: { authorId: admin.id, type: "ANNOUNCEMENT", content },
  });
  revalidatePath("/admin/comunidade");
  revalidatePath("/comunidade");
}

export async function deletePost(id: string) {
  await requireAdmin();
  await db.post.delete({ where: { id } });
  revalidatePath("/admin/comunidade");
  revalidatePath("/comunidade");
}
