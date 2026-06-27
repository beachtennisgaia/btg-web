"use client";

import { useState, useTransition } from "react";
import { generateNonStopSchedule, updateNonStopResult, resetBracket, assignGroups, completeGroupPhase, reopenGroupPhase, generateFinals, advanceFinalsRound, saveFinalsBracket } from "@/lib/actions";
import type { FinalsBracketTemplate } from "@/lib/actions";
import { BracketBuilder, slotLabel } from "@/components/bracket-builder";
import type { BracketEntry } from "@/components/bracket-builder";

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
  label: string | null;
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

// ── Finals section (after bracket configured) ─────────────────────────────────

function FinalsSection({
  matches,
  regs,
  durationMinutes,
  tournamentId,
  numGroups,
  pairsAdvancing,
  finalsTemplate,
}: {
  matches: Match[];
  regs: Registration[];
  durationMinutes: number | null;
  tournamentId: string;
  numGroups: number;
  pairsAdvancing: number;
  finalsTemplate: FinalsBracketTemplate | null;
}) {
  const [editing, setEditing] = useState(false);
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState("");
  const finalsMatches = matches.filter((m) => m.groupNumber === 0);
  const existingRounds = [...new Set(finalsMatches.map((m) => m.round))].sort((a, b) => a - b);
  const completed = finalsMatches.filter((m) => m.completedAt).length;
  const hasTemplate = finalsTemplate && finalsTemplate.length > 0;

  // Build a lookup: round number → round label from template
  const roundLabels: Record<number, string> = {};
  finalsTemplate?.forEach((e) => { if (e.roundLabel) roundLabels[e.round] = e.roundLabel; });

  // Determine the highest round with matches and if it's complete
  const maxExistingRound = existingRounds.length > 0 ? Math.max(...existingRounds) : 0;
  const currentRoundComplete = maxExistingRound > 0 &&
    finalsMatches.filter((m) => m.round === maxExistingRound).every((m) => m.completedAt);

  // Find the next round in the template (if any)
  const templateRounds = hasTemplate ? [...new Set(finalsTemplate!.map((e) => e.round))].sort((a, b) => a - b) : [];
  const nextTemplateRound = templateRounds.find((r) => r > maxExistingRound) ?? null;
  const nextRoundLabel = nextTemplateRound ? (roundLabels[nextTemplateRound] ?? `Ronda ${nextTemplateRound}`) : null;

  function handleGenerate() {
    setError("");
    startTransition(async () => {
      try { await generateFinals(tournamentId); setEditing(false); }
      catch (e) { setError((e as Error).message); }
    });
  }

  function handleAdvance() {
    if (!nextTemplateRound) return;
    setError("");
    startTransition(async () => {
      try { await advanceFinalsRound(tournamentId, maxExistingRound); }
      catch (e) { setError((e as Error).message); }
    });
  }

  function handleResetMatches() {
    if (!confirm("Apagar as partidas da fase final e regenerar com os cruzamentos actuais?")) return;
    handleGenerate();
  }

  return (
    <div style={{ marginTop: 24, background: "#fff", borderRadius: 16, overflow: "hidden", boxShadow: "0 2px 8px rgba(0,0,0,0.06)" }}>
      {/* Header */}
      <div style={{ background: "#F5C000", padding: "14px 20px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div>
          <span style={{ fontFamily: "var(--font-oswald), sans-serif", fontSize: 16, fontWeight: 700, color: "#111", letterSpacing: "0.06em" }}>FASE FINAL</span>
          {finalsMatches.length > 0 && (
            <span style={{ fontSize: 12, color: "#555", marginLeft: 10 }}>{completed}/{finalsMatches.length} partidas</span>
          )}
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          {!editing && (
            <button onClick={() => setEditing(true)} style={{ background: "rgba(0,0,0,0.1)", border: "none", borderRadius: 8, padding: "6px 14px", fontSize: 12, fontWeight: 600, color: "#111", cursor: "pointer" }}>
              ✏️ {hasTemplate ? "Editar estrutura" : "Configurar estrutura"}
            </button>
          )}
          {!editing && hasTemplate && finalsMatches.length === 0 && (
            <button onClick={handleGenerate} disabled={pending} style={{ background: "#111", border: "none", borderRadius: 8, padding: "7px 16px", fontWeight: 700, fontSize: 13, color: "#F5C000", cursor: "pointer" }}>
              {pending ? "A gerar…" : "Gerar 1ª Ronda →"}
            </button>
          )}
          {!editing && finalsMatches.length > 0 && (
            <button onClick={handleResetMatches} disabled={pending} style={{ background: "rgba(0,0,0,0.1)", border: "none", borderRadius: 8, padding: "6px 14px", fontSize: 12, fontWeight: 600, color: "#111", cursor: "pointer" }}>
              🔄 Refazer
            </button>
          )}
          {editing && (
            <button onClick={() => setEditing(false)} style={{ background: "rgba(0,0,0,0.1)", border: "none", borderRadius: 8, padding: "6px 14px", fontSize: 12, fontWeight: 600, color: "#111", cursor: "pointer" }}>
              Cancelar
            </button>
          )}
        </div>
      </div>

      {error && <div style={{ padding: "10px 20px", background: "#FFF3F3", color: "#d32f2f", fontSize: 13 }}>{error}</div>}

      {/* Bracket builder */}
      {editing && (
        <div style={{ padding: "20px 24px" }}>
          <p style={{ fontSize: 13, color: "#555", margin: "0 0 12px" }}>
            Define a estrutura da fase final: rondas (ex: Meias-Finais, Final) e quem joga com quem em cada partida.
          </p>
          <BracketBuilder
            numGroups={numGroups}
            pairsAdvancing={pairsAdvancing}
            initial={finalsTemplate}
            onSave={async (template) => {
              await saveFinalsBracket(tournamentId, template);
              setEditing(false);
            }}
            onCancel={() => setEditing(false)}
          />
        </div>
      )}

      {/* Preview of configured bracket (when no matches yet) */}
      {!editing && hasTemplate && finalsMatches.length === 0 && (
        <div style={{ padding: "16px 24px" }}>
          <p style={{ fontSize: 12, color: "#888", margin: "0 0 12px", textTransform: "uppercase", fontWeight: 700, letterSpacing: "0.05em" }}>Estrutura configurada</p>
          {templateRounds.map((roundNum) => {
            const group = finalsTemplate!.filter((e) => e.round === roundNum);
            const label = roundLabels[roundNum] ?? `Ronda ${roundNum}`;
            return (
              <div key={roundNum} style={{ marginBottom: 16 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
                  <span style={{ fontFamily: "var(--font-oswald), sans-serif", fontSize: 11, fontWeight: 700, background: "#111", color: "#F5C000", borderRadius: 4, padding: "2px 8px", letterSpacing: "0.1em" }}>R{roundNum}</span>
                  <span style={{ fontSize: 12, fontWeight: 700, color: "#555", textTransform: "uppercase", letterSpacing: "0.06em" }}>{label}</span>
                </div>
                {group.map((e, i) => (
                  <div key={i} style={{ display: "flex", alignItems: "center", gap: 10, padding: "8px 12px", background: "#FFFCE8", borderRadius: 8, marginBottom: 6, border: "1px solid #F5E080" }}>
                    {e.label && <span style={{ fontSize: 11, fontWeight: 700, color: "#7A5900", minWidth: 90 }}>{e.label}</span>}
                    <span style={{ fontWeight: 700, fontSize: 13, color: "#111" }}>{slotLabel(e.slot1)}</span>
                    <span style={{ color: "#ccc", fontSize: 12 }}>vs</span>
                    <span style={{ fontWeight: 700, fontSize: 13, color: "#111" }}>{slotLabel(e.slot2)}</span>
                  </div>
                ))}
              </div>
            );
          })}
        </div>
      )}

      {/* No template yet */}
      {!editing && !hasTemplate && finalsMatches.length === 0 && (
        <div style={{ padding: "28px 20px", textAlign: "center", color: "#aaa", fontSize: 13 }}>
          Clica em "Configurar estrutura" para definir as rondas e cruzamentos da fase final.
        </div>
      )}

      {/* Actual matches — organised by round */}
      {!editing && finalsMatches.length > 0 && (
        <>
          {existingRounds.map((round) => {
            const roundMatches = finalsMatches.filter((m) => m.round === round);
            const roundLabel = roundLabels[round] ?? `Ronda ${round}`;
            const roundComplete = roundMatches.every((m) => m.completedAt);
            return (
              <div key={round}>
                <div style={{ padding: "7px 16px", background: "#FFFCE8", borderBottom: "1px solid #F5E000", borderTop: round > existingRounds[0] ? "2px solid #F5E000" : undefined, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <span style={{ fontFamily: "var(--font-oswald), sans-serif", fontSize: 11, fontWeight: 700, background: "#111", color: "#F5C000", borderRadius: 4, padding: "1px 7px", letterSpacing: "0.08em" }}>R{round}</span>
                    <span style={{ fontWeight: 700, fontSize: 12, color: "#7A5900", textTransform: "uppercase", letterSpacing: "0.06em" }}>{roundLabel}</span>
                    {roundComplete && <span style={{ fontSize: 11, color: "#4CAF50", fontWeight: 700 }}>✓ Completa</span>}
                  </div>
                  {durationMinutes && <span style={{ fontSize: 11, color: "#aaa" }}>{durationMinutes} min</span>}
                </div>
                <table style={{ width: "100%", borderCollapse: "collapse" }}>
                  <tbody>
                    {roundMatches.map((match) => (
                      <tr key={match.id} style={{ borderBottom: "1px solid #f5f5f5" }}>
                        {match.label && (
                          <td style={{ padding: "0 16px", width: 120 }}>
                            <span style={{ fontSize: 11, fontWeight: 700, color: "#7A5900", background: "#FFFCE8", borderRadius: 4, padding: "2px 7px", border: "1px solid #F5E080" }}>{match.label}</span>
                          </td>
                        )}
                        <td colSpan={match.label ? 1 : 4} style={{ padding: 0 }}>
                          <table style={{ width: "100%", borderCollapse: "collapse" }}>
                            <tbody><GameRow match={match} regs={regs} /></tbody>
                          </table>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            );
          })}

          {/* Advance to next round */}
          {currentRoundComplete && nextTemplateRound && (
            <div style={{ padding: "16px 24px", borderTop: "2px solid #F5E000", background: "#FFFCE8", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div>
                <span style={{ fontWeight: 700, fontSize: 14, color: "#7A5900" }}>Ronda anterior completa!</span>
                <p style={{ fontSize: 12, color: "#8A6800", margin: "2px 0 0" }}>
                  Gera agora as partidas de <strong>{nextRoundLabel}</strong> com base nos vencedores.
                </p>
              </div>
              <button onClick={handleAdvance} disabled={pending} style={{ background: "#111", border: "none", borderRadius: 8, padding: "9px 20px", fontWeight: 700, fontSize: 13, color: "#F5C000", cursor: "pointer" }}>
                {pending ? "A gerar…" : `Avançar para ${nextRoundLabel} →`}
              </button>
            </div>
          )}

          {/* Final standings — only when all rounds done and no more rounds in template */}
          {!nextTemplateRound && (
            <GroupStandings matches={finalsMatches} regs={regs} pairsAdvancing={0} groupLabel="Fase Final" noFinals={true} />
          )}
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
  groupPhaseComplete,
  finalsTemplate,
}: {
  tournamentId: string;
  matches: Match[];
  regs: Registration[];
  hasConfirmedRegs: boolean;
  durationMinutes: number | null;
  totalDurationMinutes: number | null;
  numGroups: number | null;
  pairsAdvancing: number | null;
  groupPhaseComplete: boolean;
  finalsTemplate: FinalsBracketTemplate | null;
}) {
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState("");

  const active = activeRegs(regs);
  const groups = numGroups && numGroups > 1 ? numGroups : 1;
  const noFinals = pairsAdvancing === 0;
  const advancing = pairsAdvancing ?? 0;
  const hasFinals = groups > 1 && advancing > 0;

  const groupMatches = matches.filter((m) => m.groupNumber !== 0);
  const totalMatches = groupMatches.length;
  const completedCount = groupMatches.filter((m) => m.completedAt).length;
  const incompleteCount = totalMatches - completedCount;
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
    if (!confirm("Apagar todo o schedule (grupos + finais) e recomeçar?")) return;
    setError("");
    startTransition(async () => {
      try { await resetBracket(tournamentId); }
      catch (e) { setError((e as Error).message); }
    });
  }

  function handleCompletePhase() {
    const msg = incompleteCount > 0
      ? `Ainda há ${incompleteCount} partida${incompleteCount !== 1 ? "s" : ""} por registar. Concluir mesmo assim?`
      : "Concluir a fase de grupos e avançar para a fase final?";
    if (!confirm(msg)) return;
    setError("");
    startTransition(async () => {
      try { await completeGroupPhase(tournamentId); }
      catch (e) { setError((e as Error).message); }
    });
  }

  function handleReopenPhase() {
    if (!confirm("Reabrir a fase de grupos? Isto apagará as partidas da fase final.")) return;
    setError("");
    startTransition(async () => {
      try { await reopenGroupPhase(tournamentId); }
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
                {completedCount}/{totalMatches} partidas de grupo
                {durationMinutes ? ` · ${durationMinutes} min/partida` : ""}
                {totalDurationMinutes ? ` · ${Math.floor(totalDurationMinutes / 60)}h${totalDurationMinutes % 60 > 0 ? `${totalDurationMinutes % 60}min` : ""}` : ""}
              </span>
            )}
          </div>
          <div style={{ display: "flex", gap: 8 }}>
            {groups > 1 && pairsNeedGroup && hasConfirmedRegs && !groupPhaseComplete && (
              <button onClick={handleAssignGroups} disabled={pending} style={{ background: "#F5C000", border: "none", borderRadius: 8, padding: "7px 16px", fontWeight: 700, fontSize: 13, color: "#111", cursor: "pointer" }}>
                {pending ? "A distribuir…" : "🎲 Distribuir grupos"}
              </button>
            )}
            {totalMatches === 0 && hasConfirmedRegs && !pairsNeedGroup && !groupPhaseComplete && (
              <button onClick={handleGenerate} disabled={pending} style={{ background: "#F5C000", border: "none", borderRadius: 8, padding: "7px 16px", fontWeight: 700, fontSize: 13, color: "#111", cursor: "pointer" }}>
                {pending ? "A gerar…" : "Gerar Schedule"}
              </button>
            )}
            {totalMatches > 0 && !groupPhaseComplete && (
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

      {/* Phase transition card — only for multi-group with finals */}
      {hasFinals && totalMatches > 0 && (
        <div style={{ marginTop: 24, borderRadius: 16, overflow: "hidden", boxShadow: "0 2px 8px rgba(0,0,0,0.06)", border: groupPhaseComplete ? "2px solid #4CAF50" : "2px dashed #ddd", background: "#fff" }}>
          {groupPhaseComplete ? (
            <div style={{ padding: "16px 24px", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 10 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <span style={{ fontSize: 20 }}>✅</span>
                <div>
                  <span style={{ fontWeight: 700, fontSize: 14, color: "#2E7D32" }}>Fase de Grupos Concluída</span>
                  <p style={{ fontSize: 12, color: "#888", margin: "2px 0 0" }}>
                    Os top {advancing} de cada grupo avançam para a fase final.
                  </p>
                </div>
              </div>
              <button
                onClick={handleReopenPhase}
                disabled={pending}
                style={{ background: "#FFF3F3", border: "1px solid #FFCCCC", borderRadius: 8, padding: "6px 14px", fontSize: 12, fontWeight: 600, color: "#d32f2f", cursor: "pointer" }}
              >
                {pending ? "…" : "↩ Reabrir fase de grupos"}
              </button>
            </div>
          ) : (
            <div style={{ padding: "20px 24px", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 12 }}>
              <div>
                <span style={{ fontWeight: 700, fontSize: 14, color: "#111" }}>Fase de Grupos</span>
                <p style={{ fontSize: 12, color: "#888", margin: "3px 0 0" }}>
                  {completedCount}/{totalMatches} partidas registadas
                  {incompleteCount > 0 && <span style={{ color: "#F5A623", marginLeft: 6 }}>· {incompleteCount} por disputar</span>}
                </p>
              </div>
              <button
                onClick={handleCompletePhase}
                disabled={pending || totalMatches === 0}
                style={{ background: "#111", border: "none", borderRadius: 8, padding: "9px 20px", fontWeight: 700, fontSize: 13, color: "#F5C000", cursor: "pointer", opacity: totalMatches === 0 ? 0.4 : 1 }}
              >
                {pending ? "A concluir…" : "Concluir Fase de Grupos →"}
              </button>
            </div>
          )}
        </div>
      )}

      {/* Finals section */}
      {hasFinals && groupPhaseComplete && (
        <FinalsSection
          matches={matches}
          regs={active}
          durationMinutes={durationMinutes}
          tournamentId={tournamentId}
          numGroups={groups}
          pairsAdvancing={advancing}
          finalsTemplate={finalsTemplate}
        />
      )}
    </>
  );
}
