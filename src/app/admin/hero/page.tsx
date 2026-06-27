import { db } from "@/lib/db";
import { HeroGalleryManager } from "./hero-gallery-manager";

export default async function HeroAdminPage() {
  const images = await db.heroImage.findMany({ orderBy: { order: "asc" } });
  return (
    <div style={{ padding: 32, maxWidth: 900 }}>
      <div style={{ marginBottom: 28 }}>
        <h1 style={{ fontFamily: "var(--font-oswald), sans-serif", fontSize: 28, fontWeight: 700, color: "#111", margin: 0 }}>
          GALERIA DO HERO
        </h1>
        <p style={{ color: "#888", fontSize: 14, margin: "4px 0 0" }}>
          Imagens que aparecem no fundo do banner principal. Fazem slideshow automático com cross-fade.
        </p>
      </div>
      <HeroGalleryManager initialImages={images} />
    </div>
  );
}
