import { cn } from "@/lib/utils/cn";
import type { RecruitmentStep } from "@/types/content";

interface RecruitmentStepCardProps {
  step: RecruitmentStep;
  isLast?: boolean;
  className?: string;
}

export function RecruitmentStepCard({ step, isLast = false, className }: RecruitmentStepCardProps) {
  return (
    <div className={cn("relative flex gap-6", className)}>
      {/* Ligne verticale de connexion */}
      {!isLast && (
        <div
          aria-hidden
          className="absolute left-5 top-12 bottom-0 w-px bg-gradient-to-b from-gold/30 to-transparent"
        />
      )}

      {/* Numéro */}
      <div className="flex-shrink-0 w-10 h-10 rounded-full border border-gold/40 bg-bg-surface flex items-center justify-center z-10">
        <span className="font-display font-bold text-sm text-gold">
          {step.number}
        </span>
      </div>

      {/* Contenu */}
      <div className="pb-10 flex-1">
        <div className="flex items-start justify-between gap-4 mb-2">
          <h3 className="font-display font-semibold text-lg text-text-primary leading-snug">
            {step.title}
          </h3>
          {step.duration && (
            <span className="flex-shrink-0 text-xs text-text-muted font-mono mt-1">
              {step.duration}
            </span>
          )}
        </div>
        <p className="text-text-secondary text-sm leading-relaxed">
          {step.description}
        </p>
      </div>
    </div>
  );
}
