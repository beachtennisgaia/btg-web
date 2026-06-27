"use client";

import { useTransition } from "react";
import { updateRegistrationStatus } from "@/lib/actions";

type Reg = {
  id: string;
  status: string;
  createdAt: Date;
  player1Id: string;
  player2Id: string | null;
  player1: { name: string };
  player2: { name: string } | null;
};

const STATUS: Record<string, { label: string; bg: string; color: string }> = {
  PENDING:   { label: "Pendente",   bg: "#FFF3B0", color: "#7A5900" },
  CONFIRMED: { label: "Confirmada", bg: "#E8F5E9", color: "#1a7a1a" },
  CANCELLED: { label: "Cancelada",  bg: "#FFEAEA", color: "#d32f2f" },
};

function ActionButton({
  regId,
  action,
  label,
  style,
}: {
  regId: string;
  action: "CONFIRMED" | "CANCELLED" | "PENDING";
  label: string;
  style: React.CSSProperties;
}) {
  const [pending, startTransition] = useTransition();
  return (
    <button
      disabled={pending}
      onClick={() => startTransition(() => updateRegistrationStatus(regId, action))}
      style={{ ...style, opacity: pending ? 0.5 : 1, cursor: pending ? "not-allowed" : "pointer", border: "none", borderRadius: 6, padding: "5px 12px", fontSize: 12, fontWeight: 700 }}
    >
      {pending ? "…" : label}
    </button>
  );
}

export function RegistrationsTable({ registrations, tournamentStatus }: { registrations: Reg[]; tournamentStatus: string }) {
  if (registrations.length === 0) {
    return (
      <div style={{ padding: "40px 24px", textAlign: "center" }}>
        <p style={{ fontSize: 14, color: "#888" }}>Sem inscrições ainda.</p>
      </div>
    );
  }

  // IDs of players who were absorbed into a pair by the sorteio:
  // their solo registration was cancelled but they appear as player2 in another registration
  const player2Ids = new Set(registrations.filter((r) => r.player2Id).map((r) => r.player2Id!));
  const absorbedByDraw = new Set(
    registrations
      .filter((r) => r.status === "CANCELLED" && !r.player2Id && player2Ids.has(r.player1Id))
      .map((r) => r.id)
  );

  // Visible registrations: all except those silently absorbed by the draw
  const visible = registrations.filter((r) => !absorbedByDraw.has(r.id));

  const confirmed = visible.filter((r) => r.status === "CONFIRMED").length;
  const pending   = visible.filter((r) => r.status === "PENDING").length;
  const cancelled = visible.filter((r) => r.status === "CANCELLED").length;

  const canManage = tournamentStatus === "OPEN" || tournamentStatus === "ONGOING";

  return (
    <>
      {/* Summary row */}
      <div style={{ display: "flex", gap: 16, padding: "12px 20px", background: "#F9F9F9", borderBottom: "1px solid #eee", flexWrap: "wrap" }}>
        {[
          { label: "Confirmadas", value: confirmed, color: "#1a7a1a" },
          { label: "Pendentes",   value: pending,   color: "#7A5900" },
          { label: "Canceladas",  value: cancelled, color: "#d32f2f" },
        ].map(({ label, value, color }) => (
          <span key={label} style={{ fontSize: 12, fontWeight: 600, color: "#888" }}>
            <span style={{ color, fontWeight: 700 }}>{value}</span> {label}
          </span>
        ))}
        {canManage && pending > 0 && (
          <span style={{ fontSize: 12, color: "#F5C000", fontWeight: 600, marginLeft: "auto" }}>
            {pending} inscrição{pending !== 1 ? "ões" : ""} à espera de confirmação
          </span>
        )}
      </div>

      <table style={{ width: "100%", borderCollapse: "collapse" }}>
        <thead>
          <tr style={{ background: "#F9F9F9", borderBottom: "1px solid #eee" }}>
            {["#", "Jogador 1", "Jogador 2", "Estado", "Data", canManage ? "Ações" : ""].map((h) => (
              <th key={h} style={{ padding: "10px 16px", textAlign: "left", fontSize: 11, color: "#999", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.06em" }}>{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {visible.map((reg, i) => {
            const s = STATUS[reg.status];
            return (
              <tr key={reg.id} style={{ borderBottom: "1px solid #f5f5f5", background: reg.status === "CANCELLED" ? "#FAFAFA" : "#fff" }}>
                <td style={{ padding: "12px 16px", color: "#bbb", fontWeight: 600, fontSize: 13 }}>{i + 1}</td>
                <td style={{ padding: "12px 16px", fontSize: 14, color: reg.status === "CANCELLED" ? "#aaa" : "#111", fontWeight: 600 }}>
                  {reg.player1.name}
                </td>
                <td style={{ padding: "12px 16px", fontSize: 14, color: reg.status === "CANCELLED" ? "#aaa" : "#555" }}>
                  {reg.player2?.name ?? <span style={{ color: "#ccc" }}>—</span>}
                </td>
                <td style={{ padding: "12px 16px" }}>
                  <span style={{ background: s.bg, color: s.color, fontSize: 11, fontWeight: 700, padding: "3px 8px", borderRadius: 99 }}>
                    {s.label}
                  </span>
                </td>
                <td style={{ padding: "12px 16px", fontSize: 12, color: "#888" }}>
                  {new Date(reg.createdAt).toLocaleDateString("pt-PT")}
                </td>
                <td style={{ padding: "12px 16px" }}>
                  {canManage && (
                    <div style={{ display: "flex", gap: 6 }}>
                      {reg.status !== "CONFIRMED" && (
                        <ActionButton
                          regId={reg.id}
                          action="CONFIRMED"
                          label="Confirmar"
                          style={{ background: "#E8F5E9", color: "#1a7a1a" }}
                        />
                      )}
                      {reg.status !== "CANCELLED" && (
                        <ActionButton
                          regId={reg.id}
                          action="CANCELLED"
                          label="Cancelar"
                          style={{ background: "#FFEAEA", color: "#d32f2f" }}
                        />
                      )}
                      {reg.status === "CANCELLED" && (
                        <ActionButton
                          regId={reg.id}
                          action="PENDING"
                          label="Reativar"
                          style={{ background: "#FFF3B0", color: "#7A5900" }}
                        />
                      )}
                    </div>
                  )}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </>
  );
}
