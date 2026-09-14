import { Footer } from "@/components/layout/footer";
import { Header } from "@/components/layout/header";
import FeaturesPage from "@/components/pages/features";
import { Metadata } from "next";
import { pageMetadata } from "@/lib/seo";

export const metadata: Metadata = pageMetadata({
  title: "Features",
  description: "Your restaurant's digital home - menu, reservations, orders, QR and more.",
  path: "/features",
});

const Page = () => {
  return (
    <>
      <Header />
      <FeaturesPage />
      <Footer />
    </>
  );
};

export default Page;
