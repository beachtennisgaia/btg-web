"use client";

import { useState, useTransition, useRef } from "react";
import { createPost } from "@/lib/actions";

function initials(name: string) {
  return name.split(" ").slice(0, 2).map((w) => w[0]).join("").toUpperCase();
}

export function ComposeBox({ memberName }: { memberName: string }) {
  const [open, setOpen] = useState(false);
  const [content, setContent] = useState("");
  const [pending, startTransition] = useTransition();
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  function handleOpen() {
    setOpen(true);
    setTimeout(() => textareaRef.current?.focus(), 50);
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!content.trim()) return;
    startTransition(async () => {
      await createPost(content.trim());
      setContent("");
      setOpen(false);
    });
  }

  function handleCancel() {
    setContent("");
    setOpen(false);
  }

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
              style={{
                flex: 1, border: "none", outline: "none", resize: "none",
                fontSize: 14, fontFamily: "var(--font-inter), sans-serif",
                color: "#111", lineHeight: 1.6,
              }}
            />
          </div>
          <div style={{ display: "flex", justifyContent: "flex-end", gap: 8, paddingTop: 8, borderTop: "1px solid #f0f0f0" }}>
            <span style={{ fontSize: 12, color: content.length > 500 ? "#d32f2f" : "#ccc", alignSelf: "center", marginRight: "auto" }}>
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
              disabled={pending || !content.trim() || content.length > 500}
              style={{
                background: pending || !content.trim() || content.length > 500 ? "#ddd" : "#F5C000",
                color: "#111", fontWeight: 700, padding: "8px 20px", borderRadius: 8, border: "none",
                fontSize: 13, cursor: pending || !content.trim() ? "not-allowed" : "pointer",
              }}
            >
              {pending ? "A publicar…" : "Publicar"}
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
