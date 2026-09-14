type SectionKind = "links" | "events" | "faq" | "success" | "gallery";

export type AppearanceSection = {
  id: string;
  kind: SectionKind;
  title: string;
  enabled: boolean;
};

export type AppearanceLink = {
  id: string;
  title: string;
  sub?: string;
  href: string;
  iconKey: "menu" | "reserve" | "custom";
  enabled: boolean;
};
const sections: AppearanceSection[] = [
  { id: "links", kind: "links", title: "Quick links", enabled: true },
  { id: "events", kind: "events", title: "Upcoming events", enabled: true },
  { id: "gallery", kind: "gallery", title: "Gallery", enabled: true },
  { id: "success", kind: "success", title: "Success stories", enabled: true },
  { id: "faq", kind: "faq", title: "FAQ", enabled: true },
];

export const DEFAULT_APPEARANCE: AppearanceSettings = {
  // haader
  id: "default",
  bg_color: "#0b0d10",
  bg_style: "color",
  iconColor: "#0b0d10",
  fontFamily: "inter",
  text_color: "#b0b0b0",
  bg_gradient: {
    to: "#0b0d10",
    from: "#0a1f2c",
    direction: "to-br",
  },
  buttonShape: "rounded",
  buttonStyle: "solid",
  iconBgColor: "#C6F24E",
  iconRadiusPx: 12,
  sectionShape: "rounded",
  sectionStyle: "solid",
  buttonBgColor: "#ffffff0a",
  header_layout: "classic",
  heading_color: "#ffffff",
  buttonFontSize: 15,
  buttonShowIcons: true,
  buttonIconSize: 44,
  buttonPaddingX: 11,
  buttonPaddingY: 12,
  buttonRadiusPx: 12,
  sectionBgColor: "#ffffff0a",
  buttonBgColorTo: "#00b83d",
  buttonTextColor: "#ffffff",
  iconBorderColor: "#C6F24E",
  sectionPaddingX: 16,
  sectionPaddingY: 16,
  sectionRadiusPx: 16,
  bg_image_opacity: 0.35,
  buttonFontWeight: 600,
  profilePicRadius: 15,
  sectionBgColorTo: "#2563eb",
  sectionIconColor: "#C6F24E",
  buttonBorderColor: "#ffffff1a",
  buttonHoverBgColor: "#C6F24E",
  sectionBorderColor: "#ffffff1a",
  sectionIconBgColor: "#C6F24E22",
  sectionInIconColor: "#ffffff",
  sectionIconRadiusPx: 8,
  buttonHoverTextColor: "#0b0d10",
  sectionInIconBgColor: "#ffffff0a",
  sectionItemTextColor: "#9e9e9e",
  sectionHeaderFontSize: 20,
  sectionInIconRadiusPx: 7,
  buttonHoverBorderColor: "#C6F24E",
  sectionIconBorderColor: "#C6F24E55",
  sectionHeaderFontWeight: 600,
  sectionItemHeadingColor: "#ffffff",
  sectionItemTextFontSize: 13,
  sectionInIconBorderColor: "#ffffff0a",
  sectionItemTextFontWeight: 400,
  sectionItemHeadingFontSize: 15,
  sectionItemHeadingFontWeight: 600,
  sections: sections,
  links: [
    {
      id: "menu",
      title: "View our menu",
      sub: "Order & pay online",
      href: "#",
      iconKey: "menu",
      enabled: true,
    },
    {
      id: "book",
      title: "Reserve a table",
      sub: "Instant confirmation",
      href: "/preview/reserve",
      iconKey: "reserve",
      enabled: true,
    },
    {
      id: "custom",
      title: "Your custom links",
      sub: "",
      href: "/preview/reserve",
      iconKey: "custom",
      enabled: true,
    },
  ],
};

export type AppearanceSettings = {
  // header
  id: string;
  heading_color: string; // hex
  text_color: string; // hex
  profilePicRadius?: number;
  header_layout: "classic" | "banner";
  alternative_title_font?:
    | "inter"
    | "playfair"
    | "manrope"
    | "spaceGrotesk"
    | "dmSerif"
    | "poppins"
    | "montserrat"
    | "lora"
    | "raleway"
    | "nunito"
    | "workSans"
    | "ibmPlexSans"
    | "robotoSlab"
    | "merriweather"
    | "bebas";
  cover_image?: string;

  fontFamily:
    | "inter"
    | "playfair"
    | "manrope"
    | "spaceGrotesk"
    | "dmSerif"
    | "poppins"
    | "montserrat"
    | "lora"
    | "raleway"
    | "nunito"
    | "workSans"
    | "ibmPlexSans"
    | "robotoSlab"
    | "merriweather"
    | "bebas";
  // Background
  bg_style: "color" | "gradient" | "image";
  bg_color: string;
  bg_image?: string;
  bg_gradient: {
    from: string;
    to: string;
    direction: "to-r" | "to-l" | "to-t" | "to-b" | "to-tr" | "to-tl" | "to-br" | "to-bl";
  };
  bg_image_opacity?: number;
  // Button styles
  buttonShape: "pill" | "rounded" | "square";
  buttonStyle: "solid" | "outline" | "gradient";

  buttonRadiusPx: number;

  // Colors
  buttonBgColor: string;
  buttonBgColorTo: string;
  buttonTextColor: string;
  buttonBorderColor: string;

  // Hover
  buttonHoverBgColor: string;
  buttonHoverTextColor: string;
  buttonHoverBorderColor: string;

  // Typography
  buttonFontSize: number;
  buttonFontWeight: FontWeight;

  // Spacing
  buttonPaddingY: number;
  buttonPaddingX: number;

  // Icon
  buttonShowIcons?: boolean;
  buttonIconSize?: number;

  iconBgColor: string;
  iconColor: string;
  iconBorderColor: string;
  iconRadiusPx: number;
  // Button styles

  links: AppearanceLink[];
  sections: AppearanceSection[];
  // section styles
  sectionIconBgColor: string;
  sectionIconColor: string;
  sectionIconBorderColor: string;
  sectionIconRadiusPx: number;
  sectionHeaderFontSize: number;
  sectionHeaderFontWeight: FontWeight;
  //
  // Section card styling
  sectionStyle: "solid" | "outline" | "gradient";
  sectionShape: "pill" | "rounded" | "square";

  // Container
  sectionBgColor: string;
  sectionBgColorTo: string;
  sectionBorderColor: string;

  sectionRadiusPx: number;
  sectionPaddingX: number;
  sectionPaddingY: number;
  // Inner icon
  sectionInIconBgColor: string;
  sectionInIconColor: string;
  sectionInIconBorderColor: string;
  sectionInIconRadiusPx: number;
  // inner text
  sectionItemHeadingColor: string;
  sectionItemTextColor: string;

  sectionItemHeadingFontSize: number;
  sectionItemHeadingFontWeight: FontWeight;

  sectionItemTextFontSize: number;
  sectionItemTextFontWeight: FontWeight;

  sectionShadow?: ShadowLevel;
  buttonShadow?: ShadowLevel;
  glassBlur?: number;
};

type ShadowLevel = "none" | "soft" | "medium" | "strong";

export type UpdateFunctionType = <K extends keyof AppearanceSettings>(
  key: K,
  value: AppearanceSettings[K],
) => void;

export type FontWeight = 100 | 200 | 300 | 400 | 500 | 600 | 700 | 800 | 900;
