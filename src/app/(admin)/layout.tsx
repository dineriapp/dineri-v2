import { ensureAuthenticatedUser } from "@/lib/auth/guards";
import { redirect } from "next/navigation";
import { AdminShell } from "./admin/_components/admin-shell";

export default async function AdminLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const guard = await ensureAuthenticatedUser();

  if (!guard?.session) {
    redirect("/sign-in");
  }

  if (guard.session.user.role !== "admin") {
    redirect("/dashboard");
  }

  const user = guard.session.user;

  return <AdminShell user={{ name: user.name, email: user.email }}>{children}</AdminShell>;
}
