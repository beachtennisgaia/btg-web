import { Webhook } from "svix";
import { headers } from "next/headers";
import { NextResponse } from "next/server";
import { db } from "@/lib/db";

type ClerkEmailAddress = { email_address: string; id: string };

type ClerkUserPayload = {
  id: string;
  first_name: string | null;
  last_name: string | null;
  email_addresses: ClerkEmailAddress[];
  primary_email_address_id: string | null;
};

function primaryEmail(data: ClerkUserPayload): string {
  const primary = data.email_addresses.find(
    (e) => e.id === data.primary_email_address_id
  );
  return primary?.email_address ?? data.email_addresses[0]?.email_address ?? "";
}

function fullName(data: ClerkUserPayload): string {
  return [data.first_name, data.last_name].filter(Boolean).join(" ").trim() || "Sócio BTG";
}

export async function POST(req: Request) {
  const secret = process.env.CLERK_WEBHOOK_SECRET;
  if (!secret) {
    return NextResponse.json({ error: "CLERK_WEBHOOK_SECRET not set" }, { status: 500 });
  }

  // Verify svix signature
  const headersList = await headers();
  const svixId = headersList.get("svix-id");
  const svixTimestamp = headersList.get("svix-timestamp");
  const svixSignature = headersList.get("svix-signature");

  if (!svixId || !svixTimestamp || !svixSignature) {
    return NextResponse.json({ error: "Missing svix headers" }, { status: 400 });
  }

  const body = await req.text();
  const wh = new Webhook(secret);

  let event: { type: string; data: ClerkUserPayload };
  try {
    event = wh.verify(body, {
      "svix-id": svixId,
      "svix-timestamp": svixTimestamp,
      "svix-signature": svixSignature,
    }) as typeof event;
  } catch {
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  const { type, data } = event;

  if (type === "user.created") {
    await db.member.upsert({
      where: { clerkId: data.id },
      create: {
        clerkId: data.id,
        name: fullName(data),
        email: primaryEmail(data),
      },
      update: {},
    });
  }

  if (type === "user.updated") {
    await db.member.updateMany({
      where: { clerkId: data.id },
      data: {
        email: primaryEmail(data),
      },
    });
  }

  if (type === "user.deleted") {
    // Soft-ignore: não apagamos dados de sócios por GDPR/histórico
    // Futuramente: marcar como inativo
  }

  return NextResponse.json({ received: true });
}
