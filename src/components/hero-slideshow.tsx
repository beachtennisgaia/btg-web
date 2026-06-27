"use client";

import { useState, useEffect } from "react";

const FALLBACK = "https://images.unsplash.com/photo-1612872087720-bb876e2e67d1?w=1600&q=80";
const INTERVAL_MS = 6000;
const FADE_MS = 1200;

const baseStyle: React.CSSProperties = {
  position: "absolute", inset: 0, width: "100%", height: "100%",
  objectFit: "cover", objectPosition: "center",
};

export function HeroSlideshow({ urls }: { urls: string[] }) {
  const images = urls.length > 0 ? urls : [FALLBACK];
  const [current, setCurrent] = useState(0);
  const [prev, setPrev] = useState<number | null>(null);

  useEffect(() => {
    if (images.length <= 1) return;
    const timer = setInterval(() => {
      setCurrent((c) => {
        setPrev(c);
        return (c + 1) % images.length;
      });
    }, INTERVAL_MS);
    return () => clearInterval(timer);
  }, [images.length]);

  // Remove prev after fade completes
  useEffect(() => {
    if (prev === null) return;
    const t = setTimeout(() => setPrev(null), FADE_MS + 100);
    return () => clearTimeout(t);
  }, [prev]);

  return (
    <>
      {/* Previous image: stays underneath at full opacity while new one fades in */}
      {prev !== null && (
        <img key={`prev-${prev}`} src={images[prev]} alt="" style={{ ...baseStyle, zIndex: 0 }} />
      )}
      {/* Current image: new DOM element on every change (key), fades in via CSS animation */}
      <img
        key={`cur-${current}`}
        src={images[current]}
        alt=""
        style={{
          ...baseStyle,
          zIndex: 1,
          animation: prev !== null ? `heroFadeIn ${FADE_MS}ms ease forwards` : undefined,
        }}
      />
      {/* Overlays */}
      <div style={{ position: "absolute", inset: 0, zIndex: 2, background: "linear-gradient(to right, rgba(10,10,10,0.92) 40%, rgba(10,10,10,0.55) 70%, rgba(10,10,10,0.25) 100%)" }} />
      <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, height: 80, zIndex: 2, background: "linear-gradient(to bottom, transparent, #111111 90%)" }} />
    </>
  );
}
