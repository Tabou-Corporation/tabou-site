"use client";

import {
  createContext,
  useContext,
  useState,
  useCallback,
  type ReactNode,
} from "react";
import { motion, AnimatePresence } from "framer-motion";
import { CheckCircle, XCircle, Info, X } from "lucide-react";
import { cn } from "@/lib/utils/cn";

// ── Types ──────────────────────────────────────────────────────────────────

export type ToastType = "success" | "error" | "info";

interface Toast {
  id: string;
  message: string;
  type: ToastType;
}

interface ToastContextValue {
  addToast: (message: string, type?: ToastType) => void;
}

// ── Context ────────────────────────────────────────────────────────────────

const ToastContext = createContext<ToastContextValue>({ addToast: () => {} });

export function useToast() {
  return useContext(ToastContext);
}

// ── Styles par type ────────────────────────────────────────────────────────

const ICON_MAP = {
  success: CheckCircle,
  error:   XCircle,
  info:    Info,
} as const;

const COLOR_MAP: Record<ToastType, string> = {
  success: "border-green-400/40 [&_svg:first-child]:text-green-400",
  error:   "border-red-400/40   [&_svg:first-child]:text-red-400",
  info:    "border-gold/40      [&_svg:first-child]:text-gold",
};

// ── Provider ───────────────────────────────────────────────────────────────

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const addToast = useCallback((message: string, type: ToastType = "success") => {
    const id = Math.random().toString(36).slice(2, 9);
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4200);
  }, []);

  const remove = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  return (
    <ToastContext.Provider value={{ addToast }}>
      {children}

      {/* ── Stack ── */}
      <div
        aria-live="polite"
        aria-label="Notifications"
        className="fixed bottom-6 right-6 z-[300] flex flex-col gap-2 pointer-events-none"
      >
        <AnimatePresence mode="popLayout">
          {toasts.map((toast) => {
            const Icon = ICON_MAP[toast.type];
            return (
              <motion.div
                key={toast.id}
                layout
                initial={{ opacity: 0, x: 48, scale: 0.94 }}
                animate={{ opacity: 1, x: 0,  scale: 1 }}
                exit={{ opacity: 0, x: 48,    scale: 0.94 }}
                transition={{ type: "spring", stiffness: 420, damping: 32 }}
                role="status"
                className={cn(
                  "pointer-events-auto flex items-center gap-3 px-4 py-3 rounded",
                  "bg-bg-elevated border shadow-panel-lg",
                  "min-w-[260px] max-w-sm",
                  COLOR_MAP[toast.type]
                )}
              >
                <Icon size={15} className="flex-shrink-0" />
                <p className="flex-1 text-sm text-text-primary leading-snug">
                  {toast.message}
                </p>
                <button
                  onClick={() => remove(toast.id)}
                  aria-label="Fermer la notification"
                  className="text-text-muted hover:text-text-primary transition-colors flex-shrink-0 ml-1"
                >
                  <X size={13} />
                </button>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>
    </ToastContext.Provider>
  );
}
