"use client";

import { AppearanceSettings } from "@/lib/types/appearnace";
import { cn } from "@/lib/utils";
import Link from "next/link";
import { whatsappUrl } from "@/utils/whatsapp";
import { FaGlobe, FaPhone, FaWhatsapp } from "react-icons/fa";
import {
  FaFacebookF,
  FaInstagram,
  FaLinkedinIn,
  FaTiktok,
  FaXTwitter,
  FaYoutube,
} from "react-icons/fa6";

type Props = {
  settings: AppearanceSettings;
  useCustomColors?: boolean;
  className?: string;
  socials: {
    instagram: string | null;
    facebook: string | null;
    tiktok: string | null;
    x_twitter: string | null;
    youtube: string | null;
    linkedin: string | null;
    whatsapp: string | null;
    website: string | null;
    phone: string | null;
  };
};

const socialIcons: {
  key: keyof Props["socials"];
  Icon: React.ComponentType<{ className?: string }>;
  bg: string;
  buildUrl: (value: string) => string;
}[] = [
  {
    key: "instagram",
    Icon: FaInstagram,
    bg: "bg-gradient-to-br from-[#F58529] via-[#DD2A7B] to-[#8134AF]",
    buildUrl: (handle: string) => `https://instagram.com/${handle}`,
  },
  {
    key: "facebook",
    Icon: FaFacebookF,
    bg: "bg-[#1877F2]",
    buildUrl: (handle: string) => `https://facebook.com/${handle}`,
  },
  {
    key: "tiktok",
    Icon: FaTiktok,
    bg: "bg-black",
    buildUrl: (handle: string) => `https://tiktok.com/@${handle}`,
  },
  {
    key: "x_twitter",
    Icon: FaXTwitter,
    bg: "bg-black",
    buildUrl: (handle: string) => `https://x.com/${handle}`,
  },
  {
    key: "youtube",
    Icon: FaYoutube,
    bg: "bg-[#FF0000]",
    buildUrl: (handle: string) => `https://youtube.com/@${handle}`,
  },
  {
    key: "linkedin",
    Icon: FaLinkedinIn,
    bg: "bg-[#0A66C2]",
    buildUrl: (handle: string) => `https://linkedin.com/in/${handle}`,
  },
  {
    key: "whatsapp",
    Icon: FaWhatsapp,
    bg: "bg-[#25D366]",
    buildUrl: (value: string) => whatsappUrl(value) ?? "",
  },
  {
    key: "website",
    Icon: FaGlobe,
    bg: "bg-gray-800",
    buildUrl: (url: string) => url,
  },
  {
    key: "phone",
    Icon: FaPhone,
    bg: "bg-[#22C55E]",
    buildUrl: (phone: string) => `tel:${phone.replace(/\s+/g, "")}`,
  },
] as const;

const SocialIcons = ({ settings, socials, useCustomColors = true, className }: Props) => {
  const hasSocials = Object.values(socials).some(Boolean);
  if (!hasSocials) return null;
  return (
    <div className={cn("flex items-center flex-wrap justify-center gap-2", className)}>
      {socialIcons.map(({ key, Icon, bg, buildUrl }) => {
        const value = socials[key];

        if (!value) return null;

        const href =
          key === "website"
            ? value.startsWith("http")
              ? value
              : `https://${value}`
            : key === "phone" || key === "whatsapp"
              ? buildUrl(value)
              : value.startsWith("http")
                ? value
                : buildUrl(value);

        if (!href) return null;

        return (
          <Link
            key={key}
            href={href}
            target="_blank"
            rel="noopener noreferrer"
            style={
              useCustomColors
                ? {
                    background: settings.sectionIconBgColor,
                    color: settings.sectionIconColor,
                    border: `1px solid ${settings.sectionIconBorderColor}`,
                    borderRadius: `${settings.sectionIconRadiusPx}px`,
                  }
                : {
                    borderRadius: `${settings.sectionIconRadiusPx}px`,
                  }
            }
            className={`flex h-10 w-10 shrink-0 items-center justify-center shadow-sm transition-transform hover:scale-105 ${
              useCustomColors ? "" : `${bg} text-white`
            }`}
          >
            <Icon className="h-5 w-5" />
          </Link>
        );
      })}
    </div>
  );
};

export default SocialIcons;
