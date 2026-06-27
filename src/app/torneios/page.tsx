import { Nav } from "@/components/nav";
import { db } from "@/lib/db";
import { TournamentsView } from "./tournaments-view";

export const revalidate = 60;

export default async function TorneiosPage() {
  const tournaments = await db.tournament.findMany({
    orderBy: { date: "asc" },
    include: { _count: { select: { registrations: true } } },
  });

  return (
    <div style={{ minHeight: "100vh", background: "#F0F0F0", fontFamily: "var(--font-inter), sans-serif" }}>
      <Nav />

      <div className="btg-page-header" style={{ background: "#111" }}>
        <h1 style={{ fontFamily: "var(--font-oswald), sans-serif", fontSize: 38, fontWeight: 700, color: "#fff", margin: "0 0 6px", letterSpacing: "0.03em" }}>
          TORNEIOS BTG
        </h1>
        <p style={{ color: "#888", fontSize: 15, margin: 0 }}>Inscreve-te, acompanha os quadros e vê os resultados.</p>
      </div>

      <TournamentsView tournaments={tournaments} />
    </div>
  );
}
