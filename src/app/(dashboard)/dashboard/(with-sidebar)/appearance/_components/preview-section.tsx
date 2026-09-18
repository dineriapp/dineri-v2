"use client";

import { AppearanceLink, AppearanceSection, AppearanceSettings } from "@/lib/types/appearnace";
import { useId, useMemo, useState } from "react";
import {
  getContrast,
  getFontStack,
  getGlassFilter,
  resolvedButtonRadius,
  resolvedRadius,
  resolvedSectionRadius,
  SECTION_ICON,
  SECTION_LABEL,
  SHADOW_MAP,
} from "./utils";

import { PopupRenderer } from "@/components/shared/popup-renderer";
import { SHARE_TAGS, withUtm } from "@/lib/analytics/utm";
import {
  EventType,
  FaqCategoryWithItems,
  GalleryType,
  LinkType,
  MenuCategoryWithItems,
  PopupType,
  RestaurantType,
  SuccessStoryType,
} from "@/drizzle/types";
import { filterPublicEvents } from "@/lib/services/event-visibility";
import { areOnlineReservationsAvailable } from "@/lib/services/reservation-online-availability";
import { useTrackLinkClick } from "@/lib/tanstack-react-query/hooks/links";
import { IconKey } from "@/lib/types/links";
import { cn, formatTimeLabel } from "@/lib/utils";
import { ICON_REGISTRY } from "@/utils/links";

import { getCurrencySymbol, StripeCurrency } from "@/lib/stripe/types";
import { DAYS } from "@/lib/types/opening-hours";
import { MenuItemTags } from "@/components/shared/menu-item-tags";
import {
  ArrowRight,
  CalendarDays,
  Clock3,
  ExternalLink,
  ImageIcon,
  LinkIcon,
  LoaderIcon,
  MapPin,
  PlusIcon,
  Share2,
  Sparkles,
  Star,
  Utensils,
  XIcon,
} from "lucide-react";
import Link from "next/link";
import { FaInstagram, FaLinkedinIn, FaTiktok } from "react-icons/fa";
import { FaXTwitter } from "react-icons/fa6";
import RestaurantStatusBadge from "./sections/restaurant-status-badge";
import SocialIcons from "./sections/social-icons";
import { AppearanceBackground } from "@/components/shared/appearance-background";

import { venueDisplayUrl, venueUrl } from "@/lib/venue-url";
const WEEKDAY_NAMES = [
  "Sunday",
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
];

/** Day-of-week index (0 = Sunday) as it currently reads in `timezone`. */
function weekdayIndexIn(timezone?: string | null): number {
  try {
    const name = new Date().toLocaleDateString("en-US", {
      weekday: "long",
      timeZone: timezone || undefined,
    });
    return WEEKDAY_NAMES.indexOf(name);
  } catch {
    // An unrecognised zone would otherwise throw a RangeError mid-render.
    return new Date().getDay();
  }
}

function localTimezone(): string | null {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone ?? null;
  } catch {
    return null;
  }
}

export type PreviewSectionRestaurant = Pick<
  RestaurantType,
  | "slug"
  | "name"
  | "address"
  | "phone"
  | "website"
  | "timezone"
  | "opening_hours"
  | "is_menu_published"
  | "orderSettings"
  | "reservation_settings"
  | "instagram"
  | "facebook"
  | "tiktok"
  | "x_twitter"
  | "youtube"
  | "linkedin"
  | "whatsapp"
> & {
  stripe: { currency: StripeCurrency | null } | null;
};

type Props = {
  settings: AppearanceSettings;
  restaurant: PreviewSectionRestaurant;
  branding: {
    name: string;
    tagline: string;
    bio: string;
    image?: string;
  };
  isSlugPage: boolean;
  isLoading: boolean;
  // data
  links: LinkType[];
  events: EventType[];
  faqs: FaqCategoryWithItems[];
  successStories: SuccessStoryType[];
  galleryItems: GalleryType[];
  menu: MenuCategoryWithItems[];
  popups: PopupType[];
  googleRating?: { rating: number; userRatingCount: number } | null;
};

type OrderedLink =
  | {
      type: "appearance";
      data: AppearanceLink;
    }
  | {
      type: "custom";
      data: LinkType;
    };

