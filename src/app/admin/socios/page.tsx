"use client";

import { useEffect, useState, useTransition } from "react";

type Member = {
  id: string; name: string; email: string; phone: string | null;
  gender: string | null; level: string; role: string;
  memberNumber: number | null; quotaYear: number | null; createdAt: string;
};

const YEAR = 2026;
const inputStyle: React.CSSProperties = { width: "100%", padding: "9px 12px", border: "1.5px solid #e0e0e0", borderRadius: 8, fontSize: 14, fontFamily: "var(--font-inter), sans-serif", outline: "none", boxSizing: "border-box", color: "#111" };
const labelStyle: React.CSSProperties = { fontSize: 11, fontWeight: 700, color: "#555", marginBottom: 5, display: "block", textTransform: "uppercase", letterSpacing: "0.05em" };
const selectStyle: React.CSSProperties = { ...inputStyle, background: "#fff", cursor: "pointer" };

function EditModal({ member, onClose, onSave }: { member: Member; onClose: () => void; onSave: (id: string, data: Record<string, unknown>) => Promise<void> }) {
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const data: Record<string, unknown> = {
      name: fd.get("name"),
      phone: fd.get("phone") || null,
      gender: fd.get("gender") || null,
      level: fd.get("level"),
      role: fd.get("role"),
      memberNumber: fd.get("memberNumber") ? Number(fd.get("memberNumber")) : null,
      quotaYear: fd.get("quotaYear") === "true" ? YEAR : null,
    };
    setSaving(true);
    setError("");
    try {
      await onSave(member.id, data);
      onClose();
    } catch {
      setError("Erro ao guardar. Tenta novamente.");
      setSaving(false);
    }
  }

  return (
    <div
      style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.55)", zIndex: 200, display: "flex", alignItems: "center", justifyContent: "center", padding: 16 }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div style={{ background: "#fff", borderRadius: 20, width: "100%", maxWidth: 520, boxShadow: "0 8px 40px rgba(0,0,0,0.2)", overflow: "hidden", maxHeight: "90vh", overflowY: "auto" }}>
        {/* Header */}
        <div style={{ background: "#111", padding: "16px 20px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <span style={{ fontFamily: "var(--font-oswald), sans-serif", fontSize: 17, fontWeight: 700, color: "#fff", letterSpacing: "0.04em" }}>
            EDITAR SÓCIO
          </span>
          <button onClick={onClose} style={{ background: "none", border: "none", color: "#666", fontSize: 20, cursor: "pointer", lineHeight: 1, padding: "2px 6px" }}>✕</button>
        </div>

        <form onSubmit={handleSubmit} style={{ padding: 24, display: "flex", flexDirection: "column", gap: 18 }}>
          {/* Name */}
          <div>
            <label style={labelStyle}>Nome *</label>
            <input name="name" required defaultValue={member.name} style={inputStyle} />
          </div>

          {/* Email — read-only */}
          <div>
            <label style={labelStyle}>Email</label>
            <input value={member.email} readOnly style={{ ...inputStyle, background: "#F5F5F5", color: "#aaa", cursor: "not-allowed" }} />
            <p style={{ fontSize: 11, color: "#aaa", margin: "4px 0 0" }}>O email é gerido pela conta de autenticação e não pode ser alterado aqui.</p>
          </div>

          {/* Phone + Gender */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            <div>
              <label style={labelStyle}>Telefone</label>
              <input name="phone" type="tel" defaultValue={member.phone ?? ""} placeholder="+351 900 000 000" style={inputStyle} />
            </div>
            <div>
              <label style={labelStyle}>Género</label>
              <select name="gender" defaultValue={member.gender ?? ""} style={selectStyle}>
                <option value="">Não especificado</option>
                <option value="MALE">Masculino</option>
                <option value="FEMALE">Feminino</option>
              </select>
            </div>
          </div>

          {/* Level + Role */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            <div>
              <label style={labelStyle}>Nível</label>
              <select name="level" defaultValue={member.level} style={selectStyle}>
                <option value="BEGINNER">Iniciante</option>
                <option value="INTERMEDIATE">Intermédio</option>
                <option value="ADVANCED">Avançado</option>
              </select>
            </div>
            <div>
              <label style={labelStyle}>Perfil</label>
              <select name="role" defaultValue={member.role} style={{ ...selectStyle, background: member.role === "ADMIN" ? "#FFF3B0" : "#fff" }}>
                <option value="MEMBER">Sócio</option>
                <option value="ADMIN">Admin</option>
              </select>
            </div>
          </div>

          {/* Member number + Quota */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            <div>
              <label style={labelStyle}>Nº de sócio</label>
              <input name="memberNumber" type="number" defaultValue={member.memberNumber ?? ""} placeholder="—" min={1} style={inputStyle} />
            </div>
            <div>
              <label style={labelStyle}>Quota {YEAR}</label>
              <select name="quotaYear" defaultValue={member.quotaYear === YEAR ? "true" : "false"} style={selectStyle}>
                <option value="false">Por pagar</option>
                <option value="true">Paga ✓</option>
              </select>
            </div>
          </div>

          {error && <p style={{ fontSize: 13, color: "#d32f2f", background: "#ffeaea", padding: "10px 14px", borderRadius: 8, margin: 0 }}>{error}</p>}

          <div style={{ display: "flex", gap: 10, paddingTop: 4 }}>
            <button type="submit" disabled={saving} style={{ flex: 1, background: saving ? "#ccc" : "#F5C000", color: "#111", fontWeight: 700, padding: "12px 0", borderRadius: 9, border: "none", fontSize: 15, cursor: saving ? "not-allowed" : "pointer" }}>
              {saving ? "A guardar…" : "Guardar alterações"}
            </button>
            <button type="button" onClick={onClose} style={{ background: "#F0F0F0", color: "#555", fontWeight: 600, padding: "12px 20px", borderRadius: 9, border: "none", fontSize: 15, cursor: "pointer" }}>
              Cancelar
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function AdminSociosPage() {
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<string | null>(null);
  const [editing, setEditing] = useState<Member | null>(null);
  const [, startTransition] = useTransition();

  useEffect(() => {
    fetch("/api/admin/members").then((r) => r.json()).then(setMembers).finally(() => setLoading(false));
  }, []);

  async function patch(id: string, data: Record<string, unknown>) {
    setSaving(id);
    await fetch(`/api/admin/members/${id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data) });
    const updated: Member[] = await fetch("/api/admin/members").then((r) => r.json());
    startTransition(() => {
      setMembers(updated);
      if (editing?.id === id) setEditing(updated.find((m) => m.id === id) ?? null);
    });
    setSaving(null);
  }

  if (loading) return <div style={{ padding: 32, color: "#888" }}>A carregar…</div>;

  return (
    <div className="btg-admin-page">
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontFamily: "var(--font-oswald), sans-serif", fontSize: 28, fontWeight: 700, color: "#111", margin: 0 }}>SÓCIOS</h1>
        <p style={{ color: "#888", fontSize: 14, margin: "4px 0 0" }}>{members.length} sócios registados</p>
      </div>

      <div style={{ background: "#fff", borderRadius: 16, overflow: "hidden", boxShadow: "0 2px 8px rgba(0,0,0,0.06)" }}>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr style={{ background: "#111", borderBottom: "1px solid #222" }}>
              {["Nº", "Nome", "Nível", "Quota", "Role", ""].map((h) => (
                <th key={h} style={{ padding: "12px 16px", textAlign: "left", fontSize: 11, color: "#888", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.06em" }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {members.map((m) => (
              <tr key={m.id} style={{ borderBottom: "1px solid #f5f5f5", opacity: saving === m.id ? 0.5 : 1 }}>
                <td style={{ padding: "10px 16px" }}>
                  <input
                    type="number"
                    defaultValue={m.memberNumber ?? ""}
                    placeholder="—"
                    onBlur={(e) => { const v = e.target.value ? Number(e.target.value) : null; if (v !== m.memberNumber) patch(m.id, { memberNumber: v }); }}
                    style={{ width: 56, padding: "4px 6px", border: "1.5px solid #e0e0e0", borderRadius: 6, fontSize: 13, textAlign: "center", fontFamily: "inherit" }}
                  />
                </td>
                <td style={{ padding: "10px 16px" }}>
                  <p style={{ fontWeight: 600, fontSize: 14, color: "#111", margin: 0 }}>{m.name}</p>
                  <p style={{ fontSize: 11, color: "#aaa", margin: 0 }}>{m.email}</p>
                </td>
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
                <td style={{ padding: "10px 16px" }}>
                  <button
                    onClick={() => patch(m.id, { quotaYear: m.quotaYear === YEAR ? null : YEAR })}
                    style={{ background: m.quotaYear === YEAR ? "#E8F5E9" : "#F5F5F5", color: m.quotaYear === YEAR ? "#1a7a1a" : "#888", border: "none", borderRadius: 99, padding: "4px 12px", fontSize: 12, fontWeight: 700, cursor: "pointer" }}
                  >
                    {m.quotaYear === YEAR ? "Paga ✓" : "Por pagar"}
                  </button>
                </td>
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
                <td style={{ padding: "10px 16px" }}>
                  <button
                    onClick={() => setEditing(m)}
                    style={{ background: "#F0F0F0", color: "#333", border: "none", borderRadius: 7, padding: "6px 14px", fontSize: 12, fontWeight: 600, cursor: "pointer" }}
                  >
                    ✏️ Editar
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {editing && (
        <EditModal
          member={editing}
          onClose={() => setEditing(null)}
          onSave={patch}
        />
      )}
    </div>
  );
}
