import { put, del } from "@vercel/blob";
import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { revalidatePath } from "next/cache";

async function requireAdmin() {
  const { userId } = await auth();
  if (!userId) return null;
  return db.member.findUnique({ where: { clerkId: userId } });
}

export async function GET() {
  const member = await requireAdmin();
  if (!member || member.role !== "ADMIN") return NextResponse.json({ error: "Não autorizado" }, { status: 403 });
  const images = await db.heroImage.findMany({ orderBy: { order: "asc" } });
  return NextResponse.json(images);
}

export async function POST(request: Request) {
  const member = await requireAdmin();
  if (!member || member.role !== "ADMIN") return NextResponse.json({ error: "Não autorizado" }, { status: 403 });

  const formData = await request.formData();
  const file = formData.get("file") as File | null;
  if (!file) return NextResponse.json({ error: "Ficheiro não encontrado" }, { status: 400 });

  const allowed = ["image/jpeg", "image/png", "image/webp"];
  if (!allowed.includes(file.type)) return NextResponse.json({ error: "Apenas JPEG, PNG ou WebP" }, { status: 400 });
  if (file.size > 10 * 1024 * 1024) return NextResponse.json({ error: "Máximo 10 MB" }, { status: 400 });

  const blob = await put(`hero/${Date.now()}-${file.name}`, file, { access: "public" });

  const maxOrder = await db.heroImage.findFirst({ orderBy: { order: "desc" }, select: { order: true } });
  const image = await db.heroImage.create({ data: { url: blob.url, order: (maxOrder?.order ?? -1) + 1 } });

  revalidatePath("/");
  return NextResponse.json(image);
}

export async function PATCH(request: Request) {
  const member = await requireAdmin();
  if (!member || member.role !== "ADMIN") return NextResponse.json({ error: "Não autorizado" }, { status: 403 });

  const { id, active, order } = await request.json();
  const image = await db.heroImage.update({ where: { id }, data: { active, order } });
  revalidatePath("/");
  return NextResponse.json(image);
}

export async function DELETE(request: Request) {
  const member = await requireAdmin();
  if (!member || member.role !== "ADMIN") return NextResponse.json({ error: "Não autorizado" }, { status: 403 });

  const { id } = await request.json();
  const image = await db.heroImage.findUnique({ where: { id } });
  if (!image) return NextResponse.json({ error: "Não encontrada" }, { status: 404 });

  await del(image.url);
  await db.heroImage.delete({ where: { id } });
  revalidatePath("/");
  return NextResponse.json({ ok: true });
}
