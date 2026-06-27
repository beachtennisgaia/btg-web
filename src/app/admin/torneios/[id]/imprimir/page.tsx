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

function elimRoundLabel(round: number, maxRound: number) {
  const fromEnd = maxRound - round;
  if (fromEnd === 0) return "Final";
  if (fromEnd === 1) return "Meia-Final";
  if (fromEnd === 2) return "Quartos de Final";
  if (fromEnd === 3) return "Oitavos de Final";
  return `Ronda ${round}`;
}

type PairStat = {
  regId: string;
  label: string;
  groupNumber: number | null;
  played: number;
  wins: number;
  losses: number;
  ptFor: number;
  ptAgainst: number;
};

function computeStandings(
  regs: { id: string; player1: { name: string }; player2: { name: string } | null; groupNumber: number | null }[],
  matches: { pair1Id: string | null; pair2Id: string | null; score1: number | null; score2: number | null; completedAt: Date | null; groupNumber: number | null }[]
): PairStat[] {
  const stats = new Map<string, PairStat>();

  for (const r of regs) {
    stats.set(r.id, {
      regId: r.id,
      label: r.player2 ? `${r.player1.name} / ${r.player2.name}` : r.player1.name,
      groupNumber: r.groupNumber,
      played: 0, wins: 0, losses: 0, ptFor: 0, ptAgainst: 0,
    });
  }

  for (const m of matches) {
    if (!m.completedAt || m.score1 === null || m.score2 === null) continue;
    if (!m.pair1Id || !m.pair2Id) continue;

    const s1 = stats.get(m.pair1Id);
    const s2 = stats.get(m.pair2Id);

    if (s1) {
      s1.played++;
      s1.ptFor += m.score1;
      s1.ptAgainst += m.score2;
      if (m.score1 > m.score2) s1.wins++; else s1.losses++;
    }
    if (s2) {
      s2.played++;
      s2.ptFor += m.score2;
      s2.ptAgainst += m.score1;
      if (m.score2 > m.score1) s2.wins++; else s2.losses++;
    }
  }

  return [...stats.values()].sort((a, b) => {
    if (b.wins !== a.wins) return b.wins - a.wins;
    const balA = a.ptFor - a.ptAgainst;
    const balB = b.ptFor - b.ptAgainst;
    return balB - balA;
  });
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

  // ── Build match sections ──────────────────────────────────────
  const sections: { title: string; subtitle?: string; matches: typeof tournament.matches }[] = [];

  if (isNonStop) {
    const groupMatches = tournament.matches.filter((m) => m.groupNumber !== null && m.groupNumber > 0);
    const finalMatches  = tournament.matches.filter((m) => m.groupNumber === null || m.groupNumber === 0);
    const groups = [...new Set(groupMatches.map((m) => m.groupNumber!))].sort((a, b) => a - b);

    if (groups.length <= 1) {
      const rounds = [...new Set(tournament.matches.map((m) => m.round))].sort((a, b) => a - b);
      for (const round of rounds) {
        sections.push({ title: `Ronda ${round}`, matches: tournament.matches.filter((m) => m.round === round) });
      }
    } else {
      for (const g of groups) {
        const gm = groupMatches.filter((m) => m.groupNumber === g);
        const rounds = [...new Set(gm.map((m) => m.round))].sort((a, b) => a - b);
        for (const round of rounds) {
          sections.push({ title: `Grupo ${g} · Ronda ${round}`, matches: gm.filter((m) => m.round === round) });
        }
      }
      if (finalMatches.length > 0) {
        const fr = [...new Set(finalMatches.map((m) => m.round))].sort((a, b) => a - b);
        const maxFR = fr[fr.length - 1];
        for (const round of fr) {
          sections.push({ title: elimRoundLabel(round, maxFR), subtitle: "Fase Final", matches: finalMatches.filter((m) => m.round === round) });
        }
      }
    }
  } else {
    const rounds = [...new Set(tournament.matches.map((m) => m.round))].sort((a, b) => a - b);
    const maxRound = rounds[rounds.length - 1] ?? 1;
    for (const round of rounds) {
      sections.push({ title: elimRoundLabel(round, maxRound), matches: tournament.matches.filter((m) => m.round === round) });
    }
  }

  // ── Build standings per group ─────────────────────────────────
  const allRegsForStats = tournament.registrations.map((r) => ({
    id: r.id, player1: r.player1, player2: r.player2 ?? null, groupNumber: r.groupNumber,
  }));

  // Determine groups for standings display
  const groupNumbers = isNonStop
    ? [...new Set(tournament.registrations.map((r) => r.groupNumber))].filter((g) => g !== null).sort() as number[]
    : [];

  const hasMultipleGroups = groupNumbers.length > 1;

  // Standings per group (or one block for single pool / elimination)
  type StandingBlock = { title: string; rows: PairStat[] };
  const standingBlocks: StandingBlock[] = [];

  if (hasMultipleGroups) {
    for (const g of groupNumbers) {
      const groupRegs = allRegsForStats.filter((r) => r.groupNumber === g);
      const groupMatchesStat = tournament.matches.filter((m) => m.groupNumber === g);
      standingBlocks.push({ title: `Grupo ${g}`, rows: computeStandings(groupRegs, groupMatchesStat) });
    }
  } else {
    // single pool non-stop or elimination — use all group matches (exclude finals for non-stop)
    const matchesForStats = isNonStop
      ? tournament.matches.filter((m) => m.groupNumber !== null && m.groupNumber !== 0)
      : tournament.matches;
    standingBlocks.push({ title: "Classificação Geral", rows: computeStandings(allRegsForStats, matchesForStats) });
  }

  const anyCompleted = tournament.matches.some((m) => m.completedAt);

  const thStyle: React.CSSProperties = { padding: "7px 12px", fontSize: 10, fontWeight: 700, color: "#888", textTransform: "uppercase" as const, letterSpacing: "0.07em", textAlign: "left" as const, borderBottom: "2px solid #e0e0e0" };
  const tdStyle: React.CSSProperties = { padding: "8px 12px", fontSize: 13, borderBottom: "1px solid #f5f5f5" };

  return (
    <>
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
          .print-only { display: block !important; }
          .print-page-break { page-break-before: always; }
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
        .print-only { display: none; }
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
            A página será impressa em formato horizontal (paisagem). A tabela de classificação aparece apenas na impressão.
          </span>
        </div>

        {/* ── HEADER ── */}
        <header style={{ marginBottom: 20 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
            <div>
              <div style={{ fontFamily: "var(--font-oswald), sans-serif", fontSize: 32, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.04em", color: "#111", lineHeight: 1.1 }}>
                {tournament.name}
              </div>
              <div style={{ fontSize: 13, color: "#555", marginTop: 6, display: "flex", gap: 16, flexWrap: "wrap" }}>
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
              <div style={{ fontFamily: "var(--font-oswald), sans-serif", fontSize: 22, fontWeight: 700, color: "#111", letterSpacing: "0.08em" }}>BTG</div>
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
                      const done   = !!match.completedAt;
                      const p1Won  = done && (match.score1 ?? 0) > (match.score2 ?? 0);
                      const p2Won  = done && (match.score2 ?? 0) > (match.score1 ?? 0);
                      return (
                        <tr key={match.id} className="match-row" style={{ borderBottom: "1px solid #f5f5f5" }}>
                          <td style={{ width: 36, padding: "7px 6px 7px 0", textAlign: "center", verticalAlign: "middle" }}>
                            <span style={{ fontSize: 10, fontWeight: 700, background: "#F5C000", color: "#111", borderRadius: 4, padding: "2px 5px" }}>
                              Q{match.court ?? match.position}
                            </span>
                          </td>
                          <td style={{ padding: "7px 10px 7px 4px", fontSize: 13, textAlign: "right", verticalAlign: "middle", fontWeight: p1Won ? 700 : 400, color: "#111", width: "38%" }}>
                            {p1}
                          </td>
                          <td style={{ padding: "7px 10px", textAlign: "center", verticalAlign: "middle", whiteSpace: "nowrap" }}>
                            <span className="match-score-box">{score1}</span>
                            <span style={{ margin: "0 6px", color: "#888", fontSize: 13 }}>–</span>
                            <span className="match-score-box">{score2}</span>
                          </td>
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

        {/* ── STANDINGS — print only ── */}
        {standingBlocks.some((b) => b.rows.length > 0) && (
          <div className="print-only print-page-break" style={{ marginTop: 32 }}>
            {/* Repeat header on standings page */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
              <div style={{ fontFamily: "var(--font-oswald), sans-serif", fontSize: 18, fontWeight: 700, color: "#111", textTransform: "uppercase", letterSpacing: "0.04em" }}>
                {tournament.name} — Classificação
              </div>
              <div style={{ fontFamily: "var(--font-oswald), sans-serif", fontSize: 13, fontWeight: 700, color: "#111", letterSpacing: "0.06em" }}>BTG</div>
            </div>
            <div style={{ height: 3, background: "#F5C000", borderRadius: 2, marginBottom: 24 }} />

            <div style={{ display: "grid", gridTemplateColumns: hasMultipleGroups ? "repeat(auto-fit, minmax(340px, 1fr))" : "1fr", gap: "0 48px", alignItems: "start" }}>
              {standingBlocks.map((block) => (
                <div key={block.title} style={{ marginBottom: 32, breakInside: "avoid" }}>
                  {standingBlocks.length > 1 && (
                    <div style={{ fontFamily: "var(--font-oswald), sans-serif", fontSize: 14, fontWeight: 700, color: "#555", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 8 }}>
                      {block.title}
                    </div>
                  )}

                  <table style={{ width: "100%", borderCollapse: "collapse" }}>
                    <thead>
                      <tr style={{ background: "#F9F9F9" }}>
                        <th style={{ ...thStyle, width: 32, textAlign: "center" }}>#</th>
                        <th style={{ ...thStyle }}>Dupla</th>
                        <th style={{ ...thStyle, textAlign: "center" as const, width: 48 }}>J</th>
                        <th style={{ ...thStyle, textAlign: "center" as const, width: 48 }}>V</th>
                        <th style={{ ...thStyle, textAlign: "center" as const, width: 48 }}>D</th>
                        <th style={{ ...thStyle, textAlign: "center" as const, width: 72 }}>Pontos</th>
                        <th style={{ ...thStyle, textAlign: "center" as const, width: 72 }}>Saldo</th>
                      </tr>
                    </thead>
                    <tbody>
                      {block.rows.map((row, i) => {
                        const balance = row.ptFor - row.ptAgainst;
                        const isFirst = i === 0 && anyCompleted;
                        return (
                          <tr key={row.regId} style={{ background: i % 2 === 0 ? "#fff" : "#FAFAFA" }}>
                            <td style={{ ...tdStyle, textAlign: "center", fontFamily: "var(--font-oswald), sans-serif", fontSize: 16, fontWeight: 700, color: isFirst ? "#F5C000" : "#ccc" }}>
                              {i + 1}
                            </td>
                            <td style={{ ...tdStyle, fontWeight: i < 3 ? 700 : 400 }}>{row.label}</td>
                            <td style={{ ...tdStyle, textAlign: "center", color: "#555" }}>{row.played}</td>
                            <td style={{ ...tdStyle, textAlign: "center", fontWeight: 700, color: row.wins > 0 ? "#1a7a1a" : "#ccc" }}>{row.wins}</td>
                            <td style={{ ...tdStyle, textAlign: "center", color: row.losses > 0 ? "#d32f2f" : "#ccc" }}>{row.losses}</td>
                            <td style={{ ...tdStyle, textAlign: "center", fontFamily: "var(--font-oswald), sans-serif", fontSize: 15, fontWeight: 700 }}>{row.ptFor}</td>
                            <td style={{ ...tdStyle, textAlign: "center", fontFamily: "var(--font-oswald), sans-serif", fontSize: 15, fontWeight: 700, color: balance >= 0 ? "#111" : "#d32f2f" }}>
                              {balance > 0 ? `+${balance}` : balance}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>

                  <div style={{ fontSize: 10, color: "#aaa", marginTop: 6 }}>
                    J = Jogos disputados · V = Vitórias · D = Derrotas · Pontos = games ganhos · Saldo = games ganhos − perdidos
                  </div>
                </div>
              ))}
            </div>
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
