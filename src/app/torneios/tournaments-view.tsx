"use client";

import { useState } from "react";
import type { Tournament, Registration } from "@prisma/client";

type Tab = "proximos" | "decorrer" | "historico";

const TABS: { id: Tab; label: string }[] = [
  { id: "proximos", label: "Próximos" },
  { id: "decorrer", label: "A Decorrer" },
  { id: "historico", label: "Histórico" },
];

const FORMAT_LABEL: Record<string, string> = {
  ELIMINATION: "Eliminatório",
  NON_STOP: "Non-Stop",
};

const CATEGORY_LABEL: Record<string, string> = {
  MIXED: "Duplas Mistas",
  MALE: "Duplas Masculinas",
  FEMALE: "Duplas Femininas",
  OPEN: "Open",
};

const STATUS_TAB: Record<string, Tab> = {
  DRAFT: "proximos",
  OPEN: "proximos",
  ONGOING: "decorrer",
  FINISHED: "historico",
};

type TournamentWithCount = Tournament & { _count: { registrations: number } };

function TournamentCard({ t, defaultOpen }: { t: TournamentWithCount; defaultOpen?: boolean }) {
  const [open, setOpen] = useState(!!defaultOpen);
  const registered = t._count.registrations;
  const pct = Math.round((registered / t.maxPairs) * 100);
  const remaining = t.maxPairs - registered;
  const date = new Date(t.date);

  return (
    <div style={{ background: "#fff", borderRadius: 20, overflow: "hidden", boxShadow: "0 2px 16px rgba(0,0,0,0.08)", marginBottom: 16 }}>
      <div
        onClick={() => setOpen((o) => !o)}
        style={{ background: t.status === "OPEN" ? "#F5C000" : t.status === "ONGOING" ? "#111" : "#F9F9F9", padding: "20px 24px", display: "flex", justifyContent: "space-between", alignItems: "flex-start", cursor: "pointer", flexWrap: "wrap", gap: 12 }}
      >
        <div>
          <span style={{ background: t.status === "OPEN" ? "#111" : t.status === "ONGOING" ? "#F5C000" : "#E0E0E0", color: t.status === "OPEN" ? "#F5C000" : t.status === "ONGOING" ? "#111" : "#555", fontSize: 11, fontWeight: 700, padding: "3px 10px", borderRadius: 99, textTransform: "uppercase", letterSpacing: "0.08em" }}>
            {t.status === "OPEN" ? "Inscrições Abertas" : t.status === "ONGOING" ? "● A Decorrer" : t.status === "FINISHED" ? "Concluído" : "Em breve"}
          </span>
          <h2 style={{ fontFamily: "var(--font-oswald), sans-serif", fontSize: 22, fontWeight: 700, color: t.status === "ONGOING" ? "#fff" : "#111", margin: "10px 0 0", letterSpacing: "0.02em" }}>
            {t.name.toUpperCase()}
          </h2>
        </div>
        {t.status === "OPEN" && (
          <a
            href={`/torneios/${t.id}/inscricao`}
            onClick={(e) => e.stopPropagation()}
            style={{ background: "#111", color: "#F5C000", fontWeight: 700, padding: "12px 24px", borderRadius: 9, fontSize: 15, textDecoration: "none", whiteSpace: "nowrap", marginTop: 4 }}
          >
            Inscrever-me →
          </a>
        )}
      </div>

      {open && (
        <div style={{ padding: "20px 24px", display: "flex", gap: 48, flexWrap: "wrap" }}>
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {[
              ["📅", date.toLocaleDateString("pt-PT", { day: "numeric", month: "long", year: "numeric" }) + " · " + date.toLocaleTimeString("pt-PT", { hour: "2-digit", minute: "2-digit" })],
              ["📍", t.location],
              ["🎾", `${CATEGORY_LABEL[t.category]} · ${FORMAT_LABEL[t.format]}`],
              ["👥", `Máximo ${t.maxPairs} duplas${t.status === "OPEN" ? ` (${remaining > 0 ? `restam ${remaining} vagas` : "completo"})` : ""}`],
            ].map(([icon, text]) => (
              <div key={text} style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 14, color: "#444" }}>
                <span>{icon}</span> {text}
              </div>
            ))}
            {t.description && (
              <p style={{ fontSize: 14, color: "#666", margin: "4px 0 0", maxWidth: 420, lineHeight: 1.6 }}>{t.description}</p>
            )}
          </div>

          {t.status === "OPEN" && (
            <div style={{ minWidth: 220 }}>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13, color: "#666", marginBottom: 6 }}>
                <span>Inscrições</span>
                <span style={{ fontWeight: 700, color: "#111" }}>{registered} / {t.maxPairs}</span>
              </div>
              <div style={{ background: "#F0F0F0", borderRadius: 99, height: 10, overflow: "hidden" }}>
                <div style={{ width: `${pct}%`, background: "#F5C000", height: "100%", borderRadius: 99 }} />
              </div>
              {remaining > 0 && remaining <= 5 && (
                <p style={{ fontSize: 12, color: "#F59E0B", fontWeight: 600, margin: "8px 0 0" }}>
                  {remaining === 1 ? "Última vaga!" : `${remaining} vagas restantes!`}
                </p>
              )}
              {remaining === 0 && (
                <p style={{ fontSize: 12, color: "#d32f2f", fontWeight: 600, margin: "8px 0 0" }}>Torneio completo.</p>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function EmptyTab({ tab }: { tab: Tab }) {
  const messages: Record<Tab, { emoji: string; title: string; sub: string }> = {
    proximos: { emoji: "📅", title: "SEM TORNEIOS AGENDADOS", sub: "Ainda não há torneios abertos. Volta em breve!" },
    decorrer: { emoji: "🎾", title: "NENHUM TORNEIO A DECORRER", sub: "De momento não há torneios em curso." },
    historico: { emoji: "🏆", title: "SEM HISTÓRICO", sub: "Os resultados de torneios concluídos aparecerão aqui." },
  };
  const { emoji, title, sub } = messages[tab];
  return (
    <div style={{ background: "#fff", borderRadius: 20, padding: "56px 32px", textAlign: "center", boxShadow: "0 2px 16px rgba(0,0,0,0.06)" }}>
      <p style={{ fontSize: 48, margin: "0 0 16px" }}>{emoji}</p>
      <h2 style={{ fontFamily: "var(--font-oswald), sans-serif", fontSize: 22, fontWeight: 700, color: "#111", margin: "0 0 8px", letterSpacing: "0.03em" }}>{title}</h2>
      <p style={{ fontSize: 14, color: "#888", margin: 0 }}>{sub}</p>
    </div>
  );
}

export function TournamentsView({ tournaments }: { tournaments: TournamentWithCount[] }) {
  const [tab, setTab] = useState<Tab>("proximos");

  const filtered = tournaments.filter((t) => STATUS_TAB[t.status] === tab);
  const firstOpen = tab === "proximos" ? filtered.findIndex((t) => t.status === "OPEN") : -1;

  return (
    <>
      {/* TABS */}
      <div className="btg-tournaments-tabs" style={{ background: "#fff", borderBottom: "1px solid #eee", display: "flex" }}>
        {TABS.map(({ id, label }) => {
          const count = tournaments.filter((t) => STATUS_TAB[t.status] === id).length;
          return (
            <button
              key={id}
              onClick={() => setTab(id)}
              style={{ padding: "16px 24px", fontSize: 14, fontWeight: tab === id ? 700 : 500, color: tab === id ? "#111" : "#888", border: "none", background: "transparent", borderBottom: tab === id ? "3px solid #F5C000" : "3px solid transparent", cursor: "pointer" }}
            >
              {label}{count > 0 && <span style={{ marginLeft: 6, background: tab === id ? "#F5C000" : "#F0F0F0", color: tab === id ? "#111" : "#888", fontSize: 11, fontWeight: 700, padding: "1px 7px", borderRadius: 99 }}>{count}</span>}
            </button>
          );
        })}
      </div>

      <div className="btg-tournaments-content">
        {filtered.length === 0 ? (
          <EmptyTab tab={tab} />
        ) : (
          filtered.map((t, i) => (
            <TournamentCard key={t.id} t={t} defaultOpen={i === firstOpen} />
          ))
        )}
      </div>
    </>
  );
}
