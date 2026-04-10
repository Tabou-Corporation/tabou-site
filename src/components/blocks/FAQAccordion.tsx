"use client";

import { useState } from "react";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils/cn";
import type { FAQItem } from "@/types/content";

interface FAQAccordionProps {
  items: FAQItem[];
  className?: string;
}

function AccordionItem({ item }: { item: FAQItem }) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="border-b border-border last:border-0">
      <button
        type="button"
        onClick={() => setIsOpen((v) => !v)}
        aria-expanded={isOpen}
        className={cn(
          "w-full flex items-center justify-between py-5 text-left",
          "group transition-colors duration-[180ms]",
          "hover:text-text-primary",
          isOpen ? "text-text-primary" : "text-text-secondary"
        )}
      >
        <span className="text-base font-medium pr-6 leading-snug">
          {item.question}
        </span>
        <ChevronDown
          size={18}
          className={cn(
            "flex-shrink-0 text-gold/60 transition-transform duration-[280ms]",
            isOpen && "rotate-180"
          )}
          aria-hidden
        />
      </button>

      <div
        className={cn(
          "overflow-hidden transition-all duration-[280ms]",
          isOpen ? "max-h-96 opacity-100" : "max-h-0 opacity-0"
        )}
      >
        <p className="text-text-secondary text-sm leading-relaxed pb-5">
          {item.answer}
        </p>
      </div>
    </div>
  );
}

export function FAQAccordion({ items, className }: FAQAccordionProps) {
  return (
    <div
      className={cn(
        "bg-bg-surface border border-border rounded-md",
        "px-6",
        className
      )}
    >
      {items.map((item) => (
        <AccordionItem key={item.id} item={item} />
      ))}
    </div>
  );
}

interface FAQGroupedProps {
  items: FAQItem[];
  categories: string[];
  className?: string;
}

export function FAQGrouped({ items, categories, className }: FAQGroupedProps) {
  return (
    <div className={cn("space-y-10", className)}>
      {categories.map((category) => {
        const categoryItems = items.filter((item) => item.category === category);
        if (categoryItems.length === 0) return null;

        return (
          <div key={category}>
            <h3 className="text-gold text-xs font-semibold tracking-extra-wide uppercase mb-4">
              {category}
            </h3>
            <FAQAccordion items={categoryItems} />
          </div>
        );
      })}
    </div>
  );
}
