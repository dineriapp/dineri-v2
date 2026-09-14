"use client";
import { useEffect, useRef, useState } from "react";
import { Check, ChevronDown, Languages } from "lucide-react";
import { cn } from "@/lib/utils";
import { useLocale } from "next-intl";
import { changeLocaleAction } from "@/server/actions/change-locale";

export const LANGUAGES = [
  { code: "en", label: "English" },
  { code: "de", label: "German" },
  { code: "fr", label: "French" },
  { code: "nl", label: "Dutch" },
  { code: "es", label: "Spanish" },
  { code: "it", label: "Italian" },
] as const;

export type LanguageCode = (typeof LANGUAGES)[number]["code"];

interface LanguageSwitcherProps {
  variant?: "light" | "dark";
  className?: string;
}

export const LanguageSwitcher = ({ variant = "light", className }: LanguageSwitcherProps) => {
  const locale = useLocale();
  const [open, setOpen] = useState(false);
  const wrapRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (!wrapRef.current?.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", onClick);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onClick);
      document.removeEventListener("keydown", onKey);
    };
  }, []);

  const isDark = variant === "dark";

  return (
    <div ref={wrapRef} className={cn("relative", className)}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-label="Switch language"
        className={cn(
          "inline-flex h-9 items-center cursor-pointer gap-1.5 rounded-full border px-3 text-xs transition",
          isDark
            ? "border-white/10 bg-surface-1 text-foreground hover:border-white/20"
            : "border-foreground/10 text-muted-foreground hover:border-foreground/20 hover:text-foreground",
        )}
      >
        <Languages className="h-3.5 w-3.5 opacity-70" />
        <span className="font-jetbrains-mono text-[11px]">{locale.toUpperCase()}</span>
        <ChevronDown className={cn("h-3 w-3 transition-transform", open && "rotate-180")} />
      </button>

      {open && (
        <ul
          role="listbox"
          className={cn(
            "absolute right-0 z-50 mt-2 w-44 overflow-hidden rounded-xl border p-1 shadow-lg animate-fade-in",
            isDark ? "border-white/10 bg-surface-1" : "border-foreground/10 bg-background",
          )}
        >
          {LANGUAGES.map((lang) => {
            const active = lang.code === locale;
            return (
              <li key={lang.code}>
                <button
                  type="button"
                  role="option"
                  aria-selected={active}
                  onClick={() => {
                    changeLocaleAction(lang.code);
                    setOpen(false);
                  }}
                  className={cn(
                    "flex w-full items-center cursor-pointer justify-between rounded-md px-2.5 py-2 text-sm transition",
                    active
                      ? isDark
                        ? "bg-white/5 text-foreground"
                        : "bg-foreground/5 text-foreground"
                      : "text-muted-foreground hover:bg-foreground/5 hover:text-foreground",
                  )}
                >
                  <span className="flex items-center gap-2">
                    <span className="font-jetbrains-mono text-[10px] opacity-60">{lang.code}</span>
                    <span>{lang.label}</span>
                  </span>
                  {active && <Check className="h-3.5 w-3.5 text-lime" />}
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
};
