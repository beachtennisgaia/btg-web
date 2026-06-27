import { Nav } from "@/components/nav";
import { db } from "@/lib/db";

const YEAR = 2026;

const BADGE = [
  { bg: "#F5C000", color: "#111", rowBg: "#FFFDE7" },
  { bg: "#E0E0E0", color: "#555", rowBg: "#fff" },
  { bg: "#FFE0B2", color: "#BF6000", rowBg: "#fff" },
];

function initials(name: string) {
  return name.split(" ").slice(0, 2).map((w) => w[0]).join("").toUpperCase();
}

function levelLabel(level: string) {
  const map: Record<string, string> = {
    BEGINNER: "Iniciante",
    INTERMEDIATE: "Intermédio",
    ADVANCED: "Avançado",
  };
  return map[level] ?? level;
}

export default async function RankingPage() {
  const members = await db.member.findMany({
    include: { rankingPoints: { where: { year: YEAR } } },
  });

  const rankings = members
    .map((m) => ({
      member: m,
      totalPoints: m.rankingPoints.reduce((s, r) => s + r.points, 0),
      tournaments: m.rankingPoints.length,
    }))
    .filter((r) => r.tournaments > 0)
    .sort((a, b) => b.totalPoints - a.totalPoints);

  const isEmpty = rankings.length === 0;

  return (
    <div style={{ minHeight: "100vh", background: "#F0F0F0", fontFamily: "var(--font-inter), sans-serif" }}>
      <Nav />

      {/* PAGE HEADER */}
      <div className="btg-page-header" style={{ background: "#111" }}>
        <h1 style={{ fontFamily: "var(--font-oswald), sans-serif", fontSize: 38, fontWeight: 700, color: "#fff", margin: "0 0 6px", letterSpacing: "0.03em" }}>
          RANKING BTG
        </h1>
        <p style={{ color: "#888", fontSize: 15, margin: 0 }}>
          Classificação geral da temporada {YEAR} — pontos acumulados em torneios BTG.
        </p>
      </div>

      <div className="btg-page-content">
        <div style={{ background: "#fff", borderRadius: 20, overflow: "hidden", boxShadow: "0 2px 16px rgba(0,0,0,0.08)" }}>

          {/* TABLE HEADER */}
          <div style={{ background: "#111", padding: "16px 20px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span style={{ fontFamily: "var(--font-oswald), sans-serif", fontSize: 18, fontWeight: 600, color: "#fff", letterSpacing: "0.04em" }}>
              RANKING BTG
            </span>
            <span style={{ fontSize: 12, color: "#F5C000", fontWeight: 600 }}>
              {YEAR} · Geral
            </span>
          </div>

          {isEmpty ? (
            /* EMPTY STATE */
            <div style={{ padding: "64px 32px", textAlign: "center" }}>
              <div style={{ fontSize: 56, marginBottom: 16 }}>🎾</div>
              <h2 style={{ fontFamily: "var(--font-oswald), sans-serif", fontSize: 26, fontWeight: 700, color: "#111", margin: "0 0 10px", letterSpacing: "0.03em" }}>
                TEMPORADA {YEAR} A ARRANCAR
              </h2>
              <p style={{ fontSize: 15, color: "#666", maxWidth: 400, margin: "0 auto 32px", lineHeight: 1.7 }}>
                O ranking ainda não tem pontos registados. Os pontos são atribuídos após cada torneio BTG disputado.
              </p>
              <div style={{ display: "flex", gap: 20, justifyContent: "center", flexWrap: "wrap", marginBottom: 40 }}>
                <div style={{ background: "#F9F9F9", borderRadius: 14, padding: "18px 24px", textAlign: "center", minWidth: 140 }}>
                  <p style={{ fontFamily: "var(--font-oswald), sans-serif", fontSize: 28, fontWeight: 700, color: "#F5C000", margin: 0 }}>1</p>
                  <p style={{ fontSize: 12, color: "#888", margin: "4px 0 0" }}>Torneio realizado</p>
                </div>
                <div style={{ background: "#F9F9F9", borderRadius: 14, padding: "18px 24px", textAlign: "center", minWidth: 140 }}>
                  <p style={{ fontFamily: "var(--font-oswald), sans-serif", fontSize: 28, fontWeight: 700, color: "#F5C000", margin: 0 }}>0</p>
                  <p style={{ fontSize: 12, color: "#888", margin: "4px 0 0" }}>Pontos registados</p>
                </div>
                <div style={{ background: "#F9F9F9", borderRadius: 14, padding: "18px 24px", textAlign: "center", minWidth: 140 }}>
                  <p style={{ fontFamily: "var(--font-oswald), sans-serif", fontSize: 28, fontWeight: 700, color: "#F5C000", margin: 0 }}>3</p>
                  <p style={{ fontSize: 12, color: "#888", margin: "4px 0 0" }}>Torneios previstos</p>
                </div>
              </div>
              <a
                href="/torneios"
                style={{ background: "#F5C000", color: "#111", fontWeight: 700, padding: "14px 28px", borderRadius: 9, fontSize: 15, textDecoration: "none", display: "inline-block" }}
              >
                Ver próximos torneios →
              </a>
              <p style={{ fontSize: 12, color: "#aaa", marginTop: 16 }}>
                O ranking é atualizado automaticamente após cada torneio concluído.
              </p>
            </div>
          ) : (
            /* RANKING TABLE */
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr style={{ background: "#F9F9F9", borderBottom: "1px solid #eee" }}>
                  {["#", "Jogador", "Torneios", "Pts"].map((h, i) => (
                    <th
                      key={h}
                      style={{
                        padding: "10px 16px",
                        textAlign: i === 0 ? "left" : i === 2 ? "center" : i === 3 ? "right" : "left",
                        fontSize: 11,
                        color: "#999",
                        fontWeight: 600,
                        textTransform: "uppercase",
                        letterSpacing: "0.06em",
                      }}
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {rankings.map(({ member, totalPoints, tournaments }, idx) => {
                  const badge = BADGE[idx] ?? { bg: "#F0F0F0", color: "#999", rowBg: "#fff" };
                  const ini = initials(member.name);
                  return (
                    <tr key={member.id} style={{ borderBottom: "1px solid #f0f0f0", background: badge.rowBg }}>
                      <td style={{ padding: "12px 16px" }}>
                        {idx < 3 ? (
                          <span style={{ background: badge.bg, color: badge.color, fontWeight: 800, fontSize: 13, width: 26, height: 26, borderRadius: "50%", display: "inline-flex", alignItems: "center", justifyContent: "center" }}>
                            {idx + 1}
                          </span>
                        ) : (
                          <span style={{ color: "#bbb", fontWeight: 600, fontSize: 14, paddingLeft: 4 }}>{idx + 1}</span>
                        )}
                      </td>
                      <td style={{ padding: "12px 16px" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                          <div style={{ width: 34, height: 34, borderRadius: "50%", background: idx === 0 ? "#F5C000" : "#F0F0F0", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700, fontSize: 13, color: idx === 0 ? "#111" : "#666", flexShrink: 0 }}>
                            {ini}
                          </div>
                          <div>
                            <p style={{ fontWeight: 600, fontSize: 14, color: "#111", margin: 0 }}>{member.name}</p>
                            <p style={{ fontSize: 11, color: "#888", margin: 0 }}>{levelLabel(member.level)}</p>
                          </div>
                        </div>
                      </td>
                      <td style={{ padding: "12px 16px", textAlign: "center", fontSize: 14, color: "#555" }}>{tournaments}</td>
                      <td style={{ padding: "12px 16px", textAlign: "right", fontWeight: 700, fontSize: 16, color: "#111" }}>
                        {totalPoints.toLocaleString("pt-PT")}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}
