"use client";

import { useState, useTransition, useRef } from "react";
import { upload } from "@vercel/blob/client";
import { createPost } from "@/lib/actions";

function initials(name: string) {
  return name.split(" ").slice(0, 2).map((w) => w[0]).join("").toUpperCase();
}

export function ComposeBox({ memberName }: { memberName: string }) {
  const [open, setOpen] = useState(false);
  const [content, setContent] = useState("");
  const [files, setFiles] = useState<File[]>([]);
  const [previews, setPreviews] = useState<string[]>([]);
  const [uploading, setUploading] = useState(false);
  const [pending, startTransition] = useTransition();
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  function handleOpen() {
    setOpen(true);
    setTimeout(() => textareaRef.current?.focus(), 50);
  }

  function handleFiles(e: React.ChangeEvent<HTMLInputElement>) {
    const selected = Array.from(e.target.files ?? []).slice(0, 4);
    setFiles(selected);
    setPreviews(selected.map((f) => URL.createObjectURL(f)));
    if (e.target) e.target.value = "";
  }

  function removeFile(i: number) {
    setFiles((prev) => prev.filter((_, idx) => idx !== i));
    setPreviews((prev) => {
      URL.revokeObjectURL(prev[i]);
      return prev.filter((_, idx) => idx !== i);
    });
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!content.trim()) return;

    setUploading(true);
    let photoUrls: string[] = [];
    try {
      photoUrls = await Promise.all(
        files.map((file) =>
          upload(`comunidade/${Date.now()}-${file.name}`, file, {
            access: "public",
            handleUploadUrl: "/api/upload",
          }).then((b) => b.url)
        )
      );
    } finally {
      setUploading(false);
    }

    startTransition(async () => {
      await createPost(content.trim(), photoUrls);
      setContent("");
      setFiles([]);
      setPreviews([]);
      setOpen(false);
    });
  }

  function handleCancel() {
    previews.forEach((p) => URL.revokeObjectURL(p));
    setContent("");
    setFiles([]);
    setPreviews([]);
    setOpen(false);
  }

  const busy = uploading || pending;

  return (
    <div style={{ background: "#fff", borderRadius: 16, padding: "16px 20px", boxShadow: "0 2px 12px rgba(0,0,0,0.07)", border: open ? "2px solid #F5C000" : "2px dashed #eee", transition: "border-color 0.15s" }}>
      {!open ? (
        <button
          onClick={handleOpen}
          style={{ width: "100%", background: "none", border: "none", display: "flex", alignItems: "center", gap: 12, cursor: "pointer", padding: 0, textAlign: "left" }}
        >
          <div style={{ width: 40, height: 40, borderRadius: "50%", background: "#F5C000", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700, fontSize: 14, color: "#111", flexShrink: 0 }}>
            {initials(memberName)}
          </div>
          <p style={{ margin: 0, fontSize: 14, color: "#aaa" }}>Partilha um momento com a comunidade...</p>
        </button>
      ) : (
        <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          <div style={{ display: "flex", gap: 12 }}>
            <div style={{ width: 40, height: 40, borderRadius: "50%", background: "#F5C000", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700, fontSize: 14, color: "#111", flexShrink: 0 }}>
              {initials(memberName)}
            </div>
            <textarea
              ref={textareaRef}
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="O que queres partilhar?"
              rows={3}
              style={{ flex: 1, border: "none", outline: "none", resize: "none", fontSize: 14, fontFamily: "var(--font-inter), sans-serif", color: "#111", lineHeight: 1.6 }}
            />
          </div>

          {/* Image previews */}
          {previews.length > 0 && (
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
              {previews.map((src, i) => (
                <div key={i} style={{ position: "relative", width: 100, height: 100, borderRadius: 8, overflow: "hidden" }}>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={src} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                  <button
                    type="button"
                    onClick={() => removeFile(i)}
                    style={{ position: "absolute", top: 4, right: 4, width: 20, height: 20, borderRadius: "50%", background: "rgba(0,0,0,0.6)", border: "none", color: "#fff", fontSize: 12, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", lineHeight: 1 }}
                  >
                    ×
                  </button>
                </div>
              ))}
              {previews.length < 4 && (
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  style={{ width: 100, height: 100, borderRadius: 8, border: "2px dashed #ddd", background: "none", cursor: "pointer", color: "#bbb", fontSize: 24 }}
                >
                  +
                </button>
              )}
            </div>
          )}

          <div style={{ display: "flex", alignItems: "center", gap: 8, paddingTop: 8, borderTop: "1px solid #f0f0f0" }}>
            {/* Photo button */}
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={files.length >= 4}
              style={{ background: "none", border: "1.5px solid #eee", borderRadius: 8, padding: "6px 12px", fontSize: 14, cursor: files.length >= 4 ? "not-allowed" : "pointer", color: "#888" }}
              title="Adicionar foto"
            >
              📷 Foto
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp,image/gif"
              multiple
              onChange={handleFiles}
              style={{ display: "none" }}
            />

            <span style={{ fontSize: 12, color: content.length > 500 ? "#d32f2f" : "#ccc", marginLeft: "auto" }}>
              {content.length}/500
            </span>
            <button
              type="button"
              onClick={handleCancel}
              style={{ background: "#F0F0F0", color: "#555", fontWeight: 600, padding: "8px 16px", borderRadius: 8, border: "none", fontSize: 13, cursor: "pointer" }}
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={busy || !content.trim() || content.length > 500}
              style={{
                background: busy || !content.trim() || content.length > 500 ? "#ddd" : "#F5C000",
                color: "#111", fontWeight: 700, padding: "8px 20px", borderRadius: 8, border: "none",
                fontSize: 13, cursor: busy || !content.trim() ? "not-allowed" : "pointer",
              }}
            >
              {uploading ? "A enviar fotos…" : pending ? "A publicar…" : "Publicar"}
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
