"use client";

import { useState } from "react";
import { Nav } from "@/components/nav";

type Tab = "proximos" | "decorrer" | "historico";

const TABS: { id: Tab; label: string }[] = [
  { id: "proximos", label: "Próximos" },
  { id: "decorrer", label: "A Decorrer" },
  { id: "historico", label: "Histórico" },
];

const QUARTER_MATCHES = [
  { p1: "Ana & Carlos", s1: 7, p2: "Rita & João", s2: 5, done: true },
  { p1: "Pedro & Sara", s1: 4, p2: "Miguel & Inês", s2: 7, done: true },
  { p1: "Rui & Marta", s1: null, p2: "Tiago & Sofia", s2: null, done: false },
  { p1: "Luís & Catarina", s1: null, p2: "Nuno & Beatriz", s2: null, done: false },
];

const SEMI_MATCHES = [
  { p1: "Ana & Carlos", p2: "Miguel & Inês", active: true },
  { p1: "A definir", p2: "A definir", active: false },
];

function MatchSlot({ p1, s1, p2, s2, done }: { p1: string; s1: number | null; p2: string; s2: number | null; done: boolean }) {
  const w1 = done && s1 !== null && s2 !== null && s1 > s2;
  const w2 = done && s1 !== null && s2 !== null && s2 > s1;
  return (
    <div style={{ minWidth: 170 }}>
      <div style={{ background: w1 ? "#F5C000" : done ? "#F9F9F9" : "#F0F0F0", border: done && !w1 ? "1px solid #eee" : "none", borderRadius: "7px 7px 0 0", padding: "8px 14px", display: "flex", justifyContent: "space-between", opacity: done ? 1 : 0.6 }}>
        <span style={{ fontSize: 13, fontWeight: w1 ? 700 : 400, color: w1 ? "#111" : "#666" }}>{p1}</span>
        <span style={{ fontSize: 13, fontWeight: w1 ? 800 : 600, color: w1 ? "#111" : "#888" }}>{s1 ?? "–"}</span>
      </div>
      <div style={{ background: w2 ? "#F5C000" : done ? "#F9F9F9" : "#F0F0F0", border: done && !w2 ? "1px solid #eee" : "none", borderTop: "none", borderRadius: "0 0 7px 7px", padding: "8px 14px", display: "flex", justifyContent: "space-between", opacity: done ? 1 : 0.6 }}>
        <span style={{ fontSize: 13, fontWeight: w2 ? 700 : 400, color: w2 ? "#111" : "#666" }}>{p2}</span>
        <span style={{ fontSize: 13, fontWeight: w2 ? 800 : 600, color: w2 ? "#111" : "#888" }}>{s2 ?? "–"}</span>
      </div>
    </div>
  );
}

