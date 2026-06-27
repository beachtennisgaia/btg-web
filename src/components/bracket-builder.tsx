"use client";

import { useState } from "react";
import type { BracketEntry, FinalsBracketTemplate } from "@/lib/actions";

export { type BracketEntry, type FinalsBracketTemplate };

// ── Slot grammar ─────────────────────────────────────────────────────
// G{n}R{r}  →  {r}º do Grupo {A/B/C…}   (Non-Stop groups)
// S{n}      →  {n}º Cabeça de Chave      (Elimination seeds)
// W{r}.{p}  →  Vencedor da Partida {p} na Ronda {r}
// L{r}.{p}  →  Perdedor da Partida {p} na Ronda {r}

export function slotLabel(slot: string): string {
  const g = slot.match(/^G(\d+)R(\d+)$/);
  if (g) return `${g[2]}º Grupo ${String.fromCharCode(64 + parseInt(g[1]))}`;
  const s = slot.match(/^S(\d+)$/);
  if (s) return `${s[1]}º Cabeça`;
  const w = slot.match(/^W(\d+)\.(\d+)$/);
  if (w) return `Venc. M${w[2]}`;
  const l = slot.match(/^L(\d+)\.(\d+)$/);
  if (l) return `Perd. M${l[2]}`;
  return slot;
}

// ── Structure helpers ─────────────────────────────────────────────────

const ROUND_NAMES: Record<number, string> = {
  0: "Final", 1: "Meias-Finais", 2: "Quartas-de-Final",
  3: "Oitavos-de-Final", 4: "1/16 Avos", 5: "1/32 Avos",
};
const MATCH_NAMES: Record<number, (p: number) => string> = {
  0: () => "Final", 1: p => `Semifinal ${p}`, 2: p => `Quarta ${p}`,
  3: p => `Oitavo ${p}`, 4: p => `1/16 – Jogo ${p}`, 5: p => `1/32 – Jogo ${p}`,
};

function matchesPerRound(totalPairs: number): number[] {
  if (totalPairs < 2) return [];
  const rounds: number[] = [];
  let n = totalPairs;
  while (n > 1) { const m = Math.floor(n / 2); rounds.push(m); n = m + (n % 2); }
  return rounds;
}

function defaultRoundName(numRounds: number, ri: number): string {
  return ROUND_NAMES[numRounds - 1 - ri] ?? `Ronda ${ri + 1}`;
}
function defaultMatchName(numRounds: number, ri: number, pos: number): string {
  return (MATCH_NAMES[numRounds - 1 - ri] ?? ((p: number) => `Jogo ${p}`))(pos);
}

// Standard seeding for N participants: S1 vs S{n}, S2 vs S{n-1} distributed by bracket half
function standardSeedPairs(n: number): [string, string][] {
  // For powers of 2, use classic bracket seeding
  // S1 vs S{n}, S{n/2} vs S{n/2+1}, etc. arranged to keep top seeds apart
  const pairs: [string, string][] = [];
  function fill(top: number, bottom: number) {
    if (top >= bottom) return;
    if (bottom - top === 1) { pairs.push([`S${top}`, `S${bottom}`]); return; }
    const mid = Math.floor((bottom - top + 1) / 2);
    // Top seed vs bottom seed in this range
    fill(top, top + mid - 1);
    fill(top + mid, bottom);
  }
  // Simple approach: sequential pairing with cross-seeding
  if (n === 2) return [["S1", "S2"]];
  if (n === 4) return [["S1", "S4"], ["S3", "S2"]];
  if (n === 8) return [["S1", "S8"], ["S5", "S4"], ["S3", "S6"], ["S7", "S2"]];
  if (n === 16) return [
    ["S1", "S16"], ["S9", "S8"], ["S5", "S12"], ["S13", "S4"],
    ["S3", "S14"], ["S11", "S6"], ["S7", "S10"], ["S15", "S2"],
  ];
  // Fallback: sequential S1 vs S{n}, S2 vs S{n-1}...
  for (let i = 1; i <= Math.floor(n / 2); i++) pairs.push([`S${i}`, `S${n + 1 - i}`]);
  void fill;
  return pairs;
}