export const PreviewSection = ({
  settings,
  branding,
  isSlugPage,
  links,
  isLoading,
  events,
  faqs,
  successStories,
  galleryItems,
  restaurant,
  menu,
  popups,
  googleRating,
}: Props) => {
  const isOrderingClosed = restaurant?.orderSettings?.status === "closed";
  const radius = resolvedButtonRadius(settings);
  const sectionRadius = resolvedSectionRadius(settings);
  const buttonRadius = resolvedButtonRadius(settings);
  const font = getFontStack(settings.fontFamily);
  const fontTitle = settings?.alternative_title_font
    ? getFontStack(settings.alternative_title_font)
    : "";
  const Picradius = resolvedRadius(settings.profilePicRadius);
  const hoverScopeId = `pv-${useId().replace(/:/g, "")}`;
  const [quickMenuOpen, setQuickMenuOpen] = useState(false);
  const [quickCat, setQuickCat] = useState<string>("__all");
  const [selectedGalleryItem, setSelectedGalleryItem] = useState<GalleryType | null>(null);
  const [selectedSuccessStory, setSelectedSuccessStory] = useState<SuccessStoryType | null>(null);
  const [selectedEvent, setSelectedEvent] = useState<EventType | null>(null);
  const [hoursOpen, setHoursOpen] = useState(false);
  const { mutate: trackLinkClick } = useTrackLinkClick();

  const visibleEvents = useMemo(
    () => filterPublicEvents(events, restaurant.timezone),
    [events, restaurant.timezone],
  );

  const visibleFaqs = useMemo(
    () =>
      faqs
        .filter((category) => category.active)
        .map((category) => ({
          ...category,
          items: category.items.filter((faq) => faq.active),
        }))
        .filter((category) => category.items.length > 0),
    [faqs],
  );

  const glassFilter = getGlassFilter(settings.glassBlur);

  const sectionDepth: React.CSSProperties = {
    boxShadow: SHADOW_MAP[settings.sectionShadow ?? "none"],
    backdropFilter: glassFilter,
    WebkitBackdropFilter: glassFilter,
  };
  const buttonDepth: React.CSSProperties = {
    boxShadow: SHADOW_MAP[settings.buttonShadow ?? "none"],
    backdropFilter: glassFilter,
    WebkitBackdropFilter: glassFilter,
  };

  const buttonStyle = (): React.CSSProperties => {
    switch (settings.buttonStyle) {
      case "solid":
        return {
          ...buttonDepth,
          background: settings.buttonBgColor,
          color: settings.buttonTextColor,
          border: `1px solid ${settings.buttonBorderColor}`,
        };

      case "outline":
        return {
          ...buttonDepth,
          background: "transparent",
          color: settings.buttonTextColor,
          border: `1px solid ${settings.buttonBorderColor}`,
        };

      case "gradient":
        return {
          ...buttonDepth,
          background: `linear-gradient(
          135deg,
          ${settings.buttonBgColor},
          ${settings.buttonBgColorTo}
        )`,
          color: settings.buttonTextColor,
          border: `1px solid ${settings.buttonBorderColor}`,
        };

      default:
        return {
          ...buttonDepth,
          background: settings.buttonBgColor,
          color: settings.buttonTextColor,
          border: `1px solid ${settings.buttonBorderColor}`,
          backdropFilter: glassFilter ?? "blur(8px)",
        };
    }
  };
  const sectionStyle = (): React.CSSProperties => {
    switch (settings.sectionStyle) {
      case "solid":
        return {
          ...sectionDepth,
          background: settings.sectionBgColor,
          border: `1px solid ${settings.sectionBorderColor}`,
          borderRadius: `${settings.sectionRadiusPx}px`,
          padding: `${settings.sectionPaddingY}px ${settings.sectionPaddingX}px`,
        };

      case "outline":
        return {
          ...sectionDepth,
          background: "transparent",
          border: `1px solid ${settings.sectionBorderColor}`,
          borderRadius: `${settings.sectionRadiusPx}px`,
          padding: `${settings.sectionPaddingY}px ${settings.sectionPaddingX}px`,
        };

      case "gradient":
        return {
          ...sectionDepth,
          background: `linear-gradient(
                    135deg,
                    ${settings.sectionBgColor},
                    ${settings.sectionBgColorTo}
                )`,
          border: `1px solid ${settings.sectionBorderColor}`,
          borderRadius: `${settings.sectionRadiusPx}px`,
          padding: `${settings.sectionPaddingY}px ${settings.sectionPaddingX}px`,
        };

      default:
        return {
          ...sectionDepth,
          background: settings.sectionBgColor,
          border: `1px solid ${settings.sectionBorderColor}`,
          borderRadius: `${settings.sectionRadiusPx}px`,
          padding: `${settings.sectionPaddingY}px ${settings.sectionPaddingX}px`,
        };
    }
  };
  const { padding, ...sectionStyleWithoutPadding } = sectionStyle();
  console.log(padding);
  const sectionItemHeadingStyle: React.CSSProperties = {
    color: settings.sectionItemHeadingColor,
    fontSize: `${settings.sectionItemHeadingFontSize}px`,
    fontWeight: settings.sectionItemHeadingFontWeight,
  };

  const sectionItemTextStyle: React.CSSProperties = {
    color: settings.sectionItemTextColor,
    fontSize: `${settings.sectionItemTextFontSize}px`,
    fontWeight: settings.sectionItemTextFontWeight,
  };

  const sectionIconStyle: React.CSSProperties = {
    background: settings.sectionInIconBgColor,
    color: settings.sectionInIconColor,
    border: `1px solid ${settings.sectionInIconBorderColor}`,
    borderRadius: `${settings.sectionInIconRadiusPx}px`,
  };

  const iconStyle: React.CSSProperties = {
    background: settings.iconBgColor,
    color: settings.iconColor,
    border: `1px solid ${settings.iconBorderColor}`,
    borderRadius: settings.iconRadiusPx ?? Math.max(8, parseInt(radius) - 4),
  };

  const showButtonIcons = settings.buttonShowIcons ?? true;
  const buttonIconSize = settings.buttonIconSize ?? 44;
  const glyphSize = Math.round(buttonIconSize * 0.45);

  const HeaderIconStyle: React.CSSProperties = {
    background: `${settings.sectionIconBgColor}`,
    color: settings.sectionIconColor,
    border: `1px solid ${settings.sectionIconBorderColor}`,
    borderRadius: `${settings.sectionIconRadiusPx}px`,
  };

  const SectionHeader = ({ kind, title }: { kind: AppearanceSection["kind"]; title: string }) => {
    const Ic = SECTION_ICON[kind];
    if (visibleEvents.length == 0 && kind === "events") return null;
    if (galleryItems.length == 0 && kind === "gallery") return null;
    if (successStories.length == 0 && kind === "success") return null;
    if (visibleFaqs.length == 0 && kind === "faq") return null;
    return (
      <div className="mb-3 flex items-center gap-2">
        <span
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg"
          style={HeaderIconStyle}
        >
          <Ic className="h-4.5 w-4.5" />
        </span>
        <div>
          <div
            className="uppercase font-jetbrains-mono tracking-wider leading-[1.1]"
            style={{
              color: settings.text_color,
              fontSize: `${settings.sectionHeaderFontSize - 10}px`,
            }}
          >
            {SECTION_LABEL[kind]}
          </div>
          <h2
            className="text-base font-semibold"
            style={{
              color: settings.heading_color,
              fontSize: `${settings.sectionHeaderFontSize - 2}px`,
              fontWeight: settings.sectionHeaderFontWeight,
            }}
          >
            {title}
          </h2>
        </div>
      </div>
    );
  };

  const handleClick = (key: string) => {
    if (key === "menu") {
      setQuickMenuOpen(true);
    }
  };

  const handleItemClick = (item: GalleryType) => {
    setSelectedGalleryItem(item);
  };

  const renderLinks = () => {
    if (settings.links.length === 0 && links.length === 0) return null;

    const enabledSettingsLinks = settings.links.filter((l) => l.enabled);

    const orderedLinks: OrderedLink[] = enabledSettingsLinks.flatMap((link): OrderedLink[] => {
      if (link.id === "custom") {
        return links
          .filter((l): l is LinkType => l.active)
          .map((l): OrderedLink => ({
            type: "custom",
            data: l,
          }));
      }

      if (link.id === "menu" && !hasVisibleMenu) {
        return [];
      }

      if (link.id === "book" && !canBookOnline) {
        return [];
      }

      return [
        {
          type: "appearance",
          data: link,
        },
      ];
    });

    const linkStyle: React.CSSProperties = {
      ...buttonStyle(),
      borderRadius: buttonRadius,
      fontWeight: settings.buttonFontWeight,
      paddingTop: settings.buttonPaddingY,
      paddingBottom: settings.buttonPaddingY,
      paddingLeft: settings.buttonPaddingX,
      paddingRight: settings.buttonPaddingX,
    };

    const renderLinkItem = (
      key: string,
      href: string,
      title: string,
      subtitle?: string,
      Icon?: React.ElementType,
      trackableLinkId?: string,
    ) => {
      const SafeIcon = Icon ?? LinkIcon;

      const content = (
        <>
          {showButtonIcons && (
            <span
              className="flex pv-icon shrink-0 items-center justify-center shadow-lg"
              style={{ ...iconStyle, width: buttonIconSize, height: buttonIconSize }}
            >
              {/* The glyph keeps the proportion the fixed 44px tile had. */}
              <SafeIcon style={{ width: glyphSize, height: glyphSize }} />
            </span>
          )}

          <span className="min-w-0 flex-1 text-left flex flex-col gap-1">
            <span
              className="block truncate"
              style={{
                fontSize: `${settings.buttonFontSize}px`,
                fontWeight: settings.buttonFontWeight,
                lineHeight: 1.1,
              }}
            >
              {title}
            </span>

            {subtitle && (
              <span
                className="block truncate"
                style={{
                  fontSize: `${settings.buttonFontSize - 3}px`,
                  fontWeight: 400,
                  opacity: 0.6,
                  lineHeight: 1.1,
                }}
              >
                {subtitle}
              </span>
            )}
          </span>

          <ExternalLink className="h-4 w-4 shrink-0 opacity-40 transition group-hover:opacity-100" />
        </>
      );

      const cls =
        "pv-link group flex items-center gap-3 transition hover:-translate-y-0.5 active:translate-y-0";

      const isLink =
        href.startsWith("/") || href.startsWith("http://") || href.startsWith("https://");

      if (isLink) {
        return (
          <Link
            key={key}
            href={key === "book" ? venueUrl(restaurant.slug, "/reserve") : href}
            className={cls}
            style={linkStyle}
            target="_blank"
            onClick={() => {
              if (isSlugPage && trackableLinkId) trackLinkClick(trackableLinkId);
            }}
          >
            {content}
          </Link>
        );
      }

      return (
        <div
          key={key}
          className={cn(cls, "cursor-pointer")}
          onClick={() => handleClick(key)}
          style={linkStyle}
        >
          {content}
        </div>
      );
    };

    return (
      <div className="space-y-3">
        {orderedLinks.map((l) => {
          if (l.type === "custom") {
            const Icon = ICON_REGISTRY[l.data.icon_key as IconKey]?.Icon ?? LinkIcon;

            return renderLinkItem(
              l.data.id,
              l.data.url,
              l.data.title,
              l.data.description ?? "",
              Icon,
              l.data.id,
            );
          }

          const Icon = ICON_REGISTRY[l.data.iconKey as IconKey]?.Icon ?? LinkIcon;

          const subtitle = l.data.id === "menu" && isOrderingClosed ? undefined : l.data.sub;

          return renderLinkItem(l.data.id, l.data.href, l.data.title, subtitle, Icon);
        })}
      </div>
    );
  };

  const renderEvents = () => {
    if (!visibleEvents.length) return null;

    return (
      <div className="space-y-3">
        {visibleEvents.map((event) => (
          <div
            key={event.id}
            style={{
              ...sectionStyle(),
              borderRadius: sectionRadius,
            }}
          >
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0 flex-1">
                <h3 className="truncate font-semibold" style={sectionItemHeadingStyle}>
                  {event.title}
                </h3>

                {event.description && (
                  <p className="mt-1 line-clamp-1" style={sectionItemTextStyle}>
                    {event.description}
                  </p>
                )}

                <div
                  className="mt-2 flex flex-wrap gap-x-3 gap-y-1"
                  style={{
                    ...sectionItemTextStyle,

                    fontSize: Math.max(10, settings.sectionItemTextFontSize - 2),
                    opacity: 0.8,
                  }}
                >
                  <span className="flex items-center gap-1">
                    <span
                      className="inline-flex h-5 w-5 items-center justify-center"
                      style={sectionIconStyle}
                    >
                      <CalendarDays className="h-3 w-3" />
                    </span>
                    <span>{event.date}</span>
                  </span>

                  <span className="flex items-center gap-1">
                    <span
                      className="inline-flex h-5 w-5 items-center justify-center"
                      style={sectionIconStyle}
                    >
                      <Clock3 className="h-3 w-3" />
                    </span>
                    <span>{event.time}</span>
                  </span>

                  {event.location && (
                    <span className="flex items-center gap-1 truncate">
                      <span
                        className="inline-flex h-5 w-5 items-center justify-center"
                        style={sectionIconStyle}
                      >
                        <MapPin className="h-3 w-3" />
                      </span>
                      <span>{event.location}</span>
                    </span>
                  )}
                </div>

                <div
                  className="mt-2 text-xs cursor-pointer opacity-70 transition hover:opacity-100"
                  style={sectionItemTextStyle}
                  onClick={() => {
                    if (isSlugPage) setSelectedEvent(event);
                  }}
                >
                  See full details →
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  };

  const renderFaq = () => {
    // Already grouped by the category the merchant filed each question under,
    // and already filtered - a hidden category or question never arrives here.
    if (visibleFaqs.length === 0) return null;

    return (
      <div className="space-y-4">
        {visibleFaqs.map(({ id: categoryId, name, items }) => (
          <div key={categoryId} className="space-y-2">
            {/* Category Heading */}
            <h3
              className="text-sm font-semibold px-1"
              style={{
                color: settings.heading_color,
              }}
            >
              {name}
            </h3>

            {/* FAQs under category */}
            <div className="space-y-2">
              {items.map((f) => (
                <details
                  key={f.id}
                  className="group"
                  style={{
                    ...sectionStyle(),
                    borderRadius: sectionRadius,
                  }}
                >
                  <summary
                    className="flex cursor-pointer list-none items-center justify-between"
                    style={sectionItemHeadingStyle}
                  >
                    <span>{f.question}</span>

                    <div
                      className="flex shrink-0 h-6 w-6 items-center justify-center"
                      style={sectionIconStyle}
                    >
                      <span className="group-open:rotate-45 transition-transform">
                        <PlusIcon className="h-3 w-3" />
                      </span>
                    </div>
                  </summary>

                  <p className="mt-2" style={sectionItemTextStyle}>
                    {f.answer}
                  </p>
                </details>
              ))}
            </div>
          </div>
        ))}
      </div>
    );
  };

  const renderSuccess = () => {
    if (!successStories.length) return null;
    return (
      <div className="space-y-2">
        {successStories.map((s) => (
          <div key={s.id} className="block group">
            <article
              style={{
                ...sectionStyle(),
                borderRadius: sectionRadius,
              }}
            >
              <h3
                className="mt-1 flex items-center justify-between gap-2"
                style={sectionItemHeadingStyle}
              >
                <span className="truncate">{s.title}</span>
              </h3>

              <p className="mt-1 line-clamp-2" style={sectionItemTextStyle}>
                {s.body}
              </p>

              {/* CTA hint */}
              <div
                className="mt-2 text-xs cursor-pointer opacity-70 group-hover:opacity-100 transition"
                style={sectionItemTextStyle}
                onClick={() => {
                  if (isSlugPage) setSelectedSuccessStory(s);
                }}
              >
                Read full success story →
              </div>
            </article>
          </div>
        ))}
      </div>
    );
  };

  const GALLERY_RADIUS = 12;
  const gridCols =
    galleryItems.length === 1
      ? "grid-cols-1"
      : galleryItems.length === 2
        ? "grid-cols-2"
        : "grid-cols-3";

  const renderGallery = () => {
    if (galleryItems.length === 0) return null;
    return (
      <div className={`grid ${gridCols} gap-1.5`}>
        {galleryItems
          .filter((i) => i.active)
          .map((g) => (
            <div
              key={g.id}
              className="group relative aspect-square overflow-hidden"
              style={{
                borderRadius: GALLERY_RADIUS,
                // border: `1px solid ${bg.border}`,
              }}
              onClick={() => {
                if (isSlugPage) handleItemClick(g);
              }}
            >
              {g.type === "image" ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={g.image?.url ?? ""}
                  alt={g.title ?? ""}
                  loading="lazy"
                  className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
                />
              ) : (
                <>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={g.image?.url ?? g.youtube_poster ?? ""}
                    alt={g.title ?? "Video"}
                    loading="lazy"
                    className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
                  />

                  <div className="absolute inset-0 flex items-center justify-center bg-black/20">
                    <div className="rounded-full bg-black/70 p-3">
                      <svg viewBox="0 0 24 24" fill="currentColor" className="h-6 w-6 text-white">
                        <path d="M8 5v14l11-7z" />
                      </svg>
                    </div>
                  </div>
                </>
              )}
            </div>
          ))}
      </div>
    );
  };

  const RENDERERS: Record<AppearanceSection["kind"], () => React.ReactNode> = {
    links: renderLinks,
    events: renderEvents,
    faq: renderFaq,
    success: renderSuccess,
    gallery: renderGallery,
  };

  const share = async () => {
    const url = withUtm(venueUrl(restaurant.slug), SHARE_TAGS);
    if (navigator.share) {
      try {
        await navigator.share({ title: restaurant.name, url });
      } catch {
        /* cancel */
      }
    } else {
      navigator.clipboard?.writeText(url);
    }
  };

  const hasOpeningHours = !!restaurant.opening_hours;

  const venueToday = useMemo(() => weekdayIndexIn(restaurant.timezone), [restaurant.timezone]);
  const visitorTimezone = useMemo(() => localTimezone(), []);
  const hasAddress = !!restaurant.address;

  const visibleMenu = useMemo(
    () =>
      menu
        .filter((c) => c.show_on_public_page)
        .map((c) => ({
          ...c,
          items: c.items.filter((i) => i.show_on_public_page),
        }))
        .filter((c) => c.items.length > 0),
    [menu],
  );

  const hasVisibleMenu = restaurant.is_menu_published && visibleMenu.length > 0;

  const canBookOnline = areOnlineReservationsAvailable(restaurant.reservation_settings);

  const quickItems = useMemo(() => {
    if (quickCat === "__all") {
      return visibleMenu.flatMap((m) => m.items);
    }

    return visibleMenu.find((m) => m.name === quickCat)?.items ?? [];
  }, [quickCat, visibleMenu]);

  const currency = getCurrencySymbol(restaurant.stripe?.currency);

  return (
    <>
      <div
        id={hoverScopeId}
        className={cn(
          "relative isolate",
          !isSlugPage && "overflow-hidden rounded-3xl border border-white/10 shadow-2xl",
        )}
      >
        <AppearanceBackground settings={settings} mode={isSlugPage ? "fixed" : "absolute"} />
        {/* fake browser chrome */}
        {!isSlugPage && (
          <div className="flex items-center gap-1.5 border-b border-white/10 bg-surface-1 px-3 py-2">
            <span className="h-2.5 w-2.5 rounded-full bg-rose-500/70" />
            <span className="h-2.5 w-2.5 rounded-full bg-amber-400/70" />
            <span className="h-2.5 w-2.5 rounded-full bg-emerald-500/70" />
            <span className="ml-3 truncate font-mono text-[10px] text-muted-foreground">
              {venueDisplayUrl(restaurant.slug)}
            </span>
          </div>
        )}
        {/* main  */}
        <div
          className={cn(
            "overflow-y-auto pb-7 relative w-full scrollbar-dark",
            !isSlugPage ? "max-h-[calc(100dvh-300px)]" : "min-h-screen",
          )}
          style={{ fontFamily: font }}
        >
          <header
            className=" z-30 backdrop-blur"
            style={{ borderBottom: `1px solid ${settings.sectionBorderColor}` }}
          >
            <div className="mx-auto flex max-w-xl items-center justify-between gap-2 px-4 py-3">
              <Link
                href={isSlugPage ? venueUrl(restaurant.slug, "/track-order") : ""}
                className="text-xs font-medium transition hover:opacity-80"
                style={{ color: settings.heading_color }}
              >
                Track your order
              </Link>

              <button
                type="button"
                onClick={share}
                className="inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium transition hover:opacity-80"
                style={{
                  ...sectionStyleWithoutPadding,
                  color: settings.sectionItemHeadingColor,
                }}
              >
                <Share2 className="h-3.5 w-3.5" /> Share
              </button>
            </div>
          </header>
          <div className={cn("", isSlugPage ? "max-w-xl mx-auto" : "w-full")}>
            {/* Hero */}
            <div className={cn("", settings.header_layout === "banner" ? "" : "pt-10")}>
              <div className="text-center ">
                {settings.header_layout === "banner" && (
                  <>
                    {settings.cover_image ? (
                      <div className="bg-primary/20 relative aspect-20/7! w-full">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={settings.cover_image}
                          alt={branding.name}
                          fetchPriority={isSlugPage ? "high" : "auto"}
                          className={cn(
                            "w-full h-full object-cover",
                            settings.header_layout === "banner" ? "" : "",
                          )}
                        />
                      </div>
                    ) : (
                      <div className="bg-primary/20 text-sm aspect-20/7! flex items-center justify-center w-full">
                        <ImageIcon />
                      </div>
                    )}
                  </>
                )}
                {branding.image ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={branding.image}
                    alt={branding.name}
                    fetchPriority={isSlugPage ? "high" : "auto"}
                    className={cn(
                      "mx-auto h-24 z-20 relative w-24 object-cover shadow-2xl",
                      settings.header_layout === "banner" ? "-mt-10" : "",
                    )}
                    style={{
                      borderRadius: Picradius,
                    }}
                  />
                ) : (
                  <div
                    className={cn(
                      "mx-auto flex z-20 relative h-24 w-24 items-center justify-center text-2xl font-bold shadow-2xl",
                      settings.header_layout === "banner" ? "-mt-10" : "",
                    )}
                    style={{
                      background: getContrast(settings.heading_color),
                      color: settings.heading_color,
                      borderRadius: Picradius,
                    }}
                  >
                    {branding.name.slice(0, 2) || "•"}
                  </div>
                )}
                <div className="px-4 text-center">
                  <h1
                    className="mt-5 leading-[1.2]"
                    style={{
                      color: settings.heading_color,
                      fontFamily: settings.alternative_title_font ? fontTitle : "inherit",
                      fontSize: `${settings.sectionHeaderFontSize + 9}px`,
                      fontWeight: settings.sectionHeaderFontWeight,
                    }}
                  >
                    {branding.name}
                  </h1>
                  <p
                    className="mt-1"
                    style={{
                      color: settings.text_color,
                      fontSize: `${settings.sectionHeaderFontSize - 6}px`,
                      fontWeight: 400,
                    }}
                  >
                    {branding.tagline}
                  </p>
                  {(hasOpeningHours || hasAddress || googleRating) && (
                    <div className="mt-3 mx-auto flex flex-wrap items-center justify-center gap-2 text-xs">
                      {hasOpeningHours && (
                        <RestaurantStatusBadge
                          buttonStyle={() => ({
                            ...buttonStyle(),
                            borderRadius: buttonRadius,
                          })}
                          restaurant={restaurant}
                          onClick={isSlugPage ? () => setHoursOpen(true) : undefined}
                        />
                      )}

                      {googleRating && (
                        <span
                          className="inline-flex items-center gap-1 rounded-full px-2.5 py-1"
                          style={{ ...buttonStyle(), borderRadius: buttonRadius }}
                        >
                          <Star className="h-3 w-3 fill-amber-400 text-amber-400" />
                          <span className="font-medium" style={{ color: settings.buttonTextColor }}>
                            {googleRating.rating.toFixed(1)}
                          </span>
                          <span>· {googleRating.userRatingCount.toLocaleString()} reviews</span>
                        </span>
                      )}

                      {hasAddress && (
                        <span
                          className="inline-flex items-center gap-1 rounded-full px-2.5 py-1"
                          style={{ ...buttonStyle(), borderRadius: buttonRadius }}
                        >
                          <MapPin className="h-3 w-3" />
                          {restaurant.address}
                        </span>
                      )}
                    </div>
                  )}
                  <p
                    className="mx-auto mt-3 max-w-md"
                    style={{
                      color: settings.text_color,
                      fontSize: `${settings.sectionHeaderFontSize - 6}px`,
                      fontWeight: 400,
                    }}
                  >
                    {branding.bio}
                  </p>
                  <SocialIcons
                    className="mt-3"
                    useCustomColors={true}
                    settings={settings}
                    socials={{
                      facebook: restaurant.facebook,
                      instagram: restaurant.instagram,
                      linkedin: restaurant.linkedin,
                      whatsapp: restaurant.whatsapp,
                      tiktok: restaurant.tiktok,
                      x_twitter: restaurant.x_twitter,
                      youtube: restaurant.youtube,
                      website: restaurant.website,
                      phone: restaurant.phone,
                    }}
                  />
                </div>
              </div>
            </div>

            {/* Sections rendered in user-chosen order */}
            <div className="mt-6 px-5">
              <div className="space-y-8">
                <style>{`
        #${hoverScopeId} .pv-link:hover {
          background: ${settings.buttonHoverBgColor} !important;
          color: ${settings.buttonHoverTextColor} !important;
          border-color: ${settings.buttonHoverBorderColor} !important;
          ${
            settings.buttonShadow && settings.buttonShadow !== "none"
              ? "box-shadow: 0 14px 34px rgba(0,0,0,0.26) !important;"
              : ""
          }
        }
                  #${hoverScopeId} .pv-link:hover .pv-icon {
    color: ${settings.buttonHoverTextColor} !important;
     background: ${settings.buttonHoverBgColor} !important;
  }
      `}</style>

                {isLoading ? (
                  <>
                    <LoaderIcon className="animate-spin mx-auto" />
                  </>
                ) : (
                  <>
                    {settings?.sections
                      ?.filter((s) => s.enabled)
                      .map((s) => (
                        <section key={s.id}>
                          {s.kind !== "links" && <SectionHeader kind={s.kind} title={s.title} />}
                          {RENDERERS[s.kind]()}
                        </section>
                      ))}
                  </>
                )}
              </div>
            </div>
          </div>
          <footer
            className="mt-10 pt-6 text-center"
            style={{ borderTop: `1px solid ${settings.sectionBorderColor}` }}
          >
            <a
              href="https://www.dineri.app"
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1.5 text-xs font-semibold transition"
              style={{ color: settings.heading_color }}
            >
              <Sparkles className="h-3.5 w-3.5" style={{ color: settings.heading_color }} />
              Powered by <span style={{ color: settings.heading_color }}>Dineri</span>
            </a>
            <div
              className="mt-2.5 flex items-center justify-center gap-3"
              style={{ color: settings.text_color }}
            >
              <a
                href="https://www.instagram.com/dineri.app"
                target="_blank"
                rel="noreferrer"
                aria-label="Instagram"
              >
                <FaInstagram className="h-3.5 w-3.5" />
              </a>
              <a href="https://x.com/dineriapp" target="_blank" rel="noreferrer" aria-label="X">
                <FaXTwitter className="h-3.5 w-3.5" />
              </a>
              <a
                href="https://linkedin.com/company/dineri-app"
                target="_blank"
                rel="noreferrer"
                aria-label="LinkedIn"
              >
                <FaLinkedinIn className="h-3.5 w-3.5" />
              </a>
              <a
                href="https://www.tiktok.com/@dineri.app"
                target="_blank"
                rel="noreferrer"
                aria-label="TikTok"
              >
                <FaTiktok className="h-3.5 w-3.5" />
              </a>
            </div>
            <div className="mt-3 text-[10px] opacity-70" style={{ color: settings.text_color }}>
              © {new Date().getFullYear()} {restaurant.name}
            </div>
          </footer>
        </div>
        {isSlugPage && (
          <PopupRenderer
            popups={popups}
            settings={settings}
            onPage="restaurant"
            contained={!isSlugPage}
            track={isSlugPage}
          />
        )}
        {quickMenuOpen && isSlugPage && hasVisibleMenu && (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-0 backdrop-blur-sm sm:items-center sm:p-4"
            onClick={() => setQuickMenuOpen(false)}
          >
            <div
              className="w-full max-w-[90vw] sm:max-w-lg overflow-hidden shadow-2xl"
              style={sectionStyleWithoutPadding}
              onClick={(e) => e.stopPropagation()}
            >
              <div
                className="flex items-center justify-between px-5 py-4"
                style={{ borderBottom: `1px solid ${settings.sectionBorderColor}` }}
              >
                <div className="flex items-center gap-2.5">
                  <span
                    className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl"
                    style={HeaderIconStyle}
                  >
                    <Utensils className="h-4 w-4" />
                  </span>
                  <div>
                    <div className="text-sm font-semibold" style={sectionItemHeadingStyle}>
                      Quick menu
                    </div>
                    <div className="text-[10px]" style={{ color: settings.sectionItemTextColor }}>
                      A taste of what we offer
                    </div>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setQuickMenuOpen(false)}
                  className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full transition hover:opacity-80"
                  style={{
                    background: settings.sectionInIconBgColor,
                    border: `1px solid ${settings.sectionInIconBorderColor}`,
                    color: settings.sectionInIconColor,
                  }}
                  aria-label="Close"
                >
                  <XIcon className="h-4 w-4" />
                </button>
              </div>

              {/* Category tabs (last tab = "All Items") */}
              <div
                role="tablist"
                aria-label="Menu categories"
                className="-mx-1 flex gap-1.5 overflow-x-auto scrollbar-dark px-4 pb-3 pt-3"
                style={{ borderBottom: `1px solid ${settings.sectionBorderColor}` }}
              >
                {visibleMenu.map((c) => {
                  const active = c.name === quickCat;
                  const label = c.name === "__all" ? "All Items" : c.name;
                  return (
                    <button
                      key={c.id}
                      role="tab"
                      type="button"
                      aria-selected={active}
                      onClick={() => setQuickCat(c.name)}
                      className="shrink-0 shadow-sm rounded-full px-3 py-1.5 text-[11px] font-semibold transition"
                      style={{
                        border: `${active ? HeaderIconStyle.border : `1px solid ${settings.sectionInIconBorderColor}`}`,
                        background: active
                          ? HeaderIconStyle.background
                          : settings.sectionInIconBgColor,
                        color: active ? HeaderIconStyle.color : settings.sectionInIconColor,
                      }}
                    >
                      {label}
                    </button>
                  );
                })}
                <button
                  key={"__all"}
                  role="tab"
                  type="button"
                  aria-selected={quickCat === "__all"}
                  onClick={() => setQuickCat("__all")}
                  className="shrink-0 shadow-sm rounded-full px-3 py-1.5 text-[11px] font-semibold transition"
                  style={{
                    border: `${quickCat === "__all" ? HeaderIconStyle.border : `1px solid ${settings.sectionInIconBorderColor}`}`,
                    background:
                      quickCat === "__all"
                        ? HeaderIconStyle.background
                        : settings.sectionInIconBgColor,
                    color:
                      quickCat === "__all" ? HeaderIconStyle.color : settings.sectionInIconColor,
                  }}
                >
                  All Items
                </button>
              </div>

              <ul className="max-h-[50vh] overflow-y-auto px-3 py-3 scrollbar-dark">
                {quickItems.length === 0 && (
                  <li
                    className="px-3 py-6 text-center text-xs"
                    style={{ color: settings.sectionItemTextColor }}
                  >
                    No items in this category yet.
                  </li>
                )}
                {quickItems.map((item) => (
                  <li
                    key={item.id}
                    className="flex items-center gap-3 rounded-2xl p-2.5 transition hover:opacity-90"
                    style={{ borderRadius: radius }}
                  >
                    {item.image?.url && (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={item.image.url}
                        alt={item.name}
                        className="h-14 w-14 shrink-0 rounded-xl object-cover"
                        loading="lazy"
                      />
                    )}
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1.5">
                        <span
                          className="truncate text-sm font-semibold"
                          style={sectionItemHeadingStyle}
                        >
                          {item.name}
                        </span>
                      </div>
                      <div
                        className="truncate text-[11px]"
                        style={{ color: settings.sectionItemTextColor }}
                      >
                        {item.description}
                      </div>
                      <MenuItemTags tags={item.tags} settings={settings} className="mt-1.5" />
                    </div>
                    {!isOrderingClosed && (
                      <span
                        className="shrink-0 text-sm font-bold"
                        style={{ color: settings.sectionItemHeadingColor }}
                      >
                        {currency}
                        {item.price}
                      </span>
                    )}
                  </li>
                ))}
              </ul>

              <div className="px-5 pb-5 pt-2">
                <Link
                  href={venueUrl(restaurant.slug, "/menu")}
                  target="_blank"
                  className="inline-flex pv-link w-full items-center justify-center gap-2 rounded-full px-5 py-3 text-sm font-semibold transition hover:opacity-90"
                  style={{ ...buttonStyle(), borderRadius: buttonRadius }}
                >
                  View full menu <ArrowRight className="h-4 w-4" />
                </Link>
                {!isOrderingClosed && (
                  <p
                    className="mt-2 text-center text-[10px]"
                    style={{ color: settings.sectionItemTextColor }}
                  >
                    Browse all items, add to cart and pay securely.
                  </p>
                )}
              </div>
            </div>
          </div>
        )}
        {selectedGalleryItem && (
          <div
            className="fixed inset-0 z-60 flex items-center justify-center bg-black/70 py-4 px-0 sm:p-4 backdrop-blur-sm"
            onClick={() => setSelectedGalleryItem(null)}
          >
            <div
              className="relative h-screen flex items-center justify-center w-full overflow-hidden rounded-xl"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Close button */}
              <button
                onClick={() => setSelectedGalleryItem(null)}
                className="absolute right-2 top-2 z-10 rounded-full bg-black/50 p-2 text-white hover:bg-black/70 transition"
                aria-label="Close preview"
              >
                <XIcon className="h-5 w-5" />
              </button>

              {/* Navigation buttons (show only if more than one item) */}
              {galleryItems.length > 1 && (
                <>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      const currentIndex = galleryItems.findIndex(
                        (item) => item.id === selectedGalleryItem.id,
                      );
                      const prevIndex =
                        (currentIndex - 1 + galleryItems.length) % galleryItems.length;
                      setSelectedGalleryItem(galleryItems[prevIndex]);
                    }}
                    className="absolute left-2 bottom-5 -translate-y-1/2 z-10 rounded-full bg-black/50 p-2 text-white hover:bg-black/70 transition"
                    aria-label="Previous"
                  >
                    <ArrowRight className="h-6 w-6 rotate-180" />
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      const currentIndex = galleryItems.findIndex(
                        (item) => item.id === selectedGalleryItem.id,
                      );
                      const nextIndex = (currentIndex + 1) % galleryItems.length;
                      setSelectedGalleryItem(galleryItems[nextIndex]);
                    }}
                    className="absolute right-2 bottom-5 -translate-y-1/2 z-10 rounded-full bg-black/50 p-2 text-white hover:bg-black/70 transition"
                    aria-label="Next"
                  >
                    <ArrowRight className="h-6 w-6" />
                  </button>
                </>
              )}

              {/* Render the selected item */}
              {selectedGalleryItem.type === "image" ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={selectedGalleryItem.image?.url ?? ""}
                  alt={selectedGalleryItem.title ?? ""}
                  className="max-h-[85vh] sm:max-w-[85vw] object-contain"
                />
              ) : (
                <div className="relative w-full :max-h-[85vh] sm:max-w-[85vw]">
                  <iframe
                    src={selectedGalleryItem.youtube_url ?? ""}
                    title={selectedGalleryItem.title ?? "YouTube video"}
                    className="aspect-video w-full max-h-[85vh] rounded-lg"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                  />
                </div>
              )}
            </div>
          </div>
        )}
        {/* Success story full‑screen dialog */}
        {selectedEvent && (
          <div
            className="fixed inset-0 z-70 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm"
            onClick={() => setSelectedEvent(null)}
            role="dialog"
            aria-modal="true"
            aria-label={selectedEvent.title}
          >
            <div
              className="relative max-h-[90vh] w-full max-w-lg overflow-y-auto shadow-2xl"
              style={{ ...sectionStyle(), borderRadius: sectionRadius, padding: 0 }}
              onClick={(e) => e.stopPropagation()}
            >
              <button
                onClick={() => setSelectedEvent(null)}
                className="absolute right-3 top-3 z-10 rounded-full bg-black/50 p-2 text-white transition hover:bg-black/70"
                aria-label="Close"
              >
                <XIcon className="h-5 w-5" />
              </button>

              <div className="p-5">
                <h2 className="pr-10 text-2xl font-bold" style={sectionItemHeadingStyle}>
                  {selectedEvent.title}
                </h2>

                <div
                  className="mt-3 flex flex-wrap gap-x-3 gap-y-1"
                  style={{
                    ...sectionItemTextStyle,
                    fontSize: Math.max(10, settings.sectionItemTextFontSize - 2),
                    opacity: 0.8,
                  }}
                >
                  <span className="flex items-center gap-1">
                    <span
                      className="inline-flex h-5 w-5 items-center justify-center"
                      style={sectionIconStyle}
                    >
                      <CalendarDays className="h-3 w-3" />
                    </span>
                    <span>{selectedEvent.date}</span>
                  </span>
                  <span className="flex items-center gap-1">
                    <span
                      className="inline-flex h-5 w-5 items-center justify-center"
                      style={sectionIconStyle}
                    >
                      <Clock3 className="h-3 w-3" />
                    </span>
                    <span>{selectedEvent.time}</span>
                  </span>
                  {selectedEvent.location && (
                    <span className="flex items-center gap-1">
                      <span
                        className="inline-flex h-5 w-5 items-center justify-center"
                        style={sectionIconStyle}
                      >
                        <MapPin className="h-3 w-3" />
                      </span>
                      <span>{selectedEvent.location}</span>
                    </span>
                  )}
                </div>

                <div className="mt-4 whitespace-pre-wrap" style={sectionItemTextStyle}>
                  {selectedEvent.description}
                </div>

                {/* Merchant-entered destination, so it leaves our tab safely. */}
                {selectedEvent.buttonText && selectedEvent.buttonLink && (
                  <a
                    href={selectedEvent.buttonLink}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-5 inline-flex w-full items-center justify-center gap-2 px-5 py-3 text-sm font-semibold transition hover:opacity-90"
                    style={{ ...buttonStyle(), borderRadius: buttonRadius }}
                  >
                    {selectedEvent.buttonText}
                    <ExternalLink className="h-4 w-4" />
                  </a>
                )}
              </div>
            </div>
          </div>
        )}
        {selectedSuccessStory && (
          <div
            className="fixed inset-0 z-70 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm"
            onClick={() => setSelectedSuccessStory(null)}
          >
            <div
              className="relative max-h-[90vh] max-w-lg w-full overflow-y-auto shadow-2xl"
              style={{
                ...sectionStyle(),
                borderRadius: sectionRadius,
                padding: 0,
              }}
              onClick={(e) => e.stopPropagation()}
            >
              {/* Close button */}
              <button
                onClick={() => setSelectedSuccessStory(null)}
                className="absolute right-3 top-3 z-10 rounded-full bg-black/50 p-2 text-white hover:bg-black/70 transition"
                aria-label="Close"
              >
                <XIcon className="h-5 w-5" />
              </button>

              {/* Image (if exists) */}
              {selectedSuccessStory.image?.url && (
                <div className="aspect-video w-full overflow-hidden ">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={selectedSuccessStory.image.url}
                    alt={selectedSuccessStory.title ?? "Success story"}
                    className="h-full w-full object-cover"
                  />
                </div>
              )}

              {/* Content */}
              <div className="p-5">
                <h2 className="text-2xl font-bold" style={sectionItemHeadingStyle}>
                  {selectedSuccessStory.title}
                </h2>

                <div className="mt-3 whitespace-pre-wrap" style={sectionItemTextStyle}>
                  {selectedSuccessStory.body}
                </div>
              </div>
            </div>
          </div>
        )}
        {/* Opening hours for the whole week */}
        {hoursOpen && isSlugPage && hasOpeningHours && (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm"
            onClick={() => setHoursOpen(false)}
          >
            <div
              className="w-full max-w-[90vw] sm:max-w-sm overflow-hidden shadow-2xl"
              style={sectionStyleWithoutPadding}
              onClick={(e) => e.stopPropagation()}
            >
              <div
                className="flex items-center justify-between px-5 py-4"
                style={{ borderBottom: `1px solid ${settings.sectionBorderColor}` }}
              >
                <div className="flex items-center gap-2.5">
                  <span
                    className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl"
                    style={HeaderIconStyle}
                  >
                    <Clock3 className="h-4 w-4" />
                  </span>
                  <div>
                    <div className="text-sm font-semibold" style={sectionItemHeadingStyle}>
                      Opening hours
                    </div>
                    <div className="text-[10px]" style={{ color: settings.sectionItemTextColor }}>
                      When you can find us
                    </div>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setHoursOpen(false)}
                  className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full transition hover:opacity-80"
                  style={sectionIconStyle}
                  aria-label="Close"
                >
                  <XIcon className="h-4 w-4" />
                </button>
              </div>

              <ul className="px-5 py-3">
                {DAYS.map(({ key, label }) => {
                  const day = restaurant.opening_hours?.[Number(key)];
                  const isToday = Number(key) === venueToday;
                  return (
                    <li
                      key={key}
                      className="flex items-center justify-between gap-3 py-1.5 text-xs"
                      style={{ opacity: day?.isOpen ? 1 : 0.6 }}
                    >
                      <span
                        className="flex items-center gap-1.5"
                        style={{
                          ...sectionItemTextStyle,
                          fontWeight: isToday ? 700 : sectionItemTextStyle.fontWeight,
                        }}
                      >
                        {label}
                        {isToday && (
                          <span
                            className="rounded-full px-1.5 py-0.5 text-[9px] uppercase tracking-wider"
                            style={sectionIconStyle}
                          >
                            Today
                          </span>
                        )}
                      </span>
                      <span
                        className="tabular-nums"
                        style={{
                          ...sectionItemTextStyle,
                          fontWeight: isToday ? 700 : sectionItemTextStyle.fontWeight,
                        }}
                      >
                        {day?.isOpen && day.openTime && day.closeTime
                          ? `${formatTimeLabel(day.openTime)} – ${formatTimeLabel(day.closeTime)}`
                          : "Closed"}
                      </span>
                    </li>
                  );
                })}
              </ul>

              {restaurant.timezone && (
                <div
                  className="px-5 py-3 text-[10px]"
                  style={{
                    borderTop: `1px solid ${settings.sectionBorderColor}`,
                    color: settings.sectionItemTextColor,
                  }}
                >
                  <div className="flex items-center gap-1.5">
                    <MapPin className="h-3 w-3 shrink-0" />
                    <span>Times shown in the venue&apos;s timezone ({restaurant.timezone})</span>
                  </div>
                  {visitorTimezone && visitorTimezone !== restaurant.timezone && (
                    <div className="mt-1 pl-4.5">Your timezone is {visitorTimezone}.</div>
                  )}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </>
  );
};
