import { Nav } from "@/components/nav";
import { db } from "@/lib/db";
import { TournamentsView } from "./tournaments-view";

export const revalidate = 60;

export default async function TorneiosPage() {
  const [tournaments, finishedTournaments] = await Promise.all([
    db.tournament.findMany({
      where: { status: { not: "FINISHED" } },
      orderBy: { date: "asc" },
      include: {
        _count: { select: { registrations: true } },
        registrations: {
          where: { status: "CONFIRMED" },
          include: { player1: true, player2: true },
          orderBy: { createdAt: "asc" },
        },
        matches: {
          include: {
            pair1: { include: { player1: { select: { name: true } }, player2: { select: { name: true } } } },
            pair2: { include: { player1: { select: { name: true } }, player2: { select: { name: true } } } },
          },
          orderBy: [{ round: "asc" }, { position: "asc" }],
        },
      },
    }),
    db.tournament.findMany({
      where: { status: "FINISHED" },
      orderBy: { date: "desc" },
      include: {
        _count: { select: { registrations: true } },
        matches: {
          where: { completedAt: { not: null } },
          include: {
            pair1: { include: { player1: { select: { name: true } }, player2: { select: { name: true } } } },
            pair2: { include: { player1: { select: { name: true } }, player2: { select: { name: true } } } },
          },
          orderBy: [{ round: "desc" }, { position: "asc" }],
        },
      },
    }),
  ]);

  return (
    <div style={{ minHeight: "100vh", background: "#F0F0F0", fontFamily: "var(--font-inter), sans-serif" }}>
      <Nav />

      <div className="btg-page-header" style={{ background: "#111" }}>
        <h1 style={{ fontFamily: "var(--font-oswald), sans-serif", fontSize: 38, fontWeight: 700, color: "#fff", margin: "0 0 6px", letterSpacing: "0.03em" }}>
          TORNEIOS BTG
        </h1>
        <p style={{ color: "#888", fontSize: 15, margin: 0 }}>Inscreve-te, acompanha os quadros e vê os resultados.</p>
      </div>

      <TournamentsView tournaments={tournaments} finishedTournaments={finishedTournaments} />
    </div>
  );
}
