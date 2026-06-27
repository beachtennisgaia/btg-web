import { auth, currentUser } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function POST(req: Request) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const clerkUser = await currentUser();
  const { name, phone, level } = await req.json();

  if (!name?.trim()) {
    return NextResponse.json({ error: "Nome obrigatório" }, { status: 400 });
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
      profileComplete: true,
    },
    update: {
      name: name.trim(),
      phone: phone?.trim() || null,
      level: level ?? "BEGINNER",
      profileComplete: true,
    },
  });

  return NextResponse.json(member);
}
