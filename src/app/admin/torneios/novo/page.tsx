"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { BracketBuilder, defaultBracket, defaultEliminationBracket } from "@/components/bracket-builder";
import type { FinalsBracketTemplate } from "@/components/bracket-builder";

const inputStyle: React.CSSProperties = { width: "100%", padding: "10px 12px", border: "1.5px solid #e0e0e0", borderRadius: 8, fontSize: 14, fontFamily: "var(--font-inter), sans-serif", outline: "none", boxSizing: "border-box", color: "#111" };
const labelStyle: React.CSSProperties = { fontSize: 12, fontWeight: 600, color: "#555", marginBottom: 6, display: "block", textTransform: "uppercase", letterSpacing: "0.05em" };
const selectStyle: React.CSSProperties = { ...inputStyle, background: "#fff", cursor: "pointer" };

export default function NovoTorneioPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [format, setFormat] = useState("ELIMINATION");
  const [isPaid, setIsPaid] = useState(false);
  const [durationMinutes, setDurationMinutes] = useState(12);
  const [totalDurationMinutes, setTotalDurationMinutes] = useState(120);
  const [numGroups, setNumGroups] = useState(1);
  const [pairsAdvancing, setPairsAdvancing] = useState(0);
  const [bracketSize, setBracketSize] = useState(8);
  const [finalsTemplate, setFinalsTemplate] = useState<FinalsBracketTemplate>(() => defaultEliminationBracket(8));

  const isNonStop = format === "NON_STOP";
  const isElimination = format === "ELIMINATION";
  const hasBracket = (isNonStop && pairsAdvancing > 0) || isElimination;

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
    <div style={{ padding: 32, maxWidth: (isNonStop || isElimination) ? 1140 : 680 }}>
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontFamily: "var(--font-oswald), sans-serif", fontSize: 28, fontWeight: 700, color: "#111", margin: 0 }}>CRIAR TORNEIO</h1>
        <p style={{ color: "#888", fontSize: 14, margin: "4px 0 0" }}>O torneio fica em rascunho até abrires as inscrições.</p>
      </div>

      <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 24 }}>
        {/* ── Top section: two columns when NON_STOP ── */}
        <div style={{
          display: "grid",
          gridTemplateColumns: (isNonStop || isElimination) ? "minmax(0,1fr) minmax(0,1fr)" : "1fr",
          gap: 24,
          alignItems: "start",
        }}>
          {/* Left: basic info */}
          <div style={{ background: "#fff", borderRadius: 16, padding: 28, boxShadow: "0 2px 8px rgba(0,0,0,0.06)", display: "flex", flexDirection: "column", gap: 20 }}>
            <div>
              <label style={labelStyle}>Nome do torneio *</label>
              <input name="name" required placeholder="Ex: Torneio de Verão BTG 2026" style={inputStyle} />
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
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

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
              <div>
                <label style={labelStyle}>Formato *</label>
                <select name="format" required style={selectStyle} value={format} onChange={(e) => {
                  const v = e.target.value;
                  setFormat(v);
                  if (v === "ELIMINATION") setFinalsTemplate(defaultEliminationBracket(bracketSize));
                  else if (v === "NON_STOP" && numGroups > 1 && pairsAdvancing > 0) setFinalsTemplate(defaultBracket(numGroups, pairsAdvancing));
                  else setFinalsTemplate([]);
                }}>
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

            <div>
              <label style={labelStyle}>Tipo de inscrição *</label>
              <select name="registrationType" required style={selectStyle}>
                <option value="PAIRS">Em dupla — cada sócio inscreve-se com um parceiro</option>
                <option value="INDIVIDUAL">Individual — cada sócio inscreve-se sozinho</option>
              </select>
              <p style={{ fontSize: 11, color: "#999", margin: "5px 0 0" }}>Non-Stop usa normalmente inscrição individual; eliminatório usa duplas.</p>
            </div>

            <div>
              <label style={labelStyle}>Descrição</label>
              <textarea name="description" rows={3} placeholder="Informações adicionais sobre o torneio..." style={{ ...inputStyle, resize: "vertical" }} />
            </div>

            {/* Payment */}
            <div style={{ display: "grid", gridTemplateColumns: isPaid ? "1fr 1fr" : "1fr", gap: 14 }}>
              <div>
                <label style={labelStyle}>Inscrição paga?</label>
                <select name="isPaid" style={selectStyle} value={isPaid ? "true" : "false"} onChange={(e) => setIsPaid(e.target.value === "true")}>
                  <option value="false">Não — torneio gratuito</option>
                  <option value="true">Sim — participantes pagam</option>
                </select>
              </div>
              {isPaid && (
                <div>
                  <label style={labelStyle}>Preço por participante (€)</label>
                  <input name="pricePerPlayer" type="number" min={0} step={0.5} required placeholder="Ex: 5" style={inputStyle} />
                </div>
              )}
            </div>
          </div>

          {/* Right: ELIMINATION configuration */}
          {isElimination && (
            <div style={{ background: "#fff", borderRadius: 16, padding: 28, boxShadow: "0 2px 8px rgba(0,0,0,0.06)", display: "flex", flexDirection: "column", gap: 20 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <div style={{ width: 3, height: 20, background: "#F5C000", borderRadius: 2 }} />
                <span style={{ fontFamily: "var(--font-oswald), sans-serif", fontSize: 16, fontWeight: 700, color: "#111", letterSpacing: "0.04em" }}>CONFIGURAÇÃO ELIMINATÓRIO</span>
              </div>

              <div>
                <label style={labelStyle}>Tamanho do quadro *</label>
                <select name="bracketSize" style={selectStyle} value={bracketSize} onChange={(e) => {
                  const v = Number(e.target.value);
                  setBracketSize(v);
                  setFinalsTemplate(defaultEliminationBracket(v));
                }}>
                  <option value={2}>2 duplas — Final directa</option>
                  <option value={4}>4 duplas — Meias-Finais + Final</option>
                  <option value={8}>8 duplas — Quartas + Meias + Final</option>
                  <option value={16}>16 duplas — Oitavos + Quartas + Meias + Final</option>
                  <option value={32}>32 duplas — 1/16 + Oitavos + Quartas + Meias + Final</option>
                </select>
                <p style={{ fontSize: 11, color: "#999", margin: "5px 0 0" }}>
                  Os cabeças de chave são atribuídos depois das inscrições fecharem.
                </p>
              </div>

              <div style={{ background: "#F9F9F9", borderRadius: 8, padding: "10px 14px", fontSize: 12, color: "#555", lineHeight: 1.6 }}>
                <strong>{bracketSize} participantes</strong> · {Math.log2(bracketSize)} rondas · eliminação directa
              </div>
            </div>
          )}

          {/* Right: NON_STOP configuration */}
          {isNonStop && (
            <div style={{ background: "#fff", borderRadius: 16, padding: 28, boxShadow: "0 2px 8px rgba(0,0,0,0.06)", display: "flex", flexDirection: "column", gap: 20 }}>
              <div>
                <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 20 }}>
                  <div style={{ width: 3, height: 20, background: "#F5C000", borderRadius: 2 }} />
                  <span style={{ fontFamily: "var(--font-oswald), sans-serif", fontSize: 16, fontWeight: 700, color: "#111", letterSpacing: "0.04em" }}>CONFIGURAÇÃO NON-STOP</span>
                </div>

                <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
                    <div>
                      <label style={labelStyle}>Duração por partida (min) *</label>
                      <input name="durationMinutes" type="number" required value={durationMinutes} min={5} max={30} style={inputStyle}
                        onChange={(e) => setDurationMinutes(Number(e.target.value))} />
                    </div>
                    <div>
                      <label style={labelStyle}>Duração total do evento (min) *</label>
                      <input name="totalDurationMinutes" type="number" required value={totalDurationMinutes} min={30} max={480} style={inputStyle}
                        onChange={(e) => setTotalDurationMinutes(Number(e.target.value))} />
                    </div>
                  </div>

                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
                    <div>
                      <label style={labelStyle}>Número de grupos</label>
                      <select name="numGroups" style={selectStyle} value={numGroups} onChange={(e) => {
                        const v = Number(e.target.value);
                        setNumGroups(v);
                        if (pairsAdvancing > 0) setFinalsTemplate(defaultBracket(v, pairsAdvancing));
                      }}>
                        <option value={1}>1 — Pool único</option>
                        <option value={2}>2 grupos</option>
                        <option value={3}>3 grupos</option>
                        <option value={4}>4 grupos</option>
                      </select>
                    </div>
                    <div>
                      <label style={labelStyle}>{numGroups > 1 ? "Duplas que avançam por grupo" : "Fase final"}</label>
                      <select name="pairsAdvancing" style={selectStyle} value={pairsAdvancing} onChange={(e) => {
                        const v = Number(e.target.value);
                        setPairsAdvancing(v);
                        setFinalsTemplate(v > 0 ? defaultBracket(numGroups, v) : []);
                      }}>
                        <option value={0}>{numGroups > 1 ? "0 — Sem finais, campeão por grupo" : "Sem fase final"}</option>
                        <option value={1}>{numGroups > 1 ? "1 — Top 1 avança" : "Top 1 faz final (1ª vs 2ª)"}</option>
                        <option value={2}>{numGroups > 1 ? "2 — Top 2 avançam" : "Top 2 fazem meias + final"}</option>
                        <option value={3}>{numGroups > 1 ? "3 — Top 3 avançam" : "Top 3 avançam"}</option>
                        <option value={4}>{numGroups > 1 ? "4 — Top 4 avançam" : "Top 4 avançam"}</option>
                      </select>
                    </div>
                  </div>

                  {/* Summary pill */}
                  <div style={{ background: "#F9F9F9", borderRadius: 8, padding: "10px 14px", fontSize: 12, color: "#555", lineHeight: 1.6 }}>
                    <strong>{Math.floor(totalDurationMinutes / (durationMinutes || 1))} rondas</strong>
                    {numGroups > 1 ? ` por grupo · ${numGroups} grupos independentes` : " · pool único, todas as duplas jogam entre si"}
                    {pairsAdvancing > 0 && numGroups > 1 ? ` · Top ${pairsAdvancing} de cada grupo avança para a fase final` : ""}
                    {pairsAdvancing > 0 && numGroups <= 1 ? ` · Top ${pairsAdvancing} do pool jogam fase final` : ""}
                    {pairsAdvancing === 0 && numGroups > 1 ? " · Campeão independente em cada grupo" : ""}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* ── Bracket builder — full width ── */}
        {hasBracket && (
          <div style={{ background: "#fff", borderRadius: 16, padding: 28, boxShadow: "0 2px 8px rgba(0,0,0,0.06)" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 20 }}>
              <div style={{ width: 3, height: 20, background: "#F5C000", borderRadius: 2 }} />
              <span style={{ fontFamily: "var(--font-oswald), sans-serif", fontSize: 16, fontWeight: 700, color: "#111", letterSpacing: "0.04em" }}>CRUZAMENTOS DA FASE FINAL</span>
              <span style={{ fontSize: 12, color: "#888" }}>— arrasta as classificações para os slots</span>
            </div>
            {isElimination ? (
              <BracketBuilder
                numSeeds={bracketSize}
                initial={finalsTemplate.length > 0 ? finalsTemplate : null}
                onChange={setFinalsTemplate}
              />
            ) : (
              <BracketBuilder
                numGroups={numGroups}
                pairsAdvancing={pairsAdvancing}
                initial={finalsTemplate.length > 0 ? finalsTemplate : null}
                onChange={setFinalsTemplate}
              />
            )}
            <input type="hidden" name="finalsTemplate" value={JSON.stringify(finalsTemplate)} />
          </div>
        )}

        {/* ── Error + Submit ── */}
        {error && <p style={{ fontSize: 13, color: "#d32f2f", background: "#ffeaea", padding: "10px 14px", borderRadius: 8, margin: 0 }}>{error}</p>}

        <div style={{ display: "flex", gap: 10 }}>
          <button type="submit" disabled={loading} style={{ flex: 1, background: loading ? "#ccc" : "#F5C000", color: "#111", fontWeight: 700, padding: "13px 0", borderRadius: 9, border: "none", fontSize: 15, cursor: loading ? "not-allowed" : "pointer" }}>
            {loading ? "A criar…" : "Criar torneio"}
          </button>
          <button type="button" onClick={() => router.back()} style={{ background: "#F0F0F0", color: "#555", fontWeight: 600, padding: "13px 24px", borderRadius: 9, border: "none", fontSize: 15, cursor: "pointer" }}>
            Cancelar
          </button>
        </div>
      </form>
    </div>
  );
}
