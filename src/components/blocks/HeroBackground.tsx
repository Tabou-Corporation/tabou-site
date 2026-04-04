"use client";

import Image from "next/image";
import { useRef, useEffect } from "react";

interface HeroBackgroundProps {
  src: string;
}

/**
 * Background cinématique du hero :
 * - Ken Burns : zoom/pan CSS lent sur 30 s en boucle alternée
 * - Parallaxe souris : translation légère opposée au curseur pour un effet de profondeur
 */
export function HeroBackground({ src }: HeroBackgroundProps) {
  const parallaxRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let raf: number;
    let targetX = 0;
    let targetY = 0;
    let currentX = 0;
    let currentY = 0;

    const handleMouseMove = (e: MouseEvent) => {
      // -1 → +1, inversé pour effet de profondeur (oppose cursor)
      targetX = (e.clientX / window.innerWidth - 0.5) * -22;
      targetY = (e.clientY / window.innerHeight - 0.5) * -14;
    };

    const tick = () => {
      // Lerp fluide : 0.04 = ~60 fps smooth
      currentX += (targetX - currentX) * 0.04;
      currentY += (targetY - currentY) * 0.04;
      if (parallaxRef.current) {
        parallaxRef.current.style.transform = `translate(${currentX}px, ${currentY}px)`;
      }
      raf = requestAnimationFrame(tick);
    };

    window.addEventListener("mousemove", handleMouseMove, { passive: true });
    raf = requestAnimationFrame(tick);

    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      cancelAnimationFrame(raf);
    };
  }, []);

  return (
    <div className="absolute inset-0 overflow-hidden" aria-hidden>
      {/* Zone élargie pour absorber le déplacement parallaxe sans clipping */}
      <div
        ref={parallaxRef}
        className="will-change-transform"
        style={{ position: "absolute", inset: "-6%" }}
      >
        {/* Ken Burns : zoom lent + pan léger, boucle infinie alternée */}
        <div className="absolute inset-0 animate-ken-burns will-change-transform">
          {src.startsWith("http") ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={src}
              alt=""
              className="w-full h-full object-cover object-[70%_center] lg:object-[65%_center]"
            />
          ) : (
            <Image
              src={src}
              alt=""
              fill
              priority
              className="object-cover object-[70%_center] lg:object-[65%_center]"
              quality={85}
              sizes="112vw"
            />
          )}
        </div>
      </div>
    </div>
  );
}
