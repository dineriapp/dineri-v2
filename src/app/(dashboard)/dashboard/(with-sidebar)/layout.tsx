"use client"
import { AppSidebar } from "@/app/(dashboard)/dashboard/_components/app-sidebar";
import {
  SidebarInset,
  SidebarProvider
} from "@/components/ui/sidebar";
import { useAuth } from "@/lib/auth/hooks/use-auth";
import Loader from "@/components/ui/loader";
import { useRestaurantStore } from "@/stores/restaurant-store";

export default function DashboardLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const { isPending, user } = useAuth()
  const { selectedRestaurant } = useRestaurantStore()
  if (isPending || !user) {
    return <Loader />
  }
  if (!selectedRestaurant) {
    return <Loader />
  }
  return (
    <>
      <SidebarProvider>
        <AppSidebar />
        <SidebarInset>
          {children}
        </SidebarInset>
      </SidebarProvider>
    </>
  );
}
