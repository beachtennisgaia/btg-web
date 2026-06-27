"use client";

export function PrintButton() {
  return (
    <button
      onClick={() => window.print()}
      style={{ background: "#F5C000", color: "#111", fontWeight: 700, padding: "10px 24px", borderRadius: 8, border: "none", fontSize: 14, cursor: "pointer" }}
    >
      🖨 Imprimir / Guardar PDF
    </button>
  );
}
