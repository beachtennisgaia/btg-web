import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { revalidatePath } from "next/cache";

async function requireAdmin() {
  const { userId } = await auth();
  if (!userId) return null;
  return db.member.findUnique({ where: { clerkId: userId } });
}

export async function POST(req: Request) {
  const member = await requireAdmin();
  if (!member || member.role !== "ADMIN") {
    return NextResponse.json({ error: "Sem permissão" }, { status: 403 });
  }

  const formData = await req.formData();
  const name = formData.get("name") as string;
  const date = formData.get("date") as string;
  const location = formData.get("location") as string;
  const format = formData.get("format") as string;
  const category = formData.get("category") as string;
  const registrationType = formData.get("registrationType") as string;
  const maxPairs = Number(formData.get("maxPairs"));
  const description = (formData.get("description") as string) || null;

  if (!name || !date || !location) {
    return NextResponse.json({ error: "Campos obrigatórios em falta" }, { status: 400 });
  }

  const tournament = await db.tournament.create({
    data: {
      name,
      date: new Date(date),
      location,
      format: format as never,
      category: category as never,
      registrationType: registrationType as never,
      maxPairs,
      description,
      status: "DRAFT",
    },
  });

  revalidatePath("/admin/torneios");
  revalidatePath("/torneios");

  return NextResponse.json(tournament);
}
