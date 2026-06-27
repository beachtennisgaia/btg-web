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

// ── Types ──────────────────────────────────────────────────────────────────

type TournamentWithCount = Tournament & { _count: { registrations: number } };

type PlayerName = { name: string };
type RegWithPlayers = Registration & { player1: PlayerName; player2: PlayerName | null };
type MatchWithPlayers = {
  id: string; round: number; position: number; groupNumber: number | null;
  label: string | null; score1: number | null; score2: number | null;
  pair1Id: string | null; pair2Id: string | null;
  winnerId: string | null; completedAt: Date | null;
  pair1: RegWithPlayers | null; pair2: RegWithPlayers | null;
};
type FinishedTournament = Tournament & {
  _count: { registrations: number };
  matches: MatchWithPlayers[];
};

// ── Helpers ────────────────────────────────────────────────────────────────

function pairName(reg: RegWithPlayers | null, registrationType: string): string {
  if (!reg) return "—";
  if (registrationType === "INDIVIDUAL") return reg.player1.name;
  return reg.player2 ? `${reg.player1.name} / ${reg.player2.name}` : reg.player1.name;
}

function roundLabel(round: number, maxRound: number): string {
  const diff = maxRound - round;
  if (diff === 0) return "Final";
  if (diff === 1) return "Meia-Final";
  if (diff === 2) return "Quartos de Final";
  if (diff === 3) return "Oitavos de Final";
  return `Ronda ${round}`;
}

type StandingEntry = {
  regId: string; reg: RegWithPlayers;
  wins: number; losses: number; gamesWon: number; gamesLost: number;
};

function computeGroupStandings(matches: MatchWithPlayers[], groupNum: number): StandingEntry[] {
  const stats = new Map<string, StandingEntry>();
  const groupMatches = matches.filter((m) => m.groupNumber === groupNum && m.completedAt && m.winnerId);
  for (const m of groupMatches) {
    for (const [id, reg, score, oppScore] of [
      [m.pair1Id, m.pair1, m.score1, m.score2],
      [m.pair2Id, m.pair2, m.score2, m.score1],
    ] as [string | null, RegWithPlayers | null, number | null, number | null][]) {
      if (!id || !reg) continue;
      if (!stats.has(id)) stats.set(id, { regId: id, reg, wins: 0, losses: 0, gamesWon: 0, gamesLost: 0 });
      const s = stats.get(id)!;
      if (m.winnerId === id) s.wins++; else s.losses++;
      if (score != null) { s.gamesWon += score; s.gamesLost += oppScore ?? 0; }
    }
  }
  return Array.from(stats.values()).sort(
    (a, b) => b.wins - a.wins || (b.gamesWon - b.gamesLost) - (a.gamesWon - a.gamesLost) || b.gamesWon - a.gamesWon
  );
}

