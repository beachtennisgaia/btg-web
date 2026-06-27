import { db } from "@/lib/db";
import Link from "next/link";

export default async function AdminPage() {
  const [members, tournaments, posts] = await Promise.all([
    db.member.count(),
    db.tournament.findMany({ select: { id: true, status: true } }),
    db.post.count(),
  ]);

  const stats = [
    { label: "Sócios", value: members, href: "/admin/socios", color: "#F5C000" },
    { label: "Torneios", value: tournaments.length, href: "/admin/torneios", color: "#F5C000" },
    { label: "Torneios abertos", value: tournaments.filter((t) => t.status === "OPEN").length, href: "/admin/torneios", color: "#4CAF50" },
    { label: "Posts", value: posts, href: "/admin/comunidade", color: "#F5C000" },
  ];

  const quickLinks = [
    { href: "/admin/torneios/novo", label: "Criar torneio", icon: "+" },
    { href: "/admin/socios", label: "Gerir sócios", icon: "👥" },
    { href: "/admin/ranking", label: "Lançar pontos", icon: "🏆" },
    { href: "/admin/comunidade", label: "Publicar anúncio", icon: "📣" },
  ];

  return (
    <div style={{ padding: 32 }}>
      <h1 style={{ fontFamily: "var(--font-oswald), sans-serif", fontSize: 28, fontWeight: 700, color: "#111", margin: "0 0 4px", letterSpacing: "0.03em" }}>
        VISÃO GERAL
      </h1>
      <p style={{ color: "#888", fontSize: 14, margin: "0 0 32px" }}>Painel de administração BTG</p>

      {/* STATS */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(180px, 1fr))", gap: 16, marginBottom: 32 }}>
        {stats.map(({ label, value, href, color }) => (
          <Link key={label} href={href} style={{ background: "#fff", borderRadius: 16, padding: "20px 24px", boxShadow: "0 2px 8px rgba(0,0,0,0.06)", textDecoration: "none", display: "block", borderLeft: `4px solid ${color}` }}>
            <p style={{ fontFamily: "var(--font-oswald), sans-serif", fontSize: 36, fontWeight: 700, color: "#111", margin: 0 }}>{value}</p>
            <p style={{ fontSize: 13, color: "#888", margin: "4px 0 0" }}>{label}</p>
          </Link>
        ))}
      </div>

      {/* QUICK LINKS */}
      <h2 style={{ fontFamily: "var(--font-oswald), sans-serif", fontSize: 16, fontWeight: 700, color: "#555", margin: "0 0 16px", letterSpacing: "0.06em", textTransform: "uppercase" }}>
        Ações rápidas
      </h2>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", gap: 12 }}>
        {quickLinks.map(({ href, label, icon }) => (
          <Link key={href} href={href} style={{ background: "#111", borderRadius: 12, padding: "16px 20px", display: "flex", alignItems: "center", gap: 12, textDecoration: "none", color: "#fff", fontSize: 14, fontWeight: 600 }}>
            <span style={{ fontSize: 20 }}>{icon}</span>
            {label}
          </Link>
        ))}
      </div>
    </div>
  );
}
