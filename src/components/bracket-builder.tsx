"use client";

import { useState } from "react";
import type { BracketEntry, FinalsBracketTemplate } from "@/lib/actions";

export { type BracketEntry, type FinalsBracketTemplate };

// ── Slot grammar ──────────────────────────────────────────────────────────────
// G{n}R{r}   → {r}º do Grupo {A/B/C}   (from group standings)
// W{r}.{p}   → Vencedor da Partida {p} na Ronda {r}
// L{r}.{p}   → Perdedor da Partida {p} na Ronda {r}

export function slotLabel(slot: string, matchLabels?: Map<string, string>): string {
  const g = slot.match(/^G(\d+)R(\d+)$/);
  if (g) return `${g[2]}º Grupo ${String.fromCharCode(64 + parseInt(g[1]))}`;
  const w = slot.match(/^W(\d+)\.(\d+)$/);
  if (w) {
    const key = `W${w[1]}.${w[2]}`;
    return matchLabels?.get(key) ? `Venc. ${matchLabels.get(key)}` : `Venc. R${w[1]}P${w[2]}`;
  }
  const l = slot.match(/^L(\d+)\.(\d+)$/);
  if (l) {
    const key = `W${l[1]}.${l[2]}`;
    return matchLabels?.get(key) ? `Perd. ${matchLabels.get(key)}` : `Perd. R${l[1]}P${l[2]}`;
  }
  return slot;
}

// ── Round name suggestions ────────────────────────────────────────────────────
const ROUND_NAMES: Record<number, string> = {
  1: "Final",
  2: "Meias-Finais",
  3: "Quartas-de-Final",
  4: "Oitavos-de-Final",
  5: "Avos-de-Final",
};

function suggestRoundName(totalRounds: number, roundIndex: number): string {
  // roundIndex: 0 = earliest round
  const fromFinal = totalRounds - 1 - roundIndex;
  return ROUND_NAMES[fromFinal] ?? `Ronda ${roundIndex + 1}`;
}

// ── Default bracket ───────────────────────────────────────────────────────────
export function defaultBracket(numGroups: number, pairsAdvancing: number): FinalsBracketTemplate {
  const totalPairs = numGroups * pairsAdvancing;
  const entries: BracketEntry[] = [];

  if (totalPairs < 2) return entries;

  // Round 1: cross-group matchups
  let pos = 1;
  const r1Matches: Array<{ pos: number; label: string; slot1: string; slot2: string }> = [];

  if (numGroups === 2 && pairsAdvancing === 1) {
    r1Matches.push({ pos: pos++, label: "Final", slot1: "G1R1", slot2: "G2R1" });
  } else if (numGroups === 2 && pairsAdvancing === 2) {
    r1Matches.push({ pos: 1, label: "Semifinal 1", slot1: "G1R1", slot2: "G2R2" });
    r1Matches.push({ pos: 2, label: "Semifinal 2", slot1: "G2R1", slot2: "G1R2" });
    pos = 3;
  } else {
    for (let g = 1; g <= numGroups; g++) {
      for (let r = 1; r <= pairsAdvancing; r++) {
        const oppG = (g % numGroups) + 1;
        const oppR = pairsAdvancing + 1 - r;
        const slot1 = `G${g}R${r}`;
        const slot2 = `G${oppG}R${oppR}`;
        if (slot1 < slot2) r1Matches.push({ pos: pos++, label: `Partida ${r1Matches.length + 1}`, slot1, slot2 });
      }
    }
  }

  const roundLabel1 = suggestRoundName(r1Matches.length <= 1 ? 1 : 2, 0);
  r1Matches.forEach(m => entries.push({ round: 1, roundLabel: roundLabel1, position: m.pos, label: m.label, slot1: m.slot1, slot2: m.slot2 }));

  // Round 2 (Final) — only if round 1 has > 1 match
  if (r1Matches.length > 1) {
    entries.push({ round: 2, roundLabel: "Final", position: 1, label: "Final", slot1: "W1.1", slot2: "W1.2" });
    if (r1Matches.length === 2) {
      // 3rd place optional (not added by default — user can add)
    }
  }

  return entries;
}

// ── Internal state types ──────────────────────────────────────────────────────
type MatchState = { position: number; label: string; slot1: string; slot2: string };
type RoundState = { roundNum: number; roundLabel: string; matches: MatchState[] };

function entriesToRounds(entries: BracketEntry[]): RoundState[] {
  const map = new Map<number, RoundState>();
  for (const e of entries) {
    if (!map.has(e.round)) map.set(e.round, { roundNum: e.round, roundLabel: e.roundLabel ?? `Ronda ${e.round}`, matches: [] });
    map.get(e.round)!.matches.push({ position: e.position, label: e.label, slot1: e.slot1, slot2: e.slot2 });
  }
  return [...map.values()].sort((a, b) => a.roundNum - b.roundNum);
}

function roundsToEntries(rounds: RoundState[]): BracketEntry[] {
  const out: BracketEntry[] = [];
  for (const r of rounds) for (const m of r.matches) {
    out.push({ round: r.roundNum, roundLabel: r.roundLabel, position: m.position, label: m.label, slot1: m.slot1, slot2: m.slot2 });
  }
  return out;
}

