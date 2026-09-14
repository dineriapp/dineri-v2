import { pageMetadata } from "@/lib/seo";
import { Footer } from "@/components/layout/footer";
import { Header } from "@/components/layout/header";
import DocsPage from "@/components/pages/docs";
import { Metadata } from "next";

export const metadata: Metadata = pageMetadata({
  title: "Docs",
  description: "Guides, API reference and best practices for running Dineri.",
  path: "/docs",
});

const Page = () => {
  return (
    <>
      <Header />
      <DocsPage />
      <Footer />
    </>
  );
};

export default Page;
