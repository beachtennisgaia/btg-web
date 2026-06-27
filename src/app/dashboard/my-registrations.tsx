"use client";

import { useTransition } from "react";
import { cancelOwnRegistration } from "@/lib/actions";

type Reg = {
  id: string;
  status: string;
  tournament: { name: string; date: Date; location: string; status: string };
  player1: { name: string };
  player2: { name: string } | null;
  isPlayer1: boolean;
};

function CancelButton({ regId }: { regId: string }) {
  const [pending, startTransition] = useTransition();
  return (
    <button
      disabled={pending}
      onClick={() => {
        if (!confirm("Tens a certeza que queres cancelar esta inscrição?")) return;
        startTransition(() => cancelOwnRegistration(regId));
      }}
      style={{
        background: "none", border: "1.5px solid #ffd0d0", color: "#d32f2f",
        borderRadius: 7, padding: "4px 12px", fontSize: 12, fontWeight: 600,
        cursor: pending ? "not-allowed" : "pointer", opacity: pending ? 0.5 : 1,
        whiteSpace: "nowrap",
      }}
    >
      {pending ? "…" : "Cancelar"}
    </button>
  );
}

export function MyRegistrations({ registrations }: { registrations: Reg[] }) {
  if (registrations.length === 0) {
    return (
      <div style={{ padding: "40px 24px", textAlign: "center" }}>
        <p style={{ fontSize: 36, margin: "0 0 12px" }}>🎾</p>
        <p style={{ fontFamily: "var(--font-oswald), sans-serif", fontSize: 18, fontWeight: 700, color: "#111", margin: "0 0 8px" }}>
          SEM INSCRIÇÕES ATIVAS
        </p>
        <p style={{ fontSize: 14, color: "#888", margin: "0 0 20px" }}>Ainda não tens inscrições em torneios ativos.</p>
        <a href="/torneios" style={{ background: "#F5C000", color: "#111", fontWeight: 700, padding: "12px 24px", borderRadius: 9, fontSize: 14, textDecoration: "none", display: "inline-block" }}>
          Ver próximos torneios
        </a>
      </div>
    );
  }

  return (
    <div style={{ padding: "8px 0" }}>
      {registrations.map((reg) => {
        const isConfirmed = reg.status === "CONFIRMED";
        const isCancelled = reg.status === "CANCELLED";
        const canCancel = !isCancelled && reg.tournament.status === "OPEN";
        const partner = reg.isPlayer1 ? reg.player2 : reg.player1;

        return (
          <div key={reg.id} style={{ padding: "14px 24px", borderBottom: "1px solid #f5f5f5", display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12, opacity: isCancelled ? 0.55 : 1 }}>
            <div style={{ flex: 1, minWidth: 0 }}>
              <p style={{ fontWeight: 600, fontSize: 14, color: "#111", margin: 0 }}>{reg.tournament.name}</p>
              <p style={{ fontSize: 12, color: "#888", margin: "2px 0 0" }}>
                {new Date(reg.tournament.date).toLocaleDateString("pt-PT", { day: "numeric", month: "short", year: "numeric" })} · {reg.tournament.location}
              </p>
              {partner && (
                <p style={{ fontSize: 12, color: "#aaa", margin: "2px 0 0" }}>
                  Parceiro: {partner.name}
                </p>
              )}
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 8, flexShrink: 0 }}>
              <span style={{
                background: isCancelled ? "#F5F5F5" : isConfirmed ? "#FFFDE7" : "#F0F0F0",
                color: isCancelled ? "#bbb" : isConfirmed ? "#7A5900" : "#888",
                fontSize: 12, fontWeight: 700, padding: "4px 10px", borderRadius: 99, whiteSpace: "nowrap",
              }}>
                {isCancelled ? "Cancelada" : isConfirmed ? "Confirmada ✓" : "Pendente"}
              </span>
              {canCancel && <CancelButton regId={reg.id} />}
            </div>
          </div>
        );
      })}
    </div>
  );
}
