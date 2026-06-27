import Link from "next/link";
import { SignInButton, SignUpButton } from "@clerk/nextjs";
import { Nav } from "@/components/nav";
import { db } from "@/lib/db";
import { HeroSlideshow } from "@/components/hero-slideshow";

export const revalidate = 60;

const YEAR = 2026;

const CAT_LABEL: Record<string, string> = { MIXED: "Duplas Mistas", MALE: "Duplas Masc.", FEMALE: "Duplas Fem.", OPEN: "Open" };
const FORMAT_LABEL: Record<string, string> = { ELIMINATION: "Eliminatório", NON_STOP: "Non-Stop" };

const BADGE = [
  { bg: "#F5C000", color: "#111" },
  { bg: "#E0E0E0", color: "#555" },
  { bg: "#FFE0B2", color: "#BF6000" },
];

export default async function HomePage() {
  const [memberCount, finishedCount, upcomingTournaments, members, heroImages] = await Promise.all([
    db.member.count(),
    db.tournament.count({ where: { status: "FINISHED" } }),
    db.tournament.findMany({
      where: { status: { in: ["ONGOING", "OPEN", "DRAFT"] } },
      orderBy: { date: "asc" },
      take: 3,
      include: { _count: { select: { registrations: true } } },
    }),
    db.member.findMany({
      include: { rankingPoints: { where: { year: YEAR } } },
    }),
    db.heroImage.findMany({ where: { active: true }, orderBy: { order: "asc" }, select: { url: true } }),
  ]);

  const rankings = members
    .map((m) => ({
      id: m.id,
      name: m.name,
      points: m.rankingPoints.reduce((s, p) => s + p.points, 0),
      tournaments: m.rankingPoints.length,
    }))
    .filter((r) => r.tournaments > 0)
    .sort((a, b) => b.points - a.points)
    .slice(0, 3);

  const nextTournament = upcomingTournaments.find((t) => t.status === "ONGOING") ?? upcomingTournaments.find((t) => t.status === "OPEN") ?? upcomingTournaments[0] ?? null;

  return (
    <div className="min-h-screen flex flex-col" style={{ fontFamily: "var(--font-inter), sans-serif" }}>
      <Nav />

      {/* HERO */}
      <section style={{ position: "relative", minHeight: 520, display: "flex", alignItems: "center", overflow: "hidden" }}>
        <HeroSlideshow urls={heroImages.map((i) => i.url)} />
        <div style={{ position: "relative", zIndex: 3, padding: "80px 32px", maxWidth: 640 }}>
          <span style={{ background: "#F5C000", color: "#111", fontSize: 12, fontWeight: 700, padding: "4px 12px", borderRadius: 99, textTransform: "uppercase", letterSpacing: "0.08em" }}>
            Vila Nova de Gaia
          </span>
          <h1 style={{ fontFamily: "var(--font-oswald), sans-serif", fontSize: 58, fontWeight: 700, color: "#fff", margin: "16px 0 8px", lineHeight: 1.05, letterSpacing: "0.02em" }}>
            BEACH TENNIS<br /><span style={{ color: "#F5C000" }}>GAIA</span>
          </h1>
          <p style={{ fontSize: 18, color: "#bbb", margin: "0 0 32px", lineHeight: 1.6 }}>
            A comunidade de beach tennis de Gaia. Torneios, ranking, convívio e muito mais. Junta-te a nós.
          </p>
          <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
            <SignUpButton mode="modal">
              <button style={{ background: "#F5C000", color: "#111", fontWeight: 700, padding: "14px 28px", borderRadius: 9, border: "none", fontSize: 16, cursor: "pointer" }}>
                Tornar-me Sócio
              </button>
            </SignUpButton>
            <Link href="/torneios" style={{ background: "rgba(255,255,255,0.1)", color: "#fff", fontWeight: 600, padding: "14px 28px", borderRadius: 9, border: "2px solid rgba(255,255,255,0.25)", fontSize: 16, textDecoration: "none" }}>
              Ver Torneios
            </Link>
          </div>
          <div style={{ display: "flex", gap: 40, marginTop: 48, paddingTop: 40, borderTop: "1px solid rgba(255,255,255,0.1)" }}>
            {[
              [String(memberCount), "Sócios Ativos"],
              [String(finishedCount), "Torneios Realizados"],
              [String(upcomingTournaments.length), "Próximos Eventos"],
            ].map(([n, label]) => (
              <div key={label}>
                <p style={{ fontFamily: "var(--font-oswald), sans-serif", fontSize: 36, fontWeight: 700, color: "#F5C000", margin: 0 }}>{n}</p>
                <p style={{ fontSize: 13, color: "#888", margin: "4px 0 0" }}>{label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* BANNER PRÓXIMO TORNEIO */}
      {nextTournament ? (
        <section style={{ background: "#F5C000", padding: "28px 32px", display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 16 }}>
          <div>
            <span style={{ fontSize: 12, fontWeight: 700, color: nextTournament.status === "ONGOING" ? "#d32f2f" : "#8A6800", textTransform: "uppercase", letterSpacing: "0.08em" }}>{nextTournament.status === "ONGOING" ? "● A Decorrer Agora" : "● Próximo Torneio"}</span>
            <p style={{ fontFamily: "var(--font-oswald), sans-serif", fontSize: 22, fontWeight: 700, color: "#111", margin: "4px 0 0" }}>
              {nextTournament.name.toUpperCase()} · {new Date(nextTournament.date).toLocaleDateString("pt-PT", { day: "numeric", month: "short" }).toUpperCase()} · {nextTournament.location.toUpperCase()}
            </p>
          </div>
          <Link href="/torneios" style={{ background: "#111", color: "#F5C000", fontWeight: 700, padding: "12px 24px", borderRadius: 8, fontSize: 15, textDecoration: "none", whiteSpace: "nowrap" }}>
            {nextTournament.status === "ONGOING" ? "Ver a Decorrer" : nextTournament.status === "OPEN" ? "Inscrever-me Agora" : "Saber Mais"}
          </Link>
        </section>
      ) : null}

      {/* PRÓXIMOS TORNEIOS */}
      <section style={{ padding: "64px 32px", background: "#F9F9F9" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 32 }}>
          <h2 style={{ fontFamily: "var(--font-oswald), sans-serif", fontSize: 30, fontWeight: 700, color: "#111", margin: 0, letterSpacing: "0.03em" }}>PRÓXIMOS TORNEIOS</h2>
          <Link href="/torneios" style={{ color: "#F5C000", fontSize: 14, fontWeight: 600, textDecoration: "none" }}>Ver todos →</Link>
        </div>

        {upcomingTournaments.length === 0 ? (
          <div style={{ background: "#fff", borderRadius: 16, padding: "40px 24px", textAlign: "center", boxShadow: "0 2px 12px rgba(0,0,0,0.07)" }}>
            <p style={{ fontSize: 14, color: "#888" }}>Não há torneios agendados de momento. Fica atento!</p>
            <Link href="/torneios" style={{ color: "#F5C000", fontSize: 14, fontWeight: 600, textDecoration: "none" }}>Ver histórico de torneios →</Link>
          </div>
        ) : (
          <div style={{ display: "flex", gap: 20, flexWrap: "wrap" }}>
            {upcomingTournaments.map((t) => {
              const isOpen = t.status === "OPEN";
              return (
                <div key={t.id} style={{ background: "#fff", borderRadius: 16, overflow: "hidden", boxShadow: "0 2px 12px rgba(0,0,0,0.07)", width: 280 }}>
                  <div style={{ background: isOpen ? "#F5C000" : "#111", padding: 18 }}>
                    <span style={{ background: isOpen ? "#111" : "#F5C000", color: isOpen ? "#F5C000" : "#111", fontSize: 11, fontWeight: 700, padding: "3px 8px", borderRadius: 99 }}>
                      {isOpen ? "Inscrições Abertas" : "Em breve"}
                    </span>
                    <p style={{ fontFamily: "var(--font-oswald), sans-serif", fontSize: 18, fontWeight: 700, color: isOpen ? "#111" : "#fff", margin: "10px 0 0", lineHeight: 1.2 }}>
                      {t.name.toUpperCase()}
                    </p>
                  </div>
                  <div style={{ padding: 16 }}>
                    <p style={{ fontSize: 13, color: "#666", margin: "0 0 6px" }}>
                      📅 {new Date(t.date).toLocaleDateString("pt-PT", { day: "numeric", month: "short" })} · {t.location}
                    </p>
                    <p style={{ fontSize: 13, color: "#666", margin: "0 0 12px" }}>
                      👥 {CAT_LABEL[t.category]} · {FORMAT_LABEL[t.format]}
                      {isOpen && ` · ${t._count.registrations}/${t.maxPairs}`}
                    </p>
                    <Link
                      href={`/torneios`}
                      style={{ display: "block", width: "100%", textAlign: "center", background: isOpen ? "#F5C000" : "#111", color: isOpen ? "#111" : "#fff", fontWeight: 700, padding: "10px 0", borderRadius: 7, fontSize: 14, textDecoration: "none" }}
                    >
                      {isOpen ? "Inscrever-me" : "Saber Mais"}
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* RANKING PREVIEW */}
      <section style={{ padding: "64px 32px", background: "#fff" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 32 }}>
          <h2 style={{ fontFamily: "var(--font-oswald), sans-serif", fontSize: 30, fontWeight: 700, color: "#111", margin: 0, letterSpacing: "0.03em" }}>RANKING BTG {YEAR}</h2>
          <Link href="/ranking" style={{ color: "#F5C000", fontSize: 14, fontWeight: 600, textDecoration: "none" }}>Ver ranking completo →</Link>
        </div>

        <div style={{ background: "#111", borderRadius: 16, overflow: "hidden", maxWidth: 480 }}>
          <div style={{ padding: "14px 20px", borderBottom: "1px solid #222", display: "flex", justifyContent: "space-between" }}>
            <span style={{ color: "#888", fontSize: 12, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.06em" }}>Jogador</span>
            <span style={{ color: "#888", fontSize: 12, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.06em" }}>Pontos</span>
          </div>

          {rankings.length === 0 ? (
            <div style={{ padding: "32px 20px", textAlign: "center" }}>
              <p style={{ color: "#555", fontSize: 14, margin: 0 }}>O ranking está a ser construído. Participa nos torneios!</p>
            </div>
          ) : (
            rankings.map(({ id, name, points }, i) => {
              const b = BADGE[i];
              return (
                <div key={id} style={{ padding: "14px 20px", borderBottom: "1px solid #1a1a1a", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <span style={{ background: b.bg, color: b.color, fontWeight: 800, fontSize: 12, width: 22, height: 22, borderRadius: "50%", display: "inline-flex", alignItems: "center", justifyContent: "center" }}>
                      {i + 1}
                    </span>
                    <span style={{ color: "#fff", fontSize: 14, fontWeight: 600 }}>{name}</span>
                  </div>
                  <span style={{ color: "#F5C000", fontWeight: 700, fontSize: 16 }}>{points.toLocaleString("pt-PT")}</span>
                </div>
              );
            })
          )}

          <div style={{ padding: "14px 20px", textAlign: "center" }}>
            <Link href="/ranking" style={{ color: "#F5C000", fontSize: 13, fontWeight: 600, textDecoration: "none" }}>
              Ver ranking completo ({memberCount} sócios) →
            </Link>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section style={{ background: "#F5C000", padding: "64px 32px", textAlign: "center" }}>
        <h2 style={{ fontFamily: "var(--font-oswald), sans-serif", fontSize: 36, fontWeight: 700, color: "#111", margin: "0 0 12px", letterSpacing: "0.03em" }}>JUNTA-TE AO BTG</h2>
        <p style={{ fontSize: 17, color: "#5A4000", margin: "0 0 32px", maxWidth: 480, marginLeft: "auto", marginRight: "auto" }}>
          Acede a torneios exclusivos, ranking BTG, galeria de fotos e comunidade de beach tennis em Gaia.
        </p>
        <SignUpButton mode="modal">
          <button style={{ background: "#111", color: "#F5C000", fontWeight: 700, padding: "16px 36px", borderRadius: 10, border: "none", fontSize: 17, cursor: "pointer" }}>
            Tornar-me Sócio BTG
          </button>
        </SignUpButton>
        <p style={{ fontSize: 13, color: "#8A6800", marginTop: 12 }}>Quota anual · Gestão simples · Sem complicações</p>
      </section>

      {/* FOOTER */}
      <footer style={{ background: "#111", padding: 32, display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 16 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/btg-logo-white.png" alt="BTG" style={{ height: 40, width: "auto" }} />
          <span style={{ color: "#555", fontSize: 13 }}>Beach Tennis Gaia · btgaia.pt</span>
        </div>
        <p style={{ color: "#555", fontSize: 12, margin: 0 }}>© 2026 BTG. Vila Nova de Gaia, Portugal.</p>
      </footer>
    </div>
  );
}
