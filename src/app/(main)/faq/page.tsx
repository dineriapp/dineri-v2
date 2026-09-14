import { pageMetadata } from "@/lib/seo";
import { Footer } from "@/components/layout/footer";
import { Header } from "@/components/layout/header";
import FaqPage from "@/components/pages/faq";
import { Metadata } from "next";

export const metadata: Metadata = pageMetadata({
  title: "FAQ",
  description:
    "Answers to the most common questions about Dineri setup, billing, reservations, menus, QR codes and data privacy.",
  path: "/faq",
});

const Page = () => {
  return (
    <>
      <Header />
      <FaqPage />
      <Footer />
    </>
  );
};

export default Page;
