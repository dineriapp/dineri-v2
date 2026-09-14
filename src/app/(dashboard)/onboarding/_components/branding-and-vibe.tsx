"use client";
import { Data } from "@/lib/types/onboarding";
import { cn } from "@/lib/utils";
import { Check } from "lucide-react";
import { TEMPLATES } from "../../dashboard/(with-sidebar)/appearance/_components/sections/templates-data";

type Props = {
  update: <K extends keyof Data>(k: K, v: Data[K]) => void;
  data: Data;
};

const BrandingAndVibe = ({ data, update }: Props) => {
  return (
    <div className="-mt-2">
      <div className="">
        <div className="w-full grid grid-cols-2 md:grid-cols-4 gap-2.5">
          {TEMPLATES.map((template) => (
            <button
              key={template.id}
              onClick={() => update("brandColor", template.id)}
              className={cn("group flex flex-col items-center gap-2")}
            >
              {/* Preview Card */}
              <div
                className={cn(
                  "relative w-full aspect-24/24 rounded-2xl overflow-hidden border transition-all duration-300 group-hover:scale-105",
                  data.brandColor === template.id &&
                    "border-primary ring-2 ring-primary/50 shadow-lg shadow-primary/20",
                )}
                style={{
                  background:
                    template.settings.bg_style === "gradient"
                      ? `linear-gradient(135deg, ${
                          template.settings.bg_gradient?.from
                        }, ${template.settings.bg_gradient?.to})`
                      : template.settings.bg_color,
                }}
              >
                {/* Fake Text Preview */}
                <div
                  className="absolute top-3 left-3 text-xl font-bold"
                  style={{
                    color: template.settings.heading_color,
                    fontFamily: template.settings.fontFamily,
                  }}
                >
                  Aa
                </div>

                {/* Fake Button Preview */}
                <div
                  className="absolute bottom-4 translate-x-10 left-3 flex items-center justify-center right-3 h-10 rounded-full border"
                  style={{
                    background: template.settings.buttonBgColor,
                    borderColor: template.settings.buttonBorderColor,
                    fontFamily: template.settings.fontFamily,
                    color: template.settings.buttonTextColor,
                    borderRadius: `${template.settings.buttonRadiusPx}px`,
                  }}
                >
                  Button
                </div>
                {data.brandColor === template.id && (
                  <div className="absolute inset-0 flex items-center justify-center bg-black/30 backdrop-blur-[2px]">
                    <div className="rounded-full bg-primary p-1.5 shadow-lg">
                      <Check className="h-5 w-5 text-primary-foreground" />
                    </div>
                  </div>
                )}
                {/* Optional Glow */}
                <div className="absolute inset-0 bg-black/5 opacity-0 group-hover:opacity-100 transition" />
              </div>

              {/* Template Name */}
              <span className="text-xs font-medium flex items-center justify-center gap-1 text-center text-muted-foreground">
                {template.name}
                {data.brandColor === template.id && (
                  <span className="inline-block h-2 w-2 rounded-full bg-primary" />
                )}
              </span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

export default BrandingAndVibe;
