"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { Menu, X } from "lucide-react";
import { useSession } from "next-auth/react";
import { cn } from "@/lib/utils/cn";
import { NavLink } from "./NavLink";
import { Button } from "@/components/ui/Button";
import { UserMenu } from "./UserMenu";
import { NAVIGATION } from "@/config/navigation";
import { CORPORATIONS } from "@/lib/constants/corporations";

export function MainNav() {
  const [isOpen, setIsOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const { data: session } = useSession();

  useEffect(() => {
    const handler = () => setScrolled(window.scrollY > 12);
    window.addEventListener("scroll", handler, { passive: true });
    return () => window.removeEventListener("scroll", handler);
  }, []);

  // Fermer le menu sur resize > md
  useEffect(() => {
    const handler = () => {
      if (window.innerWidth >= 768) setIsOpen(false);
    };
    window.addEventListener("resize", handler);
    return () => window.removeEventListener("resize", handler);
  }, []);

  // Bloquer le scroll quand le menu mobile est ouvert
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => { document.body.style.overflow = ""; };
  }, [isOpen]);

  const discordLink = NAVIGATION.utility.find((u) => u.label === "Discord");

  return (
    <>
      <nav
        className={cn(
          "fixed top-0 left-0 right-0 z-50 transition-all duration-[350ms]",
          scrolled
            ? "bg-bg-deep/95 backdrop-blur-md border-b border-border shadow-panel"
            : "bg-transparent border-b border-transparent"
        )}
      >
        <div className="mx-auto px-4 sm:px-6 lg:px-8 max-w-7xl">
          <div className="flex items-center justify-between h-20">
            {/* Logo */}
            <Link
              href="/"
              className="flex items-center gap-3 group"
              aria-label="Tabou — Accueil"
            >
              <Image
                src={CORPORATIONS.tabou.logoUrl(128)}
                alt="Logo Tabou"
                width={56}
                height={56}
                className="rounded-sm opacity-90 group-hover:opacity-100 transition-opacity duration-[180ms]"
                priority
              />
              <div className="flex flex-col leading-none">
                <span className="font-display font-bold text-xl sm:text-2xl text-text-primary tracking-widest group-hover:text-gold transition-colors duration-[180ms]">
                  TABOU
                </span>
              </div>
            </Link>

            {/* Navigation desktop */}
            <div className="hidden md:flex items-center gap-8">
              {NAVIGATION.main
                .filter((item) => item.visibility === "public")
                .map((item) => (
                  <NavLink
                    key={item.href}
                    href={item.href}
                    label={item.label}
                    {...(item.exact !== undefined ? { exact: item.exact } : {})}
                    {...(item.external !== undefined ? { external: item.external } : {})}
                  />
                ))}
            </div>

            {/* Actions desktop */}
            <div className="hidden md:flex items-center gap-3">
              {session ? (
                <UserMenu />
              ) : (
                <>
                  {discordLink && (
                    <Button
                      as="a"
                      href={discordLink.href}
                      target="_blank"
                      rel="noopener noreferrer"
                      variant="secondary"
                      size="sm"
                    >
                      Discord
                    </Button>
                  )}
                  <Button as="a" href="/recrutement" variant="primary" size="sm">
                    Postuler
                  </Button>
                  <Button as="a" href="/login" variant="ghost" size="sm">
                    Connexion
                  </Button>
                </>
              )}
            </div>

            {/* Bouton menu mobile */}
            <button
              type="button"
              aria-label={isOpen ? "Fermer le menu" : "Ouvrir le menu"}
              aria-expanded={isOpen}
              onClick={() => setIsOpen((v) => !v)}
              className="md:hidden flex items-center justify-center w-10 h-10 rounded text-text-secondary hover:text-text-primary hover:bg-bg-elevated transition-colors"
            >
              {isOpen ? <X size={20} /> : <Menu size={20} />}
            </button>
          </div>
        </div>
      </nav>

      {/* Menu mobile */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 md:hidden"
          onClick={() => setIsOpen(false)}
          aria-hidden
        />
      )}
      <div
        className={cn(
          "fixed top-20 left-0 right-0 z-40 md:hidden",
          "bg-bg-deep border-b border-border shadow-panel-lg",
          "transition-all duration-[350ms]",
          isOpen ? "opacity-100 translate-y-0" : "opacity-0 -translate-y-2 pointer-events-none"
        )}
      >
        <div className="px-4 py-6 space-y-1">
          {NAVIGATION.main
            .filter((item) => item.visibility === "public")
            .map((item) => (
              <NavLink
                key={item.href}
                href={item.href}
                label={item.label}
                {...(item.exact !== undefined ? { exact: item.exact } : {})}
                {...(item.external !== undefined ? { external: item.external } : {})}
                onClick={() => setIsOpen(false)}
                className="block py-3 text-base border-b border-border-subtle last:border-0"
              />
            ))}
          <div className="pt-4 flex flex-col gap-3">
            {discordLink && (
              <Button
                as="a"
                href={discordLink.href}
                target="_blank"
                rel="noopener noreferrer"
                variant="secondary"
                size="md"
                className="w-full"
              >
                Discord
              </Button>
            )}
            {session ? (
              <Button
                as="a"
                href="/membre"
                variant="primary"
                size="md"
                className="w-full"
                onClick={() => setIsOpen(false)}
              >
                Espace membre
              </Button>
            ) : (
              <>
                <Button
                  as="a"
                  href="/recrutement"
                  variant="primary"
                  size="md"
                  className="w-full"
                  onClick={() => setIsOpen(false)}
                >
                  Postuler
                </Button>
                <Button
                  as="a"
                  href="/login"
                  variant="ghost"
                  size="md"
                  className="w-full"
                  onClick={() => setIsOpen(false)}
                >
                  Connexion
                </Button>
              </>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
