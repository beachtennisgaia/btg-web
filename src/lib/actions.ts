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
