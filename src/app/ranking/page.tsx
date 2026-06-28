import { Nav } from "@/components/nav";
import { db } from "@/lib/db";
import { BASE_POINTS, TAIL_POINTS, MAX_RESULTS, pointsForPosition } from "@/lib/ranking";

const YEAR = 2026;

const BADGE = [
  { bg: "#F5C000", color: "#111", rowBg: "#FFFDE7" },
  { bg: "#E0E0E0", color: "#555", rowBg: "#fff" },
  { bg: "#FFE0B2", color: "#BF6000", rowBg: "#fff" },
];

const LEVELS = [
  { key: "", label: "Geral" },
  { key: "BEGINNER", label: "Iniciante" },
  { key: "INTERMEDIATE", label: "Intermédio" },
  { key: "ADVANCED", label: "Avançado" },
];

const LEVEL_LABEL: Record<string, string> = {
  BEGINNER: "Iniciante",
  INTERMEDIATE: "Intermédio",
  ADVANCED: "Avançado",
};

const DOC_POSITIONS = [
  { label: "Campeão", pos: 1 },
  { label: "Finalista", pos: 2 },
  { label: "3.º lugar", pos: 3 },
  { label: "4.º lugar", pos: 4 },
  { label: "5.º lugar", pos: 5 },
  { label: "6.º lugar", pos: 6 },
  { label: "7.º lugar", pos: 7 },
  { label: "8.º lugar", pos: 8 },
  { label: "Restantes", pos: 9 },
];

function initials(name: string) {
  return name.split(" ").slice(0, 2).map((w) => w[0]).join("").toUpperCase();
}

