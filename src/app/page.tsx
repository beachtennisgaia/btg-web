import Link from "next/link";
import { HeroAuthButtons, CtaSignUpButton } from "@/components/auth-buttons";
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
  const [memberCount, finishedTournaments, upcomingTournaments, members, heroImages, recentPosts] = await Promise.all([
    db.member.count(),
    db.tournament.findMany({
      where: { status: "FINISHED" },
      orderBy: { date: "desc" },
      take: 4,
    }),
    db.tournament.findMany({
      where: { status: { in: ["ONGOING", "OPEN", "DRAFT"] } },
      orderBy: { date: "asc" },
      take: 4,
      include: { _count: { select: { registrations: true } } },
    }),
    db.member.findMany({
      include: { rankingPoints: { where: { year: YEAR } } },
    }),
    db.heroImage.findMany({ where: { active: true }, orderBy: { order: "asc" }, select: { url: true } }),
    db.post.findMany({
      orderBy: { createdAt: "desc" },
      take: 4,
      include: {
        author: { select: { name: true } },
        _count: { select: { likes: true, comments: true } },
      },
    }),
  ]);

  const finishedCount = finishedTournaments.length;

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
          <HeroAuthButtons />
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

      {/* TORNEIOS — duas colunas */}
      <section style={{ padding: "64px 32px", background: "#F9F9F9" }}>
        <div style={{ display: "grid", gridTemplateColumns: "minmax(0,1fr) minmax(0,1fr)", gap: 48, alignItems: "start" }}>

          {/* Coluna esquerda: Próximos */}
          <div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 24 }}>
              <h2 style={{ fontFamily: "var(--font-oswald), sans-serif", fontSize: 24, fontWeight: 700, color: "#111", margin: 0, letterSpacing: "0.03em" }}>PRÓXIMOS TORNEIOS</h2>
              <Link href="/torneios" style={{ color: "#F5C000", fontSize: 13, fontWeight: 600, textDecoration: "none" }}>Ver todos →</Link>
            </div>
            {upcomingTournaments.length === 0 ? (
              <div style={{ background: "#fff", borderRadius: 14, padding: "28px 20px", textAlign: "center", boxShadow: "0 2px 8px rgba(0,0,0,0.06)" }}>
                <p style={{ fontSize: 13, color: "#aaa", margin: 0 }}>Não há torneios agendados de momento.</p>
              </div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                {upcomingTournaments.map((t) => {
                  const isOpen = t.status === "OPEN";
                  const isOngoing = t.status === "ONGOING";
                  return (
                    <div key={t.id} style={{ background: "#fff", borderRadius: 12, overflow: "hidden", boxShadow: "0 2px 8px rgba(0,0,0,0.06)", display: "flex", alignItems: "stretch" }}>
                      <div style={{ width: 5, flexShrink: 0, background: isOngoing ? "#d32f2f" : isOpen ? "#F5C000" : "#333" }} />
                      <div style={{ padding: "14px 16px", flex: 1 }}>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 8 }}>
                          <div>
                            <span style={{ fontSize: 11, fontWeight: 700, color: isOngoing ? "#d32f2f" : isOpen ? "#7A5900" : "#888", textTransform: "uppercase", letterSpacing: "0.06em" }}>
                              {isOngoing ? "● A decorrer" : isOpen ? "Inscrições abertas" : "Em breve"}
                            </span>
                            <p style={{ fontFamily: "var(--font-oswald), sans-serif", fontSize: 15, fontWeight: 700, color: "#111", margin: "3px 0 4px" }}>{t.name}</p>
                            <p style={{ fontSize: 12, color: "#888", margin: 0 }}>
                              {new Date(t.date).toLocaleDateString("pt-PT", { day: "numeric", month: "short" })} · {t.location}
                            </p>
                          </div>
                          <span style={{ fontSize: 11, color: "#888", whiteSpace: "nowrap" }}>
                            {CAT_LABEL[t.category]}
                            {isOpen && ` · ${t._count.registrations}/${t.maxPairs}`}
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Coluna direita: Encerrados */}
          <div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 24 }}>
              <h2 style={{ fontFamily: "var(--font-oswald), sans-serif", fontSize: 24, fontWeight: 700, color: "#111", margin: 0, letterSpacing: "0.03em" }}>TORNEIOS ENCERRADOS</h2>
              <Link href="/torneios" style={{ color: "#F5C000", fontSize: 13, fontWeight: 600, textDecoration: "none" }}>Ver todos →</Link>
            </div>
            {finishedTournaments.length === 0 ? (
              <div style={{ background: "#fff", borderRadius: 14, padding: "28px 20px", textAlign: "center", boxShadow: "0 2px 8px rgba(0,0,0,0.06)" }}>
                <p style={{ fontSize: 13, color: "#aaa", margin: 0 }}>Ainda não há torneios realizados.</p>
              </div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                {finishedTournaments.map((t) => (
                  <div key={t.id} style={{ background: "#fff", borderRadius: 12, overflow: "hidden", boxShadow: "0 2px 8px rgba(0,0,0,0.06)", display: "flex", alignItems: "stretch" }}>
                    <div style={{ width: 5, flexShrink: 0, background: "#E0E0E0" }} />
                    <div style={{ padding: "14px 16px", flex: 1 }}>
                      <span style={{ fontSize: 11, fontWeight: 700, color: "#aaa", textTransform: "uppercase", letterSpacing: "0.06em" }}>Concluído</span>
                      <p style={{ fontFamily: "var(--font-oswald), sans-serif", fontSize: 15, fontWeight: 700, color: "#555", margin: "3px 0 4px" }}>{t.name}</p>
                      <p style={{ fontSize: 12, color: "#bbb", margin: 0 }}>
                        {new Date(t.date).toLocaleDateString("pt-PT", { day: "numeric", month: "short", year: "numeric" })} · {t.location}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

        </div>
      </section>

      {/* RANKING + COMUNIDADE — duas colunas */}
      <section style={{ padding: "64px 32px", background: "#fff" }}>
        <div style={{ display: "grid", gridTemplateColumns: "minmax(0,1fr) minmax(0,1fr)", gap: 48, alignItems: "start" }}>

          {/* Coluna esquerda: Ranking */}
          <div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 24 }}>
              <h2 style={{ fontFamily: "var(--font-oswald), sans-serif", fontSize: 24, fontWeight: 700, color: "#111", margin: 0, letterSpacing: "0.03em" }}>RANKING BTG {YEAR}</h2>
              <Link href="/ranking" style={{ color: "#F5C000", fontSize: 13, fontWeight: 600, textDecoration: "none" }}>Ver completo →</Link>
            </div>
            <div style={{ background: "#111", borderRadius: 16, overflow: "hidden" }}>
              <div style={{ padding: "12px 20px", borderBottom: "1px solid #222", display: "flex", justifyContent: "space-between" }}>
                <span style={{ color: "#888", fontSize: 11, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.06em" }}>Jogador</span>
                <span style={{ color: "#888", fontSize: 11, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.06em" }}>Pontos</span>
              </div>
              {rankings.length === 0 ? (
                <div style={{ padding: "28px 20px", textAlign: "center" }}>
                  <p style={{ color: "#555", fontSize: 13, margin: 0 }}>O ranking está a ser construído. Participa nos torneios!</p>
                </div>
              ) : (
                rankings.map(({ id, name, points }, i) => {
                  const b = BADGE[i];
                  return (
                    <div key={id} style={{ padding: "13px 20px", borderBottom: "1px solid #1a1a1a", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                        <span style={{ background: b.bg, color: b.color, fontWeight: 800, fontSize: 11, width: 20, height: 20, borderRadius: "50%", display: "inline-flex", alignItems: "center", justifyContent: "center" }}>
                          {i + 1}
                        </span>
                        <span style={{ color: "#fff", fontSize: 14, fontWeight: 600 }}>{name}</span>
                      </div>
                      <span style={{ color: "#F5C000", fontWeight: 700, fontSize: 15 }}>{points.toLocaleString("pt-PT")}</span>
                    </div>
                  );
                })
              )}
              <div style={{ padding: "12px 20px", textAlign: "center" }}>
                <Link href="/ranking" style={{ color: "#F5C000", fontSize: 12, fontWeight: 600, textDecoration: "none" }}>
                  Ver ranking completo ({memberCount} sócios) →
                </Link>
              </div>
            </div>
          </div>

          {/* Coluna direita: Últimas publicações */}
          <div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 24 }}>
              <h2 style={{ fontFamily: "var(--font-oswald), sans-serif", fontSize: 24, fontWeight: 700, color: "#111", margin: 0, letterSpacing: "0.03em" }}>COMUNIDADE</h2>
              <Link href="/comunidade" style={{ color: "#F5C000", fontSize: 13, fontWeight: 600, textDecoration: "none" }}>Ver tudo →</Link>
            </div>
            {recentPosts.length === 0 ? (
              <div style={{ background: "#F9F9F9", borderRadius: 14, padding: "28px 20px", textAlign: "center" }}>
                <p style={{ fontSize: 13, color: "#aaa", margin: 0 }}>Ainda não há publicações. Sê o primeiro!</p>
              </div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                {recentPosts.map((post) => (
                  <div key={post.id} style={{ background: "#F9F9F9", borderRadius: 12, padding: "14px 16px", border: "1px solid #F0F0F0" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
                      <span style={{ fontSize: 12, fontWeight: 700, color: "#333" }}>{post.author.name}</span>
                      <span style={{ fontSize: 11, color: "#bbb" }}>
                        {new Date(post.createdAt).toLocaleDateString("pt-PT", { day: "numeric", month: "short" })}
                      </span>
                    </div>
                    <p style={{ fontSize: 13, color: "#555", margin: "0 0 8px", lineHeight: 1.5, display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}>
                      {post.content}
                    </p>
                    <div style={{ display: "flex", gap: 12, fontSize: 11, color: "#bbb" }}>
                      <span>♥ {post._count.likes}</span>
                      <span>💬 {post._count.comments}</span>
                      <span style={{ marginLeft: "auto", background: post.type === "ANNOUNCEMENT" ? "#FFF3B0" : "#F0F0F0", color: post.type === "ANNOUNCEMENT" ? "#7A5900" : "#888", padding: "1px 7px", borderRadius: 99, fontWeight: 600 }}>
                        {post.type === "ANNOUNCEMENT" ? "Anúncio" : "Comunidade"}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

        </div>
      </section>

      {/* CTA */}
      <section style={{ background: "#F5C000", padding: "64px 32px", textAlign: "center" }}>
        <h2 style={{ fontFamily: "var(--font-oswald), sans-serif", fontSize: 36, fontWeight: 700, color: "#111", margin: "0 0 12px", letterSpacing: "0.03em" }}>JUNTA-TE AO BTG</h2>
        <p style={{ fontSize: 17, color: "#5A4000", margin: "0 0 32px", maxWidth: 480, marginLeft: "auto", marginRight: "auto" }}>
          Acede a torneios exclusivos, ranking BTG, galeria de fotos e comunidade de beach tennis em Gaia.
        </p>
        <CtaSignUpButton />
        <p style={{ fontSize: 13, color: "#8A6800", marginTop: 12 }}>Quota anual · Gestão simples · Sem complicações</p>
      </section>

      {/* FOOTER */}
      <footer style={{ background: "#111", padding: 32, display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 16 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/btg-logo-white.png" alt="BTG" style={{ height: 40, width: "auto" }} />
          <span style={{ color: "#555", fontSize: 13 }}>Beach Tennis Gaia · btgaia.pt</span>
        </div>
        <Link
          href="https://www.instagram.com/beachtennisgaia_btg"
          target="_blank"
          rel="noopener noreferrer"
          style={{ display: "flex", alignItems: "center", gap: 8, color: "#888", textDecoration: "none", fontSize: 13, fontWeight: 600 }}
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <rect x="2" y="2" width="20" height="20" rx="5" ry="5"/>
            <circle cx="12" cy="12" r="4"/>
            <circle cx="17.5" cy="6.5" r="0.5" fill="currentColor" stroke="none"/>
          </svg>
          @beachtennisgaia_btg
        </Link>
        <p style={{ color: "#555", fontSize: 12, margin: 0 }}>© 2026 BTG. Vila Nova de Gaia, Portugal.</p>
      </footer>
    </div>
  );
}
