import { backgroundStyle } from "@/app/(dashboard)/dashboard/(with-sidebar)/appearance/_components/utils";
import { AppearanceSettings } from "@/lib/types/appearnace";
import { cn } from "@/lib/utils";

export function AppearanceBackground({
  settings,
  mode = "fixed",
  className,
}: {
  settings: AppearanceSettings;
  mode?: "fixed" | "absolute";
  className?: string;
}) {
  const layer = cn(
    mode === "fixed" ? "fixed h-[100lvh]" : "absolute",
    "inset-0 -z-10 overflow-hidden pointer-events-none",
    className,
  );

  if (settings.bg_style === "image" && settings.bg_image) {
    const opacity =
      typeof settings.bg_image_opacity === "number" ? settings.bg_image_opacity : 0.55;

    return (
      <div aria-hidden className={layer}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={settings.bg_image}
          alt=""
          className="h-full w-full object-cover object-center"
          decoding="async"
          fetchPriority={mode === "fixed" ? "high" : "auto"}
        />
        <div className="absolute inset-0" style={{ background: `rgba(0,0,0,${opacity})` }} />
      </div>
    );
  }

  return <div aria-hidden className={layer} style={backgroundStyle(settings)} />;
}
