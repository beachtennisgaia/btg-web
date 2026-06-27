"use client";

import { useState, useRef } from "react";

type HeroImage = { id: string; url: string; order: number; active: boolean };

export function HeroGalleryManager({ initialImages }: { initialImages: HeroImage[] }) {
  const [images, setImages] = useState<HeroImage[]>(initialImages);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);

  async function handleUpload(files: FileList) {
    setUploading(true);
    setError("");
    try {
      for (const file of Array.from(files)) {
        const fd = new FormData();
        fd.append("file", file);
        const res = await fetch("/api/admin/hero-images", { method: "POST", body: fd });
        if (!res.ok) { const d = await res.json(); throw new Error(d.error); }
        const img: HeroImage = await res.json();
        setImages((prev) => [...prev, img]);
      }
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  }

  async function toggleActive(id: string, active: boolean) {
    const res = await fetch("/api/admin/hero-images", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, active }),
    });
    if (res.ok) setImages((prev) => prev.map((i) => i.id === id ? { ...i, active } : i));
  }

  async function moveImage(id: string, direction: -1 | 1) {
    const idx = images.findIndex((i) => i.id === id);
    const swapIdx = idx + direction;
    if (swapIdx < 0 || swapIdx >= images.length) return;

    const reordered = [...images];
    [reordered[idx], reordered[swapIdx]] = [reordered[swapIdx], reordered[idx]];
    const updated = reordered.map((img, i) => ({ ...img, order: i }));
    setImages(updated);

    // Persist new orders
    await Promise.all([
      fetch("/api/admin/hero-images", {
        method: "PATCH", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: updated[idx].id, order: updated[idx].order }),
      }),
      fetch("/api/admin/hero-images", {
        method: "PATCH", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: updated[swapIdx].id, order: updated[swapIdx].order }),
      }),
    ]);
  }

  async function deleteImage(id: string) {
    if (!confirm("Apagar esta imagem definitivamente?")) return;
    const res = await fetch("/api/admin/hero-images", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    });
    if (res.ok) setImages((prev) => prev.filter((i) => i.id !== id));
  }

  const activeCount = images.filter((i) => i.active).length;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
      {/* Upload zone */}
      <div
        style={{ border: "2px dashed #e0e0e0", borderRadius: 16, padding: "32px 24px", textAlign: "center", cursor: "pointer", background: "#fafafa" }}
        onClick={() => fileRef.current?.click()}
        onDragOver={(e) => e.preventDefault()}
        onDrop={(e) => { e.preventDefault(); if (e.dataTransfer.files.length) handleUpload(e.dataTransfer.files); }}
      >
        <input
          ref={fileRef}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          multiple
          style={{ display: "none" }}
          onChange={(e) => { if (e.target.files?.length) handleUpload(e.target.files); }}
        />
        <div style={{ fontSize: 32, marginBottom: 8 }}>📷</div>
        {uploading ? (
          <p style={{ fontSize: 14, color: "#888", margin: 0 }}>A fazer upload…</p>
        ) : (
          <>
            <p style={{ fontSize: 15, fontWeight: 600, color: "#333", margin: "0 0 4px" }}>Clica ou arrasta imagens aqui</p>
            <p style={{ fontSize: 13, color: "#999", margin: 0 }}>JPEG, PNG ou WebP · máximo 10 MB cada</p>
          </>
        )}
      </div>

      {error && <p style={{ fontSize: 13, color: "#d32f2f", background: "#ffeaea", padding: "10px 14px", borderRadius: 8, margin: 0 }}>{error}</p>}

      {/* Stats */}
      {images.length > 0 && (
        <p style={{ fontSize: 13, color: "#888", margin: 0 }}>
          {images.length} {images.length === 1 ? "imagem" : "imagens"} · <strong style={{ color: "#111" }}>{activeCount} activas</strong> no slideshow
          {activeCount === 0 && <span style={{ color: "#F5A623" }}> — sem imagens activas, será usada a imagem de fallback</span>}
          {activeCount === 1 && <span style={{ color: "#888" }}> — com uma só imagem não há slideshow</span>}
        </p>
      )}

      {/* Image grid */}
      {images.length === 0 ? (
        <div style={{ background: "#fff", borderRadius: 12, padding: "40px 24px", textAlign: "center", boxShadow: "0 1px 6px rgba(0,0,0,0.06)" }}>
          <p style={{ color: "#bbb", fontSize: 14, margin: 0 }}>Nenhuma imagem ainda. Faz upload acima.</p>
        </div>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))", gap: 16 }}>
          {images.map((img, idx) => (
            <div
              key={img.id}
              style={{
                background: "#fff", borderRadius: 12, overflow: "hidden",
                boxShadow: "0 2px 8px rgba(0,0,0,0.07)",
                border: img.active ? "2px solid #F5C000" : "2px solid transparent",
                opacity: img.active ? 1 : 0.55,
              }}
            >
              {/* Preview */}
              <div style={{ position: "relative", height: 160, background: "#111" }}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={img.url} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                {/* Simulate overlay */}
                <div style={{ position: "absolute", inset: 0, background: "linear-gradient(to right, rgba(10,10,10,0.7) 20%, transparent 70%)" }} />
                <div style={{ position: "absolute", top: 8, left: 8 }}>
                  <span style={{
                    background: img.active ? "#F5C000" : "#555",
                    color: img.active ? "#111" : "#fff",
                    fontSize: 10, fontWeight: 700, padding: "2px 8px", borderRadius: 99,
                  }}>
                    {img.active ? `#${idx + 1} ACTIVA` : "OCULTA"}
                  </span>
                </div>
              </div>

              {/* Controls */}
              <div style={{ padding: "10px 12px", display: "flex", alignItems: "center", gap: 6 }}>
                <button
                  onClick={() => moveImage(img.id, -1)}
                  disabled={idx === 0}
                  title="Mover para a esquerda"
                  style={{ background: "#F0F0F0", border: "none", borderRadius: 6, padding: "5px 8px", fontSize: 13, cursor: idx === 0 ? "not-allowed" : "pointer", opacity: idx === 0 ? 0.3 : 1 }}
                >
                  ←
                </button>
                <button
                  onClick={() => moveImage(img.id, 1)}
                  disabled={idx === images.length - 1}
                  title="Mover para a direita"
                  style={{ background: "#F0F0F0", border: "none", borderRadius: 6, padding: "5px 8px", fontSize: 13, cursor: idx === images.length - 1 ? "not-allowed" : "pointer", opacity: idx === images.length - 1 ? 0.3 : 1 }}
                >
                  →
                </button>

                <button
                  onClick={() => toggleActive(img.id, !img.active)}
                  style={{
                    flex: 1, background: img.active ? "#F9F9F9" : "#F5C000",
                    border: "1.5px solid #e0e0e0", borderRadius: 6, padding: "5px 10px",
                    fontSize: 12, fontWeight: 600,
                    color: img.active ? "#888" : "#111", cursor: "pointer",
                  }}
                >
                  {img.active ? "Ocultar" : "Activar"}
                </button>

                <button
                  onClick={() => deleteImage(img.id)}
                  title="Apagar imagem"
                  style={{ background: "none", border: "1.5px solid #f0f0f0", borderRadius: 6, padding: "5px 8px", fontSize: 13, color: "#bbb", cursor: "pointer" }}
                >
                  🗑
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
