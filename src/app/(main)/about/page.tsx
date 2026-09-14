import { pageMetadata } from "@/lib/seo";
import { Footer } from "@/components/layout/footer";
import { Header } from "@/components/layout/header";
import AboutPage from "@/components/pages/about";
import { Metadata } from "next";

export const metadata: Metadata = pageMetadata({
  title: "About",
  description:
    "Dineri is the operating system for restaurants. Built in Milan for independent venues across Europe.",
  path: "/about",
});

const Page = () => {
  return (
    <>
      <Header />
      <AboutPage />
      <Footer />
    </>
  );
};

export default Page;
