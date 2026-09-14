import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { AppearanceSettings, FontWeight, UpdateFunctionType } from "@/lib/types/appearnace";
import { cn } from "@/lib/utils";
import { ImageIcon, LayoutGrid, Palette, Square, Type } from "lucide-react";
import { Card, ColorInput, Field } from "../jsx-utils";

type Props = {
  appearance: AppearanceSettings;
  update: UpdateFunctionType;
};

const sectionStyles = [
  {
    id: "solid",
    label: "Solid",
    preview: <div className="h-10 rounded-lg bg-muted" />,
  },
  {
    id: "outline",
    label: "Outline",
    preview: <div className="h-10 rounded-lg border-2 border-muted-foreground/50" />,
  },
  {
    id: "gradient",
    label: "Gradient",
    preview: <div className="h-10 rounded-lg bg-linear-to-r from-red-500 to-blue-500" />,
  },
] as const;

const sectionShapes = [
  // {
  //     id: "pill",
  //     label: "Pill",
  //     preview: <div className="h-10 rounded-full bg-muted" />,
  // },
  {
    id: "rounded",
    label: "Rounded",
    preview: <div className="h-10 rounded-xl bg-muted" />,
  },
  {
    id: "square",
    label: "Square",
    preview: <div className="h-10 rounded-md bg-muted" />,
  },
] as const;

