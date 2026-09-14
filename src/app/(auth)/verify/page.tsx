import { Footer } from "@/components/layout/footer";
import { Header } from "@/components/layout/header";
import { Eyebrow } from "@/components/ui/ui-kit/Eyebrow";
import { db } from "@/drizzle/db";
import { user } from "@/drizzle/schema";
import { eq } from "drizzle-orm";
import { redirect } from "next/navigation";

interface PageProps {
  searchParams: Promise<{
    error?: string;
    id?: string;
  }>;
}

const Page = async ({ searchParams }: PageProps) => {
  const { id } = await searchParams;

  if (!id) {
    redirect("/sign-in");
  }

  const userData = await db.query.user.findFirst({
    where: eq(user.id, id),
  });

  if (!userData) {
    redirect("/sign-in");
  }

  return (
    <>
      <Header />
      <section className="relative overflow-hidden">
        <div className="bg-grid pointer-events-none absolute inset-0 opacity-[0.5]" />
        <div className="pointer-events-none absolute -left-32 top-10 h-105 w-105 rounded-full bg-lime/10 blur-[120px]" />
        <div className="pointer-events-none absolute -right-32 bottom-0 h-105 w-105 rounded-full bg-lime/10 blur-[120px]" />

        <div className="relative mx-auto flex max-w-xl flex-col px-6 py-20 lg:py-28">
          <Eyebrow className="w-fit">/Verify</Eyebrow>
          <h1 className="font-inter-tight mt-4 text-balance text-4xl font-bold leading-[1.05] tracking-tight sm:text-5xl">
            <span>Email </span>
            <span className="text-lime">Verifications.</span>
          </h1>
          <p className="mt-4 text-sm text-muted-foreground">
            Choose a strong password that you haven&apos;t used before.
          </p>
        </div>
      </section>
      <Footer />
    </>
  );
};

export default Page;
