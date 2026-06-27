import { Nav } from "@/components/nav";
import { db } from "@/lib/db";
import { auth } from "@clerk/nextjs/server";
import { ComposeBox } from "./compose-box";
import { PostCard } from "./post-card";

const YEAR = 2026;

export default async function ComunidadePage() {
  const { userId } = await auth();

  const [posts, members, upcomingEvents] = await Promise.all([
    db.post.findMany({
      include: {
        author: true,
        photos: true,
        likes: { select: { memberId: true } },
        comments: {
          include: { author: { select: { name: true, avatarUrl: true } } },
          orderBy: { createdAt: "asc" },
        },
      },
      orderBy: { createdAt: "desc" },
      take: 20,
    }),
    db.member.findMany({
      include: { rankingPoints: { where: { year: YEAR } } },
    }),
    db.tournament.findMany({
      where: { status: { in: ["OPEN", "ONGOING"] }, date: { gte: new Date() } },
      orderBy: { date: "asc" },
      take: 4,
    }),
  ]);

  const top3 = members
    .map((m) => ({
      name: m.name,
      points: m.rankingPoints.reduce((s, r) => s + r.points, 0),
    }))
    .filter((r) => r.points > 0)
    .sort((a, b) => b.points - a.points)
    .slice(0, 3);

  const isEmpty = posts.length === 0;

  const member = userId
    ? await db.member.findUnique({ where: { clerkId: userId } })
    : null;

  return (
    <div style={{ minHeight: "100vh", background: "#F0F0F0", fontFamily: "var(--font-inter), sans-serif" }}>
      <Nav />

      {/* HEADER */}
      <div className="btg-page-header" style={{ background: "#111" }}>
        <h1 style={{ fontFamily: "var(--font-oswald), sans-serif", fontSize: 38, fontWeight: 700, color: "#fff", margin: "0 0 6px", letterSpacing: "0.03em" }}>
          COMUNIDADE BTG
        </h1>
        <p style={{ color: "#888", fontSize: 15, margin: 0 }}>Fotos, notícias e momentos da nossa associação.</p>
      </div>

      <div className="btg-community-layout">

        {/* FEED */}
        <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 16 }}>

          {/* COMPOSE BOX */}
          {member ? (
            <ComposeBox memberName={member.name} />
          ) : (
            <div style={{ background: "#fff", borderRadius: 16, padding: "16px 20px", boxShadow: "0 2px 12px rgba(0,0,0,0.07)", display: "flex", alignItems: "center", gap: 12, border: "2px dashed #eee" }}>
              <div style={{ width: 40, height: 40, borderRadius: "50%", background: "#F0F0F0", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18, flexShrink: 0 }}>💬</div>
              <p style={{ margin: 0, fontSize: 14, color: "#aaa" }}>
                <a href="/sign-in" style={{ color: "#F5C000", fontWeight: 600, textDecoration: "none" }}>Inicia sessão</a> para partilhar com a comunidade.
              </p>
            </div>
          )}

          {/* EMPTY FEED STATE */}
          {isEmpty && (
            <div style={{ background: "#fff", borderRadius: 16, padding: "56px 32px", boxShadow: "0 2px 12px rgba(0,0,0,0.07)", textAlign: "center" }}>
              <div style={{ fontSize: 52, marginBottom: 16 }}>📸</div>
              <h2 style={{ fontFamily: "var(--font-oswald), sans-serif", fontSize: 24, fontWeight: 700, color: "#111", margin: "0 0 10px", letterSpacing: "0.03em" }}>
                SÊ O PRIMEIRO A PARTILHAR
              </h2>
              <p style={{ fontSize: 15, color: "#666", maxWidth: 380, margin: "0 auto", lineHeight: 1.7 }}>
                A comunidade BTG está a arrancar. Partilha fotos de treinos, jogadas ou momentos do clube — os teus colegas adoram!
              </p>
            </div>
          )}

          {/* POSTS */}
          {posts.map((post) => (
            <PostCard key={post.id} post={post} memberId={member?.id ?? null} />
          ))}
        </div>

        {/* SIDEBAR */}
        <div className="btg-sidebar" style={{ display: "flex", flexDirection: "column", gap: 16 }}>

          {/* UPCOMING EVENTS */}
          <div style={{ background: "#fff", borderRadius: 16, overflow: "hidden", boxShadow: "0 2px 12px rgba(0,0,0,0.07)" }}>
            <div style={{ background: "#111", padding: "14px 18px" }}>
              <span style={{ fontFamily: "var(--font-oswald), sans-serif", fontSize: 16, fontWeight: 600, color: "#fff", letterSpacing: "0.04em" }}>PRÓXIMOS EVENTOS</span>
            </div>
            {upcomingEvents.length === 0 ? (
              <div style={{ padding: "20px 18px", textAlign: "center" }}>
                <p style={{ fontSize: 13, color: "#aaa", margin: 0 }}>Sem torneios agendados de momento.</p>
              </div>
            ) : (
              <div style={{ padding: "14px 18px", display: "flex", flexDirection: "column", gap: 14 }}>
                {upcomingEvents.map((t, i) => {
                  const d = new Date(t.date);
                  const highlight = i === 0;
                  return (
                    <div key={t.id} style={{ display: "flex", gap: 12, alignItems: "flex-start" }}>
                      <div style={{ background: highlight ? "#F5C000" : "#F0F0F0", borderRadius: 8, padding: "6px 10px", textAlign: "center", minWidth: 44, flexShrink: 0 }}>
                        <p style={{ fontFamily: "var(--font-oswald), sans-serif", fontSize: 20, fontWeight: 700, color: highlight ? "#111" : "#555", margin: 0, lineHeight: 1 }}>
                          {d.getDate()}
                        </p>
                        <p style={{ fontSize: 10, fontWeight: 700, color: highlight ? "#111" : "#555", margin: 0, textTransform: "uppercase" }}>
                          {d.toLocaleDateString("pt-PT", { month: "short" }).replace(".", "")}
                        </p>
                      </div>
                      <div>
                        <p style={{ fontSize: 13, fontWeight: 600, color: "#111", margin: 0 }}>{t.name}</p>
                        <p style={{ fontSize: 12, color: "#888", margin: "2px 0 0" }}>{t.location}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* TOP 3 RANKING */}
          <div style={{ background: "#fff", borderRadius: 16, overflow: "hidden", boxShadow: "0 2px 12px rgba(0,0,0,0.07)" }}>
            <div style={{ background: "#F5C000", padding: "14px 18px" }}>
              <span style={{ fontFamily: "var(--font-oswald), sans-serif", fontSize: 16, fontWeight: 600, color: "#111", letterSpacing: "0.04em" }}>TOP 3 BTG</span>
            </div>
            {top3.length === 0 ? (
              <div style={{ padding: "20px 18px", textAlign: "center" }}>
                <p style={{ fontSize: 13, color: "#aaa", margin: 0 }}>Ranking ainda sem pontos em {YEAR}.</p>
              </div>
            ) : (
              <div style={{ padding: "14px 18px", display: "flex", flexDirection: "column", gap: 10 }}>
                {top3.map((r, i) => (
                  <div key={r.name} style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <span style={{ fontSize: 14 }}>{["🥇", "🥈", "🥉"][i]}</span>
                      <span style={{ fontSize: 14, fontWeight: 600, color: "#111" }}>{r.name}</span>
                    </div>
                    <span style={{ fontSize: 13, fontWeight: 700, color: "#111" }}>{r.points.toLocaleString("pt-PT")}</span>
                  </div>
                ))}
              </div>
            )}
          </div>

        </div>
      </div>
    </div>
  );
}
