import { absoluteUrl } from "@/lib/seo";
import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: [
          "/dashboard",
          "/admin",
          "/onboarding",
          "/api/",
          "/sign-in",
          "/sign-up",
          "/verify",
          "/reset-password",
          "/forgot-password",
          "/r/*/reserve/success",
          "/r/*/menu/order/success",
          "/reservation/",
          "/order/",
          "/preview",
        ],
      },
    ],
    sitemap: absoluteUrl("/sitemap.xml"),
  };
}
