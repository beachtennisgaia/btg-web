"use client";

import { deleteTournament } from "@/lib/actions";

export function DeleteTournamentButton({ id }: { id: string }) {
  return (
    <form
      action={deleteTournament.bind(null, id)}
      onSubmit={(e) => {
        if (!confirm("Apagar este torneio? Esta ação não pode ser desfeita.")) {
          e.preventDefault();
        }
      }}
    >
      <button
        type="submit"
        style={{ background: "#ffeaea", color: "#d32f2f", fontWeight: 600, padding: "8px 14px", borderRadius: 7, fontSize: 13, border: "none", cursor: "pointer" }}
      >
        Apagar
      </button>
    </form>
  );
}