const SectionStyles = ({ appearance, update }: Props) => {
  return (
    <Card
      icon={LayoutGrid}
      title="Section Styling"
      desc="Customize section cards, typography, and icons."
    >
      <div className="mb-6">
        <h4 className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          <Square className="h-3.5 w-3.5" /> Style & Shape
        </h4>
        <div className="mt-3 grid grid-cols-1 gap-4 md:grid-cols-2">
          {/* Style picker */}
          <Field label="Section Style">
            <div className="grid grid-cols-3 gap-2">
              {sectionStyles.map((style) => (
                <button
                  key={style.id}
                  type="button"
                  onClick={() => update("sectionStyle", style.id)}
                  className={cn(
                    "rounded-xl border p-2 transition-all",
                    appearance.sectionStyle === style.id
                      ? "border-primary bg-primary/5"
                      : "hover:border-muted-foreground/30",
                  )}
                >
                  {style.preview}
                  <div className="mt-2 text-xs font-medium">{style.label}</div>
                </button>
              ))}
            </div>
          </Field>

          {/* Shape picker */}
          <Field label="Section Shape">
            <div className="grid grid-cols-2 gap-2">
              {sectionShapes.map((shape) => (
                <button
                  key={shape.id}
                  type="button"
                  onClick={() => {
                    update("sectionShape", shape.id);
                    update(
                      "sectionRadiusPx",
                      // shape.id === "pill"
                      //     ? 99999
                      //     :
                      shape.id === "square" ? 8 : 16,
                    );
                  }}
                  className={cn(
                    "rounded-xl border p-2 transition-all",
                    appearance.sectionShape === shape.id
                      ? "border-primary bg-primary/5"
                      : "hover:border-muted-foreground/30",
                  )}
                >
                  {shape.preview}
                  <div className="mt-2 text-xs font-medium">{shape.label}</div>
                </button>
              ))}
            </div>
          </Field>
        </div>
      </div>

      {/* 2. COLORS  */}
      <div className="mb-6">
        <h4 className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          <Palette className="h-3.5 w-3.5" /> Colors
        </h4>
        <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-3">
          {ColorInput("Background", appearance.sectionBgColor, (v) => update("sectionBgColor", v))}
          {appearance.sectionStyle === "gradient" &&
            ColorInput("Gradient End", appearance.sectionBgColorTo, (v) =>
              update("sectionBgColorTo", v),
            )}
          {ColorInput("Border", appearance.sectionBorderColor, (v) =>
            update("sectionBorderColor", v),
          )}
        </div>
      </div>

      {/* ============================================================ */}
      {/* 3. PADDING                                                    */}
      {/* ============================================================ */}
      <div className="mb-6">
        <h4 className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          <LayoutGrid className="h-3.5 w-3.5" /> Padding
        </h4>
        <div className="mt-3 grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Field label={`Horizontal Padding (left/right) - ${appearance.sectionPaddingX}px`}>
            <Slider
              min={0}
              max={40}
              step={1}
              value={[appearance.sectionPaddingX]}
              onValueChange={([v]) => update("sectionPaddingX", v)}
            />
          </Field>
          <Field label={`Vertical Padding (top/bottom) - ${appearance.sectionPaddingY}px`}>
            <Slider
              min={0}
              max={40}
              step={1}
              value={[appearance.sectionPaddingY]}
              onValueChange={([v]) => update("sectionPaddingY", v)}
            />
          </Field>
        </div>
      </div>

      {/* ============================================================ */}
      {/* 4. HEADER ICON (section header icon)                         */}
      {/* ============================================================ */}
      <div className="mb-6">
        <h4 className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          <ImageIcon className="h-3.5 w-3.5" /> Header Icon
        </h4>
        <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-3">
          {ColorInput("Icon Background", appearance.sectionIconBgColor, (v) =>
            update("sectionIconBgColor", v),
          )}
          {ColorInput("Icon Color", appearance.sectionIconColor, (v) =>
            update("sectionIconColor", v),
          )}
          {ColorInput("Icon Border", appearance.sectionIconBorderColor, (v) =>
            update("sectionIconBorderColor", v),
          )}
        </div>
        <Field label={`Icon Corner Radius (${appearance.sectionIconRadiusPx}px)`} className="mt-3">
          <Slider
            min={0}
            max={40}
            step={1}
            value={[appearance.sectionIconRadiusPx]}
            onValueChange={([v]) => update("sectionIconRadiusPx", v)}
          />
        </Field>
      </div>

      {/* ============================================================ */}
      {/* 5. INNER CONTENT (headings & text)                           */}
      {/* ============================================================ */}
      <div className="mb-6">
        <h4 className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          <Type className="h-3.5 w-3.5" /> Inner Content
        </h4>
        <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-2">
          {ColorInput("Heading Color", appearance.sectionItemHeadingColor, (v) =>
            update("sectionItemHeadingColor", v),
          )}
          {ColorInput("Text Color", appearance.sectionItemTextColor, (v) =>
            update("sectionItemTextColor", v),
          )}
        </div>

        <div className="mt-3 grid grid-cols-1 gap-4 sm:grid-cols-2">
          {/* Heading settings */}
          <div className="space-y-4">
            <Field label={`Heading Size (${appearance.sectionItemHeadingFontSize}px)`}>
              <Slider
                min={10}
                max={24}
                step={1}
                value={[appearance.sectionItemHeadingFontSize]}
                onValueChange={([v]) => update("sectionItemHeadingFontSize", v)}
              />
            </Field>
            <Field label="Heading Weight">
              <Select
                value={String(appearance.sectionItemHeadingFontWeight)}
                onValueChange={(value) => {
                  update("sectionItemHeadingFontWeight", Number(value) as FontWeight);
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

          {/* Text settings */}
          <div className="space-y-4">
            <Field label={`Text Size (${appearance.sectionItemTextFontSize}px)`}>
              <Slider
                min={10}
                max={24}
                step={1}
                value={[appearance.sectionItemTextFontSize]}
                onValueChange={([v]) => update("sectionItemTextFontSize", v)}
              />
            </Field>
            <Field label="Text Weight">
              <Select
                value={String(appearance.sectionItemTextFontWeight)}
                onValueChange={(value) => {
                  update("sectionItemTextFontWeight", Number(value) as FontWeight);
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
        </div>
      </div>

      {/* ============================================================ */}
      {/* 6. INNER ICONS (icons inside section items)                  */}
      {/* ============================================================ */}
      <div>
        <h4 className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          <ImageIcon className="h-3.5 w-3.5" /> Inner Icons
        </h4>
        <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-3">
          {ColorInput("Icon Background", appearance.sectionInIconBgColor, (v) =>
            update("sectionInIconBgColor", v),
          )}
          {ColorInput("Icon Color", appearance.sectionInIconColor, (v) =>
            update("sectionInIconColor", v),
          )}
          {ColorInput("Icon Border", appearance.sectionInIconBorderColor, (v) =>
            update("sectionInIconBorderColor", v),
          )}
        </div>
        <Field
          label={`Icon Corner Radius (${appearance.sectionInIconRadiusPx}px)`}
          className="mt-3"
        >
          <Slider
            min={0}
            max={40}
            step={1}
            value={[appearance.sectionInIconRadiusPx]}
            onValueChange={([v]) => update("sectionInIconRadiusPx", v)}
          />
        </Field>
      </div>
    </Card>
  );
};

export default SectionStyles;
