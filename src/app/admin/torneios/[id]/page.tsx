import { db } from "@/lib/db";
import { notFound } from "next/navigation";
import { updateTournamentStatus } from "@/lib/actions";
import Link from "next/link";

const STATUS_LABEL: Record<string, string> = { DRAFT: "Rascunho", OPEN: "Inscrições Abertas", ONGOING: "A Decorrer", FINISHED: "Concluído" };
const NEXT_STATUS: Record<string, string> = { DRAFT: "OPEN", OPEN: "ONGOING", ONGOING: "FINISHED" };
const NEXT_LABEL: Record<string, string> = { DRAFT: "Abrir inscrições", OPEN: "Iniciar torneio", ONGOING: "Marcar concluído" };
const REG_STATUS_LABEL: Record<string, { label: string; bg: string; color: string }> = {
  PENDING:   { label: "Pendente",    bg: "#FFF3B0", color: "#7A5900" },
  CONFIRMED: { label: "Confirmada",  bg: "#E8F5E9", color: "#1a7a1a" },
  CANCELLED: { label: "Cancelada",   bg: "#FFEAEA", color: "#d32f2f" },
};

export default async function TorneioDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const tournament = await db.tournament.findUnique({
    where: { id },
    include: {
      registrations: {
        include: { player1: true, player2: true },
        orderBy: { createdAt: "asc" },
      },
    },
  });

  if (!tournament) notFound();

  const next = NEXT_STATUS[tournament.status];

  return (
    <div style={{ padding: 32, maxWidth: 900 }}>
      <div style={{ marginBottom: 24 }}>
        <Link href="/admin/torneios" style={{ fontSize: 13, color: "#888", textDecoration: "none" }}>← Torneios</Link>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginTop: 8, flexWrap: "wrap", gap: 12 }}>
          <div>
            <h1 style={{ fontFamily: "var(--font-oswald), sans-serif", fontSize: 26, fontWeight: 700, color: "#111", margin: "0 0 4px" }}>{tournament.name.toUpperCase()}</h1>
            <p style={{ color: "#888", fontSize: 14, margin: 0 }}>
              {new Date(tournament.date).toLocaleDateString("pt-PT", { weekday: "long", day: "numeric", month: "long", year: "numeric" })} · {tournament.location}
            </p>
          </div>
          <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
            <span style={{ fontSize: 12, fontWeight: 700, color: "#555", background: "#E0E0E0", padding: "4px 12px", borderRadius: 99 }}>
              {STATUS_LABEL[tournament.status]}
            </span>
            {next && (
              <form action={updateTournamentStatus.bind(null, id, next)}>
                <button type="submit" style={{ background: "#F5C000", color: "#111", fontWeight: 700, padding: "9px 18px", borderRadius: 8, border: "none", fontSize: 13, cursor: "pointer" }}>
                  {NEXT_LABEL[tournament.status]}
                </button>
              </form>
            )}
          </div>
        </div>
      </div>

      {/* Stats row */}
      <div style={{ display: "flex", gap: 12, marginBottom: 24, flexWrap: "wrap" }}>
        {[
          { label: "Inscrições", value: `${tournament.registrations.length} / ${tournament.maxPairs}` },
          { label: "Formato", value: tournament.format === "ELIMINATION" ? "Eliminatório" : "Non-Stop" },
          { label: "Categoria", value: { MIXED: "Mistas", MALE: "Masculino", FEMALE: "Feminino", OPEN: "Open" }[tournament.category] },
          { label: "Vagas restantes", value: Math.max(0, tournament.maxPairs - tournament.registrations.length) },
        ].map(({ label, value }) => (
          <div key={label} style={{ background: "#fff", borderRadius: 12, padding: "14px 20px", boxShadow: "0 1px 6px rgba(0,0,0,0.06)", minWidth: 120 }}>
            <p style={{ fontFamily: "var(--font-oswald), sans-serif", fontSize: 22, fontWeight: 700, color: "#111", margin: 0 }}>{value}</p>
            <p style={{ fontSize: 12, color: "#888", margin: "2px 0 0" }}>{label}</p>
          </div>
        ))}
      </div>

      {/* Registrations */}
      <div style={{ background: "#fff", borderRadius: 16, overflow: "hidden", boxShadow: "0 2px 8px rgba(0,0,0,0.06)" }}>
        <div style={{ background: "#111", padding: "14px 20px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <span style={{ fontFamily: "var(--font-oswald), sans-serif", fontSize: 16, fontWeight: 600, color: "#fff", letterSpacing: "0.04em" }}>
            INSCRIÇÕES ({tournament.registrations.length})
          </span>
        </div>

        {tournament.registrations.length === 0 ? (
          <div style={{ padding: "40px 24px", textAlign: "center" }}>
            <p style={{ fontSize: 14, color: "#888" }}>Sem inscrições ainda.</p>
          </div>
        ) : (
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ background: "#F9F9F9", borderBottom: "1px solid #eee" }}>
                {["#", "Jogador 1", "Jogador 2", "Estado", "Data"].map((h) => (
                  <th key={h} style={{ padding: "10px 16px", textAlign: "left", fontSize: 11, color: "#999", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.06em" }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {tournament.registrations.map((reg, i) => {
                const s = REG_STATUS_LABEL[reg.status];
                return (
                  <tr key={reg.id} style={{ borderBottom: "1px solid #f5f5f5" }}>
                    <td style={{ padding: "12px 16px", color: "#bbb", fontWeight: 600, fontSize: 13 }}>{i + 1}</td>
                    <td style={{ padding: "12px 16px", fontSize: 14, color: "#111", fontWeight: 600 }}>{reg.player1.name}</td>
                    <td style={{ padding: "12px 16px", fontSize: 14, color: "#111" }}>{reg.player2.name}</td>
                    <td style={{ padding: "12px 16px" }}>
                      <span style={{ background: s.bg, color: s.color, fontSize: 11, fontWeight: 700, padding: "3px 8px", borderRadius: 99 }}>{s.label}</span>
                    </td>
                    <td style={{ padding: "12px 16px", fontSize: 12, color: "#888" }}>
                      {new Date(reg.createdAt).toLocaleDateString("pt-PT")}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
