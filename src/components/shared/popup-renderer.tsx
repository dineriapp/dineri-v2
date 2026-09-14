"use client";

import {
  getGlassFilter,
  resolvedButtonRadius,
  SHADOW_MAP,
} from "@/app/(dashboard)/dashboard/(with-sidebar)/appearance/_components/utils";
import { PopupType } from "@/drizzle/types";
import {
  useTrackPopupClick,
  useTrackPopupImpression,
} from "@/lib/tanstack-react-query/hooks/popups";
import { markPopupSeen, readSeenPopups } from "@/lib/services/popup-session";
import { AppearanceSettings } from "@/lib/types/appearnace";
import { cn } from "@/lib/utils";
import { SparkleIcon, X } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";

type Props = {
  popups: PopupType[];
  settings: AppearanceSettings;
  onPage: PopupType["onPage"];
  contained?: boolean;
  track?: boolean;
};

const openTracked = (tab: Window | null, url: string) => {
  if (tab && !tab.closed) {
    tab.location.replace(url);
    return;
  }

  const opened = window.open(url, "_blank", "noopener,noreferrer");
  if (!opened) {
    window.location.href = url;
  }
};

export function PopupRenderer({
  popups,
  settings,
  onPage,
  contained = false,
  track = true,
}: Props) {
  const [seenAtMount] = useState(() => (track ? readSeenPopups() : new Set<string>()));

  const queue = useMemo(
    () =>
      popups
        .filter((p) => p.status === "live" && p.onPage === onPage && !seenAtMount.has(p.id))
        .sort((a, b) => {
          if (a.trigger_after_seconds !== b.trigger_after_seconds) {
            return a.trigger_after_seconds - b.trigger_after_seconds;
          }
          return +new Date(a.createdAt) - +new Date(b.createdAt);
        }),
    [popups, onPage, seenAtMount],
  );

  const [index, setIndex] = useState(0);
  const [visible, setVisible] = useState(false);
  const [redirecting, setRedirecting] = useState(false);

  const current = queue[index] ?? null;

  const { mutate: trackImpression } = useTrackPopupImpression();
  const { mutateAsync: trackClick } = useTrackPopupClick();
  const seenIds = useRef<Set<string>>(new Set());

  useEffect(() => {
    setVisible(false);
    if (!current) return;

    const timer = setTimeout(() => {
      setVisible(true);
    }, current.trigger_after_seconds * 1000);

    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [current?.id]);

  useEffect(() => {
    if (!track || !visible || !current) return;
    if (seenIds.current.has(current.id)) return;

    seenIds.current.add(current.id);
    trackImpression(current.id);
    markPopupSeen(current.id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [track, visible, current?.id]);

  const dismiss = () => {
    setVisible(false);
    setIndex((i) => i + 1);
  };

  const handleCtaClick = async (event: React.MouseEvent<HTMLAnchorElement>) => {
    if (!track || !current) return;

    event.preventDefault();
    if (redirecting) return;

    const { id, ctaUrl } = current;
    const tab = window.open("about:blank", "_blank");
    if (tab) tab.opener = null;

    setRedirecting(true);
    try {
      const result = await trackClick(id);
      openTracked(tab, result.ctaUrl || ctaUrl);
    } catch {
      openTracked(tab, ctaUrl);
    } finally {
      setRedirecting(false);
      dismiss();
    }
  };

  if (!current || !visible) return null;

  const glassFilter = getGlassFilter(settings.glassBlur);
  const buttonRadius = resolvedButtonRadius(settings);

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

  const cardStyle: React.CSSProperties = (() => {
    const base = { ...sectionDepth, borderRadius: `${settings.sectionRadiusPx}px` };
    switch (settings.sectionStyle) {
      case "outline":
        return {
          ...base,
          background: "transparent",
          border: `1px solid ${settings.sectionBorderColor}`,
        };
      case "gradient":
        return {
          ...base,
          background: `linear-gradient(135deg, ${settings.sectionBgColor}, ${settings.sectionBgColorTo})`,
          border: `1px solid ${settings.sectionBorderColor}`,
        };
      case "solid":
      default:
        return {
          ...base,
          background: settings.sectionBgColor,
          border: `1px solid ${settings.sectionBorderColor}`,
        };
    }
  })();

  const primaryButtonStyle: React.CSSProperties = (() => {
    switch (settings.buttonStyle) {
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
          background: `linear-gradient(135deg, ${settings.buttonBgColor}, ${settings.buttonBgColorTo})`,
          color: settings.buttonTextColor,
          border: `1px solid ${settings.buttonBorderColor}`,
        };
      case "solid":
      default:
        return {
          ...buttonDepth,
          background: settings.buttonBgColor,
          color: settings.buttonTextColor,
          border: `1px solid ${settings.buttonBorderColor}`,
        };
    }
  })();

  const headingStyle: React.CSSProperties = {
    color: settings.sectionItemHeadingColor,
    fontSize: `${settings.sectionItemHeadingFontSize}px`,
    fontWeight: settings.sectionItemHeadingFontWeight,
  };

  const textStyle: React.CSSProperties = {
    color: settings.sectionItemTextColor,
    fontSize: `${settings.sectionItemTextFontSize}px`,
    fontWeight: settings.sectionItemTextFontWeight,
  };

  const badgeStyle: React.CSSProperties = {
    background: settings.sectionIconBgColor,
    color: settings.sectionIconColor,
    border: `1px solid ${settings.sectionIconBorderColor}`,
  };

  const mutedChipStyle: React.CSSProperties = {
    background: settings.sectionInIconBgColor,
    color: settings.sectionInIconColor,
    border: `1px solid ${settings.sectionInIconBorderColor}`,
  };

  return (
    <div
      className={cn(
        "z-40 flex items-center justify-center bg-black/60 p-0 backdrop-blur-sm sm:p-4",
        contained ? "absolute inset-0" : "fixed inset-0",
      )}
      onClick={dismiss}
    >
      <div
        className="w-full max-w-[90vw] animate-scale-in max-h-[90vh] overflow-y-auto sm:max-w-md"
        style={cardStyle}
        onClick={(e) => e.stopPropagation()}
      >
        <div
          className="flex items-center justify-between px-4 py-3"
          style={{ borderBottom: `1px solid ${settings.sectionBorderColor}` }}
        >
          {current.badge ? (
            <span
              className="inline-flex gap-1 items-center rounded-full px-2 py-1 text-[10px] font-medium tracking-widest"
              style={badgeStyle}
            >
              <SparkleIcon className="size-3" /> {current.badge}
            </span>
          ) : (
            <div></div>
          )}

          <button
            type="button"
            onClick={dismiss}
            aria-label="Dismiss"
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full transition hover:opacity-80"
            style={mutedChipStyle}
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="px-5 py-4 space-y-1">
          <div
            className="truncate text-sm font-semibold"
            style={{ ...headingStyle, fontSize: "24px", fontWeight: 600 }}
          >
            {current.title}
          </div>
          <p style={{ ...textStyle, fontSize: "14px", fontWeight: 400 }} className="leading-[1.4]">
            {current.body}
          </p>
        </div>

        <div className="px-5 pb-5 pt-2">
          <div className="grid">
            <a
              href={current.ctaUrl}
              target="_blank"
              rel="noreferrer"
              onClick={track ? handleCtaClick : dismiss}
              aria-busy={redirecting}
              className={cn(
                "inline-flex items-center justify-center px-5 py-2.5 text-sm font-semibold transition hover:opacity-90",
                redirecting && "pointer-events-none opacity-70",
              )}
              style={{ ...primaryButtonStyle, borderRadius: buttonRadius }}
            >
              {current.cta}
            </a>
          </div>

          {current.footerNote && (
            <p
              className="mt-2 text-center text-[10px]"
              style={{ color: settings.sectionItemTextColor }}
            >
              {current.footerNote}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
