import { db } from "@/lib/db";
import { upsertRankingPoint, deleteRankingPoint, autoComputeRankingPoints } from "@/lib/actions";

export default async function AdminRankingPage() {
  const [tournaments, members] = await Promise.all([
    db.tournament.findMany({ where: { status: "FINISHED" }, orderBy: { date: "desc" } }),
    db.member.findMany({ orderBy: { name: "asc" } }),
  ]);

  const allPoints = await db.rankingPoint.findMany({ include: { member: true, tournament: true } });

  return (
    <div style={{ padding: 32, maxWidth: 900 }}>
      <div style={{ marginBottom: 28 }}>
        <h1 style={{ fontFamily: "var(--font-oswald), sans-serif", fontSize: 28, fontWeight: 700, color: "#111", margin: 0 }}>RANKING — LANÇAR PONTOS</h1>
        <p style={{ color: "#888", fontSize: 14, margin: "4px 0 0" }}>
          Usa "Calcular automaticamente" para atribuir pontos com base nos resultados do torneio, ou ajusta manualmente por sócio.
        </p>
      </div>

      {tournaments.length === 0 ? (
        <div style={{ background: "#fff", borderRadius: 16, padding: "48px 32px", textAlign: "center", boxShadow: "0 2px 8px rgba(0,0,0,0.06)" }}>
          <p style={{ fontSize: 36, margin: "0 0 12px" }}>🏆</p>
          <p style={{ fontFamily: "var(--font-oswald), sans-serif", fontSize: 20, color: "#111", margin: "0 0 8px" }}>SEM TORNEIOS CONCLUÍDOS</p>
          <p style={{ fontSize: 14, color: "#888" }}>Marca um torneio como "Concluído" para poderes lançar pontos.</p>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
          {tournaments.map((t) => {
            const tPoints = allPoints.filter((p) => p.tournamentId === t.id);
            const membersWithPoints = new Set(tPoints.map((p) => p.memberId));

            return (
              <div key={t.id} style={{ background: "#fff", borderRadius: 16, overflow: "hidden", boxShadow: "0 2px 8px rgba(0,0,0,0.06)" }}>
                <div style={{ background: "#111", padding: "14px 20px", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 8 }}>
                  <div>
                    <span style={{ fontFamily: "var(--font-oswald), sans-serif", fontSize: 16, fontWeight: 600, color: "#fff", letterSpacing: "0.04em" }}>
                      {t.name.toUpperCase()}
                    </span>
                    <span style={{ fontSize: 12, color: "#888", marginLeft: 12 }}>
                      {new Date(t.date).toLocaleDateString("pt-PT", { day: "numeric", month: "short", year: "numeric" })} · {tPoints.length} pontuações
                    </span>
                  </div>
                  <form action={autoComputeRankingPoints.bind(null, t.id)}>
                    <button
                      type="submit"
                      style={{ background: "#F5C000", color: "#111", fontWeight: 700, padding: "7px 16px", borderRadius: 8, border: "none", fontSize: 13, cursor: "pointer", whiteSpace: "nowrap" }}
                    >
                      Calcular automaticamente
                    </button>
                  </form>
                </div>
                <table style={{ width: "100%", borderCollapse: "collapse" }}>
                  <thead>
                    <tr style={{ background: "#F9F9F9", borderBottom: "1px solid #eee" }}>
                      {["Sócio", "Pontos", ""].map((h) => (
                        <th key={h} style={{ padding: "10px 16px", textAlign: "left", fontSize: 11, color: "#999", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.06em" }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {members.map((m) => {
                      const existing = tPoints.find((p) => p.memberId === m.id);
                      return (
                        <tr key={m.id} style={{ borderBottom: "1px solid #f5f5f5", background: membersWithPoints.has(m.id) ? "#FFFDE7" : "#fff" }}>
                          <td style={{ padding: "10px 16px", fontSize: 14, fontWeight: 600, color: "#111" }}>{m.name}</td>
                          <td style={{ padding: "10px 16px" }}>
                            <form action={async (fd) => {
                              "use server";
                              const pts = Number(fd.get("points"));
                              if (pts > 0) await upsertRankingPoint(m.id, t.id, pts);
                            }}>
                              <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                                <input
                                  name="points"
                                  type="number"
                                  defaultValue={existing?.points ?? ""}
                                  placeholder="0"
                                  min={0}
                                  style={{ width: 80, padding: "6px 8px", border: "1.5px solid #e0e0e0", borderRadius: 7, fontSize: 14, fontFamily: "inherit" }}
                                />
                                <button type="submit" style={{ background: "#F5C000", color: "#111", fontWeight: 700, padding: "7px 14px", borderRadius: 7, border: "none", fontSize: 13, cursor: "pointer" }}>
                                  {existing ? "Atualizar" : "Atribuir"}
                                </button>
                              </div>
                            </form>
                          </td>
                          <td style={{ padding: "10px 16px" }}>
                            {existing && (
                              <form action={deleteRankingPoint.bind(null, m.id, t.id)}>
                                <button type="submit" style={{ background: "none", border: "none", color: "#d32f2f", fontSize: 12, fontWeight: 600, cursor: "pointer", padding: 0 }}>
                                  Remover
                                </button>
                              </form>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
