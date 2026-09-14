import { cn } from "@/lib/utils";

interface EyebrowProps {
  children: React.ReactNode;
  className?: string;
  classNameSpan?: string;
  withArrow?: boolean;
}

export const Eyebrow = ({ children, className, withArrow = true, classNameSpan }: EyebrowProps) => (
  <div
    className={cn(
      "inline-flex items-start gap-2 font-jetbrains-mono tracking-[0.12rem] uppercase text-[11px] text-muted-foreground border rounded-2xl px-4 border-white/50 py-1",
      className,
    )}
  >
    {withArrow && <span className="text-white">▸</span>}
    <span className={cn(classNameSpan)}>{children}</span>
  </div>
);

interface SectionTagProps {
  number: string;
  label: string;
  className?: string;
}

export const SectionTag = ({ number, label, className }: SectionTagProps) => (
  <div
    className={cn(
      "font-jetbrains-mono text-[11px] tracking-[0.12rem] uppercase text-muted-foreground border border-white/50 rounded-2xl px-4 py-1 inline-block",
      className,
    )}
  >
    /{number} - {label}
  </div>
);
