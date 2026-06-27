"use client";

import { useState, useTransition, useOptimistic, useRef } from "react";
import { toggleLike, createComment } from "@/lib/actions";

function timeAgo(date: Date) {
  const mins = Math.floor((Date.now() - date.getTime()) / 60000);
  if (mins < 1) return "agora mesmo";
  if (mins < 60) return `há ${mins} min`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `há ${hrs}h`;
  return `há ${Math.floor(hrs / 24)}d`;
}

function initials(name: string) {
  return name.split(" ").slice(0, 2).map((w) => w[0]).join("").toUpperCase();
}

type Comment = {
  id: string;
  content: string;
  createdAt: Date;
  author: { name: string; avatarUrl: string | null };
};

type Post = {
  id: string;
  type: string;
  content: string;
  createdAt: Date;
  author: { name: string; role: string; avatarUrl: string | null };
  photos: { url: string }[];
  likes: { memberId: string }[];
  comments: Comment[];
};

export function PostCard({ post, memberId }: { post: Post; memberId: string | null }) {
  const [showComments, setShowComments] = useState(false);
  const [commentText, setCommentText] = useState("");
  const [commentPending, startCommentTransition] = useTransition();
  const [likePending, startLikeTransition] = useTransition();
  const inputRef = useRef<HTMLInputElement>(null);

  const likedByMe = memberId ? post.likes.some((l) => l.memberId === memberId) : false;
  const [optimisticLikes, addOptimisticLike] = useOptimistic(
    { count: post.likes.length, liked: likedByMe },
    (state) => ({ count: state.liked ? state.count - 1 : state.count + 1, liked: !state.liked })
  );

  const [optimisticComments, addOptimisticComment] = useOptimistic(
    post.comments,
    (state, newComment: Comment) => [...state, newComment]
  );

  const isAdmin = post.author.role === "ADMIN";

  function handleLike() {
    if (!memberId) return;
    startLikeTransition(async () => {
      addOptimisticLike(undefined);
      await toggleLike(post.id);
    });
  }

  function handleComment(e: React.FormEvent) {
    e.preventDefault();
    if (!commentText.trim() || !memberId) return;
    const text = commentText.trim();
    setCommentText("");
    startCommentTransition(async () => {
      addOptimisticComment({
        id: `opt-${Date.now()}`,
        content: text,
        createdAt: new Date(),
        author: { name: "Tu", avatarUrl: null },
      });
      await createComment(post.id, text);
    });
  }

  return (
    <div style={{ background: "#fff", borderRadius: 16, overflow: "hidden", boxShadow: "0 2px 12px rgba(0,0,0,0.07)" }}>
      {/* Header */}
      <div style={{ padding: "16px 20px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          {post.author.avatarUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={post.author.avatarUrl} alt="" style={{ width: 40, height: 40, borderRadius: "50%", objectFit: "cover" }} />
          ) : (
            <div style={{ width: 40, height: 40, borderRadius: "50%", background: isAdmin ? "#111" : "#F5C000", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700, fontSize: 14, color: isAdmin ? "#F5C000" : "#111" }}>
              {isAdmin ? "BTG" : initials(post.author.name)}
            </div>
          )}
          <div>
            <p style={{ margin: 0, fontWeight: 600, fontSize: 14, color: "#111" }}>
              {isAdmin ? "Beach Tennis Gaia" : post.author.name}
            </p>
            <p style={{ margin: 0, fontSize: 12, color: "#888" }}>
              {isAdmin ? "Direção BTG" : "Sócio BTG"} · {timeAgo(post.createdAt)}
            </p>
          </div>
        </div>
        <span style={{ background: post.type === "ANNOUNCEMENT" ? "#F5C000" : "#F0F0F0", color: post.type === "ANNOUNCEMENT" ? "#111" : "#555", fontSize: 11, fontWeight: 700, padding: "3px 8px", borderRadius: 99 }}>
          {post.type === "ANNOUNCEMENT" ? "Anúncio" : "Comunidade"}
        </span>
      </div>

      {/* Photo */}
      {post.photos.length > 0 && (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={post.photos[0].url} alt="" style={{ width: "100%", maxHeight: 360, objectFit: "cover", display: "block" }} />
      )}

      {/* Content */}
      <div style={{ padding: "14px 20px 0" }}>
        <p style={{ margin: 0, fontSize: 15, color: "#333", lineHeight: 1.6 }}>{post.content}</p>
      </div>

      {/* Actions bar */}
      <div style={{ padding: "12px 20px", display: "flex", gap: 4, alignItems: "center", borderTop: "1px solid #f5f5f5", marginTop: 12 }}>
        {/* Like */}
        <button
          onClick={handleLike}
          disabled={!memberId || likePending}
          style={{
            display: "flex", alignItems: "center", gap: 6, background: optimisticLikes.liked ? "#FFFDE7" : "none",
            border: optimisticLikes.liked ? "1.5px solid #F5C000" : "1.5px solid #eee",
            borderRadius: 8, padding: "6px 14px", cursor: memberId ? "pointer" : "default",
            color: optimisticLikes.liked ? "#7A5900" : "#888", fontSize: 14, fontWeight: 600,
            transition: "all 0.15s",
          }}
        >
          <span style={{ fontSize: 16 }}>{optimisticLikes.liked ? "👍" : "👍"}</span>
          <span>{optimisticLikes.count > 0 ? optimisticLikes.count : ""}</span>
        </button>

        {/* Comment toggle */}
        <button
          onClick={() => { setShowComments((v) => !v); if (!showComments) setTimeout(() => inputRef.current?.focus(), 100); }}
          style={{
            display: "flex", alignItems: "center", gap: 6,
            background: showComments ? "#F0F0F0" : "none",
            border: "1.5px solid #eee", borderRadius: 8, padding: "6px 14px",
            cursor: "pointer", color: "#888", fontSize: 14, fontWeight: 600,
          }}
        >
          <span style={{ fontSize: 16 }}>💬</span>
          <span>{optimisticComments.length > 0 ? optimisticComments.length : ""}</span>
        </button>

        {!memberId && (
          <span style={{ fontSize: 12, color: "#ccc", marginLeft: 8 }}>
            <a href="/sign-in" style={{ color: "#F5C000", fontWeight: 600, textDecoration: "none" }}>Inicia sessão</a> para interagir
          </span>
        )}
      </div>

      {/* Comments section */}
      {showComments && (
        <div style={{ borderTop: "1px solid #f5f5f5", padding: "12px 20px", display: "flex", flexDirection: "column", gap: 12 }}>
          {optimisticComments.length === 0 && (
            <p style={{ fontSize: 13, color: "#ccc", margin: 0, textAlign: "center" }}>Ainda sem comentários. Sê o primeiro!</p>
          )}

          {optimisticComments.map((c) => (
            <div key={c.id} style={{ display: "flex", gap: 10 }}>
              <div style={{ width: 30, height: 30, borderRadius: "50%", background: "#F0F0F0", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700, fontSize: 11, color: "#555", flexShrink: 0 }}>
                {initials(c.author.name)}
              </div>
              <div style={{ background: "#F9F9F9", borderRadius: 10, padding: "8px 12px", flex: 1 }}>
                <p style={{ margin: "0 0 2px", fontWeight: 600, fontSize: 12, color: "#111" }}>{c.author.name}</p>
                <p style={{ margin: 0, fontSize: 13, color: "#444", lineHeight: 1.5 }}>{c.content}</p>
              </div>
            </div>
          ))}

          {memberId && (
            <form onSubmit={handleComment} style={{ display: "flex", gap: 8, marginTop: 4 }}>
              <input
                ref={inputRef}
                value={commentText}
                onChange={(e) => setCommentText(e.target.value)}
                placeholder="Escreve um comentário…"
                disabled={commentPending}
                style={{ flex: 1, padding: "8px 12px", border: "1.5px solid #e0e0e0", borderRadius: 8, fontSize: 13, fontFamily: "var(--font-inter), sans-serif", outline: "none" }}
              />
              <button
                type="submit"
                disabled={!commentText.trim() || commentPending}
                style={{ background: !commentText.trim() ? "#eee" : "#111", color: !commentText.trim() ? "#aaa" : "#F5C000", fontWeight: 700, padding: "8px 16px", borderRadius: 8, border: "none", fontSize: 13, cursor: !commentText.trim() ? "not-allowed" : "pointer" }}
              >
                {commentPending ? "…" : "Enviar"}
              </button>
            </form>
          )}
        </div>
      )}
    </div>
  );
}