// ── Card for upcoming / ongoing ────────────────────────────────────────────

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
            {t.status === "OPEN" ? "Inscrições Abertas" : t.status === "ONGOING" ? "● A Decorrer" : "Em breve"}
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
            {([
              ["📅", date.toLocaleDateString("pt-PT", { day: "numeric", month: "long", year: "numeric" }) + " · " + date.toLocaleTimeString("pt-PT", { hour: "2-digit", minute: "2-digit" })],
              ["📍", t.location],
              ["🎾", `${CATEGORY_LABEL[t.category]} · ${FORMAT_LABEL[t.format]}`],
              ["👥", `Máximo ${t.maxPairs} duplas${t.status === "OPEN" ? ` (${remaining > 0 ? `restam ${remaining} vagas` : "completo"})` : ""}`],
            ] as [string, string][]).map(([icon, text]) => (
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

// ── Card for finished tournaments ──────────────────────────────────────────

const MEDALS = ["🥇", "🥈", "🥉"];

function FinishedTournamentCard({ t }: { t: FinishedTournament }) {
  const [showMatches, setShowMatches] = useState(false);
  const date = new Date(t.date);
  const participants = t._count.registrations;
  const completedMatches = t.matches.filter((m) => m.completedAt);

  // Case 1: finals matches (groupNumber null) exist
  const finalsMatches = completedMatches.filter((m) => m.groupNumber == null && m.winnerId);
  const hasFinalsData = finalsMatches.length > 0;

  // Case 2: pool-only — compute standings per group (groupNumber >= 1)
  const poolGroupNums = hasFinalsData
    ? []
    : [...new Set(completedMatches.map((m) => m.groupNumber).filter((g): g is number => g != null && g >= 1))].sort();

  const poolStandings = poolGroupNums.map((g) => ({
    group: g,
    standings: computeGroupStandings(completedMatches, g),
  }));

  // For finals display
  const maxRound = hasFinalsData ? Math.max(...finalsMatches.map((m) => m.round)) : 0;
  const finalMatch = hasFinalsData
    ? (finalsMatches.find((m) => m.round === maxRound && m.position === 1) ?? finalsMatches.find((m) => m.round === maxRound))
    : null;
  const champion = finalMatch
    ? (finalMatch.winnerId === finalMatch.pair1Id ? finalMatch.pair1 : finalMatch.pair2)
    : null;
  const runnerUp = finalMatch
    ? (finalMatch.winnerId === finalMatch.pair1Id ? finalMatch.pair2 : finalMatch.pair1)
    : null;

  const displayFinalsMatches = finalsMatches.sort((a, b) => b.round - a.round || a.position - b.position);

  // Pool matches for toggle (all completed, grouped)
  const allPoolMatches = completedMatches
    .filter((m) => m.groupNumber != null && m.groupNumber >= 1)
    .sort((a, b) => (a.groupNumber ?? 0) - (b.groupNumber ?? 0) || b.round - a.round || a.position - b.position);

  const totalMatchCount = (hasFinalsData ? displayFinalsMatches.length : 0) + allPoolMatches.length;

  return (
    <div style={{ background: "#fff", borderRadius: 20, overflow: "hidden", boxShadow: "0 2px 16px rgba(0,0,0,0.08)", marginBottom: 16 }}>
      {/* Header */}
      <div style={{ background: "#1a1a1a", padding: "20px 24px" }}>
        <span style={{ background: "#333", color: "#aaa", fontSize: 11, fontWeight: 700, padding: "3px 10px", borderRadius: 99, textTransform: "uppercase", letterSpacing: "0.08em" }}>
          Concluído · {date.toLocaleDateString("pt-PT", { day: "numeric", month: "short", year: "numeric" })}
        </span>
        <h2 style={{ fontFamily: "var(--font-oswald), sans-serif", fontSize: 22, fontWeight: 700, color: "#fff", margin: "10px 0 4px", letterSpacing: "0.02em" }}>
          {t.name.toUpperCase()}
        </h2>
        <p style={{ fontSize: 13, color: "#888", margin: 0 }}>
          {t.location} · {CATEGORY_LABEL[t.category]} · {FORMAT_LABEL[t.format]} · {participants} participantes
        </p>
      </div>

      {/* Podium — case 1: finals match result */}
      {hasFinalsData && champion && (
        <div style={{ padding: "20px 24px", borderBottom: "1px solid #F0F0F0", display: "flex", gap: 16, flexWrap: "wrap" }}>
          <div style={{ flex: 1, minWidth: 200, background: "#FFF8E0", border: "2px solid #F5C000", borderRadius: 14, padding: "16px 18px" }}>
            <p style={{ fontSize: 11, fontWeight: 700, color: "#8A6000", textTransform: "uppercase", letterSpacing: "0.08em", margin: "0 0 6px" }}>🏆 Campeões</p>
            <p style={{ fontFamily: "var(--font-oswald), sans-serif", fontSize: 18, fontWeight: 700, color: "#111", margin: 0 }}>
              {pairName(champion, t.registrationType)}
            </p>
            {finalMatch?.score1 != null && finalMatch?.score2 != null && (
              <p style={{ fontSize: 12, color: "#888", margin: "4px 0 0" }}>
                {finalMatch.winnerId === finalMatch.pair1Id ? `${finalMatch.score1} – ${finalMatch.score2}` : `${finalMatch.score2} – ${finalMatch.score1}`} na final
              </p>
            )}
          </div>
          {runnerUp && (
            <div style={{ flex: 1, minWidth: 180, background: "#F9F9F9", borderRadius: 14, padding: "16px 18px", border: "1px solid #E8E8E8" }}>
              <p style={{ fontSize: 11, fontWeight: 700, color: "#888", textTransform: "uppercase", letterSpacing: "0.08em", margin: "0 0 6px" }}>🥈 Finalistas</p>
              <p style={{ fontFamily: "var(--font-oswald), sans-serif", fontSize: 16, fontWeight: 700, color: "#555", margin: 0 }}>
                {pairName(runnerUp, t.registrationType)}
              </p>
            </div>
          )}
        </div>
      )}

      {/* Podium — case 2: pool standings per group */}
      {!hasFinalsData && poolStandings.length > 0 && (
        <div style={{ padding: "20px 24px", borderBottom: "1px solid #F0F0F0" }}>
          <div style={{ display: "flex", gap: 16, flexWrap: "wrap", alignItems: "flex-start" }}>
            {poolStandings.map(({ group, standings }) => (
              <div key={group} style={{ flex: 1, minWidth: 200 }}>
                {poolStandings.length > 1 && (
                  <p style={{ fontSize: 11, fontWeight: 700, color: "#888", textTransform: "uppercase", letterSpacing: "0.06em", margin: "0 0 10px" }}>
                    Grupo {group}
                  </p>
                )}
                <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                  {standings.slice(0, 3).map((s, i) => (
                    <div
                      key={s.regId}
                      style={{
                        background: i === 0 ? "#FFF8E0" : "#F9F9F9",
                        border: i === 0 ? "2px solid #F5C000" : "1px solid #E8E8E8",
                        borderRadius: 10, padding: "10px 14px",
                        display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8,
                      }}
                    >
                      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                        <span style={{ fontSize: 16 }}>{MEDALS[i]}</span>
                        <span style={{ fontWeight: i === 0 ? 700 : 500, fontSize: 13, color: i === 0 ? "#111" : "#555" }}>
                          {pairName(s.reg, t.registrationType)}
                        </span>
                      </div>
                      <div style={{ fontSize: 12, color: "#888", textAlign: "right", flexShrink: 0 }}>
                        <span style={{ fontWeight: 700, color: i === 0 ? "#8A6000" : "#888" }}>{s.wins}V</span>
                        <span style={{ color: "#ccc" }}> / </span>
                        <span>{s.losses}D</span>
                        {s.gamesWon + s.gamesLost > 0 && (
                          <span style={{ marginLeft: 6, color: (s.gamesWon - s.gamesLost) >= 0 ? "#2e7d32" : "#d32f2f" }}>
                            ({s.gamesWon - s.gamesLost >= 0 ? "+" : ""}{s.gamesWon - s.gamesLost})
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* No results at all */}
      {!hasFinalsData && poolStandings.length === 0 && (
        <div style={{ padding: "16px 24px", borderBottom: "1px solid #F0F0F0" }}>
          <p style={{ fontSize: 13, color: "#aaa", margin: 0 }}>Sem resultados registados.</p>
        </div>
      )}

      {/* Match results toggle */}
      {totalMatchCount > 0 && (
        <div>
          <button
            onClick={() => setShowMatches((v) => !v)}
            style={{ width: "100%", padding: "12px 24px", background: "transparent", border: "none", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "space-between", fontSize: 13, fontWeight: 600, color: "#555" }}
          >
            <span>Ver todos os resultados ({totalMatchCount} jogos)</span>
            <span style={{ fontSize: 11, color: "#aaa" }}>{showMatches ? "▲" : "▼"}</span>
          </button>

          {showMatches && (
            <div style={{ padding: "0 24px 20px" }}>
              {/* Finals matches */}
              {hasFinalsData && displayFinalsMatches.length > 0 && (
                <div style={{ marginBottom: 16 }}>
                  <p style={{ fontSize: 11, fontWeight: 700, color: "#F5C000", textTransform: "uppercase", letterSpacing: "0.08em", margin: "0 0 8px" }}>Fase Final</p>
                  {displayFinalsMatches.map((m) => <MatchRow key={m.id} m={m} maxRound={maxRound} registrationType={t.registrationType} />)}
                </div>
              )}
              {/* Pool matches grouped */}
              {poolGroupNums.map((g) => {
                const gMatches = allPoolMatches.filter((m) => m.groupNumber === g);
                if (gMatches.length === 0) return null;
                return (
                  <div key={g} style={{ marginBottom: 16 }}>
                    {poolGroupNums.length > 1 && (
                      <p style={{ fontSize: 11, fontWeight: 700, color: "#aaa", textTransform: "uppercase", letterSpacing: "0.08em", margin: "0 0 8px" }}>
                        Grupo {g}
                      </p>
                    )}
                    {gMatches.map((m) => {
                      const maxRoundG = Math.max(...gMatches.map((x) => x.round));
                      return <MatchRow key={m.id} m={m} maxRound={maxRoundG} registrationType={t.registrationType} isPool />;
                    })}
                  </div>
                );
              })}
              {/* Un-grouped finals matches (if no separate pool sections) */}
              {!hasFinalsData && poolGroupNums.length === 0 && completedMatches.map((m) => (
                <MatchRow key={m.id} m={m} maxRound={Math.max(...completedMatches.map((x) => x.round))} registrationType={t.registrationType} />
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function MatchRow({ m, maxRound, registrationType, isPool }: {
  m: MatchWithPlayers; maxRound: number; registrationType: string; isPool?: boolean;
}) {
  const p1Name = pairName(m.pair1, registrationType);
  const p2Name = pairName(m.pair2, registrationType);
  const p1Won = m.winnerId === m.pair1Id;
  const p2Won = m.winnerId === m.pair2Id;
  const label = m.label ?? (isPool ? `Ronda ${m.round}` : roundLabel(m.round, maxRound));
  return (
    <div style={{ background: "#F9F9F9", borderRadius: 10, padding: "10px 14px", marginBottom: 6 }}>
      <p style={{ fontSize: 10, fontWeight: 700, color: "#bbb", textTransform: "uppercase", letterSpacing: "0.06em", margin: "0 0 6px" }}>{label}</p>
      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
        <span style={{ flex: 1, fontSize: 13, fontWeight: p1Won ? 700 : 400, color: p1Won ? "#111" : "#888", textAlign: "right" }}>{p1Name}</span>
        <div style={{ display: "flex", gap: 5, alignItems: "center", flexShrink: 0 }}>
          {m.score1 != null && m.score2 != null ? (
            <>
              <span style={{ background: p1Won ? "#111" : "#E8E8E8", color: p1Won ? "#F5C000" : "#888", fontWeight: 700, fontSize: 14, padding: "3px 9px", borderRadius: 6, minWidth: 26, textAlign: "center" }}>{m.score1}</span>
              <span style={{ color: "#ccc", fontSize: 11 }}>–</span>
              <span style={{ background: p2Won ? "#111" : "#E8E8E8", color: p2Won ? "#F5C000" : "#888", fontWeight: 700, fontSize: 14, padding: "3px 9px", borderRadius: 6, minWidth: 26, textAlign: "center" }}>{m.score2}</span>
            </>
          ) : (
            <span style={{ fontSize: 11, color: "#ccc" }}>s/ resultado</span>
          )}
        </div>
        <span style={{ flex: 1, fontSize: 13, fontWeight: p2Won ? 700 : 400, color: p2Won ? "#111" : "#888" }}>{p2Name}</span>
      </div>
    </div>
  );
}

// ── Empty state ────────────────────────────────────────────────────────────

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

// ── Main view ──────────────────────────────────────────────────────────────

export function TournamentsView({
  tournaments,
  finishedTournaments,
}: {
  tournaments: TournamentWithCount[];
  finishedTournaments: FinishedTournament[];
}) {
  const [tab, setTab] = useState<Tab>("proximos");

  const nonFinished = tournaments.filter((t) => STATUS_TAB[t.status] === tab);
  const firstOpen = tab === "proximos" ? nonFinished.findIndex((t) => t.status === "OPEN") : -1;

  const counts: Record<Tab, number> = {
    proximos: tournaments.filter((t) => STATUS_TAB[t.status] === "proximos").length,
    decorrer: tournaments.filter((t) => STATUS_TAB[t.status] === "decorrer").length,
    historico: finishedTournaments.length,
  };

  return (
    <>
      <div className="btg-tournaments-tabs" style={{ background: "#fff", borderBottom: "1px solid #eee", display: "flex" }}>
        {TABS.map(({ id, label }) => (
          <button
            key={id}
            onClick={() => setTab(id)}
            style={{ padding: "16px 24px", fontSize: 14, fontWeight: tab === id ? 700 : 500, color: tab === id ? "#111" : "#888", border: "none", background: "transparent", borderBottom: tab === id ? "3px solid #F5C000" : "3px solid transparent", cursor: "pointer" }}
          >
            {label}
            {counts[id] > 0 && (
              <span style={{ marginLeft: 6, background: tab === id ? "#F5C000" : "#F0F0F0", color: tab === id ? "#111" : "#888", fontSize: 11, fontWeight: 700, padding: "1px 7px", borderRadius: 99 }}>
                {counts[id]}
              </span>
            )}
          </button>
        ))}
      </div>

      <div className="btg-tournaments-content">
        {tab === "historico" ? (
          finishedTournaments.length === 0 ? (
            <EmptyTab tab="historico" />
          ) : (
            finishedTournaments.map((t) => <FinishedTournamentCard key={t.id} t={t} />)
          )
        ) : nonFinished.length === 0 ? (
          <EmptyTab tab={tab} />
        ) : (
          nonFinished.map((t, i) => <TournamentCard key={t.id} t={t} defaultOpen={i === firstOpen} />)
        )}
      </div>
    </>
  );
}
