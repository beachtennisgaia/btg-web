"use client";

import { useState, useTransition } from "react";
import { generateNonStopSchedule, updateNonStopResult, resetBracket, assignGroups } from "@/lib/actions";

type Registration = {
  id: string;
  status: string;
  player1Id: string;
  player2Id: string | null;
  groupNumber: number | null;
  player1: { name: string };
  player2: { name: string } | null;
};

type Match = {
  id: string;
  round: number;
  position: number;
  court: number | null;
  groupNumber: number | null;
  pair1Id: string | null;
  pair2Id: string | null;
  score1: number | null;
  score2: number | null;
  winnerId: string | null;
  completedAt: Date | null;
};

function pairLabel(regId: string | null, regs: Registration[]) {
  if (!regId) return "—";
  const r = regs.find((r) => r.id === regId);
  if (!r) return "?";
  return r.player2 ? `${r.player1.name} / ${r.player2.name}` : r.player1.name;
}

function activeRegs(regs: Registration[]) {
  const player2Ids = new Set(regs.filter((r) => r.player2Id).map((r) => r.player2Id!));
  return regs.filter(
    (r) => r.status === "CONFIRMED" && !(r.player2Id === null && player2Ids.has(r.player1Id))
  );
}

function GameRow({ match, regs }: { match: Match; regs: Registration[] }) {
  const [g1, setG1] = useState(match.score1?.toString() ?? "");
  const [g2, setG2] = useState(match.score2?.toString() ?? "");
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState("");

  const done = !!match.completedAt;
  const pair1 = pairLabel(match.pair1Id, regs);
  const pair2 = pairLabel(match.pair2Id, regs);

  function handleSave() {
    const n1 = parseInt(g1), n2 = parseInt(g2);
    if (isNaN(n1) || isNaN(n2) || n1 < 0 || n2 < 0) { setError("Games inválidos"); return; }
    setError("");
    startTransition(async () => {
      try { await updateNonStopResult(match.id, n1, n2); }
      catch (e) { setError((e as Error).message); }
    });
  }

  function handleReset() {
    startTransition(async () => {
      try {
        await updateNonStopResult(match.id, 0, 0);
        setG1(""); setG2("");
      } catch (e) { setError((e as Error).message); }
    });
  }

  return (
    <tr style={{ borderBottom: "1px solid #f5f5f5" }}>
      <td style={{ padding: "10px 16px", width: 60, textAlign: "center" }}>
        <span style={{ fontSize: 11, fontWeight: 700, background: "#F5C000", color: "#111", borderRadius: 6, padding: "2px 8px" }}>
          Q{match.court ?? match.position}
        </span>
      </td>
      <td style={{ padding: "10px 8px", fontSize: 13, color: done && (match.score1 ?? 0) > (match.score2 ?? 0) ? "#111" : "#555", fontWeight: done && (match.score1 ?? 0) > (match.score2 ?? 0) ? 700 : 400, textAlign: "right", width: "35%" }}>
        {pair1}
      </td>
      <td style={{ padding: "10px 8px", textAlign: "center", minWidth: 110 }}>
        {done ? (
          <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 4 }}>
            <span style={{ fontFamily: "var(--font-oswald), sans-serif", fontSize: 16, fontWeight: 700, color: "#111" }}>
              {match.score1} – {match.score2}
            </span>
            <button onClick={handleReset} disabled={pending} style={{ background: "none", border: "1px solid #eee", borderRadius: 5, padding: "2px 7px", fontSize: 10, color: "#aaa", cursor: "pointer", marginLeft: 4 }}>
              ✎
            </button>
          </div>
        ) : (
          <div style={{ display: "flex", gap: 4, alignItems: "center", justifyContent: "center" }}>
            <input value={g1} onChange={(e) => setG1(e.target.value)} placeholder="0" style={{ width: 38, textAlign: "center", border: "1.5px solid #ddd", borderRadius: 6, padding: "3px 5px", fontSize: 14, fontWeight: 700 }} />
            <span style={{ color: "#ccc", fontSize: 12 }}>–</span>
            <input value={g2} onChange={(e) => setG2(e.target.value)} placeholder="0" style={{ width: 38, textAlign: "center", border: "1.5px solid #ddd", borderRadius: 6, padding: "3px 5px", fontSize: 14, fontWeight: 700 }} />
            <button onClick={handleSave} disabled={pending} style={{ background: "#F5C000", border: "none", borderRadius: 6, padding: "4px 10px", fontSize: 12, fontWeight: 700, color: "#111", cursor: "pointer" }}>
              {pending ? "…" : "✓"}
            </button>
          </div>
        )}
        {error && <div style={{ fontSize: 10, color: "#d32f2f", marginTop: 2 }}>{error}</div>}
      </td>
      <td style={{ padding: "10px 8px", fontSize: 13, color: done && (match.score2 ?? 0) > (match.score1 ?? 0) ? "#111" : "#555", fontWeight: done && (match.score2 ?? 0) > (match.score1 ?? 0) ? 700 : 400, textAlign: "left", width: "35%" }}>
        {pair2}
      </td>
    </tr>
  );
}

