import { cn } from "@/lib/utils/cn";

interface InfoItem {
  title: string;
  description: string;
}

interface InfoPanelProps {
  items: InfoItem[];
  columns?: 2 | 3 | 4;
  className?: string;
  /** Affiche un numéro devant chaque item */
  numbered?: boolean;
  /** Affiche une bordure gauche gold */
  accent?: boolean;
}

export function InfoPanel({ items, columns = 3, className, numbered = false, accent = false }: InfoPanelProps) {
  const gridCols = {
    2: "grid-cols-1 sm:grid-cols-2",
    3: "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3",
    4: "grid-cols-1 sm:grid-cols-2 lg:grid-cols-4",
  } as const;

  return (
    <div className={cn("grid gap-6", gridCols[columns], className)}>
      {items.map((item, i) => (
        <div
          key={item.title}
          className={cn(
            "space-y-3",
            accent && "pl-4 border-l-2 border-l-gold/40"
          )}
        >
          {numbered && (
            <span className="text-gold/60 text-xs font-mono font-semibold tracking-widest">
              {String(i + 1).padStart(2, "0")}
            </span>
          )}
          <h3 className="font-display font-semibold text-lg text-text-primary">
            {item.title}
          </h3>
          <p className="text-text-secondary text-sm leading-relaxed">
            {item.description}
          </p>
        </div>
      ))}
    </div>
  );
}