function defaultGroupSeeding(numGroups: number, pairsAdvancing: number): string[] {
  if (numGroups === 2 && pairsAdvancing === 1) return ["G1R1", "G2R1"];
  if (numGroups === 2 && pairsAdvancing === 2) return ["G1R1", "G2R2", "G2R1", "G1R2"];
  const out: string[] = [];
  for (let r = 1; r <= pairsAdvancing; r++) for (let g = 1; g <= numGroups; g++) out.push(`G${g}R${r}`);
  return out;
}

// Default bracket for Non-Stop group finals
export function defaultBracket(numGroups: number, pairsAdvancing: number): FinalsBracketTemplate {
  const rounds = matchesPerRound(numGroups * pairsAdvancing);
  const nR = rounds.length;
  if (nR === 0) return [];
  const seeds = defaultGroupSeeding(numGroups, pairsAdvancing);
  const entries: BracketEntry[] = [];
  for (let ri = 0; ri < nR; ri++) {
    const r = ri + 1;
    for (let pos = 1; pos <= rounds[ri]; pos++) {
      const slot1 = ri === 0 ? (seeds[(pos - 1) * 2] ?? "") : `W${r - 1}.${2 * pos - 1}`;
      const slot2 = ri === 0 ? (seeds[(pos - 1) * 2 + 1] ?? "") : `W${r - 1}.${2 * pos}`;
      entries.push({ round: r, roundLabel: defaultRoundName(nR, ri), position: pos, label: defaultMatchName(nR, ri, pos), slot1, slot2 });
    }
  }
  return entries;
}

// Default bracket for Elimination with N seeds
export function defaultEliminationBracket(numSeeds: number): FinalsBracketTemplate {
  const rounds = matchesPerRound(numSeeds);
  const nR = rounds.length;
  if (nR === 0) return [];
  const seedPairs = standardSeedPairs(numSeeds);
  const entries: BracketEntry[] = [];
  for (let ri = 0; ri < nR; ri++) {
    const r = ri + 1;
    for (let pos = 1; pos <= rounds[ri]; pos++) {
      let slot1: string, slot2: string;
      if (ri === 0) {
        slot1 = seedPairs[pos - 1]?.[0] ?? `S${2 * pos - 1}`;
        slot2 = seedPairs[pos - 1]?.[1] ?? `S${2 * pos}`;
      } else {
        slot1 = `W${r - 1}.${2 * pos - 1}`;
        slot2 = `W${r - 1}.${2 * pos}`;
      }
      entries.push({ round: r, roundLabel: defaultRoundName(nR, ri), position: pos, label: defaultMatchName(nR, ri, pos), slot1, slot2 });
    }
  }
  return entries;
}

// ── Component ─────────────────────────────────────────────────────────

type Props = {
  // Non-Stop mode: provide numGroups + pairsAdvancing
  numGroups?: number;
  pairsAdvancing?: number;
  // Elimination mode: provide numSeeds
  numSeeds?: number;
  initial?: FinalsBracketTemplate | null;
  onChange?: (t: FinalsBracketTemplate) => void;
  onSave?: (t: FinalsBracketTemplate) => Promise<void>;
  onCancel?: () => void;
};

const BASE_H = 110; // height per R1 match slot (px)

