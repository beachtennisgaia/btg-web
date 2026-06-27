import { db } from "@/lib/db";
import { notFound } from "next/navigation";
import { updateTournamentStatus } from "@/lib/actions";
import Link from "next/link";
import { RegistrationsTable } from "./registrations-table";
import { MatchesSection } from "./matches-section";
import { NonStopSection } from "./non-stop-section";
import { DrawSection } from "./draw-section";

const STATUS_LABEL: Record<string, string> = { DRAFT: "Rascunho", OPEN: "Inscrições Abertas", ONGOING: "A Decorrer", FINISHED: "Concluído" };
const NEXT_STATUS: Record<string, string> = { DRAFT: "OPEN", OPEN: "ONGOING", ONGOING: "FINISHED" };
const NEXT_LABEL: Record<string, string> = { DRAFT: "Abrir inscrições", OPEN: "Iniciar torneio", ONGOING: "Marcar concluído" };

export default async function TorneioDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const tournament = await db.tournament.findUnique({
    where: { id },
    include: {
      registrations: {
        include: { player1: true, player2: true },
        orderBy: { createdAt: "asc" },
      },
      matches: {
        orderBy: [{ round: "asc" }, { position: "asc" }],
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
          <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
            <span style={{ fontSize: 12, fontWeight: 700, color: "#555", background: "#E0E0E0", padding: "4px 12px", borderRadius: 99 }}>
              {STATUS_LABEL[tournament.status]}
            </span>
            <Link href={`/admin/torneios/${id}/editar`} style={{ background: "#F0F0F0", color: "#333", fontWeight: 600, padding: "9px 18px", borderRadius: 8, fontSize: 13, textDecoration: "none" }}>
              Editar
            </Link>
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
      {(() => {
        // Exclude solo registrations absorbed into pairs by the draw
        const player2Ids = new Set(tournament.registrations.filter(r => r.player2Id).map(r => r.player2Id!));
        const activeRegs = tournament.registrations.filter(
          r => !(r.status === "CANCELLED" && !r.player2Id && player2Ids.has(r.player1Id))
        );
        const activeCount = activeRegs.filter(r => r.status !== "CANCELLED").length;
        return (
      <div style={{ display: "flex", gap: 12, marginBottom: 24, flexWrap: "wrap" }}>
        {[
          { label: "Inscrições", value: `${activeCount} / ${tournament.maxPairs}` },
          { label: "Formato", value: tournament.format === "ELIMINATION" ? "Eliminatório" : "Non-Stop" },
          { label: "Categoria", value: { MIXED: "Mistas", MALE: "Masculino", FEMALE: "Feminino", OPEN: "Open" }[tournament.category] },
          { label: "Vagas restantes", value: Math.max(0, tournament.maxPairs - activeCount) },
        ].map(({ label, value }) => (
          <div key={label} style={{ background: "#fff", borderRadius: 12, padding: "14px 20px", boxShadow: "0 1px 6px rgba(0,0,0,0.06)", minWidth: 120 }}>
            <p style={{ fontFamily: "var(--font-oswald), sans-serif", fontSize: 22, fontWeight: 700, color: "#111", margin: 0 }}>{value}</p>
            <p style={{ fontSize: 12, color: "#888", margin: "2px 0 0" }}>{label}</p>
          </div>
        ))}
      </div>
        );
      })()}

      {/* Registrations */}
      <div style={{ background: "#fff", borderRadius: 16, overflow: "hidden", boxShadow: "0 2px 8px rgba(0,0,0,0.06)" }}>
        <div style={{ background: "#111", padding: "14px 20px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <span style={{ fontFamily: "var(--font-oswald), sans-serif", fontSize: 16, fontWeight: 600, color: "#fff", letterSpacing: "0.04em" }}>
            INSCRIÇÕES ({tournament.registrations.length})
          </span>
        </div>
        <RegistrationsTable
          registrations={tournament.registrations}
          tournamentStatus={tournament.status}
        />
      </div>

      {/* Draw — only for individual registration tournaments */}
      {tournament.registrationType === "INDIVIDUAL" && (() => {
        const soloCount = tournament.registrations.filter(
          (r) => r.status !== "CANCELLED" && r.player2Id === null
        ).length;
        return soloCount >= 2 ? (
          <DrawSection
            tournamentId={id}
            soloCount={soloCount}
            isMixed={tournament.category === "MIXED"}
          />
        ) : null;
      })()}

      {/* Matches / Bracket or Non-Stop Schedule */}
      {(tournament.status === "ONGOING" || tournament.status === "FINISHED") && (
        tournament.format === "NON_STOP" ? (
          <NonStopSection
            tournamentId={id}
            matches={tournament.matches}
            regs={tournament.registrations}
            hasConfirmedRegs={tournament.registrations.some((r) => r.status === "CONFIRMED")}
            durationMinutes={tournament.durationMinutes}
            totalDurationMinutes={tournament.totalDurationMinutes}
            numGroups={tournament.numGroups}
            pairsAdvancing={tournament.pairsAdvancing}
          />
        ) : (
          <MatchesSection
            tournamentId={id}
            matches={tournament.matches}
            regs={tournament.registrations}
            hasConfirmedRegs={tournament.registrations.some((r) => r.status === "CONFIRMED")}
          />
        )
      )}
    </div>
  );
}
