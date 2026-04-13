"use client";

import DOMPurify from "isomorphic-dompurify";
import { cn } from "@/lib/utils/cn";
import { useEffect, useRef } from "react";

interface Props {
  html: string;
  className?: string;
}

/**
 * Whitelist stricte des balises et attributs autorises.
 * Bloque les event handlers (onclick, onerror…), les iframes, scripts, etc.
 */
const PURIFY_CONFIG = {
  ALLOWED_TAGS: [
    "p", "br", "strong", "em", "u", "s", "del",
    "h1", "h2", "h3", "h4",
    "ul", "ol", "li",
    "blockquote", "pre", "code",
    "a", "img",
    "table", "thead", "tbody", "tr", "th", "td",
    "hr", "span", "div", "sub", "sup",
  ],
  ALLOWED_ATTR: [
    "href", "target", "rel", "src", "alt", "width", "height",
    "class", "id", "colspan", "rowspan",
    "data-id", "data-character-id", "data-label", "data-type",
  ],
  ALLOW_DATA_ATTR: false,
};

/**
 * Affiche du contenu HTML stocke depuis le RichTextEditor (Tiptap).
 * Le HTML est sanitise via DOMPurify avant rendu pour empecher toute injection XSS.
 */
/**
 * Post-process: enrichit les <span class="eve-mention"> avec portrait + lien fiche.
 */
function hydrateMentions(container: HTMLElement) {
  const mentions = container.querySelectorAll<HTMLSpanElement>("span.eve-mention");
  mentions.forEach((el) => {
    if (el.dataset.hydrated) return;
    el.dataset.hydrated = "1";

    const charId = el.dataset.characterId;
    const memberId = el.dataset.id;
    const label = el.dataset.label ?? el.textContent?.replace(/^@/, "") ?? "";

    // Build portrait + name
    el.innerHTML = "";

    if (charId) {
      const img = document.createElement("img");
      img.src = `https://images.evetech.net/characters/${charId}/portrait?size=32`;
      img.alt = label;
      img.width = 20;
      img.height = 20;
      img.className = "eve-mention-portrait";
      el.appendChild(img);
    }

    const nameSpan = document.createElement("span");
    nameSpan.textContent = label;
    el.appendChild(nameSpan);

    // Wrap in link to member profile
    if (memberId) {
      el.style.cursor = "pointer";
      el.addEventListener("click", () => {
        window.location.href = `/membre/annuaire#${memberId}`;
      });
    }
  });
}

export function RichTextContent({ html, className }: Props) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (ref.current) hydrateMentions(ref.current);
  }, [html]);

  if (!html || html === "<p></p>") {
    return null;
  }

  const clean = DOMPurify.sanitize(html, PURIFY_CONFIG);

  return (
    <div
      ref={ref}
      className={cn("prose-eve", className)}
      dangerouslySetInnerHTML={{ __html: clean }}
    />
  );
}
