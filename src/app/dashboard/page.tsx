import { auth, currentUser } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { Nav } from "@/components/nav";
import { db } from "@/lib/db";
import { Onboarding } from "./onboarding";
import { MyRegistrations } from "./my-registrations";

const YEAR = 2026;

const LEVEL_LABEL: Record<string, string> = {
  BEGINNER: "Iniciante",
  INTERMEDIATE: "Intermédio",
  ADVANCED: "Avançado",
};

function initials(name: string) {
  return name.split(" ").slice(0, 2).map((w) => w[0]).join("").toUpperCase();
}

function Row({ label, value, small }: { label: string; value: string; small?: boolean }) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", gap: 8, paddingBottom: 8, borderBottom: "1px solid #f5f5f5" }}>
      <span style={{ fontSize: 11, color: "#aaa", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.05em", flexShrink: 0 }}>{label}</span>
      <span style={{ fontSize: small ? 12 : 13, color: "#333", fontWeight: 500, textAlign: "right", wordBreak: "break-all" }}>{value}</span>
    </div>
  );
}

function Stat({ label, value, highlight, ok }: { label: string; value: string; highlight?: boolean; ok?: boolean }) {
  return (
    <div style={{ textAlign: "center", background: highlight ? "#FFFDE7" : ok ? "#F0FFF4" : "#F9F9F9", borderRadius: 10, padding: "12px 8px" }}>
      <p style={{ fontFamily: "var(--font-oswald), sans-serif", fontSize: 20, fontWeight: 700, color: "#111", margin: 0 }}>{value}</p>
      <p style={{ fontSize: 10, color: "#888", margin: "3px 0 0", textTransform: "uppercase", letterSpacing: "0.04em" }}>{label}</p>
    </div>
  );
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
        include: { tournament: true, player1: true, player2: true },
        orderBy: { createdAt: "desc" },
      },
      registrationsAsP2: {
        include: { tournament: true, player1: true, player2: true },
        orderBy: { createdAt: "desc" },
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

  const activeStatuses = new Set(["OPEN", "ONGOING"]);
  const allRegs = [
    ...member.registrationsAsP1.map((r) => ({ ...r, isPlayer1: true })),
    ...member.registrationsAsP2.map((r) => ({ ...r, isPlayer1: false })),
  ]
    .filter((r) => activeStatuses.has(r.tournament.status))
    .sort((a, b) => new Date(a.tournament.date).getTime() - new Date(b.tournament.date).getTime());

  return (
    <div style={{ minHeight: "100vh", background: "#F0F0F0", fontFamily: "var(--font-inter), sans-serif" }}>
      <Nav />

      {/* HEADER */}
      <div className="btg-page-header" style={{ background: "#111" }}>
        <h1 style={{ fontFamily: "var(--font-oswald), sans-serif", fontSize: 38, fontWeight: 700, color: "#fff", margin: "0 0 6px", letterSpacing: "0.03em" }}>
          ÁREA DE SÓCIO
        </h1>
        <p style={{ color: "#888", fontSize: 15, margin: 0 }}>O teu perfil, inscrições e estatísticas BTG.</p>
      </div>

      <div className="btg-dash-layout">

        {/* COL 1 — Perfil */}
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <div style={{ background: "#fff", borderRadius: 20, overflow: "hidden", boxShadow: "0 2px 16px rgba(0,0,0,0.09)" }}>
            {/* Identity header */}
            <div style={{ background: "linear-gradient(135deg, #111 60%, #222)", padding: "24px 20px", position: "relative" }}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/btg-logo-white.png" alt="" aria-hidden style={{ position: "absolute", top: 10, right: 10, height: 44, width: "auto", opacity: 0.12, pointerEvents: "none" }} />
              {member.avatarUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={member.avatarUrl} alt="" style={{ width: 56, height: 56, borderRadius: "50%", objectFit: "cover", marginBottom: 12 }} />
              ) : (
                <div style={{ width: 56, height: 56, borderRadius: "50%", background: "#F5C000", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 800, fontSize: 22, color: "#111", marginBottom: 12 }}>
                  {initials(member.name)}
                </div>
              )}
              <p style={{ fontFamily: "var(--font-oswald), sans-serif", fontSize: 19, fontWeight: 700, color: "#fff", margin: 0, lineHeight: 1.2 }}>{member.name}</p>
              <p style={{ fontSize: 12, color: "#F5C000", margin: "4px 0 0", fontWeight: 600 }}>
                {member.memberNumber ? `Sócio nº ${String(member.memberNumber).padStart(3, "0")}` : "Sócio BTG"}
              </p>
            </div>
            {/* Contact details */}
            <div style={{ padding: "16px 20px", display: "flex", flexDirection: "column", gap: 10 }}>
              <Row label="Nível" value={LEVEL_LABEL[member.level]} />
              <Row label="Email" value={member.email} small />
              {member.phone && <Row label="Telm." value={member.phone} />}
              {member.gender && <Row label="Sexo" value={member.gender === "MALE" ? "Masculino" : "Feminino"} />}
            </div>
          </div>
        </div>

        {/* COL 2 — Inscrições */}
        <div style={{ display: "flex", flexDirection: "column", gap: 16, minWidth: 0 }}>
          <div style={{ background: "#fff", borderRadius: 20, overflow: "hidden", boxShadow: "0 2px 16px rgba(0,0,0,0.08)" }}>
            <div style={{ background: "#111", padding: "16px 24px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span style={{ fontFamily: "var(--font-oswald), sans-serif", fontSize: 18, fontWeight: 600, color: "#fff", letterSpacing: "0.04em" }}>
                AS MINHAS INSCRIÇÕES
              </span>
              <a href="/torneios" style={{ fontSize: 13, color: "#F5C000", fontWeight: 600, textDecoration: "none" }}>Ver torneios →</a>
            </div>
            <MyRegistrations registrations={allRegs} />
          </div>
        </div>

        {/* COL 3 — Estatísticas */}
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          {/* Stats grid */}
          <div style={{ background: "#fff", borderRadius: 20, overflow: "hidden", boxShadow: "0 2px 16px rgba(0,0,0,0.09)" }}>
            <div style={{ background: "#F5C000", padding: "14px 20px" }}>
              <span style={{ fontFamily: "var(--font-oswald), sans-serif", fontSize: 16, fontWeight: 700, color: "#111", letterSpacing: "0.04em" }}>ESTATÍSTICAS</span>
            </div>
            <div style={{ padding: "16px 16px", display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
              <Stat label="Torneios" value={String(tournaments)} />
              <Stat label={`Pontos ${YEAR}`} value={totalPoints > 0 ? totalPoints.toLocaleString("pt-PT") : "—"} highlight />
              <Stat label="Ranking" value={rankLabel} />
              <Stat label={`Quota ${YEAR}`} value={member.quotaYear === YEAR ? "Paga ✓" : "—"} ok={member.quotaYear === YEAR} />
            </div>
          </div>

          {/* Points history */}
          <div style={{ background: "#fff", borderRadius: 20, overflow: "hidden", boxShadow: "0 2px 16px rgba(0,0,0,0.08)" }}>
            <div style={{ background: "#111", padding: "14px 20px" }}>
              <span style={{ fontFamily: "var(--font-oswald), sans-serif", fontSize: 16, fontWeight: 700, color: "#F5C000", letterSpacing: "0.04em" }}>PONTOS {YEAR}</span>
            </div>
            {member.rankingPoints.length === 0 ? (
              <div style={{ padding: "24px 16px", textAlign: "center" }}>
                <p style={{ fontSize: 13, color: "#aaa", margin: 0, lineHeight: 1.5 }}>Pontos atribuídos após cada torneio BTG.</p>
              </div>
            ) : (
              <table style={{ width: "100%", borderCollapse: "collapse" }}>
                <tbody>
                  {member.rankingPoints.map((rp) => (
                    <tr key={rp.id} style={{ borderBottom: "1px solid #f5f5f5" }}>
                      <td style={{ padding: "10px 16px", fontSize: 13, color: "#555" }}>Torneio BTG</td>
                      <td style={{ padding: "10px 16px", textAlign: "right", fontWeight: 700, fontSize: 14, color: "#111" }}>
                        {rp.points.toLocaleString("pt-PT")}
                      </td>
                    </tr>
                  ))}
                  <tr style={{ background: "#FFFDE7" }}>
                    <td style={{ padding: "10px 16px", fontSize: 12, fontWeight: 700, color: "#111" }}>Total</td>
                    <td style={{ padding: "10px 16px", textAlign: "right", fontWeight: 800, fontSize: 15, color: "#111" }}>
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
