import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import Link from "next/link";

const NAV = [
  { href: "/admin", label: "Visão Geral", icon: "◈" },
  { href: "/admin/torneios", label: "Torneios", icon: "🎾" },
  { href: "/admin/socios", label: "Sócios", icon: "👥" },
  { href: "/admin/ranking", label: "Ranking", icon: "🏆" },
  { href: "/admin/comunidade", label: "Comunidade", icon: "📣" },
];

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const { userId } = await auth();
  if (!userId) redirect("/sign-in");

  const member = await db.member.findUnique({ where: { clerkId: userId } });
  if (!member || member.role !== "ADMIN") redirect("/dashboard");

  return (
    <div style={{ display: "flex", minHeight: "100vh", fontFamily: "var(--font-inter), sans-serif" }}>
      {/* SIDEBAR */}
      <aside style={{ width: 220, background: "#111", display: "flex", flexDirection: "column", flexShrink: 0, position: "sticky", top: 0, height: "100vh", overflowY: "auto" }}>
        <Link href="/" style={{ display: "flex", alignItems: "center", gap: 8, padding: "20px 20px 16px", textDecoration: "none", borderBottom: "1px solid #222" }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/btg-logo-white.png" alt="BTG" style={{ height: 36, width: "auto" }} />
          <div>
            <p style={{ fontFamily: "var(--font-oswald), sans-serif", fontSize: 13, fontWeight: 700, color: "#F5C000", margin: 0, letterSpacing: "0.05em" }}>BTG</p>
            <p style={{ fontSize: 10, color: "#555", margin: 0, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.08em" }}>Admin</p>
          </div>
        </Link>

        <nav style={{ flex: 1, padding: "12px 0" }}>
          {NAV.map(({ href, label, icon }) => (
            <Link
              key={href}
              href={href}
              style={{ display: "flex", alignItems: "center", gap: 10, padding: "11px 20px", textDecoration: "none", color: "#aaa", fontSize: 14, fontWeight: 500 }}
            >
              <span style={{ fontSize: 16, width: 20, textAlign: "center" }}>{icon}</span>
              {label}
            </Link>
          ))}
        </nav>

        <div style={{ padding: "16px 20px", borderTop: "1px solid #222" }}>
          <Link href="/dashboard" style={{ fontSize: 12, color: "#555", textDecoration: "none", display: "block", marginBottom: 4 }}>← Área de sócio</Link>
          <p style={{ fontSize: 11, color: "#333", margin: 0 }}>{member.name}</p>
        </div>
      </aside>

      {/* CONTENT */}
      <main style={{ flex: 1, background: "#F5F5F5", overflowX: "hidden" }}>
        {children}
      </main>
    </div>
  );
}
