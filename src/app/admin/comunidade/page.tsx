import { db } from "@/lib/db";
import { createAnnouncement, deletePost } from "@/lib/actions";

export default async function AdminComunidadePage() {
  const posts = await db.post.findMany({
    include: { author: true },
    orderBy: { createdAt: "desc" },
    take: 50,
  });

  return (
    <div style={{ padding: 32, maxWidth: 800 }}>
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontFamily: "var(--font-oswald), sans-serif", fontSize: 28, fontWeight: 700, color: "#111", margin: 0 }}>COMUNIDADE</h1>
        <p style={{ color: "#888", fontSize: 14, margin: "4px 0 0" }}>Publica anúncios e modera posts dos sócios.</p>
      </div>

      {/* Announce form */}
      <div style={{ background: "#fff", borderRadius: 16, padding: 24, boxShadow: "0 2px 8px rgba(0,0,0,0.06)", marginBottom: 24 }}>
        <p style={{ fontFamily: "var(--font-oswald), sans-serif", fontSize: 15, fontWeight: 700, color: "#111", margin: "0 0 14px", letterSpacing: "0.04em" }}>
          📣 PUBLICAR ANÚNCIO
        </p>
        <form
          action={async (fd) => {
            "use server";
            const content = fd.get("content") as string;
            if (content?.trim()) await createAnnouncement(content.trim());
          }}
          style={{ display: "flex", flexDirection: "column", gap: 12 }}
        >
          <textarea
            name="content"
            required
            rows={3}
            placeholder="Escreve o teu anúncio aqui…"
            style={{ width: "100%", padding: "10px 12px", border: "1.5px solid #e0e0e0", borderRadius: 9, fontSize: 14, fontFamily: "var(--font-inter), sans-serif", resize: "vertical", outline: "none", boxSizing: "border-box" }}
          />
          <button
            type="submit"
            style={{ alignSelf: "flex-end", background: "#F5C000", color: "#111", fontWeight: 700, padding: "10px 24px", borderRadius: 9, border: "none", fontSize: 14, cursor: "pointer" }}
          >
            Publicar
          </button>
        </form>
      </div>

      {/* Post list */}
      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        {posts.length === 0 ? (
          <div style={{ background: "#fff", borderRadius: 16, padding: "40px 24px", textAlign: "center", boxShadow: "0 2px 8px rgba(0,0,0,0.06)" }}>
            <p style={{ fontSize: 14, color: "#888" }}>Sem posts para moderar.</p>
          </div>
        ) : posts.map((post) => (
          <div key={post.id} style={{ background: "#fff", borderRadius: 14, padding: "16px 20px", boxShadow: "0 1px 6px rgba(0,0,0,0.06)", display: "flex", gap: 14, alignItems: "flex-start" }}>
            <div style={{
              width: 36, height: 36, borderRadius: 99, background: post.type === "ANNOUNCEMENT" ? "#F5C000" : "#111", color: post.type === "ANNOUNCEMENT" ? "#111" : "#fff",
              fontWeight: 700, fontSize: 13, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
            }}>
              {post.type === "ANNOUNCEMENT" ? "📣" : post.author.name.slice(0, 2).toUpperCase()}
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 4, gap: 8 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <span style={{ fontWeight: 700, fontSize: 13, color: "#111" }}>{post.author.name}</span>
                  {post.type === "ANNOUNCEMENT" && (
                    <span style={{ background: "#FFF3B0", color: "#7A5900", fontSize: 10, fontWeight: 700, padding: "2px 7px", borderRadius: 99, textTransform: "uppercase", letterSpacing: "0.06em" }}>Anúncio</span>
                  )}
                </div>
                <span style={{ fontSize: 11, color: "#bbb", whiteSpace: "nowrap" }}>
                  {new Date(post.createdAt).toLocaleDateString("pt-PT", { day: "numeric", month: "short" })}
                </span>
              </div>
              <p style={{ fontSize: 14, color: "#444", margin: 0, lineHeight: 1.5, whiteSpace: "pre-wrap", wordBreak: "break-word" }}>{post.content}</p>
            </div>
            <form action={deletePost.bind(null, post.id)} style={{ flexShrink: 0 }}>
              <button
                type="submit"
                title="Apagar post"
                style={{ background: "none", border: "1.5px solid #ffd0d0", color: "#d32f2f", borderRadius: 7, padding: "5px 10px", fontSize: 12, fontWeight: 600, cursor: "pointer" }}
              >
                Apagar
              </button>
            </form>
          </div>
        ))}
      </div>
    </div>
  );
}
