"use client";

import Link from "next/link";
import { SignUpButton } from "@clerk/nextjs";

export function HeroAuthButtons() {
  return (
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
  );
}

export function CtaSignUpButton() {
  return (
    <SignUpButton mode="modal">
      <button style={{ background: "#111", color: "#F5C000", fontWeight: 700, padding: "16px 36px", borderRadius: 10, border: "none", fontSize: 17, cursor: "pointer" }}>
        Tornar-me Sócio BTG
      </button>
    </SignUpButton>
  );
}
