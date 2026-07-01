import Link from "next/link";

export function Footer() {
  return (
    <footer className="btg-section" style={{ background: "#111", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 16 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/btg-logo-white.png" alt="BTG" style={{ height: 40, width: "auto" }} />
        <span style={{ color: "#555", fontSize: 13 }}>Beach Tennis Gaia · btgaia.pt</span>
      </div>
      <Link
        href="https://www.instagram.com/beachtennisgaia_btg"
        target="_blank"
        rel="noopener noreferrer"
        style={{ display: "flex", alignItems: "center", gap: 8, color: "#888", textDecoration: "none", fontSize: 13, fontWeight: 600 }}
      >
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <rect x="2" y="2" width="20" height="20" rx="5" ry="5"/>
          <circle cx="12" cy="12" r="4"/>
          <circle cx="17.5" cy="6.5" r="0.5" fill="currentColor" stroke="none"/>
        </svg>
        @beachtennisgaia_btg
      </Link>
      <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
        <Link href="/privacidade" style={{ color: "#555", fontSize: 12, textDecoration: "none" }}>
          Política de Privacidade
        </Link>
        <p style={{ color: "#555", fontSize: 12, margin: 0 }}>© 2026 BTG. Vila Nova de Gaia, Portugal.</p>
        <a href="https://velo.build" target="_blank" rel="noopener noreferrer" style={{ color: "#333", fontSize: 11, textDecoration: "none" }}>
          feito por velo.build
        </a>
      </div>
    </footer>
  );
}
