import { Footer } from "@/components/layout/footer";
import { Header } from "@/components/layout/header";
import { Metadata } from "next";
import VerifyEmailPage from "../_components/verify-email-page";

export const metadata: Metadata = {
  title: "Verify your email",
};

const Page = () => {
  return (
    <>
      <Header />
      <VerifyEmailPage />
      <Footer />
    </>
  );
};

export default Page;
