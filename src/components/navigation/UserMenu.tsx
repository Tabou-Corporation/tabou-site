"use client";

import { useState, useRef, useEffect } from "react";
import { useSession, signOut } from "next-auth/react";
import Link from "next/link";
import Image from "next/image";
import { LogOut, User, ChevronDown, Shield, Settings } from "lucide-react";
import { cn } from "@/lib/utils/cn";

export function UserMenu() {
  const { data: session, status } = useSession();
  const [isOpen, setIsOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  // Fermer au clic extérieur
  useEffect(() => {
    function handler(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  if (status === "loading") {
    return <div className="w-24 h-8 rounded bg-bg-elevated animate-pulse" />;
  }

  if (!session) {
    return null; // La nav publique affiche déjà Discord + Postuler
  }

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setIsOpen((v) => !v)}
        className={cn(
          "flex items-center gap-2 px-3 py-1.5 rounded",
          "text-text-secondary hover:text-text-primary",
          "border border-border hover:border-border-accent",
          "transition-colors duration-[180ms]"
        )}
        aria-expanded={isOpen}
        aria-label="Menu utilisateur"
      >
        {session.user?.image ? (
          <Image
            src={session.user.image}
            alt={session.user.name ?? "Portrait"}
            width={24}
            height={24}
            className="rounded-full"
            unoptimized
          />
        ) : (
          <User size={16} />
        )}
        <span className="text-sm font-medium max-w-[120px] truncate">
          {session.user?.name ?? "Pilote"}
        </span>
        <ChevronDown
          size={14}
          className={cn("transition-transform duration-[180ms]", isOpen && "rotate-180")}
        />
      </button>

      {isOpen && (
        <div className="absolute right-0 top-full mt-2 w-48 bg-bg-elevated border border-border rounded-md shadow-panel-lg z-60">
          <div className="px-4 py-3 border-b border-border">
            <p className="text-text-muted text-xs font-semibold tracking-widest uppercase">
              Rôle
            </p>
            <p className="text-gold text-xs mt-0.5 capitalize">
              {session.user?.role ?? "candidat"}
            </p>
          </div>
          <div className="py-1">
            <Link
              href={session.user?.role === "candidate" ? "/membre" : "/membre/annuaire"}
              onClick={() => setIsOpen(false)}
              className="flex items-center gap-2 px-4 py-2.5 text-sm text-text-secondary hover:text-text-primary hover:bg-bg-overlay transition-colors"
            >
              <User size={14} />
              Espace membre
            </Link>
            <Link
              href="/membre/profil"
              onClick={() => setIsOpen(false)}
              className="flex items-center gap-2 px-4 py-2.5 text-sm text-text-secondary hover:text-text-primary hover:bg-bg-overlay transition-colors"
            >
              <User size={14} />
              Mon profil
            </Link>
          </div>

          {/* Liens staff — visibles officer+ */}
          {["officer", "director", "ceo", "admin"].includes(session.user?.role ?? "") && (
            <div className="border-t border-border py-1">
              <Link
                href="/staff/candidatures"
                onClick={() => setIsOpen(false)}
                className="flex items-center gap-2 px-4 py-2.5 text-sm text-gold/80 hover:text-gold hover:bg-bg-overlay transition-colors"
              >
                <Shield size={14} />
                Zone Staff
              </Link>
              {["director", "ceo", "admin"].includes(session.user?.role ?? "") && (
                <Link
                  href="/staff/admin"
                  onClick={() => setIsOpen(false)}
                  className="flex items-center gap-2 px-4 py-2.5 text-sm text-gold hover:text-gold-light hover:bg-bg-overlay transition-colors font-semibold"
                >
                  <Settings size={14} />
                  Administration
                </Link>
              )}
            </div>
          )}
          <div className="border-t border-border py-1">
            <button
              type="button"
              onClick={() => void signOut({ callbackUrl: "/" })}
              className="flex items-center gap-2 w-full px-4 py-2.5 text-sm text-text-secondary hover:text-red-light hover:bg-bg-overlay transition-colors"
            >
              <LogOut size={14} />
              Déconnexion
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
