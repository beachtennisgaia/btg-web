"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { duplicateTournament } from "@/lib/actions";

export function DuplicateTournamentButton({ id }: { id: string }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState("");

  function handleClick() {
    setError("");
    startTransition(async () => {
      try {
        const newId = await duplicateTournament(id);
        router.push(`/admin/torneios/${newId}/editar`);
      } catch (e) {
        setError((e as Error).message);
      }
    });
  }

  return (
    <div style={{ display: "inline-flex", flexDirection: "column", gap: 2 }}>
      <button
        onClick={handleClick}
        disabled={pending}
        title="Duplicar torneio"
        style={{ background: "#F0F0F0", color: "#333", fontWeight: 600, padding: "8px 14px", borderRadius: 7, fontSize: 13, border: "none", cursor: pending ? "not-allowed" : "pointer", opacity: pending ? 0.6 : 1 }}
      >
        {pending ? "A duplicar…" : "Duplicar"}
      </button>
      {error && <span style={{ fontSize: 11, color: "#d32f2f" }}>{error}</span>}
    </div>
  );
}
