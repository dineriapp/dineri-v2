import { ReactNode } from "react";
import { HeadlineToken } from "../ui/ui-kit/RichHeadline";
import { PageHeader } from "./page-header";

interface LegalShellProps {
    /** Document title (browser tab + meta). */
    title: string;
    /** Meta description. */
    description: string;
    /** Header eyebrow number, e.g. "L1". */
    number: string;
    /** Header eyebrow label, e.g. "Legal". */
    label: string;
    /** Hero headline tokens. */
    headline: readonly HeadlineToken[];
    /** Short subhead under the hero headline. */
    intro: string;
    /** "Last updated" date string. */
    lastUpdated: string;
    /** Email or short contact line shown in the side rail. */
    contact?: string;
    /** Numbered <LegalSection>s. */
    children: ReactNode;
}

/** Shared layout for Terms / Privacy / Cookies. */
export const LegalShell = ({
    title,
    number,
    label,
    headline,
    intro,
    lastUpdated,
    contact = "info@dineri.app",
    children,
}: LegalShellProps) => (
    <>
        <PageHeader
            number={number}
            label={label}
            headline={headline}
            description={intro}
        />

        <section className="relative">
            <div className="mx-auto max-w-7xl px-6 py-16 lg:px-8 lg:py-24">
                <div className="grid gap-12 lg:grid-cols-[260px_1fr]">
                    {/* Side rail */}
                    <aside className="lg:sticky lg:top-24 lg:self-start">
                        <div className="rounded-2xl border border-foreground/5 bg-surface-1 p-5">
                            <div className="font-jetbrains-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
                                Document
                            </div>
                            <div className="font-inter-tight mt-2 text-base font-semibold">
                                {title}
                            </div>
                            <div className="mt-4 flex items-center gap-2 font-jetbrains-mono text-[11px] text-muted-foreground">
                                <span className="h-1.5 w-1.5 rounded-full bg-lime" />
                                Last updated · {lastUpdated}
                            </div>
                            <div className="mt-5 border-t border-foreground/5 pt-4">
                                <div className="font-jetbrains-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
                                    Contact
                                </div>
                                <a
                                    href={`mailto:${contact}`}
                                    className="mt-2 block text-sm text-foreground/90 hover:text-lime"
                                >
                                    {contact}
                                </a>
                            </div>
                        </div>
                    </aside>

                    {/* Body */}
                    <article className="rounded-2xl border border-foreground/5 bg-surface-1/50 p-6 sm:p-10">
                        {children}
                    </article>
                </div>
            </div>
        </section>
    </>
);
