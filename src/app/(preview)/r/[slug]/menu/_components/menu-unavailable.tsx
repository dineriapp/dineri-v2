import {
    backgroundStyle,
    getContrast,
    getFontStack,
    getGlassFilter,
    resolvedButtonRadius,
    SHADOW_MAP,
} from "@/app/(dashboard)/dashboard/(with-sidebar)/appearance/_components/utils";
import { AppearanceSettings } from "@/lib/types/appearnace";
import { UtensilsCrossed } from "lucide-react";
import Link from "next/link";

type Props = {
    slug: string;
    name: string;
    settings: AppearanceSettings;
};

export function MenuUnavailable({ slug, name, settings }: Props) {
    const glassFilter = getGlassFilter(settings.glassBlur);
    const buttonRadius = resolvedButtonRadius(settings);

    const buttonDepth: React.CSSProperties = {
        boxShadow: SHADOW_MAP[settings.buttonShadow ?? "none"],
        backdropFilter: glassFilter,
        WebkitBackdropFilter: glassFilter,
    };

    const buttonStyle: React.CSSProperties = (() => {
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

    return (
        <main
            className="flex min-h-screen items-center justify-center px-4 py-10"
            style={{
                ...backgroundStyle(settings),
                fontFamily: getFontStack(settings.fontFamily),
                color: settings.text_color,
            }}
        >
            <div className="w-full max-w-sm text-center">
                <div
                    className="mx-auto flex h-16 w-16 items-center justify-center rounded-full shadow-2xl"
                    style={{
                        background: getContrast(settings.heading_color),
                        color: settings.heading_color,
                    }}
                >
                    <UtensilsCrossed className="h-7 w-7" />
                </div>
                <h1
                    className="mt-6 text-xl font-bold tracking-tight"
                    style={{ color: settings.heading_color }}
                >
                    Menu temporarily unavailable
                </h1>
                <p className="mx-auto mt-2 max-w-xs text-sm" style={{ color: settings.text_color }}>
                    {name} isn&apos;t taking orders online right now. Please check back later.
                </p>
                <Link
                    href={`/r/${slug}`}
                    className="mt-6 inline-flex items-center justify-center px-5 py-3 text-sm font-semibold transition hover:opacity-90"
                    style={{ ...buttonStyle, borderRadius: buttonRadius }}
                >
                    Back to {name}
                </Link>
            </div>
        </main>
    );
}
