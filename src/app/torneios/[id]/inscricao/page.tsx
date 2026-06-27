import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { notFound } from "next/navigation";
import { Nav } from "@/components/nav";
import { RegistrationForm } from "./registration-form";

const CAT_LABEL: Record<string, string> = { MIXED: "Duplas Mistas", MALE: "Duplas Masc.", FEMALE: "Duplas Fem.", OPEN: "Open" };
const FORMAT_LABEL: Record<string, string> = { ELIMINATION: "Eliminatório", NON_STOP: "Non-Stop" };

export default async function InscricaoPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { userId } = await auth();

  if (!userId) redirect(`/sign-in?redirect_url=/torneios/${id}/inscricao`);

  const [tournament, member, members] = await Promise.all([
    db.tournament.findUnique({
      where: { id },
      include: { _count: { select: { registrations: { where: { status: { not: "CANCELLED" } } } } } },
    }),
    db.member.findUnique({ where: { clerkId: userId } }),
    db.member.findMany({ orderBy: { name: "asc" } }),
  ]);

  if (!tournament) notFound();

  // Check existing registration
  const existingRegistration = member
    ? await db.registration.findFirst({
        where: {
          tournamentId: id,
          status: { not: "CANCELLED" },
          OR: [{ player1Id: member.id }, { player2Id: member.id }],
        },
        include: { player1: true, player2: true },
      })
    : null;

  const spotsLeft = tournament.maxPairs - tournament._count.registrations;
  const isFull = spotsLeft <= 0;

  return (
    <div style={{ minHeight: "100vh", background: "#F5F5F5", fontFamily: "var(--font-inter), sans-serif" }}>
      <Nav />

      <div style={{ maxWidth: 600, margin: "0 auto", padding: "40px 20px" }}>
        {/* Tournament info card */}
        <div style={{ background: "#111", borderRadius: 16, padding: 24, marginBottom: 24 }}>
          <span style={{ fontSize: 11, fontWeight: 700, color: "#F5C000", textTransform: "uppercase", letterSpacing: "0.08em" }}>
            {tournament.status === "OPEN" ? "● Inscrições Abertas" : "Torneio"}
          </span>
          <h1 style={{ fontFamily: "var(--font-oswald), sans-serif", fontSize: 24, fontWeight: 700, color: "#fff", margin: "8px 0 16px", lineHeight: 1.2 }}>
            {tournament.name.toUpperCase()}
          </h1>
          <div style={{ display: "flex", gap: 20, flexWrap: "wrap" }}>
            {[
              ["📅", new Date(tournament.date).toLocaleDateString("pt-PT", { weekday: "long", day: "numeric", month: "long" })],
              ["📍", tournament.location],
              ["🎾", `${FORMAT_LABEL[tournament.format]} · ${CAT_LABEL[tournament.category]}`],
              ["👥", tournament.registrationType === "PAIRS" ? "Inscrição em dupla" : "Inscrição individual"],
              ["🎫", isFull ? "Esgotado" : `${spotsLeft} vaga${spotsLeft !== 1 ? "s" : ""} restante${spotsLeft !== 1 ? "s" : ""}`],
            ].map(([icon, text]) => (
              <p key={text} style={{ fontSize: 13, color: "#bbb", margin: 0, display: "flex", gap: 6, alignItems: "center" }}>
                <span>{icon}</span> {text}
              </p>
            ))}
          </div>
          {tournament.description && (
            <p style={{ fontSize: 13, color: "#888", margin: "14px 0 0", lineHeight: 1.6, borderTop: "1px solid #222", paddingTop: 14 }}>
              {tournament.description}
            </p>
          )}
        </div>

        {/* State: not a member yet */}
        {!member && (
          <div style={{ background: "#fff", borderRadius: 16, padding: 32, textAlign: "center", boxShadow: "0 2px 8px rgba(0,0,0,0.06)" }}>
            <p style={{ fontSize: 32, margin: "0 0 12px" }}>👤</p>
            <p style={{ fontFamily: "var(--font-oswald), sans-serif", fontSize: 18, color: "#111", margin: "0 0 8px" }}>COMPLETA O TEU PERFIL</p>
            <p style={{ fontSize: 14, color: "#888", margin: "0 0 20px" }}>
              Para te inscreveres num torneio precisas de completar o teu perfil de sócio BTG.
            </p>
            <a href="/dashboard" style={{ display: "inline-block", background: "#F5C000", color: "#111", fontWeight: 700, padding: "12px 28px", borderRadius: 9, textDecoration: "none", fontSize: 15 }}>
              Completar perfil
            </a>
          </div>
        )}

        {/* State: tournament not open */}
        {member && tournament.status !== "OPEN" && (
          <div style={{ background: "#fff", borderRadius: 16, padding: 32, textAlign: "center", boxShadow: "0 2px 8px rgba(0,0,0,0.06)" }}>
            <p style={{ fontSize: 32, margin: "0 0 12px" }}>🔒</p>
            <p style={{ fontFamily: "var(--font-oswald), sans-serif", fontSize: 18, color: "#111", margin: "0 0 8px" }}>INSCRIÇÕES FECHADAS</p>
            <p style={{ fontSize: 14, color: "#888" }}>
              As inscrições para este torneio ainda não estão abertas ou já encerraram.
            </p>
          </div>
        )}

        {/* State: already registered */}
        {member && tournament.status === "OPEN" && existingRegistration && (
          <div style={{ background: "#fff", borderRadius: 16, padding: 32, boxShadow: "0 2px 8px rgba(0,0,0,0.06)" }}>
            <div style={{ display: "flex", gap: 12, alignItems: "center", marginBottom: 16 }}>
              <span style={{ fontSize: 32 }}>✅</span>
              <div>
                <p style={{ fontFamily: "var(--font-oswald), sans-serif", fontSize: 18, color: "#111", margin: 0 }}>JÁ ESTÁS INSCRITO</p>
                <p style={{ fontSize: 13, color: "#888", margin: "2px 0 0" }}>A tua inscrição está registada.</p>
              </div>
            </div>
            <div style={{ background: "#F9F9F9", borderRadius: 10, padding: "14px 16px" }}>
              {tournament.registrationType === "PAIRS" ? (
                <>
                  <p style={{ fontSize: 12, color: "#888", margin: "0 0 6px", textTransform: "uppercase", letterSpacing: "0.06em", fontWeight: 600 }}>Dupla inscrita</p>
                  <p style={{ fontSize: 15, fontWeight: 700, color: "#111", margin: 0 }}>
                    {existingRegistration.player1.name} &amp; {existingRegistration.player2?.name}
                  </p>
                </>
              ) : (
                <>
                  <p style={{ fontSize: 12, color: "#888", margin: "0 0 6px", textTransform: "uppercase", letterSpacing: "0.06em", fontWeight: 600 }}>Inscrito como</p>
                  <p style={{ fontSize: 15, fontWeight: 700, color: "#111", margin: 0 }}>{existingRegistration.player1.name}</p>
                </>
              )}
              <span style={{
                display: "inline-block", marginTop: 8, fontSize: 11, fontWeight: 700, padding: "3px 10px", borderRadius: 99,
                background: existingRegistration.status === "CONFIRMED" ? "#E8F5E9" : "#FFF3B0",
                color: existingRegistration.status === "CONFIRMED" ? "#1a7a1a" : "#7A5900",
              }}>
                {existingRegistration.status === "CONFIRMED" ? "Confirmada" : "Pendente de confirmação"}
              </span>
            </div>
          </div>
        )}

        {/* State: full */}
        {member && tournament.status === "OPEN" && !existingRegistration && isFull && (
          <div style={{ background: "#fff", borderRadius: 16, padding: 32, textAlign: "center", boxShadow: "0 2px 8px rgba(0,0,0,0.06)" }}>
            <p style={{ fontSize: 32, margin: "0 0 12px" }}>🎾</p>
            <p style={{ fontFamily: "var(--font-oswald), sans-serif", fontSize: 18, color: "#111", margin: "0 0 8px" }}>TORNEIO ESGOTADO</p>
            <p style={{ fontSize: 14, color: "#888" }}>Todas as vagas foram preenchidas. Fica atento a próximos torneios!</p>
          </div>
        )}

        {/* State: can register */}
        {member && tournament.status === "OPEN" && !existingRegistration && !isFull && (
          <RegistrationForm
            tournamentId={id}
            memberId={member.id}
            registrationType={tournament.registrationType}
            members={members.filter((m) => m.id !== member.id).map((m) => ({ id: m.id, name: m.name }))}
          />
        )}
      </div>
    </div>
  );
}
