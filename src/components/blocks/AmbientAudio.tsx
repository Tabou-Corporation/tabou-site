"use client";

import { useRef, useState, useEffect, useCallback } from "react";
import { Volume2, VolumeX } from "lucide-react";

interface AmbientAudioProps {
  /** Chemin vers le fichier audio (relatif à /public) */
  src: string;
  /** Volume initial (0-1) */
  volume?: number;
}

/**
 * Lecteur audio d'ambiance avec bouton mute/unmute.
 * Démarre muté (autoplay policy navigateur), l'utilisateur clique pour activer.
 * Persiste le choix mute dans localStorage.
 */
export function AmbientAudio({ src, volume = 0.3 }: AmbientAudioProps) {
  const audioRef = useRef<HTMLAudioElement>(null);
  const [muted, setMuted] = useState(true);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem("tabou-ambient-muted");
    // Si l'utilisateur avait explicitement activé le son, on tente de jouer
    if (stored === "false") {
      setMuted(false);
    }
    setReady(true);
  }, []);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio || !ready) return;

    audio.volume = volume;
    audio.muted = muted;

    if (!muted) {
      audio.play().catch(() => {
        // Autoplay bloqué — on reste muté
        setMuted(true);
      });
    }
  }, [muted, volume, ready]);

  const toggle = useCallback(() => {
    setMuted((prev) => {
      const next = !prev;
      localStorage.setItem("tabou-ambient-muted", String(next));
      if (!next) {
        audioRef.current?.play().catch(() => {});
      }
      return next;
    });
  }, []);

  if (!ready) return null;

  return (
    <>
      <audio ref={audioRef} src={src} loop preload="auto" />
      <button
        onClick={toggle}
        aria-label={muted ? "Activer la musique" : "Couper la musique"}
        title={muted ? "Activer la musique" : "Couper la musique"}
        className="
          fixed bottom-6 right-6 z-50
          w-11 h-11 rounded-full
          bg-bg-deep/80 backdrop-blur-md
          border border-gold/30 hover:border-gold/60
          text-gold/70 hover:text-gold
          flex items-center justify-center
          transition-all duration-300
          hover:scale-110
          shadow-lg shadow-black/40
        "
      >
        {muted ? <VolumeX size={18} /> : <Volume2 size={18} />}
      </button>
    </>
  );
}
