"use client";

import { useState } from "react";
import type { BracketEntry, FinalsBracketTemplate } from "@/lib/actions";

export { type BracketEntry, type FinalsBracketTemplate };

export function slotLabel(slot: string): string {
  const m = slot.match(/^G(\d+)R(\d+)$/);
  if (!m) return slot;
  return `${m[2]}º Grupo ${String.fromCharCode(64 + parseInt(m[1]))}`;
}

export function defaultBracket(numGroups: number, pairsAdvancing: number): FinalsBracketTemplate {
  if (numGroups < 2 || pairsAdvancing < 1) return [];
  const entries: BracketEntry[] = [];
  let pos = 1;

  if (numGroups === 2 && pairsAdvancing === 1) {
    entries.push({ round: 1, position: pos++, label: "Final", slot1: "G1R1", slot2: "G2R1" });
  } else if (numGroups === 2 && pairsAdvancing === 2) {
    entries.push({ round: 1, position: pos++, label: "Semifinal 1", slot1: "G1R1", slot2: "G2R2" });
    entries.push({ round: 1, position: pos++, label: "Semifinal 2", slot1: "G2R1", slot2: "G1R2" });
  } else {
    // Generic: each group's top vs next group's bottom (round-robin of slots)
    for (let g = 1; g <= numGroups; g++) {
      for (let r = 1; r <= pairsAdvancing; r++) {
        const oppG = (g % numGroups) + 1;
        const oppR = pairsAdvancing + 1 - r;
        const slot1 = `G${g}R${r}`;
        const slot2 = `G${oppG}R${oppR}`;
        if (slot1 < slot2) {
          entries.push({ round: 1, position: pos++, label: `Partida ${pos - 1}`, slot1, slot2 });
        }
      }
    }
  }
  return entries;
}

type Props = {
  numGroups: number;
  pairsAdvancing: number;
  initial?: FinalsBracketTemplate | null;
  /** Called on every change — use for form embedding */
  onChange?: (template: FinalsBracketTemplate) => void;
  /** When provided, shows a save/confirm button */
  onSave?: (template: FinalsBracketTemplate) => Promise<void>;
  onCancel?: () => void;
};

const inputSt: React.CSSProperties = {
  padding: "6px 10px", border: "1.5px solid #e0e0e0", borderRadius: 7,
  fontSize: 13, background: "#fff", cursor: "pointer", color: "#111",
  fontFamily: "var(--font-inter), sans-serif",
};

export function BracketBuilder({ numGroups, pairsAdvancing, initial, onChange, onSave, onCancel }: Props) {
  const [entries, setEntries] = useState<BracketEntry[]>(
    initial && initial.length > 0 ? initial : defaultBracket(numGroups, pairsAdvancing)
  );
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const slots: { key: string; label: string }[] = [];
  for (let g = 1; g <= numGroups; g++)
    for (let r = 1; r <= pairsAdvancing; r++)
      slots.push({ key: `G${g}R${r}`, label: slotLabel(`G${g}R${r}`) });

  function update(next: BracketEntry[]) {
    setEntries(next);
    onChange?.(next);
  }

  function addMatch() {
    const next = [...entries, {
      round: 1,
      position: entries.length + 1,
      label: `Partida ${entries.length + 1}`,
      slot1: slots[0]?.key ?? "",
      slot2: slots[1]?.key ?? "",
    }];
    update(next);
  }

  function removeMatch(idx: number) {
    update(entries.filter((_, i) => i !== idx).map((e, i) => ({ ...e, position: i + 1 })));
  }

  function updateField(idx: number, field: keyof BracketEntry, value: string | number) {
    update(entries.map((e, i) => i === idx ? { ...e, [field]: value } : e));
  }

  async function handleSave() {
    if (!onSave) return;
    if (entries.some(e => !e.slot1 || !e.slot2)) { setError("Todos os cruzamentos precisam de dois participantes."); return; }
    setError("");
    setSaving(true);
    try { await onSave(entries); } catch (e) { setError((e as Error).message); }
    finally { setSaving(false); }
  }

  return (
    <div>
      {/* Slot chips */}
      <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 14 }}>
        {slots.map(s => (
          <span key={s.key} style={{ background: "#F5C000", color: "#111", fontSize: 11, fontWeight: 700, padding: "3px 10px", borderRadius: 99 }}>
            {s.label}
          </span>
        ))}
      </div>

      {/* Match rows */}
      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        {entries.map((entry, idx) => (
          <div key={idx} style={{ display: "grid", gridTemplateColumns: "140px 1fr auto 1fr auto auto", gap: 8, alignItems: "center", background: "#F9F9F9", borderRadius: 10, padding: "10px 12px", border: "1px solid #eee" }}>
            <input
              value={entry.label}
              onChange={e => updateField(idx, "label", e.target.value)}
              placeholder="Ex: Semifinal 1"
              style={{ ...inputSt, width: "100%", boxSizing: "border-box" }}
            />
            <select value={entry.slot1} onChange={e => updateField(idx, "slot1", e.target.value)} style={{ ...inputSt, width: "100%" }}>
              {slots.map(s => <option key={s.key} value={s.key}>{s.label}</option>)}
            </select>
            <span style={{ color: "#aaa", fontSize: 12, fontWeight: 700, textAlign: "center" }}>vs</span>
            <select value={entry.slot2} onChange={e => updateField(idx, "slot2", e.target.value)} style={{ ...inputSt, width: "100%" }}>
              {slots.map(s => <option key={s.key} value={s.key}>{s.label}</option>)}
            </select>
            <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
              <span style={{ fontSize: 11, color: "#888", whiteSpace: "nowrap" }}>Ronda</span>
              <select value={entry.round} onChange={e => updateField(idx, "round", Number(e.target.value))} style={{ ...inputSt, width: 54 }}>
                {[1, 2, 3, 4].map(r => <option key={r} value={r}>{r}</option>)}
              </select>
            </div>
            <button onClick={() => removeMatch(idx)} style={{ background: "#FFEAEA", border: "none", borderRadius: 7, padding: "6px 10px", fontSize: 13, color: "#d32f2f", cursor: "pointer", fontWeight: 700 }}>×</button>
          </div>
        ))}
      </div>

      {/* Actions */}
      <div style={{ display: "flex", gap: 10, marginTop: 12, alignItems: "center" }}>
        <button type="button" onClick={addMatch} style={{ background: "#F0F0F0", border: "none", borderRadius: 8, padding: "8px 16px", fontSize: 13, fontWeight: 600, color: "#555", cursor: "pointer" }}>
          + Adicionar partida
        </button>
        <div style={{ flex: 1 }} />
        {error && <span style={{ fontSize: 12, color: "#d32f2f" }}>{error}</span>}
        {onCancel && (
          <button type="button" onClick={onCancel} style={{ background: "#F0F0F0", border: "none", borderRadius: 8, padding: "8px 16px", fontSize: 13, fontWeight: 600, color: "#555", cursor: "pointer" }}>
            Cancelar
          </button>
        )}
        {onSave && (
          <button type="button" onClick={handleSave} disabled={saving || entries.length === 0} style={{ background: "#111", border: "none", borderRadius: 8, padding: "9px 20px", fontSize: 13, fontWeight: 700, color: "#F5C000", cursor: "pointer" }}>
            {saving ? "A guardar…" : "Confirmar cruzamentos →"}
          </button>
        )}
      </div>
    </div>
  );
}
