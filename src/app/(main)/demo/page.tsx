import { pageMetadata } from "@/lib/seo";
import { Footer } from "@/components/layout/footer";
import { Header } from "@/components/layout/header";
import DemoPage from "@/components/pages/demo";
import { Metadata } from "next";

export const metadata: Metadata = pageMetadata({
  title: "Request a Demo",
  description: "See how Dineri can help your restaurant grow.",
  path: "/demo",
});

const Page = () => {
  return (
    <>
      <Header />
      <DemoPage />
      <Footer />
    </>
  );
};

export default Page;
