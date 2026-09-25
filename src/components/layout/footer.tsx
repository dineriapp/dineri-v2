import Link from "next/link";
import { FaInstagram, FaLinkedinIn, FaTiktok, FaXTwitter } from "react-icons/fa6";
import { BrandLogo } from "@/components/shared/brand-logo";

const SOCIALS = [
  { label: "Instagram", href: "https://www.instagram.com/dineri.app", Icon: FaInstagram },
  { label: "X", href: "https://x.com/dineriapp", Icon: FaXTwitter },
  { label: "LinkedIn", href: "https://linkedin.com/company/dineri-app", Icon: FaLinkedinIn },
  { label: "TikTok", href: "https://www.tiktok.com/@dineri.app", Icon: FaTiktok },
];

export const Footer = () => {
  const f = {
    brand: "dineri.app",
    tagline: "The quiet infrastructure behind full tables.",
    columns: [
      {
        title: "Product",
        links: [
          { label: "Features", href: "/features" },
          { label: "Pricing", href: "/pricing" },
          { label: "Demo", href: "/demo" },
        ],
      },
      {
        title: "Resources",
        links: [
          { label: "Docs", href: "/docs" },
          { label: "Help Center", href: "/help" },
          { label: "FAQ", href: "/faq" },
        ],
      },
      {
        title: "Company",
        links: [
          { label: "About", href: "/about" },
          { label: "Careers", href: "/careers" },
        ],
      },
      {
        title: "Legal",
        links: [
          { label: "Privacy", href: "/privacy" },
          { label: "Terms", href: "/terms" },
          { label: "Cookies", href: "/cookies" },
        ],
      },
    ],
    copyright: "© 2026 Dineri",
    version: "Built for independent restaurants. Used worldwide.",
  };

  return (
    <footer className="border-t border-foreground/5">
      <div className="mx-auto grid max-w-7xl gap-12 px-4 py-14 sm:px-6 sm:py-16 lg:grid-cols-[1.3fr_2fr] lg:px-8">
        <div>
          <Link href="/" className="flex items-center" aria-label={`${f.brand} home`}>
            <BrandLogo className="h-7" />
          </Link>
          <p className="mt-4 max-w-sm text-sm text-muted-foreground">{f.tagline}</p>
          <div className="mt-6 flex items-center gap-2.5">
            {SOCIALS.map(({ label, href, Icon }) => (
              <a
                key={label}
                href={href}
                target="_blank"
                rel="noreferrer"
                aria-label={label}
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-foreground/10 text-muted-foreground transition-colors hover:border-foreground/20 hover:text-foreground"
              >
                <Icon className="h-4 w-4" />
              </a>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-8 sm:grid-cols-2 md:grid-cols-4">
          {f.columns.map((col) => (
            <div key={col.title}>
              <div className="font-jetbrains-mono uppercase tracking-[0.12rem] text-[11px] text-muted-foreground">
                {col.title}
              </div>
              <ul className="mt-4 space-y-2.5">
                {col.links.map((l) => {
                  const isInternal = l.href.startsWith("/");
                  const className =
                    "text-sm text-foreground/80 transition-colors hover:text-foreground";
                  return (
                    <li key={l.label}>
                      {isInternal ? (
                        <Link href={l.href} className={className}>
                          {l.label}
                        </Link>
                      ) : (
                        <a href={l.href} className={className}>
                          {l.label}
                        </a>
                      )}
                    </li>
                  );
                })}
              </ul>
            </div>
          ))}
        </div>
      </div>

      <div className="border-t border-foreground/5">
        <div className="mx-auto flex max-w-7xl flex-col items-start justify-between gap-3 px-4 py-6 text-xs text-muted-foreground sm:flex-row sm:items-center sm:px-6 lg:px-8">
          <div>{f.copyright}</div>
          <div className="flex items-center gap-2 font-jetbrains-mono">
            <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-lime" />
            {f.version}
          </div>
        </div>
      </div>
    </footer>
  );
};
