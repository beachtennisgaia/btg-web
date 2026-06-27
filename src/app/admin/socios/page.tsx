"use client";

import { useEffect, useState, useTransition } from "react";

type Member = {
  id: string; name: string; email: string; phone: string | null;
  level: string; role: string; memberNumber: number | null; quotaYear: number | null;
  createdAt: string;
};

const YEAR = 2026;

export default function AdminSociosPage() {
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<string | null>(null);
  const [, startTransition] = useTransition();

  useEffect(() => {
    fetch("/api/admin/members").then((r) => r.json()).then(setMembers).finally(() => setLoading(false));
  }, []);

  async function patch(id: string, data: Record<string, unknown>) {
    setSaving(id);
    await fetch(`/api/admin/members/${id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data) });
    const updated = await fetch("/api/admin/members").then((r) => r.json());
    startTransition(() => setMembers(updated));
    setSaving(null);
  }

  if (loading) return <div style={{ padding: 32, color: "#888" }}>A carregar…</div>;

  return (
    <div style={{ padding: 32 }}>
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontFamily: "var(--font-oswald), sans-serif", fontSize: 28, fontWeight: 700, color: "#111", margin: 0 }}>SÓCIOS</h1>
        <p style={{ color: "#888", fontSize: 14, margin: "4px 0 0" }}>{members.length} sócios registados</p>
      </div>

      <div style={{ background: "#fff", borderRadius: 16, overflow: "hidden", boxShadow: "0 2px 8px rgba(0,0,0,0.06)" }}>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr style={{ background: "#111", borderBottom: "1px solid #222" }}>
              {["Nº", "Nome", "Email", "Nível", "Quota 2026", "Role", ""].map((h) => (
                <th key={h} style={{ padding: "12px 16px", textAlign: "left", fontSize: 11, color: "#888", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.06em" }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {members.map((m) => (
              <tr key={m.id} style={{ borderBottom: "1px solid #f5f5f5", opacity: saving === m.id ? 0.5 : 1 }}>
                {/* Member number */}
                <td style={{ padding: "10px 16px" }}>
                  <input
                    type="number"
                    defaultValue={m.memberNumber ?? ""}
                    placeholder="—"
                    onBlur={(e) => { const v = e.target.value ? Number(e.target.value) : null; if (v !== m.memberNumber) patch(m.id, { memberNumber: v }); }}
                    style={{ width: 56, padding: "4px 6px", border: "1.5px solid #e0e0e0", borderRadius: 6, fontSize: 13, textAlign: "center", fontFamily: "inherit" }}
                  />
                </td>
                <td style={{ padding: "10px 16px", fontWeight: 600, fontSize: 14, color: "#111" }}>{m.name}</td>
                <td style={{ padding: "10px 16px", fontSize: 13, color: "#666" }}>{m.email}</td>
                {/* Level */}
                <td style={{ padding: "10px 16px" }}>
                  <select
                    defaultValue={m.level}
                    onChange={(e) => patch(m.id, { level: e.target.value })}
                    style={{ fontSize: 12, padding: "4px 8px", border: "1.5px solid #e0e0e0", borderRadius: 6, background: "#fff", cursor: "pointer", fontFamily: "inherit" }}
                  >
                    <option value="BEGINNER">Iniciante</option>
                    <option value="INTERMEDIATE">Intermédio</option>
                    <option value="ADVANCED">Avançado</option>
                  </select>
                </td>
                {/* Quota */}
                <td style={{ padding: "10px 16px" }}>
                  <button
                    onClick={() => patch(m.id, { quotaYear: m.quotaYear === YEAR ? null : YEAR })}
                    style={{
                      background: m.quotaYear === YEAR ? "#E8F5E9" : "#F5F5F5",
                      color: m.quotaYear === YEAR ? "#1a7a1a" : "#888",
                      border: "none", borderRadius: 99, padding: "4px 12px", fontSize: 12, fontWeight: 700, cursor: "pointer",
                    }}
                  >
                    {m.quotaYear === YEAR ? "Paga ✓" : "Por pagar"}
                  </button>
                </td>
                {/* Role */}
                <td style={{ padding: "10px 16px" }}>
                  <select
                    defaultValue={m.role}
                    onChange={(e) => patch(m.id, { role: e.target.value })}
                    style={{ fontSize: 12, padding: "4px 8px", border: "1.5px solid #e0e0e0", borderRadius: 6, background: m.role === "ADMIN" ? "#FFF3B0" : "#fff", cursor: "pointer", fontFamily: "inherit" }}
                  >
                    <option value="MEMBER">Sócio</option>
                    <option value="ADMIN">Admin</option>
                  </select>
                </td>
                <td style={{ padding: "10px 16px", fontSize: 11, color: "#bbb" }}>
                  {new Date(m.createdAt).toLocaleDateString("pt-PT")}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
