import { db } from "@/lib/db";
import Link from "next/link";
import { updateTournamentStatus } from "@/lib/actions";
import { DeleteTournamentButton } from "./delete-button";
import { DuplicateTournamentButton } from "./duplicate-button";

const STATUS_LABEL: Record<string, { label: string; color: string; bg: string }> = {
  DRAFT:    { label: "Rascunho",   color: "#888", bg: "#F0F0F0" },
  OPEN:     { label: "Inscrições", color: "#7A5900", bg: "#FFF3B0" },
  ONGOING:  { label: "A decorrer", color: "#1a7a1a", bg: "#E8F5E9" },
  FINISHED: { label: "Concluído",  color: "#555", bg: "#EEEEEE" },
};

const NEXT_STATUS: Record<string, string> = {
  DRAFT: "OPEN",
  OPEN: "ONGOING",
  ONGOING: "FINISHED",
};

const NEXT_LABEL: Record<string, string> = {
  DRAFT: "Abrir inscrições",
  OPEN: "Iniciar torneio",
  ONGOING: "Marcar concluído",
};

export default async function AdminTorneiosPage() {
  const tournaments = await db.tournament.findMany({
    orderBy: { date: "desc" },
    include: { _count: { select: { registrations: true } } },
  });

  return (
    <div style={{ padding: 32 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
        <div>
          <h1 style={{ fontFamily: "var(--font-oswald), sans-serif", fontSize: 28, fontWeight: 700, color: "#111", margin: 0 }}>TORNEIOS</h1>
          <p style={{ color: "#888", fontSize: 14, margin: "4px 0 0" }}>{tournaments.length} torneios no total</p>
        </div>
        <Link href="/admin/torneios/novo" style={{ background: "#F5C000", color: "#111", fontWeight: 700, padding: "12px 24px", borderRadius: 9, fontSize: 14, textDecoration: "none" }}>
          + Criar torneio
        </Link>
      </div>

      {tournaments.length === 0 ? (
        <div style={{ background: "#fff", borderRadius: 16, padding: "48px 32px", textAlign: "center", boxShadow: "0 2px 8px rgba(0,0,0,0.06)" }}>
          <p style={{ fontSize: 14, color: "#888" }}>Ainda não há torneios. Cria o primeiro!</p>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {tournaments.map((t) => {
            const s = STATUS_LABEL[t.status];
            const next = NEXT_STATUS[t.status];
            return (
              <div key={t.id} style={{ background: "#fff", borderRadius: 14, padding: "16px 20px", boxShadow: "0 2px 8px rgba(0,0,0,0.06)", display: "flex", alignItems: "center", gap: 16, flexWrap: "wrap" }}>
                <div style={{ flex: 1, minWidth: 200 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 4 }}>
                    <span style={{ background: s.bg, color: s.color, fontSize: 11, fontWeight: 700, padding: "2px 8px", borderRadius: 99 }}>{s.label}</span>
                  </div>
                  <p style={{ fontWeight: 700, fontSize: 15, color: "#111", margin: 0 }}>{t.name}</p>
                  <p style={{ fontSize: 12, color: "#888", margin: "2px 0 0" }}>
                    {new Date(t.date).toLocaleDateString("pt-PT", { day: "numeric", month: "short", year: "numeric" })} · {t.location}
                  </p>
                </div>

                <div style={{ fontSize: 13, color: "#555", textAlign: "center", minWidth: 80 }}>
                  <p style={{ fontWeight: 700, fontSize: 18, color: "#111", margin: 0 }}>{t._count.registrations}/{t.maxPairs}</p>
                  <p style={{ margin: 0 }}>inscrições</p>
                </div>

                <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                  <Link href={`/admin/torneios/${t.id}`} style={{ background: "#F0F0F0", color: "#333", fontWeight: 600, padding: "8px 14px", borderRadius: 7, fontSize: 13, textDecoration: "none" }}>
                    Gerir
                  </Link>
                  {next && (
                    <form action={updateTournamentStatus.bind(null, t.id, next)}>
                      <button type="submit" style={{ background: "#111", color: "#F5C000", fontWeight: 700, padding: "8px 14px", borderRadius: 7, fontSize: 13, border: "none", cursor: "pointer" }}>
                        {NEXT_LABEL[t.status]}
                      </button>
                    </form>
                  )}
                  <DuplicateTournamentButton id={t.id} />
                  {t.status === "DRAFT" && <DeleteTournamentButton id={t.id} />}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
