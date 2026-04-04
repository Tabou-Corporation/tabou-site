import { z } from "zod";

// ─── Activités ────────────────────────────────────────────────────────────────

export const ActivityCategorySchema = z.enum([
  "pvp",
  "pve",
  "exploration",
  "industry",
  "collective",
]);

export const ActivitySchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  category: ActivityCategorySchema,
  description: z.string().min(1),
  /** Nom d'une icône Lucide React valide */
  icon: z.string().min(1),
  tags: z.array(z.string()).optional(),
});

export type ActivityData = z.infer<typeof ActivitySchema>;

// ─── FAQ ──────────────────────────────────────────────────────────────────────

export const FAQItemSchema = z.object({
  id: z.string().min(1),
  question: z.string().min(1),
  answer: z.string().min(1),
  category: z.string().min(1),
});

export type FAQItemData = z.infer<typeof FAQItemSchema>;

// ─── Étapes de recrutement ────────────────────────────────────────────────────

export const RecruitmentStepSchema = z.object({
  number: z.number().int().positive(),
  title: z.string().min(1),
  description: z.string().min(1),
  duration: z.string().optional(),
});

export type RecruitmentStepData = z.infer<typeof RecruitmentStepSchema>;

// ─── Collections ──────────────────────────────────────────────────────────────

export const ActivitiesCollectionSchema = z.array(ActivitySchema);
export const FAQCollectionSchema = z.array(FAQItemSchema);
export const RecruitmentStepsCollectionSchema = z.array(RecruitmentStepSchema);