export function BracketBuilder({ numGroups, pairsAdvancing, numSeeds, initial, onChange, onSave, onCancel }: Props) {
  const isElimination = numSeeds != null && numSeeds > 0;
  const total = isElimination ? numSeeds : (numGroups ?? 0) * (pairsAdvancing ?? 0);
  const mpr = matchesPerRound(total); // matches per round array
  const nR = mpr.length;

  // Sources: either S{n} chips (elimination) or G{g}R{r} chips (non-stop groups)
  const allSources = (() => {
    const s: { key: string; label: string }[] = [];
    if (isElimination) {
      for (let n = 1; n <= numSeeds; n++) s.push({ key: `S${n}`, label: `${n}º Cabeça` });
    } else {
      const ng = numGroups ?? 0; const pa = pairsAdvancing ?? 0;
      for (let g = 1; g <= ng; g++) for (let r = 1; r <= pa; r++)
        s.push({ key: `G${g}R${r}`, label: `${r}º Grupo ${String.fromCharCode(64 + g)}` });
    }
    return s;
  })();

  // Parse initial into working state
  function init() {
    const a: Record<string, string> = {};  // "r-pos-side" → G slot key
    const ml: Record<string, string> = {}; // "r-pos" → label
    const rl: Record<number, string> = {}; // round → label
    const src = initial && initial.length > 0 ? initial
      : isElimination ? defaultEliminationBracket(numSeeds!)
      : defaultBracket(numGroups ?? 0, pairsAdvancing ?? 0);
    for (const e of src) {
      if (e.roundLabel) rl[e.round] = e.roundLabel;
      ml[`${e.round}-${e.position}`] = e.label;
      if (e.round === 1) {
        if (e.slot1 && !e.slot1.startsWith("W") && !e.slot1.startsWith("L")) a[`1-${e.position}-1`] = e.slot1;
        if (e.slot2 && !e.slot2.startsWith("W") && !e.slot2.startsWith("L")) a[`1-${e.position}-2`] = e.slot2;
      }
    }
    for (let ri = 0; ri < nR; ri++) {
      const r = ri + 1;
      if (!rl[r]) rl[r] = defaultRoundName(nR, ri);
      for (let p = 1; p <= mpr[ri]; p++) if (!ml[`${r}-${p}`]) ml[`${r}-${p}`] = defaultMatchName(nR, ri, p);
    }
    return { a, ml, rl };
  }

  const i0 = init();
  const [assigns, setAssigns] = useState<Record<string, string>>(i0.a);
  const [mLabels, setMLabels] = useState<Record<string, string>>(i0.ml);
  const [rLabels, setRLabels] = useState<Record<number, string>>(i0.rl);
  const [dragging, setDragging] = useState<string | null>(null);
  const [dragOver, setDragOver] = useState<string | null>(null);
  const [selected, setSelected] = useState<string | null>(null);
  const [editingKey, setEditingKey] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const assignedSet = new Set(Object.values(assigns));
  const unassigned = allSources.filter(s => !assignedSet.has(s.key));

  function buildTemplate(a = assigns): FinalsBracketTemplate {
    const entries: BracketEntry[] = [];
    for (let ri = 0; ri < nR; ri++) {
      const r = ri + 1;
      for (let p = 1; p <= mpr[ri]; p++) {
        const slot1 = ri === 0 ? (a[`1-${p}-1`] ?? "") : `W${r - 1}.${2 * p - 1}`;
        const slot2 = ri === 0 ? (a[`1-${p}-2`] ?? "") : `W${r - 1}.${2 * p}`;
        entries.push({ round: r, roundLabel: rLabels[r], position: p, label: mLabels[`${r}-${p}`] ?? `Partida ${p}`, slot1, slot2 });
      }
    }
    return entries;
  }

  function place(slotKey: string, chipKey: string) {
    const next = { ...assigns };
    const prev = Object.entries(next).find(([, v]) => v === chipKey)?.[0];
    if (prev) delete next[prev];
    next[slotKey] = chipKey;
    setAssigns(next);
    onChange?.(buildTemplate(next));
  }

  function remove(slotKey: string) {
    const next = { ...assigns };
    delete next[slotKey];
    setAssigns(next);
    onChange?.(buildTemplate(next));
  }

  function handleZoneClick(slotKey: string) {
    if (selected) { place(slotKey, selected); setSelected(null); }
    else if (assigns[slotKey]) { setSelected(assigns[slotKey]); }
  }

  function handleChipClick(key: string) {
    setSelected(sel => sel === key ? null : key);
  }

  async function handleSave() {
    if (!onSave) return;
    const t = buildTemplate();
    const bad = t.filter(e => e.round === 1 && (!e.slot1 || !e.slot2));
    if (bad.length) { setError("Preenche todos os slots da 1ª ronda."); return; }
    setError(""); setSaving(true);
    try { await onSave(t); } catch (e) { setError((e as Error).message); } finally { setSaving(false); }
  }

  const totalH = mpr[0] * BASE_H;

  return (
    <div style={{ fontFamily: "var(--font-inter), sans-serif" }}>
      {/* Sources pool */}
      <div style={{ marginBottom: 16 }}>
        <p style={{ fontSize: 11, fontWeight: 700, color: "#888", textTransform: "uppercase", letterSpacing: "0.07em", margin: "0 0 8px" }}>
          Classificações disponíveis {selected && <span style={{ color: "#F5A623" }}>— clica num slot do bracket para colocar</span>}
        </p>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 7 }}>
          {allSources.map(s => {
            const isAssigned = assignedSet.has(s.key);
            const isSel = selected === s.key;
            return (
              <div
                key={s.key}
                draggable={!isAssigned}
                onDragStart={() => { setDragging(s.key); setSelected(null); }}
                onDragEnd={() => setDragging(null)}
                onClick={() => !isAssigned && handleChipClick(s.key)}
                style={{
                  padding: "6px 12px", borderRadius: 8, fontSize: 12, fontWeight: 700,
                  background: isAssigned ? "#F0F0F0" : isSel ? "#F5C000" : "#FFFCE8",
                  color: isAssigned ? "#bbb" : "#111",
                  border: `2px solid ${isAssigned ? "#E8E8E8" : isSel ? "#D4A800" : "#F5C000"}`,
                  cursor: isAssigned ? "default" : "grab",
                  userSelect: "none",
                  transition: "all 0.12s",
                  opacity: isAssigned ? 0.55 : 1,
                  boxShadow: isSel ? "0 2px 8px rgba(245,192,0,0.4)" : "none",
                }}
              >
                {s.label}
              </div>
            );
          })}
          {unassigned.length === 0 && (
            <span style={{ fontSize: 12, color: "#4CAF50", fontWeight: 700, alignSelf: "center" }}>
              ✓ Todos os slots preenchidos
            </span>
          )}
        </div>
      </div>

      {/* Bracket columns */}
      <div style={{ display: "flex", gap: 0, alignItems: "stretch", overflowX: "auto", paddingBottom: 4 }}>
        {mpr.map((numMatches, ri) => {
          const r = ri + 1;
          const isRound1 = ri === 0;
          // Height of each match card in this round = totalH / numMatches
          const cardH = totalH / numMatches;

          return (
            <div key={r} style={{ display: "flex", alignItems: "stretch", flexShrink: 0 }}>
              {/* Connector between rounds */}
              {ri > 0 && (
                <div style={{ width: 32, display: "flex", flexDirection: "column", justifyContent: "center", alignItems: "center", position: "relative" }}>
                  {/* For each match in this round, draw a horizontal line */}
                  {Array.from({ length: numMatches }, (_, mi) => {
                    const matchH = totalH / numMatches;
                    const topOffset = mi * matchH + matchH / 2;
                    return (
                      <div key={mi} style={{ position: "absolute", top: topOffset - 1, left: 0, right: 0, height: 2, background: "#E8E8E8" }} />
                    );
                  })}
                </div>
              )}

              {/* Round column */}
              <div style={{ width: 200, flexShrink: 0 }}>
                {/* Round header */}
                {editingKey === `r-${r}` ? (
                  <input
                    autoFocus
                    value={rLabels[r] ?? ""}
                    onChange={e => setRLabels(prev => ({ ...prev, [r]: e.target.value }))}
                    onBlur={() => setEditingKey(null)}
                    onKeyDown={e => e.key === "Enter" && setEditingKey(null)}
                    style={{ width: "100%", padding: "6px 10px", fontSize: 11, fontWeight: 700, fontFamily: "var(--font-inter), sans-serif", border: "1.5px solid #F5C000", borderRadius: 0, background: "#111", color: "#F5C000", textTransform: "uppercase", letterSpacing: "0.08em", outline: "none", boxSizing: "border-box" }}
                  />
                ) : (
                  <div
                    onClick={() => setEditingKey(`r-${r}`)}
                    style={{ padding: "7px 12px", background: "#111", cursor: "text", display: "flex", alignItems: "center", justifyContent: "space-between" }}
                    title="Clica para editar o nome da ronda"
                  >
                    <div style={{ display: "flex", alignItems: "center", gap: 7 }}>
                      <span style={{ fontFamily: "var(--font-oswald), sans-serif", fontSize: 10, fontWeight: 700, color: "#F5C000", background: "rgba(245,192,0,0.15)", borderRadius: 4, padding: "1px 6px", letterSpacing: "0.1em" }}>R{r}</span>
                      <span style={{ fontSize: 11, fontWeight: 700, color: "#fff", textTransform: "uppercase", letterSpacing: "0.07em" }}>{rLabels[r]}</span>
                    </div>
                    <span style={{ fontSize: 9, color: "#555" }}>✎</span>
                  </div>
                )}

                {/* Match cards */}
                <div style={{ height: totalH, display: "flex", flexDirection: "column" }}>
                  {Array.from({ length: numMatches }, (_, mi) => {
                    const pos = mi + 1;
                    const mKey = `${r}-${pos}`;
                    const isEditing = editingKey === `m-${mKey}`;

                    const slot1Key = `${r}-${pos}-1`;
                    const slot2Key = `${r}-${pos}-2`;
                    const chip1 = assigns[slot1Key] ? allSources.find(s => s.key === assigns[slot1Key]) : null;
                    const chip2 = assigns[slot2Key] ? allSources.find(s => s.key === assigns[slot2Key]) : null;

                    // For round 2+, derive auto source labels
                    const auto1 = !isRound1 ? slotLabel(`W${r - 1}.${2 * pos - 1}`) : null;
                    const auto2 = !isRound1 ? slotLabel(`W${r - 1}.${2 * pos}`) : null;

                    return (
                      <div key={pos} style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", padding: "6px 8px", borderTop: mi > 0 ? "1px solid #f0f0f0" : "none" }}>
                        <div style={{ width: "100%", background: "#fff", borderRadius: 10, border: "1.5px solid #E8E8E8", overflow: "hidden", boxShadow: "0 1px 4px rgba(0,0,0,0.06)" }}>
                          {/* Match name */}
                          {isEditing ? (
                            <input
                              autoFocus
                              value={mLabels[mKey] ?? ""}
                              onChange={e => setMLabels(prev => ({ ...prev, [mKey]: e.target.value }))}
                              onBlur={() => setEditingKey(null)}
                              onKeyDown={e => e.key === "Enter" && setEditingKey(null)}
                              style={{ width: "100%", padding: "4px 10px", fontSize: 11, fontFamily: "var(--font-inter), sans-serif", fontWeight: 700, border: "none", borderBottom: "1.5px solid #F5C000", outline: "none", boxSizing: "border-box", color: "#111" }}
                            />
                          ) : (
                            <div
                              onClick={() => setEditingKey(`m-${mKey}`)}
                              style={{ padding: "5px 10px", fontSize: 11, fontWeight: 700, color: "#555", background: "#FAFAFA", borderBottom: "1px solid #F0F0F0", cursor: "text", display: "flex", justifyContent: "space-between" }}
                              title="Clica para editar o nome"
                            >
                              <span>{mLabels[mKey]}</span>
                              <span style={{ fontSize: 9, color: "#ccc" }}>✎</span>
                            </div>
                          )}

                          {/* Slots */}
                          <div style={{ padding: "6px 8px", display: "flex", flexDirection: "column", gap: 5 }}>
                            {[
                              { zKey: slot1Key, chip: chip1, auto: auto1, side: 1 },
                              { zKey: slot2Key, chip: chip2, auto: auto2, side: 2 },
                            ].map(({ zKey, chip, auto, side }) => {
                              const isDragOver = dragOver === zKey;
                              const isSelTarget = !!selected && !chip && isRound1;
                              return (
                                <div
                                  key={side}
                                  draggable={!!chip && isRound1}
                                  onDragStart={() => chip && (setDragging(chip.key), setSelected(null))}
                                  onDragEnd={() => setDragging(null)}
                                  onDragOver={e => { if (isRound1) { e.preventDefault(); setDragOver(zKey); } }}
                                  onDragLeave={() => setDragOver(null)}
                                  onDrop={e => { e.preventDefault(); if (isRound1 && dragging) { place(zKey, dragging); setDragging(null); setDragOver(null); } }}
                                  onClick={() => isRound1 && handleZoneClick(zKey)}
                                  style={{
                                    padding: "5px 9px",
                                    borderRadius: 7,
                                    border: `1.5px ${chip || auto ? "solid" : "dashed"} ${isDragOver || isSelTarget ? "#F5C000" : chip ? "#E0E0E0" : "#DDD"}`,
                                    background: isDragOver || isSelTarget ? "#FFFCE8" : chip ? "#F5F5F5" : "#FAFAFA",
                                    display: "flex",
                                    alignItems: "center",
                                    justifyContent: "space-between",
                                    minHeight: 30,
                                    cursor: isRound1 ? (chip ? "grab" : selected ? "copy" : "default") : "default",
                                    transition: "all 0.1s",
                                  }}
                                >
                                  {chip ? (
                                    <>
                                      <span style={{ fontSize: 11, fontWeight: 700, color: "#111" }}>{chip.label}</span>
                                      {isRound1 && (
                                        <button
                                          onClick={e => { e.stopPropagation(); remove(zKey); }}
                                          style={{ background: "none", border: "none", color: "#ccc", cursor: "pointer", fontSize: 13, padding: "0 2px", lineHeight: 1 }}
                                        >
                                          ×
                                        </button>
                                      )}
                                    </>
                                  ) : auto ? (
                                    <span style={{ fontSize: 11, color: "#aaa", fontStyle: "italic" }}>{auto}</span>
                                  ) : (
                                    <span style={{ fontSize: 10, color: isDragOver || isSelTarget ? "#8A6800" : "#ccc", fontStyle: "italic" }}>
                                      {isDragOver ? "Soltar →" : isSelTarget ? "Clica para colocar" : "Arrastar aqui…"}
                                    </span>
                                  )}
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Actions */}
      <div style={{ display: "flex", gap: 10, alignItems: "center", marginTop: 16 }}>
        {error && <span style={{ fontSize: 12, color: "#d32f2f", flex: 1 }}>{error}</span>}
        {!error && <div style={{ flex: 1 }} />}
        {onCancel && (
          <button type="button" onClick={onCancel} style={{ background: "#F0F0F0", border: "none", borderRadius: 8, padding: "8px 16px", fontSize: 13, fontWeight: 600, color: "#555", cursor: "pointer" }}>
            Cancelar
          </button>
        )}
        {onSave && (
          <button type="button" onClick={handleSave} disabled={saving} style={{ background: "#111", border: "none", borderRadius: 8, padding: "9px 20px", fontSize: 13, fontWeight: 700, color: "#F5C000", cursor: saving ? "not-allowed" : "pointer" }}>
            {saving ? "A guardar…" : "Confirmar estrutura →"}
          </button>
        )}
      </div>
    </div>
  );
}
