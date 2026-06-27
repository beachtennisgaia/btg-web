"use client";

import { useState, useTransition } from "react";
import { generateBracket, generateNextRound, updateMatchResult, resetMatch } from "@/lib/actions";

type Registration = {
  id: string;
  player1: { name: string };
  player2: { name: string } | null;
};

type Match = {
  id: string;
  round: number;
  position: number;
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

function MatchRow({ match, regs, tournamentId }: { match: Match; regs: Registration[]; tournamentId: string }) {
  const [s1, setS1] = useState(match.score1?.toString() ?? "");
  const [s2, setS2] = useState(match.score2?.toString() ?? "");
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState("");

  const isBye = !match.pair2Id;
  const done = !!match.completedAt;
  const pair1 = pairLabel(match.pair1Id, regs);
  const pair2 = pairLabel(match.pair2Id, regs);
  const winner = pairLabel(match.winnerId, regs);

  function handleSave() {
    const n1 = parseInt(s1), n2 = parseInt(s2);
    if (isNaN(n1) || isNaN(n2) || n1 < 0 || n2 < 0) { setError("Scores inválidos"); return; }
    if (n1 === n2) { setError("Não pode haver empate"); return; }
    setError("");
    startTransition(async () => {
      try { await updateMatchResult(match.id, n1, n2); }
      catch (e) { setError((e as Error).message); }
    });
  }

  function handleReset() {
    startTransition(async () => {
      try { await resetMatch(match.id); setS1(""); setS2(""); }
      catch (e) { setError((e as Error).message); }
    });
  }

  return (
    <tr style={{ borderBottom: "1px solid #f5f5f5" }}>
      <td style={{ padding: "12px 16px", fontSize: 13, color: "#888", fontWeight: 600 }}>
        R{match.round} · J{match.position}
      </td>
      <td style={{ padding: "12px 16px", fontSize: 14, color: done && match.winnerId === match.pair1Id ? "#111" : "#555", fontWeight: done && match.winnerId === match.pair1Id ? 700 : 400 }}>
        {pair1} {done && match.winnerId === match.pair1Id && "🏆"}
      </td>
      <td style={{ padding: "12px 16px", textAlign: "center" }}>
        {isBye ? (
          <span style={{ fontSize: 12, color: "#aaa" }}>BYE</span>
        ) : done ? (
          <span style={{ fontFamily: "var(--font-oswald), sans-serif", fontSize: 18, fontWeight: 700, color: "#111" }}>
            {match.score1} – {match.score2}
          </span>
        ) : (
          <div style={{ display: "flex", gap: 6, alignItems: "center", justifyContent: "center" }}>
            <input value={s1} onChange={(e) => setS1(e.target.value)} placeholder="0" style={{ width: 42, textAlign: "center", border: "1.5px solid #ddd", borderRadius: 6, padding: "4px 6px", fontSize: 14, fontWeight: 700 }} />
            <span style={{ color: "#bbb" }}>–</span>
            <input value={s2} onChange={(e) => setS2(e.target.value)} placeholder="0" style={{ width: 42, textAlign: "center", border: "1.5px solid #ddd", borderRadius: 6, padding: "4px 6px", fontSize: 14, fontWeight: 700 }} />
          </div>
        )}
      </td>
      <td style={{ padding: "12px 16px", fontSize: 14, color: done && match.winnerId === match.pair2Id ? "#111" : "#555", fontWeight: done && match.winnerId === match.pair2Id ? 700 : 400 }}>
        {isBye ? <span style={{ color: "#bbb" }}>—</span> : <>{pair2} {done && match.winnerId === match.pair2Id && "🏆"}</>}
      </td>
      <td style={{ padding: "12px 16px", textAlign: "right" }}>
        {isBye ? null : done ? (
          <button onClick={handleReset} disabled={pending} style={{ background: "none", border: "1.5px solid #eee", borderRadius: 6, padding: "4px 10px", fontSize: 12, color: "#888", cursor: "pointer" }}>
            Corrigir
          </button>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 4 }}>
            <button onClick={handleSave} disabled={pending} style={{ background: "#F5C000", border: "none", borderRadius: 6, padding: "5px 14px", fontSize: 13, fontWeight: 700, color: "#111", cursor: "pointer" }}>
              {pending ? "…" : "Guardar"}
            </button>
            {error && <span style={{ fontSize: 11, color: "#d32f2f" }}>{error}</span>}
          </div>
        )}
      </td>
    </tr>
  );
}

