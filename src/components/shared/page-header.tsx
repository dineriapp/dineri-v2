import { SectionTag } from "@/components/ui/ui-kit/Eyebrow";
import { HeadlineToken, RichHeadline } from "@/components/ui/ui-kit/RichHeadline";
import { cn } from "@/lib/utils";

interface PageHeaderProps {
    number: string;
    label: string;
    headline: readonly HeadlineToken[];
    description?: string;
    richClassName?: string;
}

export const PageHeader = ({
    number,
    label,
    headline,
    description,
    richClassName
}: PageHeaderProps) => (
    <section className="relative overflow-hidden border-b border-foreground/5">
        <div className="bg-grid pointer-events-none absolute inset-0 opacity-[0.5]" />
        <div className="pointer-events-none absolute -left-32 top-0 h-105 w-105 rounded-full bg-lime/10 blur-[120px]" />

        <div className="relative mx-auto max-w-7xl px-6 pb-16 pt-20 lg:px-8 lg:pb-24 lg:pt-28">
            <SectionTag number={number} label={label} />
            <h1 className={cn("font-inter-tight mt-5 text-balance text-4xl font-bold leading-none tracking-tight sm:text-5xl  lg:text-[64px]", richClassName)}>
                <RichHeadline tokens={headline} />
            </h1>
            {description && (
                <p className="mt-6 max-w-2xl text-base leading-relaxed text-muted-foreground sm:text-lg">
                    {description}
                </p>
            )}
        </div>
    </section>
);
