"use client";

export function ScrollDownButton() {
  return (
    <button
      onClick={() => window.scrollBy({ top: window.innerHeight * 0.85, behavior: "smooth" })}
      className="animate-bounce-slow flex flex-col items-center gap-2 cursor-pointer group"
      aria-label="Découvrir le site"
    >
      <span className="text-gold animate-pulse text-sm font-semibold tracking-extra-wide uppercase group-hover:opacity-70 transition-opacity">
        Découvrir
      </span>
      <svg
        width="28"
        height="28"
        viewBox="0 0 20 20"
        fill="none"
        className="text-gold animate-pulse group-hover:opacity-70 transition-opacity"
      >
        <path
          d="M10 4v10m0 0l-4-4m4 4l4-4"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </button>
  );
}