function GroupStandings({
  matches,
  regs,
  pairsAdvancing,
  groupLabel,
  noFinals,
}: {
  matches: Match[];
  regs: Registration[];
  pairsAdvancing: number;
  groupLabel: string;
  noFinals: boolean;
}) {
  const totals: Record<string, { gamesFor: number; gamesAgainst: number; wins: number; played: number }> = {};
  for (const r of regs) totals[r.id] = { gamesFor: 0, gamesAgainst: 0, wins: 0, played: 0 };

  for (const m of matches.filter((m) => m.completedAt)) {
    if (m.pair1Id && totals[m.pair1Id] !== undefined) {
      totals[m.pair1Id].gamesFor     += m.score1 ?? 0;
      totals[m.pair1Id].gamesAgainst += m.score2 ?? 0;
      totals[m.pair1Id].played++;
      if ((m.score1 ?? 0) > (m.score2 ?? 0)) totals[m.pair1Id].wins++;
    }
    if (m.pair2Id && totals[m.pair2Id] !== undefined) {
      totals[m.pair2Id].gamesFor     += m.score2 ?? 0;
      totals[m.pair2Id].gamesAgainst += m.score1 ?? 0;
      totals[m.pair2Id].played++;
      if ((m.score2 ?? 0) > (m.score1 ?? 0)) totals[m.pair2Id].wins++;
    }
  }

  const ranked = Object.entries(totals)
    .map(([id, s]) => ({ id, label: pairLabel(id, regs), ...s, balance: s.gamesFor - s.gamesAgainst }))
    .sort((a, b) => b.wins - a.wins || b.balance - a.balance);

  if (ranked.length === 0) return null;

  return (
    <div>
      <div style={{ padding: "8px 16px", background: "#F9F9F9", borderBottom: "1px solid #eee", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <span style={{ fontWeight: 700, fontSize: 12, color: "#555", letterSpacing: "0.06em", textTransform: "uppercase" }}>
          Classificação — {groupLabel}
        </span>
        {noFinals && <span style={{ fontSize: 11, color: "#F5C000", fontWeight: 700 }}>🏆 Sem finais — campeão independente</span>}
        {!noFinals && pairsAdvancing > 0 && (
          <span style={{ fontSize: 11, color: "#888" }}>
            Top {pairsAdvancing} avança{pairsAdvancing === 1 ? "" : "m"}
          </span>
        )}
      </div>
      <table style={{ width: "100%", borderCollapse: "collapse" }}>
        <thead>
          <tr style={{ background: "#F9F9F9" }}>
            {["#", "Dupla", "J", "V", "Saldo"].map((h, idx) => (
              <th key={h} style={{ padding: "7px 16px", fontSize: 11, color: "#888", fontWeight: 700, textAlign: idx > 1 ? "center" : "left" }}>{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {ranked.map((r, i) => {
            const advances = !noFinals && pairsAdvancing > 0 && i < pairsAdvancing;
            const isChampion = noFinals && i === 0;
            return (
              <tr key={r.id} style={{ borderBottom: "1px solid #f5f5f5", background: advances || isChampion ? "#FFFCE8" : undefined }}>
                <td style={{ padding: "9px 16px", fontFamily: "var(--font-oswald), sans-serif", fontSize: 18, fontWeight: 700, color: i === 0 ? "#F5C000" : "#ccc", width: 40 }}>{i + 1}</td>
                <td style={{ padding: "9px 16px", fontSize: 13, fontWeight: i < 3 ? 700 : 400, color: "#111" }}>
                  {r.label}
                  {advances && <span style={{ fontSize: 10, marginLeft: 6, background: "#F5C000", color: "#111", borderRadius: 4, padding: "1px 5px", fontWeight: 700 }}>FINAL</span>}
                  {isChampion && <span style={{ fontSize: 10, marginLeft: 6, background: "#F5C000", color: "#111", borderRadius: 4, padding: "1px 5px", fontWeight: 700 }}>🏆 CAMPEÃO</span>}
                </td>
                <td style={{ padding: "9px 16px", fontSize: 12, textAlign: "center", color: "#555" }}>{r.played}</td>
                <td style={{ padding: "9px 16px", fontSize: 12, textAlign: "center", color: "#555" }}>{r.wins}</td>
                <td style={{ padding: "9px 16px", fontFamily: "var(--font-oswald), sans-serif", fontSize: 15, fontWeight: 700, textAlign: "center", color: r.balance >= 0 ? "#111" : "#d32f2f" }}>
                  {r.balance > 0 ? "+" : ""}{r.balance}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

function GroupSection({
  groupNum,
  matches,
  regs,
  pairsAdvancing,
  durationMinutes,
  noFinals,
}: {
  groupNum: number;
  matches: Match[];
  regs: Registration[];
  pairsAdvancing: number;
  durationMinutes: number | null;
  noFinals: boolean;
}) {
  const groupMatches = matches.filter((m) => m.groupNumber === groupNum);
  const groupRegs = regs.filter((r) => r.groupNumber === groupNum);
  const rounds = [...new Set(groupMatches.map((m) => m.round))].sort((a, b) => a - b);
  const completed = groupMatches.filter((m) => m.completedAt).length;
  const groupLabel = `Grupo ${String.fromCharCode(64 + groupNum)}`; // A, B, C...

  return (
    <div style={{ marginTop: 24, background: "#fff", borderRadius: 16, overflow: "hidden", boxShadow: "0 2px 8px rgba(0,0,0,0.06)" }}>
      <div style={{ background: "#222", padding: "12px 20px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <span style={{ fontFamily: "var(--font-oswald), sans-serif", fontSize: 15, fontWeight: 600, color: "#F5C000", letterSpacing: "0.06em" }}>
          {groupLabel.toUpperCase()}
        </span>
        <span style={{ fontSize: 12, color: "#888" }}>
          {completed}/{groupMatches.length} partidas · {groupRegs.length} duplas
          {durationMinutes ? ` · ${durationMinutes} min/partida` : ""}
        </span>
      </div>

      {groupMatches.length === 0 ? (
        <div style={{ padding: "20px", textAlign: "center", color: "#aaa", fontSize: 13 }}>
          Sem partidas. Gera o schedule acima.
        </div>
      ) : (
        <>
          {rounds.map((round) => (
            <div key={round}>
              <div style={{ padding: "7px 16px", background: "#F9F9F9", borderBottom: "1px solid #eee", borderTop: round > 1 ? "2px solid #eee" : undefined, display: "flex", justifyContent: "space-between" }}>
                <span style={{ fontWeight: 700, fontSize: 11, color: "#555", textTransform: "uppercase", letterSpacing: "0.06em" }}>Ronda {round}</span>
                {durationMinutes && <span style={{ fontSize: 11, color: "#aaa" }}>{durationMinutes} min</span>}
              </div>
              <table style={{ width: "100%", borderCollapse: "collapse" }}>
                <tbody>
                  {groupMatches.filter((m) => m.round === round).map((match) => (
                    <GameRow key={match.id} match={match} regs={regs} />
                  ))}
                </tbody>
              </table>
            </div>
          ))}
          <GroupStandings
            matches={groupMatches}
            regs={groupRegs}
            pairsAdvancing={pairsAdvancing}
            groupLabel={groupLabel}
            noFinals={noFinals}
          />
        </>
      )}
    </div>
  );
}

export function NonStopSection({
  tournamentId,
  matches,
  regs,
  hasConfirmedRegs,
  durationMinutes,
  totalDurationMinutes,
  numGroups,
  pairsAdvancing,
}: {
  tournamentId: string;
  matches: Match[];
  regs: Registration[];
  hasConfirmedRegs: boolean;
  durationMinutes: number | null;
  totalDurationMinutes: number | null;
  numGroups: number | null;
  pairsAdvancing: number | null;
}) {
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState("");

  const active = activeRegs(regs);
  const groups = numGroups && numGroups > 1 ? numGroups : 1;
  const noFinals = pairsAdvancing === 0;
  const advancing = pairsAdvancing ?? 0;

  const totalMatches = matches.filter((m) => m.groupNumber !== 0).length;
  const completedCount = matches.filter((m) => m.completedAt && m.groupNumber !== 0).length;
  const pairsWithGroup = active.filter((r) => r.groupNumber !== null).length;
  const pairsNeedGroup = groups > 1 && pairsWithGroup < active.length;

  function handleAssignGroups() {
    setError("");
    startTransition(async () => {
      try { await assignGroups(tournamentId); }
      catch (e) { setError((e as Error).message); }
    });
  }

  function handleGenerate() {
    setError("");
    startTransition(async () => {
      try { await generateNonStopSchedule(tournamentId); }
      catch (e) { setError((e as Error).message); }
    });
  }

  function handleReset() {
    if (!confirm("Apagar o schedule e recomeçar?")) return;
    setError("");
    startTransition(async () => {
      try { await resetBracket(tournamentId); }
      catch (e) { setError((e as Error).message); }
    });
  }

  return (
    <>
      {/* Header card */}
      <div style={{ background: "#fff", borderRadius: 16, overflow: "hidden", boxShadow: "0 2px 8px rgba(0,0,0,0.06)", marginTop: 24 }}>
        <div style={{ background: "#111", padding: "14px 20px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div>
            <span style={{ fontFamily: "var(--font-oswald), sans-serif", fontSize: 16, fontWeight: 600, color: "#fff", letterSpacing: "0.04em" }}>
              NON-STOP {groups > 1 ? `· ${groups} GRUPOS` : ""}
            </span>
            {totalMatches > 0 && (
              <span style={{ fontSize: 12, color: "#888", marginLeft: 10 }}>
                {completedCount}/{totalMatches} partidas
                {durationMinutes ? ` · ${durationMinutes} min/partida` : ""}
                {totalDurationMinutes ? ` · ${Math.floor(totalDurationMinutes / 60)}h${totalDurationMinutes % 60 > 0 ? `${totalDurationMinutes % 60}min` : ""}` : ""}
              </span>
            )}
          </div>
          <div style={{ display: "flex", gap: 8 }}>
            {/* Step 1: assign groups (if multi-group and not done) */}
            {groups > 1 && pairsNeedGroup && hasConfirmedRegs && (
              <button onClick={handleAssignGroups} disabled={pending} style={{ background: "#F5C000", border: "none", borderRadius: 8, padding: "7px 16px", fontWeight: 700, fontSize: 13, color: "#111", cursor: "pointer" }}>
                {pending ? "A distribuir…" : "🎲 Distribuir grupos"}
              </button>
            )}
            {/* Step 2: generate schedule */}
            {totalMatches === 0 && hasConfirmedRegs && (!pairsNeedGroup) && (
              <button onClick={handleGenerate} disabled={pending} style={{ background: "#F5C000", border: "none", borderRadius: 8, padding: "7px 16px", fontWeight: 700, fontSize: 13, color: "#111", cursor: "pointer" }}>
                {pending ? "A gerar…" : "Gerar Schedule"}
              </button>
            )}
            {totalMatches > 0 && (
              <button onClick={handleReset} disabled={pending} style={{ background: "#F0F0F0", border: "none", borderRadius: 8, padding: "7px 14px", fontWeight: 600, fontSize: 13, color: "#555", cursor: "pointer" }}>
                🔄 Refazer
              </button>
            )}
          </div>
        </div>

        {error && <div style={{ padding: "10px 20px", background: "#FFF3F3", color: "#d32f2f", fontSize: 13 }}>{error}</div>}

        {/* Single pool (no groups) */}
        {groups === 1 && totalMatches === 0 && (
          <div style={{ padding: "32px 20px", textAlign: "center", color: "#aaa", fontSize: 14 }}>
            {hasConfirmedRegs ? "Clica em \"Gerar Schedule\" para criar as rondas." : "Ainda não há duplas confirmadas."}
          </div>
        )}

        {groups === 1 && totalMatches > 0 && (() => {
          const rounds = [...new Set(matches.map((m) => m.round))].sort((a, b) => a - b);
          return rounds.map((round) => (
            <div key={round}>
              <div style={{ padding: "8px 16px", background: "#F9F9F9", borderBottom: "1px solid #eee", borderTop: round > 1 ? "2px solid #eee" : undefined, display: "flex", justifyContent: "space-between" }}>
                <span style={{ fontWeight: 700, fontSize: 12, color: "#555", textTransform: "uppercase", letterSpacing: "0.06em" }}>Ronda {round}</span>
                {durationMinutes && <span style={{ fontSize: 11, color: "#aaa" }}>{durationMinutes} min</span>}
              </div>
              <table style={{ width: "100%", borderCollapse: "collapse" }}>
                <tbody>
                  {matches.filter((m) => m.round === round).map((match) => (
                    <GameRow key={match.id} match={match} regs={regs} />
                  ))}
                </tbody>
              </table>
            </div>
          ));
        })()}

        {/* Group assignment status */}
        {groups > 1 && pairsNeedGroup && totalMatches === 0 && (
          <div style={{ padding: "20px 24px", color: "#888", fontSize: 13, textAlign: "center" }}>
            {pairsWithGroup > 0
              ? `${pairsWithGroup} de ${active.length} duplas com grupo atribuído. Distribui os grupos para continuar.`
              : "Clica em \"Distribuir grupos\" para atribuir as duplas aleatoriamente."}
          </div>
        )}
      </div>

      {/* Single pool standings */}
      {groups === 1 && totalMatches > 0 && (
        <div style={{ background: "#fff", borderRadius: 16, overflow: "hidden", boxShadow: "0 2px 8px rgba(0,0,0,0.06)", marginTop: 24 }}>
          <div style={{ background: "#111", padding: "14px 20px" }}>
            <span style={{ fontFamily: "var(--font-oswald), sans-serif", fontSize: 16, fontWeight: 600, color: "#fff", letterSpacing: "0.04em" }}>CLASSIFICAÇÃO</span>
          </div>
          <GroupStandings matches={matches} regs={active} pairsAdvancing={0} groupLabel="" noFinals={true} />
        </div>
      )}

      {/* Multi-group: one section per group */}
      {groups > 1 && Array.from({ length: groups }, (_, i) => i + 1).map((g) => (
        <GroupSection
          key={g}
          groupNum={g}
          matches={matches}
          regs={active}
          pairsAdvancing={advancing}
          durationMinutes={durationMinutes}
          noFinals={noFinals}
        />
      ))}
    </>
  );
}
