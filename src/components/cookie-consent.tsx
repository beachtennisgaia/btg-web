"use client";

import { useEffect, useState } from "react";
import Script from "next/script";

const STORAGE_KEY = "btg_cookie_consent";

export function CookieConsent() {
  const [consent, setConsent] = useState<"accepted" | "declined" | null>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved === "accepted" || saved === "declined") {
      setConsent(saved as "accepted" | "declined");
    } else {
      setVisible(true);
    }
  }, []);

  function accept() {
    localStorage.setItem(STORAGE_KEY, "accepted");
    setConsent("accepted");
    setVisible(false);
  }

  function decline() {
    localStorage.setItem(STORAGE_KEY, "declined");
    setConsent("declined");
    setVisible(false);
  }

  return (
    <>
      {consent === "accepted" && (
        <>
          <Script src="https://www.googletagmanager.com/gtag/js?id=G-TN8VZPFPNL" strategy="afterInteractive" />
          <Script id="gtag-init" strategy="afterInteractive">{`
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());
            gtag('config', 'G-TN8VZPFPNL');
          `}</Script>
        </>
      )}

      {visible && (
        <div style={{
          position: "fixed",
          bottom: 0,
          left: 0,
          right: 0,
          zIndex: 9999,
          background: "#111",
          borderTop: "2px solid #F5C000",
          padding: "16px 24px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 16,
          flexWrap: "wrap",
          fontFamily: "var(--font-inter), sans-serif",
        }}>
          <p style={{ margin: 0, fontSize: 13, color: "#ccc", flex: 1, minWidth: 200, lineHeight: 1.6 }}>
            Usamos cookies de análise (Google Analytics) para perceber como o site é usado.{" "}
            <a href="/privacidade" style={{ color: "#F5C000", textDecoration: "underline" }}>
              Política de privacidade
            </a>
          </p>
          <div style={{ display: "flex", gap: 10, flexShrink: 0 }}>
            <button
              onClick={decline}
              style={{ background: "transparent", border: "1.5px solid #555", color: "#999", fontWeight: 600, padding: "8px 18px", borderRadius: 8, fontSize: 13, cursor: "pointer" }}
            >
              Recusar
            </button>
            <button
              onClick={accept}
              style={{ background: "#F5C000", color: "#111", fontWeight: 700, padding: "8px 18px", borderRadius: 8, fontSize: 13, cursor: "pointer", border: "none" }}
            >
              Aceitar
            </button>
          </div>
        </div>
      )}
    </>
  );
}
