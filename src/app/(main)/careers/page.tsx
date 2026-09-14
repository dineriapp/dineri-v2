import { pageMetadata } from "@/lib/seo";
import { Footer } from "@/components/layout/footer";
import { Header } from "@/components/layout/header";
import CareersPage from "@/components/pages/careers";
import { Metadata } from "next";

export const metadata: Metadata = pageMetadata({
  title: "Careers",
  description:
    "Build the operating system for restaurants. Open roles across engineering, design, customer and marketing.",
  path: "/careers",
});

const Page = () => {
  return (
    <>
      <Header />
      <CareersPage />
      <Footer />
    </>
  );
};

export default Page;