// ── Slot options for a given round ───────────────────────────────────────────
function slotOptions(
  round: number,
  numGroups: number,
  pairsAdvancing: number,
  rounds: RoundState[],
): Array<{ key: string; label: string; group?: string }> {
  const opts: Array<{ key: string; label: string; group?: string }> = [];

  if (round === 1) {
    // Group standings
    for (let g = 1; g <= numGroups; g++)
      for (let r = 1; r <= pairsAdvancing; r++)
        opts.push({ key: `G${g}R${r}`, label: slotLabel(`G${g}R${r}`), group: `Grupo ${String.fromCharCode(64 + g)}` });
  }

  // Winners/Losers from previous rounds
  for (const prevRound of rounds.filter(r => r.roundNum < round)) {
    const matchLabels = new Map(prevRound.matches.map(m => [`W${prevRound.roundNum}.${m.position}`, m.label]));
    for (const m of prevRound.matches) {
      opts.push({ key: `W${prevRound.roundNum}.${m.position}`, label: `Venc. ${m.label} (${prevRound.roundLabel})`, group: `Venc. ${prevRound.roundLabel}` });
      opts.push({ key: `L${prevRound.roundNum}.${m.position}`, label: `Perd. ${m.label} (${prevRound.roundLabel})`, group: `Perd. ${prevRound.roundLabel}` });
    }
    void matchLabels;
  }

  return opts;
}

// ── Component ─────────────────────────────────────────────────────────────────
type Props = {
  numGroups: number;
  pairsAdvancing: number;
  initial?: FinalsBracketTemplate | null;
  onChange?: (template: FinalsBracketTemplate) => void;
  onSave?: (template: FinalsBracketTemplate) => Promise<void>;
  onCancel?: () => void;
};

const inputSt: React.CSSProperties = {
  padding: "6px 10px", border: "1.5px solid #e0e0e0", borderRadius: 7,
  fontSize: 13, background: "#fff", cursor: "pointer", color: "#111",
  fontFamily: "var(--font-inter), sans-serif", boxSizing: "border-box",
};

