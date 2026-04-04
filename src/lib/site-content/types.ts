// ─── CMS Site Content — Types ──────────────────────────────────────────────
// Définit la structure de chaque page éditable.
// Les valeurs par défaut sont dans defaults.ts.

export interface StatItem {
  label: string;
  value: string;
}

export interface InfoItem {
  title: string;
  description: string;
}

// ── Home ──────────────────────────────────────────────────────────────────────
export interface HomeContent {
  hero: {
    eyebrow: string;
    headline: string;
    subheadline: string;
    /** URL de l'image de fond du hero (chemin /images/... ou URL externe) */
    backgroundImage?: string;
  };
  intro: {
    eyebrow: string;
    headline: string;
    body: string[]; // paragraphes
  };
  stats: StatItem[];
  why: {
    headline: string;
    items: InfoItem[];
  };
  activitiesPreview: {
    headline: string;
    description: string;
  };
  recruitmentTeaser: {
    eyebrow: string;
    headline: string;
    body: string;
  };
}

// ── Corporation ───────────────────────────────────────────────────────────────
export interface CorporationContent {
  intro: {
    eyebrow: string;
    headline: string;
    body: string[];
  };
  values: {
    headline: string;
    items: InfoItem[];
  };
  expectations: {
    fromUs: { headline: string; items: string[] };
    fromYou: { headline: string; items: string[] };
  };
}

// ── Recruitment ───────────────────────────────────────────────────────────────
export interface RecruitmentProfile {
  title: string;
  description: string;
  traits: string[];
}

export interface RecruitmentStep {
  number: number;
  title: string;
  description: string;
  duration: string;
}

export interface RecruitmentContent {
  intro: {
    eyebrow: string;
    headline: string;
    body: string;
  };
  wantedProfiles: RecruitmentProfile[];
  notAdaptedProfiles: RecruitmentProfile[];
  requirements: {
    headline: string;
    items: string[];
  };
  steps: RecruitmentStep[];
}

// ── FAQ ───────────────────────────────────────────────────────────────────────
export interface FaqItem {
  id: string;
  category: string;
  question: string;
  answer: string;
}

// ── Activities ────────────────────────────────────────────────────────────────
export type ActivityCategory = "pvp" | "pve" | "exploration" | "industry" | "collective";

export interface ActivityItem {
  id: string;
  name: string;
  category: ActivityCategory | string; // string fallback for unknown categories
  icon: string;
  description: string;
  tags: string[];
}

// ── Contact ───────────────────────────────────────────────────────────────────
export interface ContactChannel {
  id: string;
  title: string;
  description: string;
  detail: string;
  ctaLabel?: string;
  ctaHref?: string;
  ctaExternal?: boolean;
}

export interface ContactContent {
  intro: {
    eyebrow: string;
    headline: string;
    body: string;
  };
  channels: ContactChannel[];
  availability: string;
  formNote: string;
}

// ── Page registry ─────────────────────────────────────────────────────────────
export type PageKey =
  | "home"
  | "corporation"
  | "recruitment"
  | "faq"
  | "activities"
  | "contact";

export type ContentByPage = {
  home: HomeContent;
  corporation: CorporationContent;
  recruitment: RecruitmentContent;
  faq: FaqItem[];
  activities: ActivityItem[];
  contact: ContactContent;
};
