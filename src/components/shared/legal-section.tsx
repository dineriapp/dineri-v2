import { ReactNode } from "react";

interface LegalSectionProps {
    num: string;
    title: string;
    children: ReactNode;
}

/** Numbered legal/policy section with the Dark Ops technical styling. */
export const LegalSection = ({ num, title, children }: LegalSectionProps) => (
    <section className="border-t border-foreground/5 py-10 first:border-t-0 first:pt-0">
        <div className="grid gap-6 lg:grid-cols-[140px_1fr]">
            <div className="font-jetbrains-mono text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
                <span className="text-lime">§</span> {num}
            </div>
            <div>
                <h2 className="font-inter-tight text-2xl font-semibold tracking-tight sm:text-3xl">
                    {title}
                </h2>
                <div className="prose-legal mt-4 space-y-4 text-[15px] leading-relaxed text-foreground/80">
                    {children}
                </div>
            </div>
        </div>
    </section>
);
