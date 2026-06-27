"use client";

import { useState, useTransition } from "react";
import { drawPairs } from "@/lib/actions";

const LEVEL_LABEL = { BEGINNER: "Iniciante", INTERMEDIATE: "Intermédio", ADVANCED: "Avançado" };
const LEVEL_COLOR = { BEGINNER: "#4CAF50", INTERMEDIATE: "#FF9800", ADVANCED: "#F44336" };

type Pair = { player1: string; player2: string; level1: string; level2: string };

export function DrawSection({
  tournamentId,
  soloCount,
  isMixed,
}: {
  tournamentId: string;
  soloCount: number;
  isMixed: boolean;
}) {
  const [result, setResult] = useState<Pair[] | null>(null);
  const [error, setError] = useState("");
  const [pending, startTransition] = useTransition();

  function handleDraw() {
    setError("");
    setResult(null);
    startTransition(async () => {
      try {
        const pairs = await drawPairs(tournamentId);
        setResult(pairs);
      } catch (e) {
        setError((e as Error).message);
      }
    });
  }

  if (soloCount < 2) return null;

  return (
    <div style={{ background: "#fff", borderRadius: 16, overflow: "hidden", boxShadow: "0 2px 8px rgba(0,0,0,0.06)", marginTop: 16 }}>
      <div style={{ background: "#D4A800", padding: "14px 20px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div>
          <span style={{ fontFamily: "var(--font-oswald), sans-serif", fontSize: 16, fontWeight: 600, color: "#111", letterSpacing: "0.04em" }}>
            SORTEIO DE DUPLAS
          </span>
          <span style={{ fontSize: 13, color: "#7A5900", marginLeft: 10 }}>
            {soloCount} inscrições individuais sem par
          </span>
        </div>
        <button
          onClick={handleDraw}
          disabled={pending}
          style={{ background: "#111", border: "none", borderRadius: 8, padding: "7px 18px", fontWeight: 700, fontSize: 13, color: "#F5C000", cursor: "pointer" }}
        >
          {pending ? "A sortear…" : result ? "Novo sorteio 🔀" : "Realizar sorteio 🎲"}
        </button>
      </div>

      {error && (
        <div style={{ padding: "10px 20px", background: "#FFF3F3", color: "#d32f2f", fontSize: 13 }}>{error}</div>
      )}

      {!result && !error && (
        <div style={{ padding: "20px 24px", fontSize: 14, color: "#888" }}>
          {isMixed
            ? "O sorteio emparelha masculino com feminino e equilibra os níveis (avançado com iniciante)."
            : "O sorteio equilibra os níveis (avançado com iniciante) de forma aleatória."}
        </div>
      )}

      {result && (
        <div style={{ padding: "16px 20px" }}>
          <p style={{ fontSize: 13, color: "#888", margin: "0 0 14px" }}>
            {result.length} duplas formadas. As inscrições individuais foram atualizadas.
          </p>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {result.map((pair, i) => (
              <div key={i} style={{ display: "flex", alignItems: "center", gap: 12, padding: "10px 14px", background: "#F9F9F9", borderRadius: 10 }}>
                <span style={{ fontFamily: "var(--font-oswald), sans-serif", fontSize: 15, fontWeight: 700, color: "#bbb", minWidth: 24 }}>#{i + 1}</span>
                <div style={{ flex: 1, display: "flex", alignItems: "center", gap: 8 }}>
                  <span style={{ fontSize: 14, fontWeight: 600, color: "#111" }}>{pair.player1}</span>
                  <span style={{ fontSize: 11, background: LEVEL_COLOR[pair.level1 as keyof typeof LEVEL_COLOR] + "20", color: LEVEL_COLOR[pair.level1 as keyof typeof LEVEL_COLOR], padding: "2px 7px", borderRadius: 99, fontWeight: 700 }}>
                    {LEVEL_LABEL[pair.level1 as keyof typeof LEVEL_LABEL]}
                  </span>
                </div>
                <span style={{ fontSize: 13, color: "#bbb", fontWeight: 700 }}>+</span>
                <div style={{ flex: 1, display: "flex", alignItems: "center", gap: 8 }}>
                  <span style={{ fontSize: 14, fontWeight: 600, color: "#111" }}>{pair.player2}</span>
                  <span style={{ fontSize: 11, background: LEVEL_COLOR[pair.level2 as keyof typeof LEVEL_COLOR] + "20", color: LEVEL_COLOR[pair.level2 as keyof typeof LEVEL_COLOR], padding: "2px 7px", borderRadius: 99, fontWeight: 700 }}>
                    {LEVEL_LABEL[pair.level2 as keyof typeof LEVEL_LABEL]}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
