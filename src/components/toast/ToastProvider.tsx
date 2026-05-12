"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import Link from "next/link";

/**
 * Lightweight in-house toast system. No deps; the whole API is one hook
 * (`useToast`) that returns a `push(...)` function. Toasts auto-dismiss
 * after `duration` ms (default 6000) and are stacked top-right on desktop,
 * bottom-center on mobile.
 *
 * Variants: brand (default), success, warning, danger.
 * Optional `action` renders an inline `<Link>` button on the right.
 */

export type ToastVariant = "brand" | "success" | "warning" | "danger";

export interface ToastInput {
  title: string;
  description?: string;
  variant?: ToastVariant;
  duration?: number;
  action?: {
    label: string;
    href: string;
  };
}

interface Toast extends ToastInput {
  id: number;
}

interface ToastContextValue {
  push: (toast: ToastInput) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

export function useToast(): ToastContextValue {
  const ctx = useContext(ToastContext);
  if (!ctx) {
    // No-op when not under a provider so consumers don't crash in tests
    // / storybook. The real provider lives at the root layout.
    return { push: () => {} };
  }
  return ctx;
}

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const nextId = useRef(1);

  const dismiss = useCallback((id: number) => {
    setToasts((cur) => cur.filter((t) => t.id !== id));
  }, []);

  const push = useCallback(
    (toast: ToastInput) => {
      const id = nextId.current++;
      const duration = toast.duration ?? 6000;
      setToasts((cur) => [...cur, { ...toast, id }]);
      if (duration > 0) {
        window.setTimeout(() => dismiss(id), duration);
      }
    },
    [dismiss],
  );

  const value = useMemo(() => ({ push }), [push]);

  return (
    <ToastContext.Provider value={value}>
      {children}
      <Toaster toasts={toasts} onDismiss={dismiss} />
    </ToastContext.Provider>
  );
}

function Toaster({
  toasts,
  onDismiss,
}: {
  toasts: Toast[];
  onDismiss: (id: number) => void;
}) {
  if (toasts.length === 0) return null;
  return (
    <div
      aria-live="polite"
      aria-atomic="true"
      className="pointer-events-none fixed inset-x-0 bottom-4 sm:inset-x-auto sm:right-4 sm:top-20 sm:bottom-auto z-[60] flex flex-col gap-2 px-4 sm:px-0 sm:items-end"
    >
      {toasts.map((t) => (
        <ToastCard key={t.id} toast={t} onDismiss={() => onDismiss(t.id)} />
      ))}
    </div>
  );
}

function ToastCard({
  toast,
  onDismiss,
}: {
  toast: Toast;
  onDismiss: () => void;
}) {
  // Slide-in animation
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    // Defer one frame so the transition fires
    const id = requestAnimationFrame(() => setMounted(true));
    return () => cancelAnimationFrame(id);
  }, []);

  const variant: ToastVariant = toast.variant ?? "brand";
  const tone =
    variant === "success"
      ? "border-success/30 bg-success-soft"
      : variant === "warning"
        ? "border-warning/30 bg-warning-soft"
        : variant === "danger"
          ? "border-danger/30 bg-danger-soft"
          : "border-brand/30 bg-brand-soft";
  const icon =
    variant === "success"
      ? "✓"
      : variant === "warning"
        ? "!"
        : variant === "danger"
          ? "×"
          : "•";
  const iconColor =
    variant === "success"
      ? "text-success"
      : variant === "warning"
        ? "text-warning"
        : variant === "danger"
          ? "text-danger"
          : "text-brand";

  return (
    <div
      role="status"
      className={
        "pointer-events-auto w-full sm:max-w-sm rounded-xl border bg-paper px-4 py-3 shadow-[var(--shadow-lifted)] transition-all duration-200 " +
        tone +
        " " +
        (mounted
          ? "opacity-100 translate-y-0 sm:translate-x-0"
          : "opacity-0 translate-y-2 sm:translate-y-0 sm:translate-x-3")
      }
    >
      <div className="flex items-start gap-3">
        <div
          className={
            "shrink-0 w-6 h-6 rounded-full flex items-center justify-center text-sm font-semibold " +
            iconColor +
            " bg-paper"
          }
          aria-hidden
        >
          {icon}
        </div>
        <div className="flex-1 min-w-0">
          <div className="text-sm font-medium text-ink leading-snug">
            {toast.title}
          </div>
          {toast.description && (
            <div className="text-xs text-ink-soft mt-0.5 leading-snug">
              {toast.description}
            </div>
          )}
          {toast.action && (
            <Link
              href={toast.action.href}
              onClick={onDismiss}
              className="inline-block mt-2 text-xs font-medium text-brand hover:text-brand-hover underline-offset-2 hover:underline"
            >
              {toast.action.label} →
            </Link>
          )}
        </div>
        <button
          type="button"
          onClick={onDismiss}
          aria-label="Dismiss"
          className="shrink-0 text-ink-faint hover:text-ink transition-colors duration-75 text-lg leading-none -mt-0.5"
        >
          ×
        </button>
      </div>
    </div>
  );
}
