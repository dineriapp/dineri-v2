import { AppearanceSection, AppearanceSettings } from "@/lib/types/appearnace";
import { CalendarDays, HelpCircle, Images, Link as LinkIcon, Trophy } from "lucide-react";
import { type CSSProperties } from "react";

export const BG_COLOR_OPTIONS = [
  { bg: "#0a1f2c" },
  { bg: "#16181d" },
  { bg: "#0b0d10" },
  { bg: "#7C3AED" },
  { bg: "#2563EB" },
  { bg: "#0891B2" },
  { bg: "#0F766E" },
  { bg: "#15803D" },
  { bg: "#CA8A04" },
  { bg: "#EA580C" },
  { bg: "#DC2626" },
  { bg: "#BE185D" },
  { bg: "#9333EA" },
];
export const FONT_OPTIONS: {
  id: AppearanceSettings["fontFamily"];
  label: string;
  stack: string;
}[] = [
  { id: "inter", label: "Inter", stack: "'Inter', system-ui, sans-serif" },
  { id: "manrope", label: "Manrope", stack: "'Manrope', system-ui, sans-serif" },
  { id: "spaceGrotesk", label: "Space Grotesk", stack: "'Space Grotesk', system-ui, sans-serif" },
  { id: "poppins", label: "Poppins", stack: "'Poppins', system-ui, sans-serif" },
  { id: "montserrat", label: "Montserrat", stack: "'Montserrat', system-ui, sans-serif" },
  { id: "raleway", label: "Raleway", stack: "'Raleway', system-ui, sans-serif" },
  { id: "nunito", label: "Nunito", stack: "'Nunito', system-ui, sans-serif" },
  { id: "workSans", label: "Work Sans", stack: "'Work Sans', system-ui, sans-serif" },
  { id: "ibmPlexSans", label: "IBM Plex Sans", stack: "'IBM Plex Sans', system-ui, sans-serif" },
  { id: "playfair", label: "Playfair Display", stack: "'Playfair Display', Georgia, serif" },
  { id: "dmSerif", label: "DM Serif Display", stack: "'DM Serif Display', Georgia, serif" },
  { id: "lora", label: "Lora", stack: "'Lora', Georgia, serif" },
  { id: "merriweather", label: "Merriweather", stack: "'Merriweather', Georgia, serif" },
  { id: "robotoSlab", label: "Roboto Slab", stack: "'Roboto Slab', Georgia, serif" },
  { id: "bebas", label: "Bebas Neue", stack: "'Bebas Neue', Impact, sans-serif" },
] as const;

export const getFontStack = (id: AppearanceSettings["fontFamily"]) =>
  FONT_OPTIONS.find((f) => f.id === id)?.stack ?? FONT_OPTIONS[0].stack;

const buttonRadius = (shape: AppearanceSettings["buttonShape"]) =>
  shape === "pill" ? "9999px" : shape === "square" ? "8px" : "16px";

export const resolvedButtonRadius = (s: AppearanceSettings): string =>
  typeof s.buttonRadiusPx === "number" ? `${s.buttonRadiusPx}px` : buttonRadius(s.buttonShape);

const sectionRadius = (shape: AppearanceSettings["sectionShape"]) =>
  shape === "pill" ? "9999px" : shape === "square" ? "8px" : "16px";

export const resolvedSectionRadius = (s: AppearanceSettings): string =>
  typeof s.sectionRadiusPx === "number" ? `${s.sectionRadiusPx}px` : sectionRadius(s.sectionShape);

export const resolvedRadius = (s: number | undefined): string =>
  typeof s === "number" ? `${s}px` : "0px";

export const backgroundStyle = (s: AppearanceSettings): CSSProperties => {
  switch (s.bg_style) {
    case "color":
      return {
        background: s.bg_color,
      };

    case "gradient":
      return {
        background: `linear-gradient(${directionToCss(
          s.bg_gradient?.direction,
        )}, ${s.bg_gradient?.from}, ${s.bg_gradient?.to})`,
      };

    case "image": {
      const opacity = typeof s.bg_image_opacity === "number" ? s.bg_image_opacity : 0.55;

      return {
        backgroundImage: `
          linear-gradient(
            rgba(0,0,0,${opacity}),
            rgba(0,0,0,${opacity})
          ),
          url("${s.bg_image}")
        `,
        backgroundSize: "cover, cover",
        backgroundPosition: "center, center",
        backgroundRepeat: "no-repeat, no-repeat",
      };
    }

    default:
      return {
        background: s.bg_color,
      };
  }
};

const directionToCss = (direction: AppearanceSettings["bg_gradient"]["direction"]) => {
  switch (direction) {
    case "to-r":
      return "to right";
    case "to-l":
      return "to left";
    case "to-t":
      return "to top";
    case "to-b":
      return "to bottom";
    case "to-tr":
      return "to top right";
    case "to-tl":
      return "to top left";
    case "to-br":
      return "to bottom right";
    case "to-bl":
      return "to bottom left";
    default:
      return "to bottom right";
  }
};

export const SECTION_ICON: Record<AppearanceSection["kind"], React.ElementType> = {
  links: LinkIcon,
  events: CalendarDays,
  faq: HelpCircle,
  success: Trophy,
  gallery: Images,
};

export const SECTION_LABEL: Record<AppearanceSection["kind"], string> = {
  links: "Links",
  events: "Events",
  faq: "FAQ",
  success: "Success Stories",
  gallery: "Gallery",
};

export const input_class =
  "w-full rounded-lg border border-white/10 bg-surface-1 px-3 py-2 text-sm text-foreground outline-none transition focus:border-lime/40";

export function getContrast(hex: string) {
  const color = hex.replace("#", "");

  const r = parseInt(color.substring(0, 2), 16);
  const g = parseInt(color.substring(2, 4), 16);
  const b = parseInt(color.substring(4, 6), 16);

  const brightness = (r * 299 + g * 587 + b * 114) / 1000;

  return brightness > 128 ? "#000000" : "#ffffff";
}

export const SHADOW_MAP: Record<NonNullable<AppearanceSettings["sectionShadow"]>, string> = {
  none: "none",
  soft: "0 4px 16px rgba(0,0,0,0.12)",
  medium: "0 10px 28px rgba(0,0,0,0.20)",
  strong: "0 18px 46px rgba(0,0,0,0.30)",
};

export const getGlassFilter = (glassBlur?: number) => {
  return typeof glassBlur === "number" && glassBlur > 0 ? `blur(${glassBlur}px)` : undefined;
};
