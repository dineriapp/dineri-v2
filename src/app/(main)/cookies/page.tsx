import { pageMetadata } from "@/lib/seo";
import { Footer } from "@/components/layout/footer";
import { Header } from "@/components/layout/header";
import CookiesPage from "@/components/pages/cookies";
import { Metadata } from "next";

export const metadata: Metadata = pageMetadata({
  title: "Cookies Policy",
  description: "How Dineri uses cookies and similar technologies.",
  path: "/cookies",
});

const Page = () => {
  return (
    <>
      <Header />
      <CookiesPage />
      <Footer />
    </>
  );
};

export default Page;
