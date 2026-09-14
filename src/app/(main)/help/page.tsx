import { Footer } from "@/components/layout/footer";
import { Header } from "@/components/layout/header";
import HelpPage from "@/components/pages/help";
import { Metadata } from "next";
import { pageMetadata } from "@/lib/seo";

export const metadata: Metadata = pageMetadata({
  title: "Help Center",
  description:
    "Get started with Dineri - guides for menus, orders, links, events, FAQs, popups, QR codes and analytics.",
  path: "/help",
});

const Page = () => {
  return (
    <>
      <Header />
      <HelpPage />
      <Footer />
    </>
  );
};

export default Page;
