import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { AppearanceSettings, FontWeight, UpdateFunctionType } from "@/lib/types/appearnace";
import { AlignLeft, MousePointerClick, Palette, Square, Type } from "lucide-react";
import { Card, ColorInput, Field, Label } from "../jsx-utils";

type Props = {
  appearance: AppearanceSettings;
  update: UpdateFunctionType;
};

const ButtonStylesSection = ({ appearance, update }: Props) => {
  const showIcons = appearance.buttonShowIcons ?? true;
  const iconSize = appearance.buttonIconSize ?? 44;
  const buttonHeight = iconSize + appearance.buttonPaddingY * 2;

  return (
    <Card
      icon={MousePointerClick}
      title="Button Styling"
      desc="Customize button appearance, spacing, typography and icons."
    >
      {/* Style & Shape - with visual examples */}
      <div className="mb-6">
        <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3 flex items-center gap-2">
          <Square className="w-3.5 h-3.5" /> Style & Shape
        </h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Style picker with visual buttons */}
          <div>
            <Label className="text-xs font-medium block mb-1.5">Button Style</Label>
            <div className="flex gap-2">
              {[
                {
                  id: "solid",
                  label: "Solid",
                  style: { background: "#d5e700", color: "black", border: "none" },
                },
                {
                  id: "outline",
                  label: "Outline",
                  style: {
                    background: "transparent",
                    color: "#d5e700",
                    border: "2px solid #d5e700",
                  },
                },
                {
                  id: "gradient",
                  label: "Gradient",
                  style: {
                    background: "linear-gradient(135deg, #ff8f6b 0%, #d5e700 100%)",
                    color: "#000000",
                    border: "none",
                  },
                },
              ].map(({ id, label, style }) => (
                <button
                  key={id}
                  type="button"
                  onClick={() => update("buttonStyle", id as AppearanceSettings["buttonStyle"])}
                  className={`flex-1 h-12 rounded-md text-xs font-medium transition-all ${
                    appearance.buttonStyle === id
                      ? "border-2 border-primary scale-[1.02] ring-2 ring-white ring-offset-1"
                      : "border border-transparent opacity-50 hover:opacity-100"
                  }`}
                  style={style}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          {/* Shape picker with visual buttons */}
          <div>
            <Label className="text-xs font-medium block mb-1.5">Button Shape</Label>
            <div className="flex gap-2">
              {[
                { id: "pill", label: "Pill", radius: 9999 },
                { id: "rounded", label: "Rounded", radius: 12 },
                { id: "square", label: "Square", radius: 4 },
              ].map(({ id, label, radius }) => (
                <button
                  key={id}
                  type="button"
                  onClick={() => {
                    update("buttonShape", id as AppearanceSettings["buttonShape"]);
                    update("buttonRadiusPx", radius);
                  }}
                  className={`flex-1 h-12 bg-primary/10 text-primary font-medium text-xs transition-all ${
                    appearance.buttonShape === id
                      ? "ring-2 ring-primary ring-offset-0"
                      : "opacity-60 hover:opacity-100"
                  }`}
                  style={{ borderRadius: radius === 9999 ? "9999px" : `${radius}px` }}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Colors (normal state) */}
      <div className="mb-6">
        <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3 flex items-center gap-2">
          <Palette className="w-3.5 h-3.5" /> Normal State Colors
        </h4>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {ColorInput("Background", appearance.buttonBgColor, (v) => update("buttonBgColor", v))}
          {appearance.buttonStyle === "gradient" &&
            ColorInput("Gradient End", appearance.buttonBgColorTo, (v) =>
              update("buttonBgColorTo", v),
            )}
          {ColorInput("Text", appearance.buttonTextColor, (v) => update("buttonTextColor", v))}
          {ColorInput("Border", appearance.buttonBorderColor, (v) =>
            update("buttonBorderColor", v),
          )}
        </div>
      </div>

      {/* Hover Colors */}
      <div className="mb-6">
        <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3 flex items-center gap-2">
          <MousePointerClick className="w-3.5 h-3.5" /> Hover State Colors
        </h4>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {ColorInput("Hover Background", appearance.buttonHoverBgColor, (v) =>
            update("buttonHoverBgColor", v),
          )}
          {ColorInput("Hover Text", appearance.buttonHoverTextColor, (v) =>
            update("buttonHoverTextColor", v),
          )}
          {ColorInput("Hover Border", appearance.buttonHoverBorderColor, (v) =>
            update("buttonHoverBorderColor", v),
          )}
        </div>
      </div>

      {/* Typography & Padding */}
      <div className="mb-6">
        <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3 flex items-center gap-2">
          <Type className="w-3.5 h-3.5" /> Typography & Spacing
        </h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Field label="Font Size">
            <Slider
              min={10}
              max={24}
              step={1}
              value={[appearance.buttonFontSize]}
              onValueChange={([v]) => update("buttonFontSize", v)}
              className="h-1.5"
            />
            <div className="flex justify-between text-[11px] text-muted-foreground mt-0.5">
              <span>10px</span>
              <span>{appearance.buttonFontSize}px</span>
              <span>24px</span>
            </div>
          </Field>
          <Field label="Font Weight">
            <Select
              value={String(appearance.buttonFontWeight)}
              onValueChange={(value) => {
                update("buttonFontWeight", Number(value) as FontWeight);
              }}
            >
              <SelectTrigger className="w-full rounded-sm bg-transparent">
                <SelectValue placeholder="Select font" />
              </SelectTrigger>

              <SelectContent>
                {[
                  { label: "Regular", value: `400` },
                  { label: "Medium", value: `500` },
                  { label: "Semibold", value: `600` },
                  { label: "Bold", value: `700` },
                  { label: "Extrabold", value: `800` },
                ].map((font) => (
                  <SelectItem key={font.label} value={font.value}>
                    <span>{font.label}</span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-3">
          <Field label="Vertical Padding (top/bottom)">
            <Slider
              min={4}
              max={32}
              step={1}
              value={[appearance.buttonPaddingY]}
              onValueChange={([v]) => update("buttonPaddingY", v)}
              className="h-1.5"
            />
            <div className="flex justify-between text-[11px] text-muted-foreground mt-0.5">
              <span>4px</span>
              <span>{appearance.buttonPaddingY}px</span>
              <span>32px</span>
            </div>
          </Field>
          <Field label="Horizontal Padding (left/right)">
            <Slider
              min={8}
              max={48}
              step={1}
              value={[appearance.buttonPaddingX]}
              onValueChange={([v]) => update("buttonPaddingX", v)}
              className="h-1.5"
            />
            <div className="flex justify-between text-[11px] text-muted-foreground mt-0.5">
              <span>8px</span>
              <span>{appearance.buttonPaddingX}px</span>
              <span>48px</span>
            </div>
          </Field>
        </div>
      </div>

      {/* Icon Settings */}
      <div>
        <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3 flex items-center gap-2">
          <AlignLeft className="w-3.5 h-3.5" /> Icon (inside button)
        </h4>

        <label className="mb-3 flex cursor-pointer items-center justify-between gap-3 rounded-lg border border-white/10 bg-surface-1/60 px-3 py-2.5">
          <span className="min-w-0">
            <span className="block text-xs font-medium">Show icons in buttons</span>
            <span className="block text-[11px] text-muted-foreground">
              Turn off for text-only buttons.
            </span>
          </span>
          <Switch
            checked={showIcons}
            onCheckedChange={(v) => update("buttonShowIcons", v)}
            aria-label="Show icons in buttons"
          />
        </label>

        {showIcons && (
          <Field label="Icon Size" className="mb-3">
            <Slider
              min={24}
              max={72}
              step={1}
              value={[iconSize]}
              onValueChange={([v]) => update("buttonIconSize", v)}
              className="h-1.5"
            />
            <div className="flex justify-between text-[11px] text-muted-foreground mt-0.5">
              <span>24px</span>
              <span>{iconSize}px</span>
              <span>72px</span>
            </div>
            <p className="mt-1 text-[11px] text-muted-foreground">
              The icon is taller than the label, so this sets the button&apos;s height. Button
              height ≈ {buttonHeight}px (icon {iconSize} + padding {appearance.buttonPaddingY} × 2).
            </p>
          </Field>
        )}

        <div
          className={`grid grid-cols-2 sm:grid-cols-3 gap-3 ${!showIcons ? "pointer-events-none opacity-40" : ""}`}
        >
          {ColorInput("Icon Background", appearance.iconBgColor, (v) => update("iconBgColor", v))}
          {ColorInput("Icon Color", appearance.iconColor, (v) => update("iconColor", v))}
          {ColorInput("Icon Border", appearance.iconBorderColor, (v) =>
            update("iconBorderColor", v),
          )}
        </div>
        <Field
          label="Icon Corner Radius"
          className={`mt-3 ${!showIcons ? "pointer-events-none opacity-40" : ""}`}
        >
          <Slider
            min={0}
            max={30}
            step={1}
            value={[appearance.iconRadiusPx ?? 12]}
            onValueChange={([v]) => update("iconRadiusPx", v)}
            className="h-1.5"
          />
          <div className="flex justify-between text-[11px] text-muted-foreground mt-0.5">
            <span>0px</span>
            <span>{appearance.iconRadiusPx ?? 12}px</span>
            <span>30px</span>
          </div>
        </Field>
      </div>
    </Card>
  );
};

export default ButtonStylesSection;
