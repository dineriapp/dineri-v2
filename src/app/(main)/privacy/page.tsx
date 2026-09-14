import { pageMetadata } from "@/lib/seo";
import { Footer } from "@/components/layout/footer";
import { Header } from "@/components/layout/header";
import PrivacyPage from "@/components/pages/privacy";
import { Metadata } from "next";

export const metadata: Metadata = pageMetadata({
  title: "Privacy Policy",
  description: "How Dineri collects, uses, and protects your personal data under GDPR.",
  path: "/privacy",
});

const Page = () => {
  return (
    <>
      <Header />
      <PrivacyPage />
      <Footer />
    </>
  );
};

export default Page;
