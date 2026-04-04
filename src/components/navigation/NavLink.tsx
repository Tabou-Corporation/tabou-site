"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils/cn";

interface NavLinkProps {
  href: string;
  label: string;
  exact?: boolean | undefined;
  external?: boolean | undefined;
  className?: string | undefined;
  onClick?: (() => void) | undefined;
}

export function NavLink({ href, label, exact = false, external = false, className, onClick }: NavLinkProps) {
  const pathname = usePathname();
  const isActive = exact ? pathname === href : pathname.startsWith(href) && href !== "/";
  const isHome = href === "/" && pathname === "/";
  const active = isActive || isHome;

  if (external) {
    return (
      <a
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        className={cn(
          "text-sm sm:text-lg font-medium tracking-wide transition-colors duration-[180ms]",
          "text-text-secondary hover:text-text-primary",
          className
        )}
        onClick={onClick}
      >
        {label}
      </a>
    );
  }

  return (
    <Link
      href={href}
      {...(onClick ? { onClick } : {})}
      className={cn(
        "relative text-sm sm:text-lg font-medium tracking-wide transition-colors duration-[180ms]",
        "after:absolute after:bottom-[-2px] after:left-0 after:h-px after:w-full",
        "after:transition-transform after:duration-[180ms] after:origin-left",
        active
          ? "text-gold after:bg-gold after:scale-x-100"
          : "text-text-secondary hover:text-text-primary after:bg-gold/60 after:scale-x-0 hover:after:scale-x-100",
        className
      )}
    >
      {label}
    </Link>
  );
}
