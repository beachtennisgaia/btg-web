import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { notFound } from "next/navigation";
import Link from "next/link";
import { db } from "@/lib/db";
import { PrintButton } from "./print-button";

const CATEGORY_LABEL: Record<string, string> = {
  MIXED: "Duplas Mistas",
  MALE: "Duplas Masculinas",
  FEMALE: "Duplas Femininas",
  OPEN: "Open",
};

const ELIM_ROUND_LABEL: Record<number, string> = {
  1: "Oitavos de Final",
  2: "Quartos de Final",
  3: "Meias-Finais",
  4: "Final",
};

function elimRoundLabel(round: number, totalRounds: number) {
  const fromEnd = totalRounds - round;
  if (fromEnd === 0) return "Final";
  if (fromEnd === 1) return "Meia-Final";
  if (fromEnd === 2) return "Quartos de Final";
  if (fromEnd === 3) return "Oitavos de Final";
  return ELIM_ROUND_LABEL[round] ?? `Ronda ${round}`;
}

export default async function ImprimirTorneioPage({ params }: { params: Promise<{ id: string }> }) {
  const { userId } = await auth();
  if (!userId) redirect("/sign-in");
  const member = await db.member.findUnique({ where: { clerkId: userId } });
  if (!member || member.role !== "ADMIN") redirect("/dashboard");

  const { id } = await params;
  const tournament = await db.tournament.findUnique({
    where: { id },
    include: {
      registrations: {
        where: { status: "CONFIRMED" },
        include: { player1: true, player2: true },
        orderBy: { createdAt: "asc" },
      },
      matches: {
        orderBy: [{ groupNumber: "asc" }, { round: "asc" }, { position: "asc" }],
      },
    },
  });
  if (!tournament) notFound();

  const regMap = new Map(
    tournament.registrations.map((r) => [
      r.id,
      r.player2 ? `${r.player1.name} / ${r.player2.name}` : r.player1.name,
    ])
  );

  const dateStr = new Date(tournament.date).toLocaleDateString("pt-PT", {
    weekday: "long", day: "numeric", month: "long", year: "numeric",
  });
  const printedAt = new Date().toLocaleDateString("pt-PT", { day: "numeric", month: "long", year: "numeric" });

  const isNonStop = tournament.format === "NON_STOP";

  // Group matches: non-stop → by groupNumber then round; elimination → by round
  let sections: { title: string; subtitle?: string; matches: typeof tournament.matches }[] = [];

  if (isNonStop) {
    const groupMatches = tournament.matches.filter((m) => m.groupNumber !== null && m.groupNumber > 0);
    const finalMatches = tournament.matches.filter((m) => m.groupNumber === null || m.groupNumber === 0);

    const groups = [...new Set(groupMatches.map((m) => m.groupNumber!))].sort((a, b) => a - b);
    const numGroups = groups.length || 1;

    if (numGroups <= 1) {
      // Single pool
      const rounds = [...new Set(tournament.matches.map((m) => m.round))].sort((a, b) => a - b);
      for (const round of rounds) {
        sections.push({
          title: `Ronda ${round}`,
          matches: tournament.matches.filter((m) => m.round === round),
        });
      }
    } else {
      // Multiple groups
      for (const g of groups) {
        const gMatches = groupMatches.filter((m) => m.groupNumber === g);
        const rounds = [...new Set(gMatches.map((m) => m.round))].sort((a, b) => a - b);
        for (const round of rounds) {
          sections.push({
            title: `Grupo ${g} · Ronda ${round}`,
            matches: gMatches.filter((m) => m.round === round),
          });
        }
      }
      if (finalMatches.length > 0) {
        const finalRounds = [...new Set(finalMatches.map((m) => m.round))].sort((a, b) => a - b);
        const totalFinalRounds = finalRounds.length;
        for (const round of finalRounds) {
          sections.push({
            title: elimRoundLabel(round, finalRounds[finalRounds.length - 1]),
            subtitle: "Fase Final",
            matches: finalMatches.filter((m) => m.round === round),
          });
        }
        void totalFinalRounds;
      }
    }
  } else {
    const rounds = [...new Set(tournament.matches.map((m) => m.round))].sort((a, b) => a - b);
    const maxRound = rounds[rounds.length - 1] ?? 1;
    for (const round of rounds) {
      sections.push({
        title: elimRoundLabel(round, maxRound),
        matches: tournament.matches.filter((m) => m.round === round),
      });
    }
  }

  return (
    <>
      {/* Print + page styles */}
      <style>{`
        @page { size: landscape; margin: 12mm 16mm; }
        @media print {
          .btg-admin-sidebar,
          .btg-admin-topbar,
          .btg-admin-overlay,
          .print-hide { display: none !important; }
          .btg-admin-layout { display: block !important; }
          .btg-admin-content { background: #fff !important; }
          body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
        }
        .match-score-box {
          display: inline-block;
          width: 44px;
          border-bottom: 2px solid #111;
          text-align: center;
          font-size: 15px;
          font-weight: 700;
          line-height: 1.8;
          color: #111;
        }
        .match-row:last-child td { border-bottom: none; }
      `}</style>

      <div style={{ padding: "24px 32px", maxWidth: 1200, fontFamily: "var(--font-inter), system-ui, sans-serif" }}>

        {/* Screen-only controls */}
        <div className="print-hide" style={{ display: "flex", gap: 12, alignItems: "center", marginBottom: 28 }}>
          <PrintButton />
          <Link href={`/admin/torneios/${id}`} style={{ fontSize: 14, color: "#555", textDecoration: "none" }}>
            ← Voltar ao torneio
          </Link>
          <span style={{ fontSize: 12, color: "#aaa", marginLeft: 8 }}>
            A página será impressa em formato horizontal (paisagem).
          </span>
        </div>

        {/* ── HEADER ── */}
        <header style={{ marginBottom: 20 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
            <div>
              <div style={{ fontFamily: "var(--font-oswald), sans-serif", fontSize: 32, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.04em", color: "#111", lineHeight: 1.1 }}>
                {tournament.name}
              </div>
              <div style={{ fontSize: 13, color: "#555", marginTop: 6, display: "flex", gap: 16 }}>
                <span>{dateStr}</span>
                <span>·</span>
                <span>{tournament.location}</span>
                <span>·</span>
                <span>{CATEGORY_LABEL[tournament.category] ?? tournament.category}</span>
                <span>·</span>
                <span>{isNonStop ? "Non-Stop" : "Eliminatório"}</span>
              </div>
            </div>
            <div style={{ textAlign: "right", flexShrink: 0 }}>
              <div style={{ fontFamily: "var(--font-oswald), sans-serif", fontSize: 22, fontWeight: 700, color: "#111", letterSpacing: "0.08em" }}>
                BTG
              </div>
              <div style={{ fontSize: 11, color: "#888" }}>Beach Tennis Gaia</div>
            </div>
          </div>
          <div style={{ height: 3, background: "#F5C000", marginTop: 12, borderRadius: 2 }} />
        </header>

        {/* ── MATCHES ── */}
        {sections.length === 0 ? (
          <div style={{ padding: "40px 0", textAlign: "center", color: "#aaa", fontSize: 14 }}>
            Sem partidas registadas para este torneio.
          </div>
        ) : (
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0 40px", alignItems: "start" }}>
            {sections.map((section, si) => (
              <div key={si} style={{ marginBottom: 20, breakInside: "avoid" }}>
                {/* Section header */}
                <div style={{ display: "flex", alignItems: "baseline", gap: 8, marginBottom: 6 }}>
                  {section.subtitle && (
                    <span style={{ fontFamily: "var(--font-oswald), sans-serif", fontSize: 10, fontWeight: 700, color: "#F5C000", background: "#111", padding: "1px 7px", borderRadius: 4, letterSpacing: "0.08em", textTransform: "uppercase" }}>
                      {section.subtitle}
                    </span>
                  )}
                  <span style={{ fontFamily: "var(--font-oswald), sans-serif", fontSize: 14, fontWeight: 700, color: "#555", textTransform: "uppercase", letterSpacing: "0.08em" }}>
                    {section.title}
                  </span>
                </div>
                <div style={{ borderBottom: "1.5px solid #e0e0e0", marginBottom: 4 }} />

                <table style={{ width: "100%", borderCollapse: "collapse" }}>
                  <tbody>
                    {section.matches.map((match) => {
                      const p1 = match.pair1Id ? (regMap.get(match.pair1Id) ?? "?") : "—";
                      const p2 = match.pair2Id ? (regMap.get(match.pair2Id) ?? "?") : "—";
                      const score1 = match.score1 !== null && match.score1 !== undefined ? String(match.score1) : "";
                      const score2 = match.score2 !== null && match.score2 !== undefined ? String(match.score2) : "";
                      const done = !!match.completedAt;
                      const p1Won = done && (match.score1 ?? 0) > (match.score2 ?? 0);
                      const p2Won = done && (match.score2 ?? 0) > (match.score1 ?? 0);

                      return (
                        <tr key={match.id} className="match-row" style={{ borderBottom: "1px solid #f5f5f5" }}>
                          {/* Court badge */}
                          <td style={{ width: 36, padding: "7px 6px 7px 0", textAlign: "center", verticalAlign: "middle" }}>
                            <span style={{ fontSize: 10, fontWeight: 700, background: "#F5C000", color: "#111", borderRadius: 4, padding: "2px 5px" }}>
                              Q{match.court ?? match.position}
                            </span>
                          </td>
                          {/* Pair 1 */}
                          <td style={{ padding: "7px 10px 7px 4px", fontSize: 13, textAlign: "right", verticalAlign: "middle", fontWeight: p1Won ? 700 : 400, color: "#111", width: "38%" }}>
                            {p1}
                          </td>
                          {/* Score */}
                          <td style={{ padding: "7px 10px", textAlign: "center", verticalAlign: "middle", whiteSpace: "nowrap" }}>
                            <span className="match-score-box">{score1}</span>
                            <span style={{ margin: "0 6px", color: "#888", fontSize: 13 }}>–</span>
                            <span className="match-score-box">{score2}</span>
                          </td>
                          {/* Pair 2 */}
                          <td style={{ padding: "7px 4px 7px 0", fontSize: 13, textAlign: "left", verticalAlign: "middle", fontWeight: p2Won ? 700 : 400, color: "#111", width: "38%" }}>
                            {p2}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            ))}
          </div>
        )}

        {/* ── FOOTER ── */}
        <footer style={{ marginTop: 32, paddingTop: 10, borderTop: "1px solid #e0e0e0", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <span style={{ fontSize: 10, color: "#aaa" }}>Impresso em {printedAt}</span>
          <span style={{ fontFamily: "var(--font-oswald), sans-serif", fontSize: 13, fontWeight: 700, color: "#111", letterSpacing: "0.06em" }}>
            btgaia.pt
          </span>
        </footer>
      </div>
    </>
  );
}
