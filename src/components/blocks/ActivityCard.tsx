import { cn } from "@/lib/utils/cn";
import { Badge } from "@/components/ui/Badge";
import type { Activity } from "@/types/content";
import {
  Crosshair, Eye, Navigation, Shield,
  Zap, Target, Compass, Globe,
  Factory, TrendingUp, Users, Radio,
} from "lucide-react";

const ICON_MAP: Record<string, React.ElementType> = {
  Crosshair, Eye, Navigation, Shield,
  Zap, Target, Compass, Globe,
  Factory, TrendingUp, Users, Radio,
};

const CATEGORY_COLORS = {
  pvp: "text-red-light",
  pve: "text-gold",
  exploration: "text-blue-400",
  industry: "text-emerald-400",
  collective: "text-text-secondary",
} as const;

interface ActivityCardProps {
  activity: Activity;
  className?: string;
}

export function ActivityCard({ activity, className }: ActivityCardProps) {
  const Icon = ICON_MAP[activity.icon] ?? Crosshair;
  const iconColor = CATEGORY_COLORS[activity.category];

  return (
    <div
      className={cn(
        "relative bg-bg-surface border border-border rounded-md",
        "p-6 space-y-4",
        "transition-all duration-[180ms]",
        "hover:border-border-accent hover:bg-bg-elevated",
        className
      )}
    >
      {/* Icon */}
      <div className={cn("w-10 h-10 flex items-center justify-center", iconColor)}>
        <Icon size={24} />
      </div>

      {/* Content */}
      <div className="space-y-2">
        <h3 className="font-display font-semibold text-base text-text-primary leading-snug">
          {activity.name}
        </h3>
        <p className="text-text-secondary text-sm leading-relaxed">
          {activity.description}
        </p>
      </div>

      {/* Tags */}
      {activity.tags && activity.tags.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {activity.tags.map((tag) => (
            <Badge key={tag} variant="muted">
              {tag}
            </Badge>
          ))}
        </div>
      )}
    </div>
  );
}
