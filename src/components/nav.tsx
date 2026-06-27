"use client";

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

  return (
    <nav style={{ background: "#111", height: 72, display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0 32px", position: "sticky", top: 0, zIndex: 50 }}>
      <Link href="/" style={{ display: "flex", alignItems: "center", gap: 10, textDecoration: "none" }}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/btg-logo-white.png" alt="BTG Beach Tennis Gaia" style={{ height: 56, width: "auto" }} />
        <span style={{ color: "#888", fontSize: 13, fontWeight: 500 }}>Beach Tennis Gaia</span>
      </Link>
      <div style={{ display: "flex", gap: 28, alignItems: "center" }}>
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
          <UserButton />
        </Show>
      </div>
    </nav>
  );
}
