import { cn } from "@/lib/utils";
import { ButtonHTMLAttributes, forwardRef } from "react";

type Variant = "primary" | "outline" | "ghost";
type Size = "sm" | "md" | "lg";

interface PillButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
}

const variants: Record<Variant, string> = {
  primary:
    "bg-white text-[#0A0A0A] hover:bg-white/90 shadow-[0_0_0_1px_hsl(0_0%_100%_/_0.6),0_10px_30px_-10px_hsl(0_0%_100%_/_0.5)]",
  outline:
    "border border-foreground/15 text-foreground hover:bg-foreground/5 hover:border-foreground/25",
  ghost: "text-muted-foreground hover:text-foreground",
};

const sizes: Record<Size, string> = {
  sm: "h-9 px-4 text-sm",
  md: "h-11 px-5 text-sm",
  lg: "h-12 px-6 text-base",
};

export const PillButton = forwardRef<HTMLButtonElement, PillButtonProps>(
  ({ className, variant = "primary", size = "md", ...props }, ref) => (
    <button
      ref={ref}
      className={cn(
        "inline-flex items-center cursor-pointer justify-center gap-2 rounded-full font-medium tracking-tight transition-all duration-200 hover:-translate-y-0.5 active:translate-y-0 active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:opacity-50 disabled:pointer-events-none motion-reduce:hover:translate-y-0 motion-reduce:active:scale-100",
        variants[variant],
        sizes[size],
        className,
      )}
      {...props}
    />
  ),
);
PillButton.displayName = "PillButton";