export default function TorneiosPage() {
  const [tab, setTab] = useState<Tab>("proximos");

  return (
    <div style={{ minHeight: "100vh", background: "#F0F0F0", fontFamily: "var(--font-inter), sans-serif" }}>
      <Nav />

      {/* PAGE HEADER */}
      <div style={{ background: "#111", padding: "40px 32px 32px" }}>
        <h1 style={{ fontFamily: "var(--font-oswald), sans-serif", fontSize: 38, fontWeight: 700, color: "#fff", margin: "0 0 6px", letterSpacing: "0.03em" }}>
          TORNEIOS BTG
        </h1>
        <p style={{ color: "#888", fontSize: 15, margin: 0 }}>Inscreve-te, acompanha os quadros e vê os resultados.</p>
      </div>

      {/* TABS */}
      <div style={{ background: "#fff", borderBottom: "1px solid #eee", padding: "0 32px", display: "flex" }}>
        {TABS.map(({ id, label }) => (
          <button
            key={id}
            onClick={() => setTab(id)}
            style={{
              padding: "16px 24px",
              fontSize: 14,
              fontWeight: tab === id ? 700 : 500,
              color: tab === id ? "#111" : "#888",
              border: "none",
              background: "transparent",
              borderBottom: tab === id ? "3px solid #F5C000" : "3px solid transparent",
              cursor: "pointer",
            }}
          >
            {label}
          </button>
        ))}
      </div>

      <div style={{ padding: "32px", maxWidth: 1100 }}>

        {tab === "proximos" && (
          <div style={{ background: "#fff", borderRadius: 20, overflow: "hidden", boxShadow: "0 2px 16px rgba(0,0,0,0.08)", marginBottom: 20 }}>
            <div style={{ background: "#F5C000", padding: "24px 28px", display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: 12 }}>
              <div>
                <span style={{ background: "#111", color: "#F5C000", fontSize: 11, fontWeight: 700, padding: "3px 10px", borderRadius: 99, textTransform: "uppercase", letterSpacing: "0.08em" }}>Inscrições Abertas</span>
                <h2 style={{ fontFamily: "var(--font-oswald), sans-serif", fontSize: 28, fontWeight: 700, color: "#111", margin: "10px 0 0", letterSpacing: "0.02em" }}>TORNEIO DE VERÃO BTG 2026</h2>
              </div>
              <button style={{ background: "#111", color: "#F5C000", fontWeight: 700, padding: "12px 24px", borderRadius: 9, border: "none", fontSize: 15, cursor: "pointer", whiteSpace: "nowrap", marginTop: 4 }}>
                Inscrever-me →
              </button>
            </div>
            <div style={{ padding: "24px 28px", display: "flex", gap: 48, flexWrap: "wrap" }}>
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                {[
                  ["📅", "12 de Julho, 2026 · 9h00"],
                  ["📍", "Praia de Canide, Vila Nova de Gaia"],
                  ["🎾", "Duplas Mistas · Formato Eliminatório"],
                  ["👥", "Máximo 16 duplas (restam 5 vagas)"],
                ].map(([icon, text]) => (
                  <div key={text} style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 14, color: "#444" }}>
                    <span>{icon}</span> {text}
                  </div>
                ))}
              </div>
              <div style={{ minWidth: 220 }}>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13, color: "#666", marginBottom: 6 }}>
                  <span>Inscrições</span>
                  <span style={{ fontWeight: 700, color: "#111" }}>11 / 16</span>
                </div>
                <div style={{ background: "#F0F0F0", borderRadius: 99, height: 10, overflow: "hidden" }}>
                  <div style={{ width: "68%", background: "#F5C000", height: "100%", borderRadius: 99 }} />
                </div>
                <p style={{ fontSize: 12, color: "#F59E0B", fontWeight: 600, margin: "8px 0 0" }}>5 vagas restantes — inscreve-te já!</p>
              </div>
            </div>
          </div>
        )}

        {tab === "decorrer" && (
          <>
            {/* Bracket */}
            <div style={{ background: "#fff", borderRadius: 20, overflow: "hidden", boxShadow: "0 2px 16px rgba(0,0,0,0.08)", marginBottom: 20 }}>
              <div style={{ background: "#111", padding: "16px 24px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <span style={{ fontFamily: "var(--font-oswald), sans-serif", fontSize: 18, fontWeight: 600, color: "#fff", letterSpacing: "0.04em" }}>
                  COPA BTG PRIMAVERA · QUADRO
                </span>
                <span style={{ background: "#F5C000", color: "#111", fontSize: 11, fontWeight: 700, padding: "3px 10px", borderRadius: 99 }}>● A Decorrer</span>
              </div>
              <div style={{ padding: "24px 28px", overflowX: "auto" }}>
                <div style={{ display: "flex", gap: 40, minWidth: 600, alignItems: "flex-start" }}>

                  {/* Quartos */}
                  <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                    <div style={{ fontSize: 11, fontWeight: 700, color: "#999", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 8 }}>Quartos-de-Final</div>
                    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                      {QUARTER_MATCHES.map((m, i) => (
                        <MatchSlot key={i} {...m} />
                      ))}
                    </div>
                  </div>

                  {/* Connector */}
                  <div style={{ display: "flex", flexDirection: "column", gap: 62, paddingTop: 52 }}>
                    {[0, 1, 2, 3].map((i) => (
                      <div key={i} style={{ width: 20, height: 2, background: i < 2 ? "#ddd" : "#eee", opacity: i < 2 ? 1 : 0.5 }} />
                    ))}
                  </div>

                  {/* Meias */}
                  <div style={{ display: "flex", flexDirection: "column", gap: 4, marginTop: 28 }}>
                    <div style={{ fontSize: 11, fontWeight: 700, color: "#999", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 8 }}>Meias-Finais</div>
                    <div style={{ display: "flex", flexDirection: "column", gap: 60 }}>
                      {SEMI_MATCHES.map((m, i) => (
                        <div key={i} style={{ minWidth: 170 }}>
                          <div style={{ background: "#F9F9F9", border: m.active ? "2px solid #F5C000" : "1px solid #eee", borderRadius: "7px 7px 0 0", padding: "8px 14px", display: "flex", justifyContent: "space-between", opacity: m.active ? 1 : 0.5 }}>
                            <span style={{ fontSize: 13, fontWeight: m.active ? 600 : 400, color: m.active ? "#111" : "#888" }}>{m.p1}</span>
                            <span style={{ fontSize: 13, color: "#aaa" }}>–</span>
                          </div>
                          <div style={{ background: "#F9F9F9", border: m.active ? "2px solid #F5C000" : "1px solid #eee", borderTop: "none", borderRadius: "0 0 7px 7px", padding: "8px 14px", display: "flex", justifyContent: "space-between", opacity: m.active ? 1 : 0.5 }}>
                            <span style={{ fontSize: 13, fontWeight: m.active ? 600 : 400, color: m.active ? "#111" : "#888" }}>{m.p2}</span>
                            <span style={{ fontSize: 13, color: "#aaa" }}>–</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Final */}
                  <div style={{ marginTop: 76 }}>
                    <div style={{ fontSize: 11, fontWeight: 700, color: "#999", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 8 }}>Final</div>
                    <div style={{ minWidth: 170 }}>
                      <div style={{ background: "#111", borderRadius: "7px 7px 0 0", padding: "10px 16px", display: "flex", justifyContent: "space-between" }}>
                        <span style={{ fontSize: 13, fontWeight: 600, color: "#F5C000" }}>🏆 A definir</span>
                        <span style={{ fontSize: 13, color: "#555" }}>–</span>
                      </div>
                      <div style={{ background: "#1a1a1a", borderRadius: "0 0 7px 7px", borderTop: "1px solid #333", padding: "10px 16px", display: "flex", justifyContent: "space-between" }}>
                        <span style={{ fontSize: 13, color: "#555" }}>A definir</span>
                        <span style={{ fontSize: 13, color: "#555" }}>–</span>
                      </div>
                    </div>
                  </div>

                </div>
              </div>
            </div>
          </>
        )}

        {tab === "historico" && (
          <div style={{ background: "#fff", borderRadius: 20, padding: "40px 28px", textAlign: "center", boxShadow: "0 2px 16px rgba(0,0,0,0.06)" }}>
            <p style={{ fontFamily: "var(--font-oswald), sans-serif", fontSize: 22, color: "#111", margin: "0 0 8px" }}>HISTÓRICO DE TORNEIOS</p>
            <p style={{ fontSize: 14, color: "#888" }}>Em breve — resultados e classificações de torneios anteriores.</p>
          </div>
        )}

      </div>
    </div>
  );
}
