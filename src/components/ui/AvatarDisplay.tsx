import Image from "next/image";
import { cn } from "@/lib/utils/cn";

interface AvatarDisplayProps {
  image?: string | null;
  name?: string | null;
  /** Taille en pixels — appliquée à width/height (Image) et style inline (fallback) */
  size?: number;
  /** Épaisseur de la bordure : "thin" = border (1px), "thick" = border-2 (2px) */
  border?: "thin" | "thick";
  className?: string;
}

/**
 * Avatar réutilisable : portrait EVE si disponible, sinon initiale sur fond sombre.
 * Remplace le pattern if/else image dupliqué dans 4 pages staff.
 */
export function AvatarDisplay({
  image,
  name,
  size = 40,
  border = "thin",
  className,
}: AvatarDisplayProps) {
  const borderClass = border === "thick" ? "border-2" : "border";
  const initial = (name ?? "?")[0]?.toUpperCase() ?? "?";
  const textSizeClass = size >= 56 ? "text-xl" : size >= 40 ? "text-sm" : "text-xs";

  if (image) {
    return (
      <Image
        src={image}
        alt={name ?? "Pilote"}
        width={size}
        height={size}
        className={cn(
          `rounded-full ${borderClass} border-gold/20 flex-shrink-0`,
          className
        )}
        unoptimized
      />
    );
  }

  return (
    <div
      className={cn(
        `rounded-full ${borderClass} border-border bg-bg-elevated`,
        "flex items-center justify-center flex-shrink-0",
        className
      )}
      style={{ width: size, height: size }}
    >
      <span className={cn("text-text-muted font-display font-bold", textSizeClass)}>
        {initial}
      </span>
    </div>
  );
}
