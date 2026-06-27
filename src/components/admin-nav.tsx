"use client";

import { useState } from "react";
import Link from "next/link";

const NAV = [
  { href: "/admin", label: "Visão Geral", icon: "◈" },
  { href: "/admin/torneios", label: "Torneios", icon: "🎾" },
  { href: "/admin/socios", label: "Sócios", icon: "👥" },
  { href: "/admin/hero", label: "Galeria Hero", icon: "🖼" },
  { href: "/admin/ranking", label: "Ranking", icon: "🏆" },
  { href: "/admin/comunidade", label: "Comunidade", icon: "📣" },
];

export function AdminNav({ memberName }: { memberName: string }) {
  const [open, setOpen] = useState(false);
  const close = () => setOpen(false);

  return (
    <>
      {/* Mobile top bar */}
      <div className="btg-admin-topbar">
        <Link href="/" style={{ display: "flex", alignItems: "center", gap: 8, textDecoration: "none" }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/btg-logo-white.png" alt="BTG" style={{ height: 28, width: "auto" }} />
          <span style={{ fontFamily: "var(--font-oswald), sans-serif", fontSize: 13, fontWeight: 700, color: "#F5C000", letterSpacing: "0.06em" }}>ADMIN</span>
        </Link>
        <button
          onClick={() => setOpen(true)}
          aria-label="Abrir menu"
          style={{ background: "none", border: "none", color: "#fff", fontSize: 22, cursor: "pointer", padding: "4px 8px", lineHeight: 1 }}
        >
          ☰
        </button>
      </div>

      {/* Sidebar */}
      <aside className={`btg-admin-sidebar${open ? " btg-open" : ""}`} style={{ width: 220, background: "#111", display: "flex", flexDirection: "column", flexShrink: 0, position: "sticky", top: 0, height: "100vh", overflowY: "auto" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "20px 20px 16px", borderBottom: "1px solid #222" }}>
          <Link href="/" onClick={close} style={{ display: "flex", alignItems: "center", gap: 8, textDecoration: "none" }}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/btg-logo-white.png" alt="BTG" style={{ height: 36, width: "auto" }} />
            <div>
              <p style={{ fontFamily: "var(--font-oswald), sans-serif", fontSize: 13, fontWeight: 700, color: "#F5C000", margin: 0, letterSpacing: "0.05em" }}>BTG</p>
              <p style={{ fontSize: 10, color: "#555", margin: 0, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.08em" }}>Admin</p>
            </div>
          </Link>
          <button
            className="btg-admin-close"
            onClick={close}
            aria-label="Fechar menu"
            style={{ background: "none", border: "none", color: "#555", fontSize: 20, cursor: "pointer", padding: 4, lineHeight: 1 }}
          >
            ✕
          </button>
        </div>

        <nav style={{ flex: 1, padding: "12px 0" }}>
          {NAV.map(({ href, label, icon }) => (
            <Link
              key={href}
              href={href}
              onClick={close}
              style={{ display: "flex", alignItems: "center", gap: 10, padding: "13px 20px", textDecoration: "none", color: "#aaa", fontSize: 14, fontWeight: 500 }}
            >
              <span style={{ fontSize: 16, width: 20, textAlign: "center" }}>{icon}</span>
              {label}
            </Link>
          ))}
        </nav>

        <div style={{ padding: "16px 20px", borderTop: "1px solid #222" }}>
          <Link href="/dashboard" onClick={close} style={{ fontSize: 12, color: "#555", textDecoration: "none", display: "block", marginBottom: 4 }}>← Área de sócio</Link>
          <p style={{ fontSize: 11, color: "#333", margin: 0 }}>{memberName}</p>
        </div>
      </aside>

      {/* Overlay — closes sidebar when tapped outside */}
      <div
        className={`btg-admin-overlay${open ? " btg-open" : ""}`}
        onClick={close}
        aria-hidden
      />
    </>
  );
}
