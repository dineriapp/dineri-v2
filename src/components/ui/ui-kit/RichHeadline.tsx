export type HeadlineToken =
  { plain: string } | { muted: string } | { lime: string } | { white: string };

interface RichHeadlineProps {
  tokens: readonly HeadlineToken[];
  className?: string;
}

/** Renders a headline with inline plain / muted / lime spans. */
export const RichHeadline = ({ tokens, className }: RichHeadlineProps) => {
  return (
    <span className={className}>
      {tokens.map((t, i) => {
        if ("white" in t)
          return (
            <span key={i} className="text-white">
              {t.white}
            </span>
          );
        if ("lime" in t)
          return (
            <span key={i} className="text-lime">
              {t.lime}
            </span>
          );
        if ("muted" in t)
          return (
            <span key={i} className="text-muted-foreground">
              {t.muted}
            </span>
          );
        return <span key={i}>{t.plain}</span>;
      })}
    </span>
  );
};
