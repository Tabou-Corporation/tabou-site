import { cn } from "@/lib/utils/cn";
import type { StatItem } from "@/types/content";

interface StatBlockProps {
  stats: StatItem[];
  className?: string;
}

export function StatBlock({ stats, className }: StatBlockProps) {
  return (
    <div
      className={cn(
        "grid gap-px",
        stats.length === 2 && "grid-cols-2",
        stats.length === 3 && "grid-cols-3",
        stats.length === 4 && "grid-cols-2 sm:grid-cols-4",
        "bg-border rounded-md overflow-hidden border border-border",
        className
      )}
    >
      {stats.map((stat) => (
        <div
          key={stat.label}
          className="bg-bg-surface px-6 py-8 flex flex-col items-center text-center"
        >
          <div className="flex items-baseline gap-1">
            <span className="font-display font-bold text-3xl sm:text-4xl text-gold">
              {stat.value}
            </span>
            {stat.unit && (
              <span className="text-gold-dark text-lg font-semibold">{stat.unit}</span>
            )}
          </div>
          <span className="text-text-muted text-xs font-medium tracking-widest uppercase mt-1">
            {stat.label}
          </span>
        </div>
      ))}
    </div>
  );
}
