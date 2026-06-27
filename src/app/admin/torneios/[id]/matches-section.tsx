"use client";

import { useState, useTransition } from "react";
import { generateBracket, generateNextRound, updateMatchResult, resetMatch, resetBracket, assignSeedNumber } from "@/lib/actions";
import type { FinalsBracketTemplate } from "@/lib/actions";

type Registration = {
  id: string;
  status: string;
  seedNumber?: number | null;
  player1: { name: string };
  player2: { name: string } | null;
};

type Match = {
  id: string;
  round: number;
  position: number;
  label?: string | null;
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

// ── Seeding assignment UI ─────────────────────────────────────────────

function SeedingPanel({ regs, numSeeds, tournamentId }: { regs: Registration[]; numSeeds: number; tournamentId: string }) {
  const confirmed = regs.filter((r) => r.status !== "CANCELLED");

  // Local state: map seedNumber → regId
  const initial: Record<number, string> = {};
  for (const r of confirmed) if (r.seedNumber) initial[r.seedNumber] = r.id;
  const [assignments, setAssignments] = useState<Record<number, string>>(initial);
  const [saving, startTransition] = useTransition();
  const [error, setError] = useState("");
  const [saved, setSaved] = useState(false);

  const [dragging, setDragging] = useState<string | null>(null); // regId being dragged

  // Reverse lookup: regId → seedNumber
  const regToSeed: Record<string, number> = {};
  for (const [s, id] of Object.entries(assignments)) regToSeed[id] = Number(s);

  function dropOnSlot(seed: number, regId: string) {
    setAssignments((prev) => {
      const next = { ...prev };
      // Remove from previous slot if already assigned
      for (const [k, v] of Object.entries(next)) if (v === regId) delete next[Number(k)];
      next[seed] = regId;
      return next;
    });
    setSaved(false);
  }

  function removeFromSlot(seed: number) {
    setAssignments((prev) => { const n = { ...prev }; delete n[seed]; return n; });
    setSaved(false);
  }

  async function handleSave() {
    setError("");
    // Clear all seeds for confirmed regs, then reassign
    startTransition(async () => {
      try {
        // Clear any existing seeds not in new assignments
        const assignedIds = new Set(Object.values(assignments));
        for (const r of confirmed) {
          if (r.seedNumber && !assignedIds.has(r.id)) {
            await assignSeedNumber(r.id, null);
          }
        }
        // Set new assignments
        for (const [seed, id] of Object.entries(assignments)) {
          await assignSeedNumber(id, Number(seed));
        }
        setSaved(true);
      } catch (e) {
        setError((e as Error).message);
      }
    });
  }

  const slots = Array.from({ length: numSeeds }, (_, i) => i + 1);
  const unassigned = confirmed.filter((r) => !regToSeed[r.id]);

  return (
    <div style={{ padding: "20px", borderTop: "2px solid #F5C000" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 16 }}>
        <span style={{ fontFamily: "var(--font-oswald), sans-serif", fontSize: 14, fontWeight: 700, color: "#111", letterSpacing: "0.05em" }}>
          CABEÇAS DE CHAVE
        </span>
        <span style={{ fontSize: 12, color: "#999" }}>— arrasta as duplas para atribuir a posição no quadro</span>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>
        {/* Left: available pairs */}
        <div>
          <p style={{ fontSize: 11, fontWeight: 600, color: "#888", textTransform: "uppercase", letterSpacing: "0.05em", margin: "0 0 8px" }}>Duplas disponíveis</p>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
            {unassigned.map((r) => (
              <div
                key={r.id}
                draggable
                onDragStart={() => setDragging(r.id)}
                onDragEnd={() => setDragging(null)}
                style={{
                  background: dragging === r.id ? "#F5C000" : "#F9F9F9",
                  border: "1.5px solid #e0e0e0", borderRadius: 8,
                  padding: "6px 12px", fontSize: 12, fontWeight: 600, color: "#333",
                  cursor: "grab", userSelect: "none",
                }}
              >
                {r.player2 ? `${r.player1.name} / ${r.player2.name}` : r.player1.name}
              </div>
            ))}
            {unassigned.length === 0 && (
              <span style={{ fontSize: 12, color: "#bbb" }}>Todas atribuídas</span>
            )}
          </div>
        </div>

        {/* Right: seed slots */}
        <div>
          <p style={{ fontSize: 11, fontWeight: 600, color: "#888", textTransform: "uppercase", letterSpacing: "0.05em", margin: "0 0 8px" }}>Quadro ({numSeeds} posições)</p>
          <div style={{ display: "grid", gridTemplateColumns: numSeeds > 8 ? "1fr 1fr" : "1fr", gap: 6 }}>
            {slots.map((seed) => {
              const assignedId = assignments[seed];
              const assignedReg = assignedId ? confirmed.find((r) => r.id === assignedId) : null;
              return (
                <div
                  key={seed}
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={(e) => { e.preventDefault(); if (dragging) dropOnSlot(seed, dragging); }}
                  style={{
                    display: "flex", alignItems: "center", gap: 8,
                    background: "#F9F9F9", border: "1.5px dashed #ddd", borderRadius: 8,
                    padding: "6px 10px", minHeight: 36,
                  }}
                >
                  <span style={{ fontSize: 11, fontWeight: 700, color: "#F5C000", minWidth: 22 }}>{seed}º</span>
                  {assignedReg ? (
                    <>
                      <span style={{ fontSize: 12, fontWeight: 600, color: "#111", flex: 1 }}>
                        {assignedReg.player2 ? `${assignedReg.player1.name} / ${assignedReg.player2.name}` : assignedReg.player1.name}
                      </span>
                      <button onClick={() => removeFromSlot(seed)} style={{ background: "none", border: "none", cursor: "pointer", fontSize: 12, color: "#bbb", padding: "0 2px" }}>×</button>
                    </>
                  ) : (
                    <span style={{ fontSize: 11, color: "#bbb" }}>Arrasta aqui…</span>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {error && <p style={{ fontSize: 12, color: "#d32f2f", marginTop: 8 }}>{error}</p>}
      <div style={{ display: "flex", gap: 8, marginTop: 12, alignItems: "center" }}>
        <button
          onClick={handleSave}
          disabled={saving}
          style={{ background: "#F5C000", border: "none", borderRadius: 7, padding: "7px 18px", fontWeight: 700, fontSize: 13, color: "#111", cursor: "pointer" }}
        >
          {saving ? "A guardar…" : "Guardar cabeças de chave"}
        </button>
        {saved && <span style={{ fontSize: 12, color: "#4CAF50" }}>✓ Guardado</span>}
      </div>
    </div>
  );
}

// ── Match row ─────────────────────────────────────────────────────────

function MatchRow({ match, regs, tournamentId }: { match: Match; regs: Registration[]; tournamentId: string }) {
  const [s1, setS1] = useState(match.score1?.toString() ?? "");
  const [s2, setS2] = useState(match.score2?.toString() ?? "");
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState("");

  const isBye = !match.pair2Id;
  const done = !!match.completedAt;
  const pair1 = pairLabel(match.pair1Id, regs);
  const pair2 = pairLabel(match.pair2Id, regs);

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
        {match.label ? match.label : `R${match.round} · J${match.position}`}
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

// ── Main section ──────────────────────────────────────────────────────

export function MatchesSection({
  tournamentId,
  matches,
  regs,
  hasConfirmedRegs,
  finalsTemplate,
}: {
  tournamentId: string;
  matches: Match[];
  regs: Registration[];
  hasConfirmedRegs: boolean;
  finalsTemplate?: FinalsBracketTemplate | null;
}) {
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState("");

  // Build round label map from template
  const roundLabelMap: Record<number, string> = {};
  if (finalsTemplate) {
    for (const e of finalsTemplate) {
      if (e.roundLabel && !roundLabelMap[e.round]) roundLabelMap[e.round] = e.roundLabel;
    }
  }

  // Derive numSeeds from template (count S-slot matches in round 1)
  const templateRound1 = finalsTemplate?.filter((e) => e.round === Math.min(...(finalsTemplate.map(x => x.round)))) ?? [];
  const numSeeds = templateRound1.length > 0
    ? templateRound1.length * 2
    : 0;

  const rounds = [...new Set(matches.map((m) => m.round))].sort((a, b) => a - b);
  const maxRound = rounds[rounds.length - 1] ?? 0;
  const currentRoundMatches = matches.filter((m) => m.round === maxRound);
  const allDone = currentRoundMatches.length > 0 && currentRoundMatches.every((m) => !!m.completedAt);
  const isFinal = currentRoundMatches.length === 1;
  const totalRounds = finalsTemplate ? Math.max(...finalsTemplate.map(e => e.round)) : maxRound;

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

  function getRoundLabel(round: number): string {
    if (roundLabelMap[round]) return roundLabelMap[round];
    if (isFinal && round === maxRound) return "🏆 Final";
    return `Round ${round}`;
  }

  return (
    <div style={{ background: "#fff", borderRadius: 16, overflow: "hidden", boxShadow: "0 2px 8px rgba(0,0,0,0.06)", marginTop: 24 }}>
      <div style={{ background: "#111", padding: "14px 20px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <span style={{ fontFamily: "var(--font-oswald), sans-serif", fontSize: 16, fontWeight: 600, color: "#fff", letterSpacing: "0.04em" }}>
          RESULTADOS {matches.length > 0 && `(${matches.filter((m) => m.completedAt).length}/${matches.length})`}
        </span>
        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
          {matches.length === 0 && hasConfirmedRegs && (
            <button onClick={handleGenerate} disabled={pending} style={{ background: "#F5C000", border: "none", borderRadius: 8, padding: "7px 16px", fontWeight: 700, fontSize: 13, color: "#111", cursor: "pointer" }}>
              {pending ? "A gerar…" : "Gerar Bracket"}
            </button>
          )}
          {matches.length > 0 && (
            <button
              onClick={() => { if (confirm("Apagar todos os resultados e refazer o bracket?")) { startTransition(async () => { try { await resetBracket(tournamentId); } catch (e) { setError((e as Error).message); } }); } }}
              disabled={pending}
              style={{ background: "#F0F0F0", border: "none", borderRadius: 8, padding: "7px 14px", fontWeight: 600, fontSize: 13, color: "#555", cursor: "pointer" }}
            >
              Refazer
            </button>
          )}
          {allDone && !isFinal && maxRound < totalRounds && (
            <button onClick={handleNextRound} disabled={pending} style={{ background: "#F5C000", border: "none", borderRadius: 8, padding: "7px 16px", fontWeight: 700, fontSize: 13, color: "#111", cursor: "pointer" }}>
              {pending ? "A gerar…" : `${getRoundLabel(maxRound + 1)} →`}
            </button>
          )}
          {allDone && isFinal && (
            <span style={{ fontSize: 13, fontWeight: 700, color: "#F5C000" }}>🏆 Torneio concluído</span>
          )}
        </div>
      </div>

      {error && (
        <div style={{ padding: "10px 20px", background: "#FFF3F3", color: "#d32f2f", fontSize: 13 }}>{error}</div>
      )}

      {/* Seeding UI: show when template has S-slots and no matches yet */}
      {numSeeds > 0 && matches.length === 0 && hasConfirmedRegs && (
        <SeedingPanel regs={regs} numSeeds={numSeeds} tournamentId={tournamentId} />
      )}

      {matches.length === 0 ? (
        <div style={{ padding: "32px 20px", textAlign: "center", color: "#aaa", fontSize: 14 }}>
          {hasConfirmedRegs
            ? numSeeds > 0
              ? 'Atribui os cabeças de chave acima e clica em "Gerar Bracket".'
              : 'Clica em "Gerar Bracket" para criar os matches do Round 1.'
            : "Ainda não há inscrições confirmadas."}
        </div>
      ) : (
        rounds.map((round) => (
          <div key={round}>
            <div style={{ padding: "10px 16px", background: "#F9F9F9", borderBottom: "1px solid #eee", borderTop: round > 1 ? "2px solid #eee" : undefined }}>
              <span style={{ fontWeight: 700, fontSize: 12, color: "#555", letterSpacing: "0.06em", textTransform: "uppercase" }}>
                {getRoundLabel(round)}
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
