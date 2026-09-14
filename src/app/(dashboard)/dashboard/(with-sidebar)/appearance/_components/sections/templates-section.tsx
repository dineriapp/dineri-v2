import { AppearanceSettings, UpdateFunctionType } from "@/lib/types/appearnace";
import { TEMPLATES } from "./templates-data";
import { cn } from "@/lib/utils";
import { Check } from "lucide-react";

type Props = {
  appearance: AppearanceSettings;
  update: UpdateFunctionType;
};

export const TemplatesSection = ({ update, appearance }: Props) => {
  const applyTemplate = (settings: AppearanceSettings, id: string) => {
    Object.entries(settings).forEach(([key, value]) => {
      update(key as keyof AppearanceSettings, value);
    });
    update("id", id);
  };

  return (
    <div className="grid grid-cols-2 gap-3 min-[420px]:grid-cols-3 sm:gap-4 xl:grid-cols-5">
      {TEMPLATES.map((template) => (
        <button
          key={template.id}
          onClick={() => applyTemplate(template.settings, template.id)}
          className={cn("group flex flex-col items-center gap-2")}
        >
          {/* Preview Card */}
          <div
            className={cn(
              "relative w-full aspect-24/24 rounded-2xl overflow-hidden border transition-all duration-300 group-hover:scale-105",
              appearance.id === template.id &&
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
            {appearance.id === template.id && (
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
            {appearance.id === template.id && (
              <span className="inline-block h-2 w-2 rounded-full bg-primary" />
            )}
          </span>
        </button>
      ))}
    </div>
  );
};
