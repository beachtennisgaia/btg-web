import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { revalidatePath } from "next/cache";

async function requireAdmin() {
  const { userId } = await auth();
  if (!userId) return null;
  return db.member.findUnique({ where: { clerkId: userId } });
}

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const member = await requireAdmin();
  if (!member || member.role !== "ADMIN") return NextResponse.json({ error: "Sem permissão" }, { status: 403 });

  const { id } = await params;
  const data = await req.json();

  const allowed = ["memberNumber", "quotaYear", "role", "level"];
  const filtered = Object.fromEntries(Object.entries(data).filter(([k]) => allowed.includes(k)));

  const updated = await db.member.update({ where: { id }, data: filtered as never });
  revalidatePath("/admin/socios");
  revalidatePath("/ranking");
  return NextResponse.json(updated);
}
