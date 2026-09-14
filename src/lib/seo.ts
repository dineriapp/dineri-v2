import type { Metadata } from "next";

export const SITE_NAME = "Dineri";

export const SITE_TAGLINE = "One link for your restaurant";

export const SITE_DESCRIPTION =
  "Menu, reservations, reviews, social and analytics - one bio link for your venue. Zero commission.";

export const SOCIAL_PROFILES = [
  "https://www.instagram.com/dineri.app",
  "https://x.com/dineriapp",
  "https://linkedin.com/company/dineri-app",
  "https://www.tiktok.com/@dineri.app",
];

export function siteUrl(): string {
  const configured =
    process.env.NEXT_PUBLIC_BETTER_AUTH_URL ||
    process.env.BETTER_AUTH_URL ||
    process.env.NEXT_PUBLIC_BETTER_AUTH_URL ||
    "";

  const url = configured.trim().replace(/\/+$/, "");

  if (process.env.NODE_ENV === "production") {
    if (!url) {
      throw new Error(
        "NEXT_PUBLIC_BETTER_AUTH_URL is not set. Every canonical URL, Open Graph URL and sitemap entry " +
          "is built from it, so a production build without it would publish unreachable URLs.",
      );
    }
  }

  return url || "http://localhost:3000";
}

export function absoluteUrl(path: string): string {
  return `${siteUrl()}${path.startsWith("/") ? path : `/${path}`}`;
}

export function truncate(text: string, max = 160): string {
  const clean = text.replace(/\s+/g, " ").trim();
  if (clean.length <= max) return clean;
  const cut = clean.slice(0, max - 1);
  const lastSpace = cut.lastIndexOf(" ");
  return `${(lastSpace > max * 0.6 ? cut.slice(0, lastSpace) : cut).trimEnd()}…`;
}

export const NO_INDEX: Metadata["robots"] = {
  index: false,
  follow: false,
  googleBot: { index: false, follow: false },
};

export const NO_INDEX_FOLLOW: Metadata["robots"] = {
  index: false,
  follow: true,
  googleBot: { index: false, follow: true },
};

export function pageMetadata({
  title,
  description,
  path,
  noIndex = false,
}: {
  title: string;
  description: string;
  path: string;
  noIndex?: boolean;
}): Metadata {
  return {
    title,
    description,
    alternates: { canonical: path },
    robots: noIndex ? NO_INDEX_FOLLOW : undefined,
    openGraph: {
      type: "website",
      siteName: SITE_NAME,
      title,
      description,
      url: absoluteUrl(path),
    },
    twitter: { card: "summary_large_image", title, description },
  };
}

export function organizationJsonLd(): Record<string, unknown> {
  return {
    "@context": "https://schema.org",
    "@type": "Organization",
    "@id": `${absoluteUrl("/")}#organization`,
    name: SITE_NAME,
    url: absoluteUrl("/"),
    logo: absoluteUrl("/images/logo.png"),
    description: SITE_DESCRIPTION,
    sameAs: SOCIAL_PROFILES,
  };
}

export function webSiteJsonLd(): Record<string, unknown> {
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    "@id": `${absoluteUrl("/")}#website`,
    name: SITE_NAME,
    url: absoluteUrl("/"),
    description: SITE_DESCRIPTION,
    publisher: { "@id": `${absoluteUrl("/")}#organization` },
  };
}

export function breadcrumbJsonLd(
  trail: Array<{ name: string; path: string }>,
): Record<string, unknown> {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: trail.map((step, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: step.name,
      item: absoluteUrl(step.path),
    })),
  };
}
