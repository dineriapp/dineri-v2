import { Footer } from "@/components/layout/footer";
import { Header } from "@/components/layout/header";
import PricingPage from "@/components/pages/pricing";
import { Metadata } from "next";
import { pageMetadata } from "@/lib/seo";

export const metadata: Metadata = pageMetadata({
  title: "Pricing",
  description:
    "Simple, restaurant-friendly pricing. Free forever to start. €0 commission per booking - pay per venue, never per cover.",
  path: "/pricing",
});

const Page = () => {
  return (
    <>
      <Header />
      <PricingPage />
      <Footer />
    </>
  );
};

export default Page;
