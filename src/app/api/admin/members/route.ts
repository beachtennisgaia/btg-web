import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { db } from "@/lib/db";

async function requireAdmin() {
  const { userId } = await auth();
  if (!userId) return null;
  return db.member.findUnique({ where: { clerkId: userId } });
}

export async function GET() {
  const member = await requireAdmin();
  if (!member || member.role !== "ADMIN") return NextResponse.json({ error: "Sem permissão" }, { status: 403 });
  const members = await db.member.findMany({ orderBy: { createdAt: "asc" } });
  return NextResponse.json(members);
}
