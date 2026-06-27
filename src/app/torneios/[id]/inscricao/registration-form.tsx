"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type Member = { id: string; name: string };

interface Props {
  tournamentId: string;
  memberId: string;
  registrationType: string;
  members: Member[];
}

function PartnerPicker({
  members,
  partnerId,
  setPartnerId,
  required,
}: {
  members: Member[];
  partnerId: string;
  setPartnerId: (id: string) => void;
  required: boolean;
}) {
  const [search, setSearch] = useState("");
  const selectedPartner = members.find((m) => m.id === partnerId);
  const filtered = members.filter((m) =>
    search.trim().length > 0 ? m.name.toLowerCase().includes(search.toLowerCase()) : true
  );

  return (
    <div>
      <label style={{ fontSize: 12, fontWeight: 600, color: "#555", marginBottom: 8, display: "block", textTransform: "uppercase", letterSpacing: "0.05em" }}>
        Parceiro {required ? "*" : "(opcional)"}
      </label>

      {selectedPartner ? (
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", background: "#FFFDE7", border: "2px solid #F5C000", borderRadius: 10, padding: "12px 16px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div style={{ width: 36, height: 36, borderRadius: 99, background: "#F5C000", color: "#111", fontWeight: 700, fontSize: 14, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
              {selectedPartner.name.slice(0, 2).toUpperCase()}
            </div>
            <div>
              <p style={{ fontWeight: 700, fontSize: 14, color: "#111", margin: 0 }}>{selectedPartner.name}</p>
              <p style={{ fontSize: 11, color: "#888", margin: "1px 0 0" }}>Parceiro selecionado</p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => { setPartnerId(""); setSearch(""); }}
            style={{ background: "none", border: "none", color: "#888", fontSize: 18, cursor: "pointer", padding: 4 }}
          >
            ×
          </button>
        </div>
      ) : (
        <div>
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Escreve o nome do parceiro…"
            style={{ width: "100%", padding: "10px 12px", border: "1.5px solid #e0e0e0", borderRadius: 8, fontSize: 14, fontFamily: "var(--font-inter), sans-serif", outline: "none", boxSizing: "border-box" }}
          />
          {search.trim().length > 0 && (
            <div style={{ border: "1.5px solid #e0e0e0", borderTop: "none", borderRadius: "0 0 8px 8px", maxHeight: 220, overflowY: "auto", background: "#fff" }}>
              {filtered.length === 0 ? (
                <p style={{ padding: "12px 14px", fontSize: 13, color: "#888", margin: 0 }}>Nenhum sócio encontrado com esse nome.</p>
              ) : (
                filtered.slice(0, 8).map((m) => (
                  <button
                    key={m.id}
                    type="button"
                    onClick={() => { setPartnerId(m.id); setSearch(""); }}
                    style={{ width: "100%", textAlign: "left", padding: "11px 14px", background: "none", border: "none", borderBottom: "1px solid #f0f0f0", cursor: "pointer", fontSize: 14, color: "#111", display: "flex", alignItems: "center", gap: 10 }}
                  >
                    <div style={{ width: 30, height: 30, borderRadius: 99, background: "#111", color: "#fff", fontWeight: 700, fontSize: 12, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                      {m.name.slice(0, 2).toUpperCase()}
                    </div>
                    {m.name}
                  </button>
                ))
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export function RegistrationForm({ tournamentId, registrationType, members }: Props) {
  const router = useRouter();
  const [partnerId, setPartnerId] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  const isPairs = registrationType === "PAIRS";
  const withPartner = partnerId !== "";

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (isPairs && !partnerId) {
      setError("Seleciona o teu parceiro antes de submeter.");
      return;
    }
    setLoading(true);
    setError("");
    try {
      const res = await fetch(`/api/torneios/${tournamentId}/inscricao`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ partnerId: partnerId || null }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Erro ao submeter inscrição");
      setSuccess(true);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro desconhecido");
    } finally {
      setLoading(false);
    }
  }

  if (success) {
    return (
      <div style={{ background: "#fff", borderRadius: 16, padding: 32, textAlign: "center", boxShadow: "0 2px 8px rgba(0,0,0,0.06)" }}>
        <p style={{ fontSize: 40, margin: "0 0 12px" }}>🎉</p>
        <p style={{ fontFamily: "var(--font-oswald), sans-serif", fontSize: 22, color: "#111", margin: "0 0 8px" }}>INSCRIÇÃO SUBMETIDA!</p>
        <p style={{ fontSize: 14, color: "#888", margin: "0 0 24px" }}>
          A tua inscrição foi registada com sucesso. Aguarda confirmação da organização.
        </p>
        <a href="/torneios" style={{ display: "inline-block", background: "#111", color: "#F5C000", fontWeight: 700, padding: "12px 28px", borderRadius: 9, textDecoration: "none", fontSize: 14 }}>
          Ver todos os torneios
        </a>
      </div>
    );
  }

  return (
    <div style={{ background: "#fff", borderRadius: 16, padding: 28, boxShadow: "0 2px 8px rgba(0,0,0,0.06)" }}>
      <p style={{ fontFamily: "var(--font-oswald), sans-serif", fontSize: 18, fontWeight: 700, color: "#111", margin: "0 0 4px" }}>
        {isPairs ? "INSCRIÇÃO EM DUPLA" : "INSCRIÇÃO INDIVIDUAL"}
      </p>
      <p style={{ fontSize: 13, color: "#888", margin: "0 0 24px" }}>
        {isPairs
          ? "Escolhe o teu parceiro para este torneio. Ambos ficarão inscritos."
          : "Podes inscrever-te sozinho ou indicar um parceiro."}
      </p>

      <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 20 }}>
        <PartnerPicker
          members={members}
          partnerId={partnerId}
          setPartnerId={setPartnerId}
          required={isPairs}
        />

        {!isPairs && !withPartner && (
          <p style={{ fontSize: 12, color: "#888", background: "#F9F9F9", padding: "10px 14px", borderRadius: 8, margin: 0 }}>
            Sem parceiro indicado, ficarás inscrito individualmente.
          </p>
        )}

        {error && (
          <p style={{ fontSize: 13, color: "#d32f2f", background: "#ffeaea", padding: "10px 14px", borderRadius: 8, margin: 0 }}>
            {error}
          </p>
        )}

        <button
          type="submit"
          disabled={loading || (isPairs && !partnerId)}
          style={{
            background: loading || (isPairs && !partnerId) ? "#ddd" : "#F5C000",
            color: "#111", fontWeight: 700, padding: "14px 0", borderRadius: 9, border: "none", fontSize: 15,
            cursor: loading || (isPairs && !partnerId) ? "not-allowed" : "pointer",
          }}
        >
          {loading
            ? "A submeter…"
            : withPartner
            ? "Inscrever dupla"
            : "Confirmar inscrição individual"}
        </button>

        <p style={{ fontSize: 12, color: "#aaa", textAlign: "center", margin: 0 }}>
          A inscrição fica pendente até confirmação da organização.
        </p>
      </form>
    </div>
  );
}
