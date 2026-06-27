"use client";

import { useState, useTransition } from "react";
import { generateNonStopSchedule, updateNonStopResult, resetBracket } from "@/lib/actions";

type Registration = {
  id: string;
  player1: { name: string };
  player2: { name: string } | null;
};

type Match = {
  id: string;
  round: number;
  position: number;
  court: number | null;
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
        // Reset to null state — call resetMatch instead
      } catch (e) { setError((e as Error).message); }
    });
  }

  return (
    <tr style={{ borderBottom: "1px solid #f5f5f5" }}>
      <td style={{ padding: "10px 16px", width: 70, textAlign: "center" }}>
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

function Standings({ matches, regs }: { matches: Match[]; regs: Registration[] }) {
  const totals: Record<string, { games: number; wins: number; played: number }> = {};

  for (const r of regs.filter((r) => r.player2 !== null || r.player1)) {
    totals[r.id] = { games: 0, wins: 0, played: 0 };
  }

  for (const m of matches.filter((m) => m.completedAt)) {
    if (m.pair1Id && totals[m.pair1Id] !== undefined) {
      totals[m.pair1Id].games += m.score1 ?? 0;
      totals[m.pair1Id].played += 1;
      if ((m.score1 ?? 0) > (m.score2 ?? 0)) totals[m.pair1Id].wins += 1;
    }
    if (m.pair2Id && totals[m.pair2Id] !== undefined) {
      totals[m.pair2Id].games += m.score2 ?? 0;
      totals[m.pair2Id].played += 1;
      if ((m.score2 ?? 0) > (m.score1 ?? 0)) totals[m.pair2Id].wins += 1;
    }
  }

  const ranked = Object.entries(totals)
    .map(([id, s]) => ({ id, label: pairLabel(id, regs), ...s }))
    .sort((a, b) => b.wins - a.wins || b.games - a.games);

  if (ranked.length === 0) return null;

  return (
    <div style={{ marginTop: 24, background: "#fff", borderRadius: 16, overflow: "hidden", boxShadow: "0 2px 8px rgba(0,0,0,0.06)" }}>
      <div style={{ background: "#111", padding: "14px 20px" }}>
        <span style={{ fontFamily: "var(--font-oswald), sans-serif", fontSize: 16, fontWeight: 600, color: "#fff", letterSpacing: "0.04em" }}>
          CLASSIFICAÇÃO
        </span>
      </div>
      <table style={{ width: "100%", borderCollapse: "collapse" }}>
        <thead>
          <tr style={{ background: "#F9F9F9" }}>
            <th style={{ padding: "8px 16px", fontSize: 11, color: "#888", fontWeight: 700, textAlign: "left", width: 40 }}>#</th>
            <th style={{ padding: "8px 16px", fontSize: 11, color: "#888", fontWeight: 700, textAlign: "left" }}>Dupla</th>
            <th style={{ padding: "8px 16px", fontSize: 11, color: "#888", fontWeight: 700, textAlign: "center" }}>J</th>
            <th style={{ padding: "8px 16px", fontSize: 11, color: "#888", fontWeight: 700, textAlign: "center" }}>V</th>
            <th style={{ padding: "8px 16px", fontSize: 11, color: "#888", fontWeight: 700, textAlign: "center" }}>Games</th>
          </tr>
        </thead>
        <tbody>
          {ranked.map((r, i) => (
            <tr key={r.id} style={{ borderBottom: "1px solid #f5f5f5", background: i === 0 ? "#FFFCE8" : undefined }}>
              <td style={{ padding: "10px 16px", fontFamily: "var(--font-oswald), sans-serif", fontSize: 18, fontWeight: 700, color: i === 0 ? "#F5C000" : "#ccc" }}>{i + 1}</td>
              <td style={{ padding: "10px 16px", fontSize: 14, fontWeight: i < 3 ? 700 : 400, color: "#111" }}>{r.label}</td>
              <td style={{ padding: "10px 16px", fontSize: 13, textAlign: "center", color: "#555" }}>{r.played}</td>
              <td style={{ padding: "10px 16px", fontSize: 13, textAlign: "center", color: "#555" }}>{r.wins}</td>
              <td style={{ padding: "10px 16px", fontFamily: "var(--font-oswald), sans-serif", fontSize: 16, fontWeight: 700, textAlign: "center", color: "#111" }}>{r.games}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export function NonStopSection({
  tournamentId,
  matches,
  regs,
  hasConfirmedRegs,
  durationMinutes,
}: {
  tournamentId: string;
  matches: Match[];
  regs: Registration[];
  hasConfirmedRegs: boolean;
  durationMinutes: number | null;
}) {
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState("");

  const courts = Math.floor(regs.filter((r) => r.player2 !== null).length / 2) ||
    Math.floor(matches.reduce((max, m) => Math.max(max, m.court ?? 0), 0));
  const rounds = [...new Set(matches.map((m) => m.round))].sort((a, b) => a - b);
  const completedCount = matches.filter((m) => m.completedAt).length;

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
      <div style={{ background: "#fff", borderRadius: 16, overflow: "hidden", boxShadow: "0 2px 8px rgba(0,0,0,0.06)", marginTop: 24 }}>
        <div style={{ background: "#111", padding: "14px 20px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div>
            <span style={{ fontFamily: "var(--font-oswald), sans-serif", fontSize: 16, fontWeight: 600, color: "#fff", letterSpacing: "0.04em" }}>
              SCHEDULE NON-STOP
            </span>
            {matches.length > 0 && (
              <span style={{ fontSize: 12, color: "#888", marginLeft: 10 }}>
                {completedCount}/{matches.length} partidas · {durationMinutes ?? "?"} min/partida · {courts > 0 ? `${courts} quadras` : ""}
              </span>
            )}
          </div>
          <div style={{ display: "flex", gap: 8 }}>
            {matches.length === 0 && hasConfirmedRegs && (
              <button onClick={handleGenerate} disabled={pending} style={{ background: "#F5C000", border: "none", borderRadius: 8, padding: "7px 16px", fontWeight: 700, fontSize: 13, color: "#111", cursor: "pointer" }}>
                {pending ? "A gerar…" : "Gerar Schedule"}
              </button>
            )}
            {matches.length > 0 && (
              <button onClick={handleReset} disabled={pending} style={{ background: "#F0F0F0", border: "none", borderRadius: 8, padding: "7px 14px", fontWeight: 600, fontSize: 13, color: "#555", cursor: "pointer" }}>
                🔄 Refazer
              </button>
            )}
          </div>
        </div>

        {error && <div style={{ padding: "10px 20px", background: "#FFF3F3", color: "#d32f2f", fontSize: 13 }}>{error}</div>}

        {matches.length === 0 ? (
          <div style={{ padding: "32px 20px", textAlign: "center", color: "#aaa", fontSize: 14 }}>
            {hasConfirmedRegs
              ? "Clica em \"Gerar Schedule\" para criar todas as rondas."
              : "Ainda não há inscrições confirmadas."}
          </div>
        ) : (
          rounds.map((round) => (
            <div key={round}>
              <div style={{ padding: "8px 16px", background: "#F9F9F9", borderBottom: "1px solid #eee", borderTop: round > 1 ? "2px solid #eee" : undefined, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <span style={{ fontWeight: 700, fontSize: 12, color: "#555", letterSpacing: "0.06em", textTransform: "uppercase" }}>
                  Ronda {round}
                </span>
                {durationMinutes && (
                  <span style={{ fontSize: 11, color: "#aaa" }}>{durationMinutes} min</span>
                )}
              </div>
              <table style={{ width: "100%", borderCollapse: "collapse" }}>
                <tbody>
                  {matches.filter((m) => m.round === round).map((match) => (
                    <GameRow key={match.id} match={match} regs={regs} />
                  ))}
                </tbody>
              </table>
            </div>
          ))
        )}
      </div>

      {matches.length > 0 && <Standings matches={matches} regs={regs} />}
    </>
  );
}
