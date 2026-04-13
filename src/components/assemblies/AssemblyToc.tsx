"use client";

import { useMemo } from "react";

interface TocEntry {
  id: string;
  text: string;
  level: number;
}

/**
 * Extrait les H2/H3 du HTML pour construire une table des matières.
 * Les ancres sont injectées dans le contenu via un effet DOM côté client.
 */
function extractHeadings(html: string): TocEntry[] {
  const regex = /<h([23])[^>]*>(.*?)<\/h[23]>/gi;
  const headings: TocEntry[] = [];
  let match;

  while ((match = regex.exec(html)) !== null) {
    const level = parseInt(match[1]!, 10);
    const text = (match[2] ?? "").replace(/<[^>]*>/g, "").trim();
    if (!text) continue;

    const id = `toc-${text
      .toLowerCase()
      .replace(/[^a-z0-9àâäéèêëïîôùûüÿç]+/gi, "-")
      .replace(/(^-|-$)/g, "")}`;

    headings.push({ id, text, level });
  }

  return headings;
}

export function AssemblyToc({ html }: { html: string }) {
  const headings = useMemo(() => extractHeadings(html), [html]);

  // Inject anchor IDs into headings in the DOM
  useMemo(() => {
    if (typeof window === "undefined") return;

    // Schedule after render so the content is in the DOM
    setTimeout(() => {
      const container = document.querySelector(".prose-eve");
      if (!container) return;

      const hEls = container.querySelectorAll("h2, h3");
      let idx = 0;
      hEls.forEach((el) => {
        const heading = headings[idx];
        if (heading && el.textContent?.trim() === heading.text) {
          el.id = heading.id;
          idx++;
        }
      });
    }, 100);
  }, [headings]);

  if (headings.length < 2) return null;

  return (
    <nav className="assembly-toc mb-6">
      <p className="assembly-toc-title">Sommaire</p>
      <ol>
        {headings.map((h) => (
          <li key={h.id} className={h.level === 3 ? "toc-h3" : ""}>
            <a href={`#${h.id}`} onClick={(e) => {
              e.preventDefault();
              document.getElementById(h.id)?.scrollIntoView({ behavior: "smooth", block: "start" });
            }}>
              {h.text}
            </a>
          </li>
        ))}
      </ol>
    </nav>
  );
}
