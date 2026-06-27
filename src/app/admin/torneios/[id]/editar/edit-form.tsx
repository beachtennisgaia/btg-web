"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

const inputStyle: React.CSSProperties = {
  width: "100%", padding: "10px 12px", border: "1.5px solid #e0e0e0",
  borderRadius: 8, fontSize: 14, fontFamily: "var(--font-inter), sans-serif",
  outline: "none", boxSizing: "border-box", color: "#111",
};
const labelStyle: React.CSSProperties = {
  fontSize: 12, fontWeight: 600, color: "#555", marginBottom: 6,
  display: "block", textTransform: "uppercase", letterSpacing: "0.05em",
};
const selectStyle: React.CSSProperties = { ...inputStyle, background: "#fff", cursor: "pointer" };

type Tournament = {
  id: string; name: string; date: string; location: string;
  format: string; category: string; registrationType: string;
  maxPairs: number; description: string; status: string;
  durationMinutes: number | null;
  totalDurationMinutes: number | null;
  numGroups: number | null;
  pairsAdvancing: number | null;
};

export function EditTournamentForm({ tournament }: { tournament: Tournament }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [format, setFormat] = useState(tournament.format);
  const [durationMinutes, setDurationMinutes] = useState(tournament.durationMinutes ?? 12);
  const [totalDurationMinutes, setTotalDurationMinutes] = useState(tournament.totalDurationMinutes ?? 120);
  const [numGroups, setNumGroups] = useState(tournament.numGroups ?? 1);
  const [pairsAdvancing, setPairsAdvancing] = useState(tournament.pairsAdvancing ?? 0);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError("");
    const formData = new FormData(e.currentTarget);
    const body = Object.fromEntries(formData.entries());
    try {
      const res = await fetch(`/api/admin/tournament/${tournament.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (!res.ok) throw new Error((await res.json()).error ?? "Erro");
      router.push(`/admin/torneios/${tournament.id}`);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro desconhecido");
      setLoading(false);
    }
  }

  return (
    <div style={{ background: "#fff", borderRadius: 16, padding: 28, boxShadow: "0 2px 8px rgba(0,0,0,0.06)" }}>
      <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 20 }}>
        <div>
          <label style={labelStyle}>Nome do torneio *</label>
          <input name="name" required defaultValue={tournament.name} style={inputStyle} />
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
          <div>
            <label style={labelStyle}>Data e hora *</label>
            <input name="date" type="datetime-local" required defaultValue={tournament.date} style={inputStyle} />
          </div>
          <div>
            <label style={labelStyle}>Máximo de inscrições *</label>
            <input name="maxPairs" type="number" required defaultValue={tournament.maxPairs} min={4} max={128} style={inputStyle} />
          </div>
        </div>

        <div>
          <label style={labelStyle}>Local *</label>
          <input name="location" required defaultValue={tournament.location} style={inputStyle} />
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
          <div>
            <label style={labelStyle}>Formato *</label>
            <select name="format" required style={selectStyle} value={format} onChange={(e) => setFormat(e.target.value)}>
              <option value="ELIMINATION">Eliminatório</option>
              <option value="NON_STOP">Non-Stop</option>
            </select>
          </div>
          <div>
            <label style={labelStyle}>Categoria *</label>
            <select name="category" required defaultValue={tournament.category} style={selectStyle}>
              <option value="MIXED">Duplas Mistas</option>
              <option value="MALE">Duplas Masculinas</option>
              <option value="FEMALE">Duplas Femininas</option>
              <option value="OPEN">Open</option>
            </select>
          </div>
        </div>

        {format === "NON_STOP" && (
          <div style={{ display: "flex", flexDirection: "column", gap: 14, padding: "16px", background: "#F9F9F9", borderRadius: 10, border: "1.5px solid #eee" }}>
            <p style={{ margin: 0, fontSize: 12, fontWeight: 700, color: "#555", textTransform: "uppercase", letterSpacing: "0.05em" }}>Configuração Non-Stop</p>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
              <div>
                <label style={labelStyle}>Duração por partida (min)</label>
                <input name="durationMinutes" type="number" value={durationMinutes} min={5} max={30} style={inputStyle}
                  onChange={(e) => setDurationMinutes(Number(e.target.value))} />
              </div>
              <div>
                <label style={labelStyle}>Duração total do evento (min)</label>
                <input name="totalDurationMinutes" type="number" value={totalDurationMinutes} min={30} max={480} style={inputStyle}
                  onChange={(e) => setTotalDurationMinutes(Number(e.target.value))} />
              </div>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
              <div>
                <label style={labelStyle}>Número de grupos</label>
                <select name="numGroups" style={selectStyle} value={numGroups} onChange={(e) => {
                  const v = Number(e.target.value);
                  setNumGroups(v);
                  if (v <= 1) setPairsAdvancing(0);
                }}>
                  <option value={1}>1 — Pool único</option>
                  <option value={2}>2 grupos</option>
                  <option value={3}>3 grupos</option>
                  <option value={4}>4 grupos</option>
                </select>
              </div>
              {numGroups > 1 && (
                <div>
                  <label style={labelStyle}>Duplas que avançam por grupo</label>
                  <select name="pairsAdvancing" style={selectStyle} value={pairsAdvancing} onChange={(e) => setPairsAdvancing(Number(e.target.value))}>
                    <option value={0}>0 — Sem finais, campeão por grupo</option>
                    <option value={1}>1 — Top 1 avança para final</option>
                    <option value={2}>2 — Top 2 avançam para final</option>
                    <option value={3}>3 — Top 3 avançam para final</option>
                    <option value={4}>4 — Top 4 avançam para final</option>
                  </select>
                </div>
              )}
            </div>

            <div style={{ background: "#fff", borderRadius: 8, padding: "9px 13px", fontSize: 12, color: "#555", border: "1px solid #eee" }}>
              <strong>{Math.floor(totalDurationMinutes / (durationMinutes || 1))} rondas</strong>
              {numGroups > 1 ? ` por grupo · ${numGroups} grupos independentes` : " · todas as duplas jogam em simultâneo"}
              {numGroups > 1 && pairsAdvancing > 0 ? ` · Top ${pairsAdvancing} de cada grupo avança` : ""}
              {numGroups > 1 && pairsAdvancing === 0 ? " · Campeão independente em cada grupo" : ""}
            </div>
          </div>
        )}

        <div>
          <label style={labelStyle}>Tipo de inscrição *</label>
          <select name="registrationType" required defaultValue={tournament.registrationType} style={selectStyle}>
            <option value="PAIRS">Em dupla — cada sócio inscreve-se com um parceiro</option>
            <option value="INDIVIDUAL">Individual — cada sócio inscreve-se sozinho</option>
          </select>
        </div>

        <div>
          <label style={labelStyle}>Descrição</label>
          <textarea
            name="description"
            rows={3}
            defaultValue={tournament.description}
            placeholder="Informações adicionais sobre o torneio..."
            style={{ ...inputStyle, resize: "vertical" }}
          />
        </div>

        {tournament.status !== "DRAFT" && (
          <p style={{ fontSize: 12, color: "#F5A623", background: "#FFF8E6", padding: "10px 14px", borderRadius: 8, margin: 0 }}>
            ⚠️ Este torneio já tem inscrições. Altera o máximo de inscrições com cuidado.
          </p>
        )}

        {error && (
          <p style={{ fontSize: 13, color: "#d32f2f", background: "#ffeaea", padding: "10px 14px", borderRadius: 8, margin: 0 }}>
            {error}
          </p>
        )}

        <div style={{ display: "flex", gap: 10 }}>
          <button
            type="submit"
            disabled={loading}
            style={{ flex: 1, background: loading ? "#ccc" : "#F5C000", color: "#111", fontWeight: 700, padding: "13px 0", borderRadius: 9, border: "none", fontSize: 15, cursor: loading ? "not-allowed" : "pointer" }}
          >
            {loading ? "A guardar…" : "Guardar alterações"}
          </button>
          <button
            type="button"
            onClick={() => router.back()}
            style={{ background: "#F0F0F0", color: "#555", fontWeight: 600, padding: "13px 20px", borderRadius: 9, border: "none", fontSize: 15, cursor: "pointer" }}
          >
            Cancelar
          </button>
        </div>
      </form>
    </div>
  );
}
