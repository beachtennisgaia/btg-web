import { auth, currentUser } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function POST(req: Request) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const clerkUser = await currentUser();
  const { name, phone, level, gender, privacyAccepted } = await req.json();

  if (!name?.trim()) {
    return NextResponse.json({ error: "Nome obrigatório" }, { status: 400 });
  }
  if (!privacyAccepted) {
    return NextResponse.json({ error: "Tens de aceitar a política de privacidade" }, { status: 400 });
  }

  const email = clerkUser?.emailAddresses[0]?.emailAddress ?? "";

  const member = await db.member.upsert({
    where: { clerkId: userId },
    create: {
      clerkId: userId,
      name: name.trim(),
      email,
      phone: phone?.trim() || null,
      level: level ?? "BEGINNER",
      gender: gender ?? null,
      profileComplete: true,
      privacyAcceptedAt: new Date(),
    },
    update: {
      name: name.trim(),
      phone: phone?.trim() || null,
      level: level ?? "BEGINNER",
      gender: gender ?? null,
      profileComplete: true,
      privacyAcceptedAt: new Date(),
    },
  });

  return NextResponse.json(member);
}
