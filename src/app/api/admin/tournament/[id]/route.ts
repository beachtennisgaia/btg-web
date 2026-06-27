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
  if (!member || member.role !== "ADMIN") {
    return NextResponse.json({ error: "Sem permissão" }, { status: 403 });
  }

  const { id } = await params;
  const body = await req.json();

  const numericFields = new Set(["maxPairs", "durationMinutes", "totalDurationMinutes", "numGroups", "pairsAdvancing"]);
  const jsonFields = new Set(["finalsTemplate"]);
  const allowed = ["name", "date", "location", "format", "category", "registrationType", "maxPairs", "description", "durationMinutes", "totalDurationMinutes", "numGroups", "pairsAdvancing", "finalsTemplate"];
  const data: Record<string, unknown> = {};
  for (const key of allowed) {
    if (key in body) {
      if (key === "date") data[key] = new Date(body[key] as string);
      else if (numericFields.has(key)) data[key] = body[key] !== "" && body[key] !== null ? Number(body[key]) : null;
      else if (jsonFields.has(key)) {
        const v = body[key];
        data[key] = v ? (typeof v === "string" ? JSON.parse(v) : v) : null;
      }
      else if (key === "description") data[key] = (body[key] as string) || null;
      else data[key] = body[key];
    }
  }

  const tournament = await db.tournament.update({ where: { id }, data: data as never });

  revalidatePath("/admin/torneios");
  revalidatePath(`/admin/torneios/${id}`);
  revalidatePath("/torneios");
  revalidatePath("/");

  return NextResponse.json(tournament);
}
