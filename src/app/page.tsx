import Link from "next/link";
import { SignInButton, SignUpButton } from "@clerk/nextjs";
import { Nav } from "@/components/nav";

export default function HomePage() {
  return (
    <div className="min-h-screen flex flex-col" style={{ fontFamily: "var(--font-inter), sans-serif" }}>

      <Nav />

      {/* HERO */}
      <section style={{ position: "relative", minHeight: 520, display: "flex", alignItems: "center", overflow: "hidden" }}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="https://images.unsplash.com/photo-1612872087720-bb876e2e67d1?w=1600&q=80"
          alt=""
          style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover", objectPosition: "center" }}
        />
        <div style={{ position: "absolute", inset: 0, background: "linear-gradient(to right, rgba(10,10,10,0.92) 40%, rgba(10,10,10,0.55) 70%, rgba(10,10,10,0.25) 100%)" }} />
        <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, height: 80, background: "linear-gradient(to bottom, transparent, #111111 90%)" }} />
        <div style={{ position: "relative", zIndex: 1, padding: "80px 32px", maxWidth: 640 }}>
          <span style={{ background: "#F5C000", color: "#111", fontSize: 12, fontWeight: 700, padding: "4px 12px", borderRadius: 99, textTransform: "uppercase", letterSpacing: "0.08em" }}>
            Vila Nova de Gaia
          </span>
          <h1 style={{ fontFamily: "var(--font-oswald), sans-serif", fontSize: 58, fontWeight: 700, color: "#fff", margin: "16px 0 8px", lineHeight: 1.05, letterSpacing: "0.02em" }}>
            BEACH TENNIS<br /><span style={{ color: "#F5C000" }}>GAIA</span>
          </h1>
          <p style={{ fontSize: 18, color: "#bbb", margin: "0 0 32px", lineHeight: 1.6 }}>
            A comunidade de beach tennis de Gaia. Torneios, ranking, convívio e muito mais. Junta-te a nós.
          </p>
          <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
            <SignUpButton mode="modal">
              <button style={{ background: "#F5C000", color: "#111", fontWeight: 700, padding: "14px 28px", borderRadius: 9, border: "none", fontSize: 16, cursor: "pointer" }}>
                Tornar-me Sócio
              </button>
            </SignUpButton>
            <Link href="/torneios" style={{ background: "rgba(255,255,255,0.1)", color: "#fff", fontWeight: 600, padding: "14px 28px", borderRadius: 9, border: "2px solid rgba(255,255,255,0.25)", fontSize: 16, textDecoration: "none" }}>
              Ver Torneios
            </Link>
          </div>
          <div style={{ display: "flex", gap: 40, marginTop: 48, paddingTop: 40, borderTop: "1px solid rgba(255,255,255,0.1)" }}>
            {[["87", "Sócios Ativos"], ["24", "Torneios Realizados"], ["3", "Próximos Eventos"]].map(([n, label]) => (
              <div key={label}>
                <p style={{ fontFamily: "var(--font-oswald), sans-serif", fontSize: 36, fontWeight: 700, color: "#F5C000", margin: 0 }}>{n}</p>
                <p style={{ fontSize: 13, color: "#888", margin: "4px 0 0" }}>{label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* BANNER PRÓXIMO TORNEIO */}
      <section style={{ background: "#F5C000", padding: "28px 32px", display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 16 }}>
        <div>
          <span style={{ fontSize: 12, fontWeight: 700, color: "#8A6800", textTransform: "uppercase", letterSpacing: "0.08em" }}>● Próximo Torneio</span>
          <p style={{ fontFamily: "var(--font-oswald), sans-serif", fontSize: 22, fontWeight: 700, color: "#111", margin: "4px 0 0" }}>
            TORNEIO DE VERÃO BTG 2026 · 12 JUL · CANIDE
          </p>
        </div>
        <Link href="/torneios" style={{ background: "#111", color: "#F5C000", fontWeight: 700, padding: "12px 24px", borderRadius: 8, fontSize: 15, textDecoration: "none", whiteSpace: "nowrap" }}>
          Inscrever-me Agora
        </Link>
      </section>

      {/* PRÓXIMOS TORNEIOS */}
      <section style={{ padding: "64px 32px", background: "#F9F9F9" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 32 }}>
          <h2 style={{ fontFamily: "var(--font-oswald), sans-serif", fontSize: 30, fontWeight: 700, color: "#111", margin: 0, letterSpacing: "0.03em" }}>PRÓXIMOS TORNEIOS</h2>
          <Link href="/torneios" style={{ color: "#F5C000", fontSize: 14, fontWeight: 600, textDecoration: "none" }}>Ver todos →</Link>
        </div>
        <div style={{ display: "flex", gap: 20, flexWrap: "wrap" }}>
          <div style={{ background: "#fff", borderRadius: 16, overflow: "hidden", boxShadow: "0 2px 12px rgba(0,0,0,0.07)", width: 280 }}>
            <div style={{ background: "#F5C000", padding: 18 }}>
              <span style={{ background: "#111", color: "#F5C000", fontSize: 11, fontWeight: 700, padding: "3px 8px", borderRadius: 99 }}>Inscrições Abertas</span>
              <p style={{ fontFamily: "var(--font-oswald), sans-serif", fontSize: 18, fontWeight: 700, color: "#111", margin: "10px 0 0", lineHeight: 1.2 }}>TORNEIO DE VERÃO<br />BTG 2026</p>
            </div>
            <div style={{ padding: 16 }}>
              <p style={{ fontSize: 13, color: "#666", margin: "0 0 6px" }}>📅 12 Jul · 9h00 · Canide</p>
              <p style={{ fontSize: 13, color: "#666", margin: "0 0 12px" }}>👥 Duplas Mistas · 11/16</p>
              <Link href="/torneios" style={{ display: "block", width: "100%", textAlign: "center", background: "#F5C000", color: "#111", fontWeight: 700, padding: "10px 0", borderRadius: 7, fontSize: 14, textDecoration: "none" }}>
                Inscrever-me
              </Link>
            </div>
          </div>
          <div style={{ background: "#fff", borderRadius: 16, overflow: "hidden", boxShadow: "0 2px 12px rgba(0,0,0,0.07)", width: 280 }}>
            <div style={{ background: "#111", padding: 18 }}>
              <span style={{ background: "#F5C000", color: "#111", fontSize: 11, fontWeight: 700, padding: "3px 8px", borderRadius: 99 }}>Em breve</span>
              <p style={{ fontFamily: "var(--font-oswald), sans-serif", fontSize: 18, fontWeight: 700, color: "#fff", margin: "10px 0 0", lineHeight: 1.2 }}>NON-STOP BTG<br />AGOSTO 2026</p>
            </div>
            <div style={{ padding: 16 }}>
              <p style={{ fontSize: 13, color: "#666", margin: "0 0 6px" }}>📅 23 Ago · Salgueiros</p>
              <p style={{ fontSize: 13, color: "#666", margin: "0 0 12px" }}>👥 Misto · Formato Non-Stop</p>
              <Link href="/torneios" style={{ display: "block", width: "100%", textAlign: "center", background: "#111", color: "#fff", fontWeight: 700, padding: "10px 0", borderRadius: 7, fontSize: 14, textDecoration: "none" }}>
                Saber Mais
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* RANKING PREVIEW */}
      <section style={{ padding: "64px 32px", background: "#fff" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 32 }}>
          <h2 style={{ fontFamily: "var(--font-oswald), sans-serif", fontSize: 30, fontWeight: 700, color: "#111", margin: 0, letterSpacing: "0.03em" }}>RANKING BTG 2026</h2>
          <Link href="/ranking" style={{ color: "#F5C000", fontSize: 14, fontWeight: 600, textDecoration: "none" }}>Ver ranking completo →</Link>
        </div>
        <div style={{ background: "#111", borderRadius: 16, overflow: "hidden", maxWidth: 480 }}>
          <div style={{ padding: "14px 20px", borderBottom: "1px solid #222", display: "flex", justifyContent: "space-between" }}>
            <span style={{ color: "#888", fontSize: 12, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.06em" }}>Jogador</span>
            <span style={{ color: "#888", fontSize: 12, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.06em" }}>Pontos</span>
          </div>
          {[
            { pos: 1, name: "Carlos Ferreira", pts: "1.240", badge: "#F5C000", badgeText: "#111" },
            { pos: 2, name: "Ana Silva", pts: "1.085", badge: "#E0E0E0", badgeText: "#555" },
            { pos: 3, name: "Miguel Oliveira", pts: "920", badge: "#FFE0B2", badgeText: "#BF6000" },
          ].map(({ pos, name, pts, badge, badgeText }) => (
            <div key={name} style={{ padding: "14px 20px", borderBottom: "1px solid #1a1a1a", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <span style={{ background: badge, color: badgeText, fontWeight: 800, fontSize: 12, width: 22, height: 22, borderRadius: "50%", display: "inline-flex", alignItems: "center", justifyContent: "center" }}>{pos}</span>
                <span style={{ color: "#fff", fontSize: 14, fontWeight: 600 }}>{name}</span>
              </div>
              <span style={{ color: "#F5C000", fontWeight: 700, fontSize: 16 }}>{pts}</span>
            </div>
          ))}
          <div style={{ padding: "14px 20px", textAlign: "center" }}>
            <Link href="/ranking" style={{ color: "#F5C000", fontSize: 13, fontWeight: 600, textDecoration: "none" }}>Ver ranking completo (87 sócios) →</Link>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section style={{ background: "#F5C000", padding: "64px 32px", textAlign: "center" }}>
        <h2 style={{ fontFamily: "var(--font-oswald), sans-serif", fontSize: 36, fontWeight: 700, color: "#111", margin: "0 0 12px", letterSpacing: "0.03em" }}>JUNTA-TE AO BTG</h2>
        <p style={{ fontSize: 17, color: "#5A4000", margin: "0 0 32px", maxWidth: 480, marginLeft: "auto", marginRight: "auto" }}>
          Acede a torneios exclusivos, ranking BTG, galeria de fotos e comunidade de beach tennis em Gaia.
        </p>
        <SignUpButton mode="modal">
          <button style={{ background: "#111", color: "#F5C000", fontWeight: 700, padding: "16px 36px", borderRadius: 10, border: "none", fontSize: 17, cursor: "pointer" }}>
            Tornar-me Sócio BTG
          </button>
        </SignUpButton>
        <p style={{ fontSize: 13, color: "#8A6800", marginTop: 12 }}>Quota anual · Gestão simples · Sem complicações</p>
      </section>

      {/* FOOTER */}
      <footer style={{ background: "#111", padding: 32, display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 16 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/btg-logo-white.png" alt="BTG" style={{ height: 40, width: "auto" }} />
          <span style={{ color: "#555", fontSize: 13 }}>Beach Tennis Gaia · btgaia.pt</span>
        </div>
        <p style={{ color: "#555", fontSize: 12, margin: 0 }}>© 2026 BTG. Vila Nova de Gaia, Portugal.</p>
      </footer>

    </div>
  );
}