export function MatchesSection({
  tournamentId,
  matches,
  regs,
  hasConfirmedRegs,
}: {
  tournamentId: string;
  matches: Match[];
  regs: Registration[];
  hasConfirmedRegs: boolean;
}) {
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState("");

  const rounds = [...new Set(matches.map((m) => m.round))].sort((a, b) => a - b);
  const maxRound = rounds[rounds.length - 1] ?? 0;
  const currentRoundMatches = matches.filter((m) => m.round === maxRound);
  const allDone = currentRoundMatches.length > 0 && currentRoundMatches.every((m) => !!m.completedAt);
  const isFinal = currentRoundMatches.length === 1;

  function handleGenerate() {
    setError("");
    startTransition(async () => {
      try { await generateBracket(tournamentId); }
      catch (e) { setError((e as Error).message); }
    });
  }

  function handleNextRound() {
    setError("");
    startTransition(async () => {
      try { await generateNextRound(tournamentId); }
      catch (e) { setError((e as Error).message); }
    });
  }

  return (
    <div style={{ background: "#fff", borderRadius: 16, overflow: "hidden", boxShadow: "0 2px 8px rgba(0,0,0,0.06)", marginTop: 24 }}>
      <div style={{ background: "#111", padding: "14px 20px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <span style={{ fontFamily: "var(--font-oswald), sans-serif", fontSize: 16, fontWeight: 600, color: "#fff", letterSpacing: "0.04em" }}>
          RESULTADOS {matches.length > 0 && `(${matches.filter((m) => m.completedAt).length}/${matches.length})`}
        </span>
        {matches.length === 0 && hasConfirmedRegs && (
          <button onClick={handleGenerate} disabled={pending} style={{ background: "#F5C000", border: "none", borderRadius: 8, padding: "7px 16px", fontWeight: 700, fontSize: 13, color: "#111", cursor: "pointer" }}>
            {pending ? "A gerar…" : "Gerar Bracket"}
          </button>
        )}
        {allDone && !isFinal && (
          <button onClick={handleNextRound} disabled={pending} style={{ background: "#F5C000", border: "none", borderRadius: 8, padding: "7px 16px", fontWeight: 700, fontSize: 13, color: "#111", cursor: "pointer" }}>
            {pending ? "A gerar…" : "Gerar Round Seguinte →"}
          </button>
        )}
        {allDone && isFinal && (
          <span style={{ fontSize: 13, fontWeight: 700, color: "#F5C000" }}>🏆 Torneio concluído</span>
        )}
      </div>

      {error && (
        <div style={{ padding: "10px 20px", background: "#FFF3F3", color: "#d32f2f", fontSize: 13 }}>{error}</div>
      )}

      {matches.length === 0 ? (
        <div style={{ padding: "32px 20px", textAlign: "center", color: "#aaa", fontSize: 14 }}>
          {hasConfirmedRegs
            ? 'Clica em "Gerar Bracket" para criar os matches do Round 1.'
            : "Ainda não há inscrições confirmadas."}
        </div>
      ) : (
        rounds.map((round) => (
          <div key={round}>
            <div style={{ padding: "10px 16px", background: "#F9F9F9", borderBottom: "1px solid #eee", borderTop: round > 1 ? "2px solid #eee" : undefined }}>
              <span style={{ fontWeight: 700, fontSize: 12, color: "#555", letterSpacing: "0.06em", textTransform: "uppercase" }}>
                {isFinal && round === maxRound ? "🏆 Final" : `Round ${round}`}
              </span>
            </div>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <tbody>
                {matches.filter((m) => m.round === round).map((match) => (
                  <MatchRow key={match.id} match={match} regs={regs} tournamentId={tournamentId} />
                ))}
              </tbody>
            </table>
          </div>
        ))
      )}
    </div>
  );
}
