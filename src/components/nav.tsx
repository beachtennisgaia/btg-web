"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { SignInButton, SignUpButton, UserButton, Show } from "@clerk/nextjs";

const links = [
  { href: "/torneios", label: "Torneios" },
  { href: "/ranking", label: "Ranking" },
  { href: "/comunidade", label: "Comunidade" },
];

export function Nav() {
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <div style={{ position: "sticky", top: 0, zIndex: 50, background: "#111" }}>
      <nav style={{ height: 72, display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0 32px" }}>
        <Link href="/" style={{ display: "flex", alignItems: "center", gap: 10, textDecoration: "none" }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/btg-logo-white.png" alt="BTG Beach Tennis Gaia" style={{ height: 56, width: "auto" }} />
          <span className="btg-logo-text">Beach Tennis Gaia</span>
        </Link>

        {/* Desktop links */}
        <div className="btg-nav-links">
          {links.map(({ href, label }) => {
            const active = pathname.startsWith(href);
            return (
              <Link
                key={href}
                href={href}
                style={{
                  color: active ? "#F5C000" : "#ccc",
                  textDecoration: "none",
                  fontSize: 14,
                  fontWeight: active ? 600 : 500,
                  borderBottom: active ? "2px solid #F5C000" : "2px solid transparent",
                  paddingBottom: 2,
                }}
              >
                {label}
              </Link>
            );
          })}
          <Show when="signed-out">
            <SignInButton mode="modal">
              <button style={{ color: "#ccc", background: "transparent", border: "none", fontSize: 14, cursor: "pointer", fontWeight: 500 }}>Entrar</button>
            </SignInButton>
            <SignUpButton mode="modal">
              <button style={{ background: "#F5C000", color: "#111", fontWeight: 700, fontSize: 14, padding: "8px 18px", borderRadius: 7, border: "none", cursor: "pointer" }}>
                Tornar-me Sócio
              </button>
            </SignUpButton>
          </Show>
          <Show when="signed-in">
            <Link
              href="/dashboard"
              style={{
                color: pathname === "/dashboard" ? "#F5C000" : "#ccc",
                textDecoration: "none",
                fontSize: 14,
                fontWeight: pathname === "/dashboard" ? 600 : 500,
                borderBottom: pathname === "/dashboard" ? "2px solid #F5C000" : "2px solid transparent",
                paddingBottom: 2,
              }}
            >
              A minha área
            </Link>
            <UserButton />
          </Show>
        </div>

        {/* Hamburger button — visible only on mobile via CSS class */}
        <button
          className="btg-hamburger"
          onClick={() => setMenuOpen((o) => !o)}
          style={{ background: "transparent", border: "none", cursor: "pointer", padding: "8px", flexDirection: "column", gap: 5 }}
          aria-label={menuOpen ? "Fechar menu" : "Abrir menu"}
        >
          <span style={{ display: "block", width: 24, height: 2, background: menuOpen ? "#F5C000" : "#fff", transform: menuOpen ? "rotate(45deg) translateY(7px)" : "none", transition: "all 0.2s" }} />
          <span style={{ display: "block", width: 24, height: 2, background: "#fff", opacity: menuOpen ? 0 : 1, transition: "opacity 0.2s" }} />
          <span style={{ display: "block", width: 24, height: 2, background: menuOpen ? "#F5C000" : "#fff", transform: menuOpen ? "rotate(-45deg) translateY(-7px)" : "none", transition: "all 0.2s" }} />
        </button>
      </nav>

      {/* Mobile dropdown — CSS class hides it on desktop even if rendered */}
      {menuOpen && (
        <div className="btg-mobile-menu">
          {links.map(({ href, label }) => {
            const active = pathname.startsWith(href);
            return (
              <Link
                key={href}
                href={href}
                onClick={() => setMenuOpen(false)}
                style={{ color: active ? "#F5C000" : "#ccc", textDecoration: "none", fontSize: 15, fontWeight: active ? 700 : 500, padding: "13px 8px", borderBottom: "1px solid #222", display: "block" }}
              >
                {label}
              </Link>
            );
          })}
          <Show when="signed-in">
            <Link
              href="/dashboard"
              onClick={() => setMenuOpen(false)}
              style={{ color: pathname === "/dashboard" ? "#F5C000" : "#ccc", textDecoration: "none", fontSize: 15, fontWeight: 600, padding: "13px 8px", borderBottom: "1px solid #222", display: "block" }}
            >
              A minha área
            </Link>
          </Show>
          <Show when="signed-out">
            <div style={{ display: "flex", gap: 10, padding: "13px 8px" }}>
              <SignInButton mode="modal">
                <button style={{ color: "#ccc", background: "transparent", border: "1px solid #333", fontSize: 14, cursor: "pointer", fontWeight: 500, padding: "10px 16px", borderRadius: 7 }}>Entrar</button>
              </SignInButton>
              <SignUpButton mode="modal">
                <button style={{ background: "#F5C000", color: "#111", fontWeight: 700, fontSize: 14, padding: "10px 16px", borderRadius: 7, border: "none", cursor: "pointer" }}>
                  Tornar-me Sócio
                </button>
              </SignUpButton>
            </div>
          </Show>
        </div>
      )}
    </div>
  );
}
