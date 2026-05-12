"use client";

import { useTheme } from "next-themes";
import { useEffect, useState } from "react";
import clsx from "clsx";

const OPTIONS: Array<{
  id: "system" | "light" | "dark";
  label: string;
  description: string;
}> = [
  { id: "system", label: "System", description: "Match device." },
  { id: "light", label: "Light", description: "Always light." },
  { id: "dark", label: "Dark", description: "Always dark." },
];

export function AppearanceSection() {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => setMounted(true), []);

  return (
    <section className="flex flex-col gap-2">
      <h2 className="font-display text-lg text-ink">Appearance</h2>
      <div className="grid grid-cols-3 gap-2 rounded-xl border border-edge bg-paper p-2">
        {OPTIONS.map((opt) => {
          const active = mounted && theme === opt.id;
          return (
            <button
              type="button"
              key={opt.id}
              onClick={() => setTheme(opt.id)}
              className={clsx(
                "flex flex-col items-start gap-0.5 px-3 py-2.5 rounded-lg text-left transition-colors duration-75",
                active
                  ? "bg-brand-soft ring-2 ring-brand text-ink"
                  : "hover:bg-paper-raised text-ink"
              )}
            >
              <span className="text-sm font-medium">{opt.label}</span>
              <span className="text-xs text-ink-faint">{opt.description}</span>
            </button>
          );
        })}
      </div>
    </section>
  );
}
