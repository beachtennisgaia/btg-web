"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

const LEVELS = [
  { value: "BEGINNER", label: "Iniciante" },
  { value: "INTERMEDIATE", label: "Intermédio" },
  { value: "ADVANCED", label: "Avançado" },
];

export function Onboarding({ email, name: initialName }: { email: string; name: string }) {
  const router = useRouter();
  const [name, setName] = useState(initialName);
  const [phone, setPhone] = useState("");
  const [level, setLevel] = useState("BEGINNER");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/member", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, phone, level }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error ?? "Erro ao criar perfil");
      }
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro desconhecido");
      setLoading(false);
    }
  }

  const inputStyle: React.CSSProperties = {
    width: "100%",
    padding: "12px 14px",
    border: "1.5px solid #eee",
    borderRadius: 9,
    fontSize: 15,
    fontFamily: "var(--font-inter), sans-serif",
    outline: "none",
    boxSizing: "border-box",
    color: "#111",
  };

  const labelStyle: React.CSSProperties = {
    fontSize: 13,
    fontWeight: 600,
    color: "#555",
    marginBottom: 6,
    display: "block",
  };

  return (
    <div style={{ minHeight: "calc(100vh - 72px)", display: "flex", alignItems: "center", justifyContent: "center", padding: 24, background: "#F0F0F0" }}>
      <div style={{ background: "#fff", borderRadius: 20, overflow: "hidden", boxShadow: "0 4px 24px rgba(0,0,0,0.10)", width: "100%", maxWidth: 460 }}>
        {/* Header */}
        <div style={{ background: "#111", padding: "28px 32px" }}>
          <p style={{ fontFamily: "var(--font-oswald), sans-serif", fontSize: 24, fontWeight: 700, color: "#F5C000", margin: "0 0 4px", letterSpacing: "0.04em" }}>
            BEM-VINDO AO BTG
          </p>
          <p style={{ fontSize: 14, color: "#888", margin: 0 }}>Completa o teu perfil para acederes à área de sócio.</p>
        </div>

        <form onSubmit={handleSubmit} style={{ padding: "28px 32px", display: "flex", flexDirection: "column", gap: 20 }}>
          {/* Email (read-only) */}
          <div>
            <label style={labelStyle}>Email</label>
            <input value={email} readOnly style={{ ...inputStyle, background: "#F9F9F9", color: "#888", cursor: "not-allowed" }} />
          </div>

          {/* Name */}
          <div>
            <label style={labelStyle}>Nome completo <span style={{ color: "#F5C000" }}>*</span></label>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ex: Carlos Ferreira"
              required
              style={inputStyle}
            />
          </div>

          {/* Phone */}
          <div>
            <label style={labelStyle}>Telemóvel</label>
            <input
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="+351 912 345 678"
              type="tel"
              style={inputStyle}
            />
          </div>

          {/* Level */}
          <div>
            <label style={labelStyle}>Nível de jogo</label>
            <div style={{ display: "flex", gap: 10 }}>
              {LEVELS.map((l) => (
                <button
                  key={l.value}
                  type="button"
                  onClick={() => setLevel(l.value)}
                  style={{
                    flex: 1,
                    padding: "10px 0",
                    borderRadius: 8,
                    border: level === l.value ? "2px solid #F5C000" : "2px solid #eee",
                    background: level === l.value ? "#FFFDE7" : "#fff",
                    color: level === l.value ? "#111" : "#888",
                    fontSize: 13,
                    fontWeight: level === l.value ? 700 : 500,
                    cursor: "pointer",
                    fontFamily: "var(--font-inter), sans-serif",
                  }}
                >
                  {l.label}
                </button>
              ))}
            </div>
          </div>

          {error && (
            <p style={{ fontSize: 13, color: "#d32f2f", margin: 0, padding: "10px 14px", background: "#ffeaea", borderRadius: 8 }}>{error}</p>
          )}

          <button
            type="submit"
            disabled={loading}
            style={{
              background: loading ? "#ccc" : "#F5C000",
              color: "#111",
              fontWeight: 700,
              padding: "14px 0",
              borderRadius: 9,
              border: "none",
              fontSize: 16,
              cursor: loading ? "not-allowed" : "pointer",
              fontFamily: "var(--font-inter), sans-serif",
            }}
          >
            {loading ? "A criar perfil…" : "Criar perfil de sócio"}
          </button>
        </form>
      </div>
    </div>
  );
}
