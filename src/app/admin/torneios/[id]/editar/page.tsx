import { db } from "@/lib/db";
import { notFound } from "next/navigation";
import Link from "next/link";
import { EditTournamentForm } from "./edit-form";

export default async function EditarTorneioPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const tournament = await db.tournament.findUnique({ where: { id } });
  if (!tournament) notFound();

  return (
    <div style={{ padding: 32, maxWidth: 640 }}>
      <div style={{ marginBottom: 24 }}>
        <Link href={`/admin/torneios/${id}`} style={{ fontSize: 13, color: "#888", textDecoration: "none" }}>
          ← {tournament.name}
        </Link>
        <h1 style={{ fontFamily: "var(--font-oswald), sans-serif", fontSize: 28, fontWeight: 700, color: "#111", margin: "8px 0 4px" }}>
          EDITAR TORNEIO
        </h1>
        <p style={{ color: "#888", fontSize: 14, margin: 0 }}>
          As alterações ficam visíveis imediatamente no site.
        </p>
      </div>

      <EditTournamentForm tournament={{
        id: tournament.id,
        name: tournament.name,
        date: tournament.date.toISOString().slice(0, 16),
        location: tournament.location,
        format: tournament.format,
        category: tournament.category,
        registrationType: tournament.registrationType,
        maxPairs: tournament.maxPairs,
        description: tournament.description ?? "",
        status: tournament.status,
      }} />
    </div>
  );
}
