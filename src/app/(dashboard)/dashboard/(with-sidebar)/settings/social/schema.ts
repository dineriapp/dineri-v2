import { z } from "zod";

import { normaliseWhatsappNumber } from "@/utils/whatsapp";

const PLATFORM_HOSTS = {
  instagram: ["instagram.com", "instagr.am"],
  facebook: ["facebook.com", "fb.com", "fb.me"],
  tiktok: ["tiktok.com"],
  x_twitter: ["x.com", "twitter.com"],
  youtube: ["youtube.com", "youtu.be"],
  linkedin: ["linkedin.com"],
} as const;

type Platform = keyof typeof PLATFORM_HOSTS;

const PLATFORM_LABEL: Record<Platform, string> = {
  instagram: "Instagram",
  facebook: "Facebook",
  tiktok: "TikTok",
  x_twitter: "X",
  youtube: "YouTube",
  linkedin: "LinkedIn",
};

const HANDLE_RE = /^[a-zA-Z0-9._-]+$/;

const SCHEME_RE = /^[a-z][a-z0-9+.-]*:\/\//i;
const HTTP_SCHEME_RE = /^https?:\/\//i;

function looksLikeUrl(value: string): boolean {
  return SCHEME_RE.test(value) || value.includes("/");
}

function hostBelongsTo(hostname: string, domains: readonly string[]): boolean {
  const host = hostname.toLowerCase();
  return domains.some((domain) => host === domain || host.endsWith(`.${domain}`));
}

function socialField(platform: Platform) {
  const domains = PLATFORM_HOSTS[platform];
  const label = PLATFORM_LABEL[platform];
  const primary = domains[0];

  return z
    .string()
    .trim()
    .superRefine((value, ctx) => {
      if (value === "") return;

      if (!looksLikeUrl(value)) {
        if (!HANDLE_RE.test(value)) {
          ctx.addIssue({ code: "custom", message: "Invalid handle format" });
        }
        return;
      }

      if (SCHEME_RE.test(value) && !HTTP_SCHEME_RE.test(value)) {
        ctx.addIssue({ code: "custom", message: "Links must start with http:// or https://" });
        return;
      }

      let url: URL;
      try {
        url = new URL(HTTP_SCHEME_RE.test(value) ? value : `https://${value}`);
      } catch {
        ctx.addIssue({ code: "custom", message: "Invalid URL" });
        return;
      }

      if (!hostBelongsTo(url.hostname, domains)) {
        ctx.addIssue({
          code: "custom",
          message: `That is not a ${label} link. Use a ${primary} URL, or just your handle.`,
        });
        return;
      }

      if (url.pathname.replace(/\/+/g, "") === "") {
        ctx.addIssue({
          code: "custom",
          message: `Add your ${label} profile, not just ${primary}.`,
        });
      }
    })
    .optional();
}

/**
 * WhatsApp is a phone number rather than a handle or a profile URL, so it can't
 * go through `socialField`. `wa.me` needs an international number: a local one
 * would save happily and then dead-end every guest who tapped it.
 */
function whatsappField() {
  return z
    .string()
    .trim()
    .superRefine((value, ctx) => {
      if (value === "") return;

      if (/[a-z]/i.test(value)) {
        ctx.addIssue({
          code: "custom",
          message: "Enter a phone number, not a link or handle",
        });
        return;
      }

      if (normaliseWhatsappNumber(value) === null) {
        ctx.addIssue({
          code: "custom",
          message:
            "Use the full international number with country code, e.g. +92 300 1234567 (no leading 0)",
        });
      }
    })
    .optional();
}

export const SocialLinksSchema = z.object({
  whatsapp: whatsappField(),
  instagram: socialField("instagram"),
  facebook: socialField("facebook"),
  tiktok: socialField("tiktok"),
  x_twitter: socialField("x_twitter"),
  youtube: socialField("youtube"),
  linkedin: socialField("linkedin"),
});

export type SocialLinksSchemaValues = z.infer<typeof SocialLinksSchema>;
