import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { revalidatePath } from "next/cache";

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Não autenticado" }, { status: 401 });

  const { id: tournamentId } = await params;
  const { partnerId } = await req.json();

  const [member, tournament] = await Promise.all([
    db.member.findUnique({ where: { clerkId: userId } }),
    db.tournament.findUnique({ where: { id: tournamentId } }),
  ]);

  if (!member) return NextResponse.json({ error: "Perfil de sócio não encontrado. Completa o teu perfil primeiro." }, { status: 400 });
  if (!tournament) return NextResponse.json({ error: "Torneio não encontrado" }, { status: 404 });
  if (tournament.status !== "OPEN") return NextResponse.json({ error: "As inscrições para este torneio não estão abertas" }, { status: 400 });

  const currentCount = await db.registration.count({ where: { tournamentId, status: { not: "CANCELLED" } } });
  if (currentCount >= tournament.maxPairs) {
    return NextResponse.json({ error: "Este torneio já atingiu o máximo de inscrições" }, { status: 400 });
  }

  // Check if current user already registered
  const alreadyRegistered = await db.registration.findFirst({
    where: {
      tournamentId,
      status: { not: "CANCELLED" },
      OR: [{ player1Id: member.id }, { player2Id: member.id }],
    },
  });
  if (alreadyRegistered) {
    return NextResponse.json({ error: "Já estás inscrito neste torneio" }, { status: 400 });
  }

  if (partnerId) {
    if (partnerId === member.id) {
      return NextResponse.json({ error: "Não podes inscrever-te contigo próprio" }, { status: 400 });
    }

    const partner = await db.member.findUnique({ where: { id: partnerId } });
    if (!partner) return NextResponse.json({ error: "Parceiro não encontrado" }, { status: 400 });

    // Check if partner has an existing solo registration (no partner yet) — merge into it
    const partnerSoloRegistration = await db.registration.findFirst({
      where: {
        tournamentId,
        status: { not: "CANCELLED" },
        player1Id: partnerId,
        player2Id: null,
      },
    });

    if (partnerSoloRegistration) {
      // Partner registered alone before — complete the pair by adding current user as player2
      const registration = await db.registration.update({
        where: { id: partnerSoloRegistration.id },
        data: { player2Id: member.id },
        include: { player1: true, player2: true },
      });
      revalidatePath("/torneios");
      revalidatePath(`/admin/torneios/${tournamentId}`);
      return NextResponse.json({ ...registration, merged: true });
    }

    // Partner is fully registered with someone else
    const partnerTaken = await db.registration.findFirst({
      where: {
        tournamentId,
        status: { not: "CANCELLED" },
        OR: [{ player1Id: partnerId }, { player2Id: partnerId }],
      },
    });
    if (partnerTaken) {
      return NextResponse.json({ error: `${partner.name} já está inscrito neste torneio` }, { status: 400 });
    }

    // Both free — create new pair registration
    const registration = await db.registration.create({
      data: { tournamentId, player1Id: member.id, player2Id: partnerId, status: "PENDING" },
      include: { player1: true, player2: true },
    });
    revalidatePath("/torneios");
    revalidatePath(`/admin/torneios/${tournamentId}`);
    return NextResponse.json(registration);
  }

  // No partner — individual registration
  const registration = await db.registration.create({
    data: { tournamentId, player1Id: member.id, status: "PENDING" },
    include: { player1: true },
  });
  revalidatePath("/torneios");
  revalidatePath(`/admin/torneios/${tournamentId}`);
  return NextResponse.json(registration);
}