export function BracketBuilder({ numGroups, pairsAdvancing, initial, onChange, onSave, onCancel }: Props) {
  const [rounds, setRounds] = useState<RoundState[]>(() => {
    const src = initial && initial.length > 0 ? initial : defaultBracket(numGroups, pairsAdvancing);
    return entriesToRounds(src);
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  function update(next: RoundState[]) {
    setRounds(next);
    onChange?.(roundsToEntries(next));
  }

  function updateRoundLabel(roundIdx: number, label: string) {
    const next = rounds.map((r, i) => i === roundIdx ? { ...r, roundLabel: label } : r);
    update(next);
  }

  function addRound() {
    const nextRoundNum = Math.max(...rounds.map(r => r.roundNum), 0) + 1;
    const newRound: RoundState = {
      roundNum: nextRoundNum,
      roundLabel: nextRoundNum === 2 ? "Final" : `Ronda ${nextRoundNum}`,
      matches: [{ position: 1, label: "Partida 1", slot1: rounds.length > 0 ? `W${nextRoundNum - 1}.1` : "", slot2: rounds.length > 0 ? `W${nextRoundNum - 1}.2` : "" }],
    };
    update([...rounds, newRound]);
  }

  function removeRound(roundIdx: number) {
    update(rounds.filter((_, i) => i !== roundIdx));
  }

  function addMatch(roundIdx: number) {
    const r = rounds[roundIdx];
    const nextPos = Math.max(...r.matches.map(m => m.position), 0) + 1;
    const newMatch: MatchState = {
      position: nextPos,
      label: `Partida ${nextPos}`,
      slot1: r.roundNum === 1 ? (numGroups > 0 ? `G1R${nextPos}` : "") : `W${r.roundNum - 1}.${nextPos}`,
      slot2: r.roundNum === 1 ? (numGroups > 1 ? `G2R${nextPos}` : "") : `W${r.roundNum - 1}.${Math.min(nextPos + 1, r.matches.length + 1)}`,
    };
    const next = rounds.map((round, i) => i === roundIdx ? { ...round, matches: [...round.matches, newMatch] } : round);
    update(next);
  }

  function removeMatch(roundIdx: number, matchIdx: number) {
    const next = rounds.map((r, i) => i !== roundIdx ? r : {
      ...r,
      matches: r.matches.filter((_, j) => j !== matchIdx).map((m, j) => ({ ...m, position: j + 1 })),
    });
    update(next);
  }

  function updateMatch(roundIdx: number, matchIdx: number, field: keyof MatchState, value: string | number) {
    const next = rounds.map((r, i) => i !== roundIdx ? r : {
      ...r,
      matches: r.matches.map((m, j) => j !== matchIdx ? m : { ...m, [field]: value }),
    });
    update(next);
  }

  async function handleSave() {
    if (!onSave) return;
    const entries = roundsToEntries(rounds);
    for (const e of entries) {
      if (!e.slot1 || !e.slot2) { setError("Todos os cruzamentos precisam de dois participantes."); return; }
    }
    setError("");
    setSaving(true);
    try { await onSave(entries); } catch (e) { setError((e as Error).message); }
    finally { setSaving(false); }
  }

  return (
    <div>
      {rounds.map((round, roundIdx) => {
        const opts = slotOptions(round.roundNum, numGroups, pairsAdvancing, rounds);
        const groupedOpts = opts.reduce((acc, o) => {
          const g = o.group ?? "";
          (acc[g] ??= []).push(o);
          return acc;
        }, {} as Record<string, typeof opts>);

        return (
          <div key={round.roundNum} style={{ marginBottom: 20, background: "#F9F9F9", borderRadius: 12, border: "1px solid #eee", overflow: "hidden" }}>
            {/* Round header */}
            <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 14px", background: "#111", borderBottom: "1px solid #222" }}>
              <span style={{ fontFamily: "var(--font-oswald), sans-serif", fontSize: 12, color: "#F5C000", fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", minWidth: 20 }}>
                R{round.roundNum}
              </span>
              <input
                value={round.roundLabel}
                onChange={e => updateRoundLabel(roundIdx, e.target.value)}
                placeholder="Nome da ronda (ex: Meias-Finais)"
                style={{ ...inputSt, flex: 1, background: "#222", border: "1px solid #333", color: "#fff", padding: "5px 10px" }}
              />
              <button onClick={() => removeRound(roundIdx)} style={{ background: "#333", border: "none", borderRadius: 6, padding: "4px 10px", fontSize: 12, color: "#aaa", cursor: "pointer" }}>
                × Remover ronda
              </button>
            </div>

            {/* Matches */}
            <div style={{ padding: "12px 14px", display: "flex", flexDirection: "column", gap: 8 }}>
              {round.matches.map((match, matchIdx) => (
                <div key={matchIdx} style={{ display: "grid", gridTemplateColumns: "140px 1fr auto 1fr auto", gap: 8, alignItems: "center" }}>
                  <input
                    value={match.label}
                    onChange={e => updateMatch(roundIdx, matchIdx, "label", e.target.value)}
                    placeholder="Ex: Semifinal 1"
                    style={inputSt}
                  />
                  <select value={match.slot1} onChange={e => updateMatch(roundIdx, matchIdx, "slot1", e.target.value)} style={inputSt}>
                    {Object.entries(groupedOpts).map(([group, options]) => (
                      <optgroup key={group} label={group}>
                        {options.map(o => <option key={o.key} value={o.key}>{o.label}</option>)}
                      </optgroup>
                    ))}
                  </select>
                  <span style={{ color: "#aaa", fontSize: 12, fontWeight: 700, textAlign: "center" }}>vs</span>
                  <select value={match.slot2} onChange={e => updateMatch(roundIdx, matchIdx, "slot2", e.target.value)} style={inputSt}>
                    {Object.entries(groupedOpts).map(([group, options]) => (
                      <optgroup key={group} label={group}>
                        {options.map(o => <option key={o.key} value={o.key}>{o.label}</option>)}
                      </optgroup>
                    ))}
                  </select>
                  <button onClick={() => removeMatch(roundIdx, matchIdx)} style={{ background: "#FFEAEA", border: "none", borderRadius: 7, padding: "6px 10px", fontSize: 13, color: "#d32f2f", cursor: "pointer", fontWeight: 700, whiteSpace: "nowrap" }}>×</button>
                </div>
              ))}
              <button onClick={() => addMatch(roundIdx)} style={{ background: "#fff", border: "1.5px dashed #ddd", borderRadius: 8, padding: "7px 14px", fontSize: 12, fontWeight: 600, color: "#888", cursor: "pointer", alignSelf: "flex-start", marginTop: 4 }}>
                + Adicionar partida a {round.roundLabel}
              </button>
            </div>
          </div>
        );
      })}

      {/* Add round */}
      <button onClick={addRound} style={{ width: "100%", background: "#fff", border: "2px dashed #F5C000", borderRadius: 10, padding: "10px", fontSize: 13, fontWeight: 700, color: "#8A6800", cursor: "pointer", marginBottom: 14 }}>
        + Adicionar ronda seguinte
      </button>

      {/* Actions */}
      <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
        <div style={{ flex: 1 }} />
        {error && <span style={{ fontSize: 12, color: "#d32f2f" }}>{error}</span>}
        {onCancel && (
          <button type="button" onClick={onCancel} style={{ background: "#F0F0F0", border: "none", borderRadius: 8, padding: "8px 16px", fontSize: 13, fontWeight: 600, color: "#555", cursor: "pointer" }}>
            Cancelar
          </button>
        )}
        {onSave && (
          <button type="button" onClick={handleSave} disabled={saving || rounds.length === 0} style={{ background: "#111", border: "none", borderRadius: 8, padding: "9px 20px", fontSize: 13, fontWeight: 700, color: "#F5C000", cursor: "pointer" }}>
            {saving ? "A guardar…" : "Confirmar estrutura →"}
          </button>
        )}
      </div>
    </div>
  );
}
