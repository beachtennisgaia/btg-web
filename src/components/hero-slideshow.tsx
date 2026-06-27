"use client";

import { useState, useEffect } from "react";

const FALLBACK = "https://images.unsplash.com/photo-1612872087720-bb876e2e67d1?w=1600&q=80";
const INTERVAL_MS = 6000;
const FADE_MS = 1200;

export function HeroSlideshow({ urls }: { urls: string[] }) {
  const images = urls.length > 0 ? urls : [FALLBACK];
  const [current, setCurrent] = useState(0);
  const [fading, setFading] = useState(false);
  const [next, setNext] = useState<number | null>(null);

  useEffect(() => {
    if (images.length <= 1) return;
    const timer = setInterval(() => {
      const nextIdx = (current + 1) % images.length;
      setNext(nextIdx);
      setFading(true);
      setTimeout(() => {
        setCurrent(nextIdx);
        setNext(null);
        setFading(false);
      }, FADE_MS);
    }, INTERVAL_MS);
    return () => clearInterval(timer);
  }, [current, images.length]);

  return (
    <>
      {/* Current image */}
      <img
        src={images[current]}
        alt=""
        style={{
          position: "absolute", inset: 0, width: "100%", height: "100%",
          objectFit: "cover", objectPosition: "center",
          transition: `opacity ${FADE_MS}ms ease`,
          opacity: fading ? 0 : 1,
        }}
      />
      {/* Next image — fades in underneath as current fades out */}
      {next !== null && (
        <img
          src={images[next]}
          alt=""
          style={{
            position: "absolute", inset: 0, width: "100%", height: "100%",
            objectFit: "cover", objectPosition: "center",
            opacity: 1,
          }}
        />
      )}
      {/* Overlays — always on top */}
      <div style={{ position: "absolute", inset: 0, background: "linear-gradient(to right, rgba(10,10,10,0.92) 40%, rgba(10,10,10,0.55) 70%, rgba(10,10,10,0.25) 100%)" }} />
      <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, height: 80, background: "linear-gradient(to bottom, transparent, #111111 90%)" }} />
    </>
  );
}
