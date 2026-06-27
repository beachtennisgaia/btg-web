import { auth, currentUser } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { Nav } from "@/components/nav";
import { db } from "@/lib/db";
import { Onboarding } from "./onboarding";

const YEAR = 2026;

const LEVEL_LABEL: Record<string, string> = {
  BEGINNER: "Iniciante",
  INTERMEDIATE: "Intermédio",
  ADVANCED: "Avançado",
};

function initials(name: string) {
  return name.split(" ").slice(0, 2).map((w) => w[0]).join("").toUpperCase();
}

export default async function DashboardPage() {
  const { userId } = await auth();
  if (!userId) redirect("/sign-in");

  const clerkUser = await currentUser();
  const email = clerkUser?.emailAddresses[0]?.emailAddress ?? "";

  const member = await db.member.findUnique({
    where: { clerkId: userId },
    include: {
      rankingPoints: { where: { year: YEAR } },
      registrationsAsP1: {
        include: { tournament: true },
        orderBy: { createdAt: "desc" },
        take: 5,
      },
    },
  });

  // No profile or profile not yet completed — show onboarding
  if (!member || !member.profileComplete) {
    return (
      <>
        <Nav />
        <Onboarding email={email} name={member?.name ?? ""} />
      </>
    );
  }

  const totalPoints = member.rankingPoints.reduce((s, r) => s + r.points, 0);
  const tournaments = member.rankingPoints.length;

  // Ranking position
  const allMembers = await db.member.findMany({
    include: { rankingPoints: { where: { year: YEAR } } },
  });
  const ranked = allMembers
    .map((m) => ({ id: m.id, pts: m.rankingPoints.reduce((s, r) => s + r.points, 0) }))
    .filter((m) => m.pts > 0)
    .sort((a, b) => b.pts - a.pts);
  const rankPos = ranked.findIndex((m) => m.id === member.id);
  const rankLabel = rankPos >= 0 ? `#${rankPos + 1}` : "—";

  const upcomingRegs = member.registrationsAsP1.filter(
    (r) => r.tournament.status === "OPEN" || r.tournament.status === "ONGOING"
  );

  return (
    <div style={{ minHeight: "100vh", background: "#F0F0F0", fontFamily: "var(--font-inter), sans-serif" }}>
      <Nav />

      {/* HEADER */}
      <div style={{ background: "#111", padding: "40px 32px 32px" }}>
        <h1 style={{ fontFamily: "var(--font-oswald), sans-serif", fontSize: 38, fontWeight: 700, color: "#fff", margin: "0 0 6px", letterSpacing: "0.03em" }}>
          ÁREA DE SÓCIO
        </h1>
        <p style={{ color: "#888", fontSize: 15, margin: 0 }}>O teu perfil, inscrições e estatísticas BTG.</p>
      </div>

      <div style={{ padding: "32px", maxWidth: 1000, display: "flex", gap: 24, alignItems: "flex-start", flexWrap: "wrap" }}>

        {/* LEFT — Member card */}
        <div style={{ width: 280, flexShrink: 0 }}>
          <div style={{ background: "#fff", borderRadius: 20, overflow: "hidden", boxShadow: "0 2px 16px rgba(0,0,0,0.09)" }}>
            <div style={{ background: "linear-gradient(135deg, #111 60%, #222)", padding: "24px 20px", position: "relative" }}>
              {/* Watermark logo */}
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/btg-logo-white.png" alt="" aria-hidden style={{ position: "absolute", top: 10, right: 10, height: 52, width: "auto", opacity: 0.14, pointerEvents: "none" }} />
              {member.avatarUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={member.avatarUrl} alt="" style={{ width: 56, height: 56, borderRadius: "50%", objectFit: "cover", marginBottom: 12 }} />
              ) : (
                <div style={{ width: 56, height: 56, borderRadius: "50%", background: "#F5C000", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 800, fontSize: 22, color: "#111", marginBottom: 12 }}>
                  {initials(member.name)}
                </div>
              )}
              <p style={{ fontFamily: "var(--font-oswald), sans-serif", fontSize: 20, fontWeight: 700, color: "#fff", margin: 0, lineHeight: 1.2 }}>{member.name}</p>
              <p style={{ fontSize: 13, color: "#F5C000", margin: "4px 0 0", fontWeight: 500 }}>
                {member.memberNumber ? `Sócio nº ${String(member.memberNumber).padStart(3, "0")}` : "Sócio BTG"} · {LEVEL_LABEL[member.level]}
              </p>
            </div>
            <div style={{ padding: "16px 20px" }}>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 16 }}>
                <div style={{ textAlign: "center", background: "#F9F9F9", borderRadius: 10, padding: 12 }}>
                  <p style={{ fontFamily: "var(--font-oswald), sans-serif", fontSize: 22, fontWeight: 700, color: "#111", margin: 0 }}>{tournaments}</p>
                  <p style={{ fontSize: 11, color: "#888", margin: "2px 0 0" }}>Torneios</p>
                </div>
                <div style={{ textAlign: "center", background: "#FFFDE7", borderRadius: 10, padding: 12 }}>
                  <p style={{ fontFamily: "var(--font-oswald), sans-serif", fontSize: 22, fontWeight: 700, color: "#111", margin: 0 }}>{totalPoints > 0 ? totalPoints.toLocaleString("pt-PT") : "—"}</p>
                  <p style={{ fontSize: 11, color: "#888", margin: "2px 0 0" }}>Pontos {YEAR}</p>
                </div>
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 16 }}>
                <div style={{ textAlign: "center", background: "#F9F9F9", borderRadius: 10, padding: 12 }}>
                  <p style={{ fontFamily: "var(--font-oswald), sans-serif", fontSize: 22, fontWeight: 700, color: "#111", margin: 0 }}>{rankLabel}</p>
                  <p style={{ fontSize: 11, color: "#888", margin: "2px 0 0" }}>Ranking</p>
                </div>
                <div style={{ textAlign: "center", background: "#F9F9F9", borderRadius: 10, padding: 12 }}>
                  <p style={{ fontFamily: "var(--font-oswald), sans-serif", fontSize: 22, fontWeight: 700, color: "#111", margin: 0 }}>{member.quotaYear === YEAR ? "✓" : "—"}</p>
                  <p style={{ fontSize: 11, color: "#888", margin: "2px 0 0" }}>Quota {YEAR}</p>
                </div>
              </div>
              {/* Quota status banner */}
              <div style={{ background: member.quotaYear === YEAR ? "#F5C000" : "#F0F0F0", borderRadius: 8, padding: "10px 16px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <span style={{ fontSize: 13, fontWeight: 600, color: member.quotaYear === YEAR ? "#111" : "#888" }}>Quota {YEAR}</span>
                <span style={{ fontSize: 12, fontWeight: 700, color: member.quotaYear === YEAR ? "#111" : "#aaa", background: "#fff", padding: "2px 8px", borderRadius: 99 }}>
                  {member.quotaYear === YEAR ? "Paga ✓" : "Por pagar"}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* RIGHT — Main content */}
        <div style={{ flex: 1, minWidth: 0, display: "flex", flexDirection: "column", gap: 16 }}>

          {/* Upcoming registrations */}
          <div style={{ background: "#fff", borderRadius: 20, overflow: "hidden", boxShadow: "0 2px 16px rgba(0,0,0,0.08)" }}>
            <div style={{ background: "#111", padding: "16px 24px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span style={{ fontFamily: "var(--font-oswald), sans-serif", fontSize: 18, fontWeight: 600, color: "#fff", letterSpacing: "0.04em" }}>
                AS MINHAS INSCRIÇÕES
              </span>
              <a href="/torneios" style={{ fontSize: 13, color: "#F5C000", fontWeight: 600, textDecoration: "none" }}>Ver torneios →</a>
            </div>
            {upcomingRegs.length === 0 ? (
              <div style={{ padding: "40px 24px", textAlign: "center" }}>
                <p style={{ fontSize: 36, margin: "0 0 12px" }}>🎾</p>
                <p style={{ fontFamily: "var(--font-oswald), sans-serif", fontSize: 18, fontWeight: 700, color: "#111", margin: "0 0 8px" }}>
                  SEM INSCRIÇÕES ATIVAS
                </p>
                <p style={{ fontSize: 14, color: "#888", margin: "0 0 20px" }}>Ainda não tens inscrições em torneios ativos.</p>
                <a href="/torneios" style={{ background: "#F5C000", color: "#111", fontWeight: 700, padding: "12px 24px", borderRadius: 9, fontSize: 14, textDecoration: "none", display: "inline-block" }}>
                  Ver próximos torneios
                </a>
              </div>
            ) : (
              <div style={{ padding: "8px 0" }}>
                {upcomingRegs.map((reg) => (
                  <div key={reg.id} style={{ padding: "14px 24px", borderBottom: "1px solid #f5f5f5", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <div>
                      <p style={{ fontWeight: 600, fontSize: 14, color: "#111", margin: 0 }}>{reg.tournament.name}</p>
                      <p style={{ fontSize: 12, color: "#888", margin: "2px 0 0" }}>
                        {new Date(reg.tournament.date).toLocaleDateString("pt-PT", { day: "numeric", month: "short", year: "numeric" })} · {reg.tournament.location}
                      </p>
                    </div>
                    <span style={{
                      background: reg.status === "CONFIRMED" ? "#FFFDE7" : "#F0F0F0",
                      color: reg.status === "CONFIRMED" ? "#7A5900" : "#888",
                      fontSize: 12, fontWeight: 700, padding: "4px 10px", borderRadius: 99,
                    }}>
                      {reg.status === "CONFIRMED" ? "Confirmada ✓" : "Pendente"}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Ranking history */}
          <div style={{ background: "#fff", borderRadius: 20, overflow: "hidden", boxShadow: "0 2px 16px rgba(0,0,0,0.08)" }}>
            <div style={{ background: "#F5C000", padding: "16px 24px" }}>
              <span style={{ fontFamily: "var(--font-oswald), sans-serif", fontSize: 18, fontWeight: 600, color: "#111", letterSpacing: "0.04em" }}>
                PONTOS {YEAR}
              </span>
            </div>
            {member.rankingPoints.length === 0 ? (
              <div style={{ padding: "32px 24px", textAlign: "center" }}>
                <p style={{ fontSize: 14, color: "#888", margin: 0 }}>Ainda sem pontos registados em {YEAR}. Os pontos são atribuídos após cada torneio BTG.</p>
              </div>
            ) : (
              <table style={{ width: "100%", borderCollapse: "collapse" }}>
                <thead>
                  <tr style={{ background: "#F9F9F9", borderBottom: "1px solid #eee" }}>
                    {["Torneio", "Pontos"].map((h, i) => (
                      <th key={h} style={{ padding: "10px 24px", textAlign: i === 0 ? "left" : "right", fontSize: 11, color: "#999", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.06em" }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {member.rankingPoints.map((rp) => (
                    <tr key={rp.id} style={{ borderBottom: "1px solid #f5f5f5" }}>
                      <td style={{ padding: "12px 24px", fontSize: 14, color: "#333" }}>Torneio BTG</td>
                      <td style={{ padding: "12px 24px", textAlign: "right", fontWeight: 700, fontSize: 15, color: "#111" }}>
                        {rp.points.toLocaleString("pt-PT")}
                      </td>
                    </tr>
                  ))}
                  <tr style={{ background: "#FFFDE7" }}>
                    <td style={{ padding: "12px 24px", fontSize: 13, fontWeight: 700, color: "#111" }}>Total {YEAR}</td>
                    <td style={{ padding: "12px 24px", textAlign: "right", fontWeight: 800, fontSize: 16, color: "#111" }}>
                      {totalPoints.toLocaleString("pt-PT")}
                    </td>
                  </tr>
                </tbody>
              </table>
            )}
          </div>

        </div>
      </div>
    </div>
  );
}
