"use client";
import FeatureNotAvailable from "@/components/shared/feature-not-available";
import Loader from "@/components/ui/loader";
import { useAuth } from "@/lib/auth/hooks/use-auth";
import { hasFeature } from "@/lib/stripe/checkers";
import { useMenuCategoryWithItems } from "@/lib/tanstack-react-query/hooks/menu";
import { useSelectedRestaurant } from "@/stores/restaurant-store";
import React from "react";
import CreateOrderPage from "./client";

const Page = () => {
  const restaurant = useSelectedRestaurant();
  const { session } = useAuth();
  const { data: menu_categories = [], isPending } = useMenuCategoryWithItems();

  if (!hasFeature(session?.user.subscription.plan ?? "starter", "orderSystem")) {
    return (
      <FeatureNotAvailable
        featureName="Online ordering"
        showBackButton={false}
        description="Take pickup and delivery orders from your page, with zero commission."
        requiredPlan="growth"
      />
    );
  }

  if (isPending) {
    return <Loader className="min-h-75" />;
  }

  return <CreateOrderPage restaurant={{ ...restaurant, menu_categories, popups: [] }} />;
};

export default Page;
