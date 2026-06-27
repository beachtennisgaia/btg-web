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

export async function generateNonStopSchedule(tournamentId: string) {
  await requireAdmin();

  await db.match.deleteMany({ where: { tournamentId } });

  const tournament = await db.tournament.findUnique({
    where: { id: tournamentId },
    select: { durationMinutes: true, totalDurationMinutes: true },
  });

  const registrations = await db.registration.findMany({
    where: { tournamentId, status: "CONFIRMED" },
    orderBy: { createdAt: "asc" },
  });
  if (registrations.length < 2) throw new Error("Mínimo 2 duplas confirmadas");

  // Circle method for balanced round-robin
  const ids = registrations.map((r) => r.id);
  if (ids.length % 2 !== 0) ids.push("bye"); // ghost for odd count
  const n = ids.length;
  const fixed = ids[0];
  const rotating = ids.slice(1);
  const courts = n / 2;

  // Limit rounds to what fits in the event duration (or full round-robin if not set)
  const maxPossibleRounds = n - 1;
  const totalRounds =
    tournament?.durationMinutes && tournament?.totalDurationMinutes
      ? Math.min(Math.floor(tournament.totalDurationMinutes / tournament.durationMinutes), maxPossibleRounds)
      : maxPossibleRounds;

  const matchData: {
    tournamentId: string;
    round: number;
    position: number;
    court: number;
    pair1Id: string | null;
    pair2Id: string | null;
    winnerId: null;
    completedAt: null;
  }[] = [];

  for (let round = 0; round < totalRounds; round++) {
    const roundPairs: [string, string][] = [[fixed, rotating[0]]];
    for (let i = 1; i < courts; i++) {
      roundPairs.push([rotating[i], rotating[n - 1 - i]]);
    }

    roundPairs.forEach(([a, b], court) => {
      const hasBye = a === "bye" || b === "bye";
      if (hasBye) return;
      matchData.push({
        tournamentId,
        round: round + 1,
        position: court + 1,
        court: court + 1,
        pair1Id: a,
        pair2Id: b,
        winnerId: null,
        completedAt: null,
      });
    });

    // Rotate: last element comes to front
    rotating.unshift(rotating.pop()!);
  }

  await db.match.createMany({ data: matchData });
  revalidatePath(`/admin/torneios/${tournamentId}`);
}

export async function generateBracket(tournamentId: string) {
  await requireAdmin();

  await db.match.deleteMany({ where: { tournamentId } }); // idempotent reset before generating

  const registrations = await db.registration.findMany({
    where: { tournamentId, status: "CONFIRMED" },
    orderBy: { createdAt: "asc" },
  });
  if (registrations.length < 2) throw new Error("Mínimo 2 inscrições confirmadas");

  const matches: { tournamentId: string; round: number; position: number; pair1Id: string; pair2Id: string | null; winnerId: string | null; completedAt: Date | null }[] = [];
  for (let i = 0; i < registrations.length; i += 2) {
    const pair1 = registrations[i];
    const pair2 = registrations[i + 1] ?? null;
    const bye = pair2 === null;
    matches.push({
      tournamentId,
      round: 1,
      position: Math.floor(i / 2) + 1,
      pair1Id: pair1.id,
      pair2Id: pair2?.id ?? null,
      winnerId: bye ? pair1.id : null,
      completedAt: bye ? new Date() : null,
    });
  }

  await db.match.createMany({ data: matches });
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
