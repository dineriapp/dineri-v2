"use client"
import { ReactNode } from "react";
import { useReveal } from "@/hooks/use-reveal";
import { cn } from "@/lib/utils";

interface RevealProps {
  children: ReactNode;
  className?: string;
  /** Delay in ms before the reveal transition starts. */
  delay?: number;
  as?: "div" | "section" | "article" | "li" | "span";
}

/** Wraps content with a subtle fade + lift on first scroll-into-view. */
export const Reveal = ({
  children,
  className,
  delay = 0,
  as: Tag = "div",
}: RevealProps) => {
  const { ref, revealed } = useReveal<HTMLDivElement>();
  return (
    <Tag
      ref={ref as never}
      style={delay ? { transitionDelay: `${delay}ms` } : undefined}
      className={cn("reveal", revealed && "is-revealed", className)}
    >
      {children}
    </Tag>
  );
};
