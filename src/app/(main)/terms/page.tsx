import { pageMetadata } from "@/lib/seo";
import { Footer } from "@/components/layout/footer";
import { Header } from "@/components/layout/header";
import TermsPage from "@/components/pages/terms";
import { Metadata } from "next";

export const metadata: Metadata = pageMetadata({
  title: "Terms of Service",
  description: "The terms governing your access to and use of Dineri.",
  path: "/terms",
});

const Page = () => {
  return (
    <>
      <Header />
      <TermsPage />
      <Footer />
    </>
  );
};

export default Page;
