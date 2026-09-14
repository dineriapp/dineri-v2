import { Footer } from "@/components/layout/footer";
import { Header } from "@/components/layout/header";
import HomePage from "@/components/pages/home";
import { SITE_DESCRIPTION, SITE_NAME, SITE_TAGLINE, pageMetadata } from "@/lib/seo";
import type { Metadata } from "next";

/**
 * Self-referencing canonical. The home page is the most linked and the most
 * parameterised URL on the site - every QR and share link the platform
 * generates carries utm tags - so it needs one most of all.
 */
export const metadata: Metadata = pageMetadata({
  title: `${SITE_NAME} - ${SITE_TAGLINE}`,
  description: SITE_DESCRIPTION,
  path: "/",
});

export default function Home() {
  return (
    <div className="animate-page-in motion-reduce:animate-none">
      <Header />
      <HomePage />
      <Footer />
    </div>
  );
}