export default async function RankingPage({
  searchParams,
}: {
  searchParams: Promise<{ nivel?: string }>;
}) {
  const { nivel } = await searchParams;
  const activeNivel = nivel ?? "";

  const [members, finishedCount, upcomingCount] = await Promise.all([
    db.member.findMany({ include: { rankingPoints: { where: { year: YEAR } } } }),
    db.tournament.count({ where: { status: "FINISHED" } }),
    db.tournament.count({ where: { status: { in: ["DRAFT", "OPEN", "ONGOING"] } } }),
  ]);

  const filtered = activeNivel
    ? members.filter((m) => m.level === activeNivel)
    : members;

  const rankings = filtered
    .map((m) => ({
      member: m,
      totalPoints: m.rankingPoints.reduce((s, r) => s + r.points, 0),
      tournaments: m.rankingPoints.length,
    }))
    .filter((r) => r.tournaments > 0)
    .sort((a, b) => b.totalPoints - a.totalPoints);

  const totalPointsRegistered = members.reduce(
    (s, m) => s + m.rankingPoints.reduce((ss, r) => ss + r.points, 0),
    0
  );
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

        {/* TABS */}
        <div style={{ display: "flex", gap: 8, marginBottom: 16, flexWrap: "wrap" }}>
          {LEVELS.map(({ key, label }) => {
            const isActive = activeNivel === key;
            return (
              <a
                key={key}
                href={key ? `/ranking?nivel=${key}` : "/ranking"}
                style={{
                  padding: "8px 18px",
                  borderRadius: 24,
                  fontSize: 13,
                  fontWeight: 600,
                  textDecoration: "none",
                  background: isActive ? "#F5C000" : "#fff",
                  color: isActive ? "#111" : "#555",
                  boxShadow: "0 1px 4px rgba(0,0,0,0.08)",
                  transition: "background 0.15s",
                }}
              >
                {label}
              </a>
            );
          })}
        </div>

        <div style={{ background: "#fff", borderRadius: 20, overflow: "hidden", boxShadow: "0 2px 16px rgba(0,0,0,0.08)" }}>

          {/* TABLE HEADER */}
          <div style={{ background: "#111", padding: "16px 20px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span style={{ fontFamily: "var(--font-oswald), sans-serif", fontSize: 18, fontWeight: 600, color: "#fff", letterSpacing: "0.04em" }}>
              RANKING BTG
            </span>
            <span style={{ fontSize: 12, color: "#F5C000", fontWeight: 600 }}>
              {YEAR} · {activeNivel ? LEVEL_LABEL[activeNivel] : "Geral"}
            </span>
          </div>

          {isEmpty ? (
            <div style={{ padding: "64px 32px", textAlign: "center" }}>
              <div style={{ fontSize: 56, marginBottom: 16 }}>🎾</div>
              <h2 style={{ fontFamily: "var(--font-oswald), sans-serif", fontSize: 26, fontWeight: 700, color: "#111", margin: "0 0 10px", letterSpacing: "0.03em" }}>
                {activeNivel ? `SEM PONTOS — ${LEVEL_LABEL[activeNivel].toUpperCase()}` : `TEMPORADA ${YEAR} A ARRANCAR`}
              </h2>
              <p style={{ fontSize: 15, color: "#666", maxWidth: 400, margin: "0 auto 32px", lineHeight: 1.7 }}>
                {activeNivel
                  ? `Ainda não há jogadores do nível ${LEVEL_LABEL[activeNivel]} com pontos registados.`
                  : "O ranking ainda não tem pontos registados. Os pontos são atribuídos após cada torneio BTG disputado."}
              </p>
              <div style={{ display: "flex", gap: 20, justifyContent: "center", flexWrap: "wrap", marginBottom: 40 }}>
                <div style={{ background: "#F9F9F9", borderRadius: 14, padding: "18px 24px", textAlign: "center", minWidth: 140 }}>
                  <p style={{ fontFamily: "var(--font-oswald), sans-serif", fontSize: 28, fontWeight: 700, color: "#F5C000", margin: 0 }}>{finishedCount}</p>
                  <p style={{ fontSize: 12, color: "#888", margin: "4px 0 0" }}>Torneio{finishedCount !== 1 ? "s" : ""} realizado{finishedCount !== 1 ? "s" : ""}</p>
                </div>
                <div style={{ background: "#F9F9F9", borderRadius: 14, padding: "18px 24px", textAlign: "center", minWidth: 140 }}>
                  <p style={{ fontFamily: "var(--font-oswald), sans-serif", fontSize: 28, fontWeight: 700, color: "#F5C000", margin: 0 }}>{totalPointsRegistered}</p>
                  <p style={{ fontSize: 12, color: "#888", margin: "4px 0 0" }}>Pontos registados</p>
                </div>
                <div style={{ background: "#F9F9F9", borderRadius: 14, padding: "18px 24px", textAlign: "center", minWidth: 140 }}>
                  <p style={{ fontFamily: "var(--font-oswald), sans-serif", fontSize: 28, fontWeight: 700, color: "#F5C000", margin: 0 }}>{upcomingCount}</p>
                  <p style={{ fontSize: 12, color: "#888", margin: "4px 0 0" }}>Torneio{upcomingCount !== 1 ? "s" : ""} por realizar</p>
                </div>
              </div>
              <a
                href="/torneios"
                style={{ background: "#F5C000", color: "#111", fontWeight: 700, padding: "14px 28px", borderRadius: 9, fontSize: 15, textDecoration: "none", display: "inline-block" }}
              >
                Ver próximos torneios →
              </a>
            </div>
          ) : (
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
                            <p style={{ fontSize: 11, color: "#888", margin: 0 }}>{LEVEL_LABEL[member.level] ?? member.level}</p>
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

        {/* DOCUMENTATION */}
        <details style={{ marginTop: 24 }}>
          <summary style={{
            background: "#fff",
            borderRadius: 16,
            padding: "18px 24px",
            boxShadow: "0 2px 8px rgba(0,0,0,0.06)",
            cursor: "pointer",
            listStyle: "none",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            fontWeight: 600,
            fontSize: 15,
            color: "#111",
          }}>
            <span>Como funciona o ranking BTG?</span>
            <span style={{ fontSize: 20, color: "#F5C000", fontWeight: 700 }}>+</span>
          </summary>

          <div style={{
            background: "#fff",
            borderRadius: "0 0 16px 16px",
            padding: "0 24px 28px",
            boxShadow: "0 4px 8px rgba(0,0,0,0.06)",
            marginTop: -4,
          }}>
            {/* Princípios */}
            <div style={{ borderTop: "1px solid #f0f0f0", paddingTop: 24, marginBottom: 24 }}>
              <h3 style={{ fontFamily: "var(--font-oswald), sans-serif", fontSize: 16, fontWeight: 700, color: "#111", margin: "0 0 12px", letterSpacing: "0.04em" }}>
                PRINCÍPIOS GERAIS
              </h3>
              <ul style={{ margin: 0, padding: "0 0 0 20px", color: "#444", fontSize: 14, lineHeight: 1.9 }}>
                <li>Os pontos são <strong>individuais</strong> — cada jogador acumula pontos independentemente do parceiro</li>
                <li>Contam os <strong>melhores {MAX_RESULTS} resultados</strong> dos últimos 12 meses (época rolante)</li>
                <li>Os pontos de cada torneio têm validade de <strong>52 semanas</strong></li>
                <li>Podes filtrar o ranking por nível de jogo nas tabs acima</li>
                <li>O ranking é actualizado automaticamente após cada torneio concluído</li>
              </ul>
            </div>

            {/* Fórmula */}
            <div style={{ background: "#F9F9F9", borderRadius: 12, padding: "16px 20px", marginBottom: 24 }}>
              <h3 style={{ fontFamily: "var(--font-oswald), sans-serif", fontSize: 14, fontWeight: 700, color: "#111", margin: "0 0 8px", letterSpacing: "0.04em" }}>
                FÓRMULA DE CÁLCULO
              </h3>
              <p style={{ fontSize: 13, color: "#555", margin: 0, lineHeight: 1.9 }}>
                <strong>Pontos = base × nível × tamanho</strong><br />
                · <strong>Base</strong>: pontos fixos por posição (ver tabela abaixo)<br />
                · <strong>Nível do torneio</strong>: Nível 1 = ×2,0 · Nível 2 = ×1,0<br />
                · <strong>Tamanho</strong>: 1 + log₁₀(duplas / 8) — 8 duplas = ×1,0 · 16 ≈ ×1,3 · 32 ≈ ×1,6
              </p>
            </div>

            {/* Tabela de pontos */}
            <div style={{ marginBottom: 28 }}>
              <h3 style={{ fontFamily: "var(--font-oswald), sans-serif", fontSize: 16, fontWeight: 700, color: "#111", margin: "0 0 4px", letterSpacing: "0.04em" }}>
                PONTOS POR POSIÇÃO
              </h3>
              <p style={{ fontSize: 13, color: "#888", margin: "0 0 12px" }}>
                Com 8 duplas como referência. Nível 1 duplica estes valores; mais duplas aumentam-nos proporcionalmente.
              </p>
              <div style={{ overflowX: "auto" }}>
                <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 14 }}>
                  <thead>
                    <tr style={{ background: "#F9F9F9", borderBottom: "2px solid #eee" }}>
                      <th style={{ padding: "8px 14px", textAlign: "left", color: "#888", fontWeight: 600, fontSize: 11, textTransform: "uppercase", letterSpacing: "0.06em" }}>Posição</th>
                      <th style={{ padding: "8px 14px", textAlign: "right", color: "#888", fontWeight: 600, fontSize: 11, textTransform: "uppercase", letterSpacing: "0.06em" }}>Nível 2 · 8 duplas</th>
                      <th style={{ padding: "8px 14px", textAlign: "right", color: "#F5C000", fontWeight: 600, fontSize: 11, textTransform: "uppercase", letterSpacing: "0.06em" }}>Nível 1 · 8 duplas</th>
                      <th style={{ padding: "8px 14px", textAlign: "right", color: "#F5C000", fontWeight: 600, fontSize: 11, textTransform: "uppercase", letterSpacing: "0.06em" }}>Nível 1 · 16 duplas</th>
                    </tr>
                  </thead>
                  <tbody>
                    {DOC_POSITIONS.map(({ label, pos }, idx) => (
                      <tr key={pos} style={{ borderBottom: "1px solid #f5f5f5", background: idx === 0 ? "#FFFDE7" : "#fff" }}>
                        <td style={{ padding: "9px 14px", fontWeight: idx === 0 ? 700 : 400, color: "#111" }}>
                          {idx === 0 && <span style={{ marginRight: 6 }}>🏆</span>}
                          {label}
                        </td>
                        <td style={{ padding: "9px 14px", textAlign: "right", color: "#555" }}>
                          {pointsForPosition(pos, 8, 2)} pts
                        </td>
                        <td style={{ padding: "9px 14px", textAlign: "right", fontWeight: 600, color: "#111" }}>
                          {pointsForPosition(pos, 8, 1)} pts
                        </td>
                        <td style={{ padding: "9px 14px", textAlign: "right", fontWeight: 600, color: "#111" }}>
                          {pointsForPosition(pos, 16, 1)} pts
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Formatos */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
              <div style={{ background: "#F9F9F9", borderRadius: 12, padding: "18px 20px" }}>
                <h4 style={{ fontFamily: "var(--font-oswald), sans-serif", fontSize: 14, fontWeight: 700, color: "#111", margin: "0 0 8px", letterSpacing: "0.04em" }}>
                  FORMATO NON-STOP
                </h4>
                <p style={{ fontSize: 13, color: "#555", margin: 0, lineHeight: 1.8 }}>
                  A posição final é determinada pela tabela de classificação — vitórias e depois diferencial de games. Se houver fase final, os finalistas são classificados pelo desempenho nessa fase; os restantes pela fase de grupos.
                </p>
              </div>
              <div style={{ background: "#F9F9F9", borderRadius: 12, padding: "18px 20px" }}>
                <h4 style={{ fontFamily: "var(--font-oswald), sans-serif", fontSize: 14, fontWeight: 700, color: "#111", margin: "0 0 8px", letterSpacing: "0.04em" }}>
                  FORMATO ELIMINATÓRIO
                </h4>
                <p style={{ fontSize: 13, color: "#555", margin: 0, lineHeight: 1.8 }}>
                  A posição é definida pela ronda mais longe atingida. Os dois finalistas recebem 1.º e 2.º lugar. Os semifinalistas ficam em 3.º. Os quartofinalistam em 5.º, e assim sucessivamente.
                </p>
              </div>
            </div>
          </div>
        </details>
      </div>
    </div>
  );
}
