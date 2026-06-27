"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

const inputStyle: React.CSSProperties = { width: "100%", padding: "10px 12px", border: "1.5px solid #e0e0e0", borderRadius: 8, fontSize: 14, fontFamily: "var(--font-inter), sans-serif", outline: "none", boxSizing: "border-box", color: "#111" };
const labelStyle: React.CSSProperties = { fontSize: 12, fontWeight: 600, color: "#555", marginBottom: 6, display: "block", textTransform: "uppercase", letterSpacing: "0.05em" };
const selectStyle: React.CSSProperties = { ...inputStyle, background: "#fff", cursor: "pointer" };

export default function NovoTorneioPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [format, setFormat] = useState("ELIMINATION");

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError("");
    const formData = new FormData(e.currentTarget);
    try {
      const res = await fetch("/api/admin/tournament", { method: "POST", body: formData });
      if (!res.ok) throw new Error((await res.json()).error ?? "Erro");
      router.push("/admin/torneios");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro desconhecido");
      setLoading(false);
    }
  }

  return (
    <div style={{ padding: 32, maxWidth: 640 }}>
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontFamily: "var(--font-oswald), sans-serif", fontSize: 28, fontWeight: 700, color: "#111", margin: 0 }}>CRIAR TORNEIO</h1>
        <p style={{ color: "#888", fontSize: 14, margin: "4px 0 0" }}>O torneio fica em rascunho até abrires as inscrições.</p>
      </div>

      <div style={{ background: "#fff", borderRadius: 16, padding: 28, boxShadow: "0 2px 8px rgba(0,0,0,0.06)" }}>
        <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 20 }}>
          <div>
            <label style={labelStyle}>Nome do torneio *</label>
            <input name="name" required placeholder="Ex: Torneio de Verão BTG 2026" style={inputStyle} />
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
            <div>
              <label style={labelStyle}>Data e hora *</label>
              <input name="date" type="datetime-local" required style={inputStyle} />
            </div>
            <div>
              <label style={labelStyle}>Máximo de duplas *</label>
              <input name="maxPairs" type="number" required defaultValue={16} min={4} max={64} style={inputStyle} />
            </div>
          </div>

          <div>
            <label style={labelStyle}>Local *</label>
            <input name="location" required placeholder="Ex: Praia de Canide, Vila Nova de Gaia" style={inputStyle} />
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
              <select name="category" required style={selectStyle}>
                <option value="MIXED">Duplas Mistas</option>
                <option value="MALE">Duplas Masculinas</option>
                <option value="FEMALE">Duplas Femininas</option>
                <option value="OPEN">Open</option>
              </select>
            </div>
          </div>

          {format === "NON_STOP" && (
            <div>
              <label style={labelStyle}>Duração por partida (minutos) *</label>
              <input name="durationMinutes" type="number" required defaultValue={12} min={5} max={30} style={inputStyle} />
              <p style={{ fontSize: 11, color: "#999", margin: "6px 0 0" }}>
                Tempo de jogo por partida. Quadras = nº de duplas ÷ 2 (todas jogam em simultâneo).
              </p>
            </div>
          )}

          <div>
            <label style={labelStyle}>Tipo de inscrição *</label>
            <select name="registrationType" required style={selectStyle}>
              <option value="PAIRS">Em dupla — cada sócio inscreve-se com um parceiro</option>
              <option value="INDIVIDUAL">Individual — cada sócio inscreve-se sozinho</option>
            </select>
            <p style={{ fontSize: 11, color: "#999", margin: "6px 0 0" }}>
              Non-Stop usa normalmente inscrição individual; eliminatório usa duplas.
            </p>
          </div>

          <div>
            <label style={labelStyle}>Descrição</label>
            <textarea name="description" rows={3} placeholder="Informações adicionais sobre o torneio..." style={{ ...inputStyle, resize: "vertical" }} />
          </div>

          {error && <p style={{ fontSize: 13, color: "#d32f2f", background: "#ffeaea", padding: "10px 14px", borderRadius: 8, margin: 0 }}>{error}</p>}

          <div style={{ display: "flex", gap: 10, marginTop: 4 }}>
            <button type="submit" disabled={loading} style={{ flex: 1, background: loading ? "#ccc" : "#F5C000", color: "#111", fontWeight: 700, padding: "13px 0", borderRadius: 9, border: "none", fontSize: 15, cursor: loading ? "not-allowed" : "pointer" }}>
              {loading ? "A criar…" : "Criar torneio"}
            </button>
            <button type="button" onClick={() => router.back()} style={{ background: "#F0F0F0", color: "#555", fontWeight: 600, padding: "13px 20px", borderRadius: 9, border: "none", fontSize: 15, cursor: "pointer" }}>
              Cancelar
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
