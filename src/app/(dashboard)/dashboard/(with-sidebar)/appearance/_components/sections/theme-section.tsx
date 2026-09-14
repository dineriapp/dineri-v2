import { MultiImageUploader } from "@/components/shared/image-uploader";
import { Slider } from "@/components/ui/slider";
import { AppearanceSettings, UpdateFunctionType } from "@/lib/types/appearnace";
import { cn, getS3KeyFromUrl } from "@/lib/utils";
import { Palette, UploadCloud } from "lucide-react";
import { Card, Field, Label } from "../jsx-utils";
import { BG_COLOR_OPTIONS, input_class } from "../utils";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

type Props = {
  appearance: AppearanceSettings;
  update: UpdateFunctionType;
};

const backgroundStyles = [
  {
    id: "color",
    label: "Color",
    preview: <div className="h-10 rounded-md bg-blue-500" />,
  },
  {
    id: "gradient",
    label: "Gradient",
    preview: <div className="h-10 rounded-md bg-linear-to-br from-violet-500 to-blue-500" />,
  },
  {
    id: "image",
    label: "Image",
    preview: (
      <div
        className="h-10 rounded-md bg-cover bg-center"
        style={{
          backgroundImage: "url('/images/bg-image-example.jfif')",
        }}
      />
    ),
  },
] as const;

const ThemeSection = ({ appearance, update }: Props) => {
  return (
    <Card icon={Palette} title="Colors & background" desc="Pick a backdrop and accent color.">
      <div>
        <Label>Background Style</Label>
        <div className="mt-2 grid grid-cols-3 gap-3">
          {backgroundStyles.map((style) => (
            <button
              key={style.id}
              type="button"
              onClick={() => update("bg_style", style.id)}
              className={cn(
                "rounded-xl border p-2 text-left transition-all",
                appearance.bg_style === style.id
                  ? "border-primary bg-primary/5"
                  : "hover:border-muted-foreground/30",
              )}
            >
              {style.preview}

              <div className="mt-2 text-xs font-medium">{style.label}</div>
            </button>
          ))}
        </div>
      </div>
      {appearance.bg_style === "color" && (
        <div className="mt-4">
          <Label>Background Color</Label>

          <div className="mt-2 flex flex-wrap gap-2">
            {BG_COLOR_OPTIONS.map((c) => (
              <button
                key={c.bg}
                type="button"
                onClick={() => update("bg_color", c.bg)}
                className={`size-9 rounded-full border ${
                  appearance.bg_color === c.bg ? "ring-2 ring-primary" : ""
                }`}
                style={{ background: c.bg }}
              />
            ))}
          </div>

          <div className="mt-3 flex gap-2">
            <input
              type="color"
              value={appearance.bg_color}
              onChange={(e) => update("bg_color", e.target.value)}
              className="h-10 w-12"
            />

            <input
              className={input_class}
              value={appearance.bg_color}
              onChange={(e) => update("bg_color", e.target.value)}
            />
          </div>
        </div>
      )}
      {appearance.bg_style === "gradient" && (
        <div className="mt-4 space-y-4">
          <Field label="From">
            <div className="flex flex-wrap gap-2">
              {BG_COLOR_OPTIONS.map((c) => (
                <button
                  key={`from-${c.bg}`}
                  type="button"
                  onClick={() =>
                    update("bg_gradient", {
                      ...appearance.bg_gradient,
                      from: c.bg,
                    })
                  }
                  className={`size-9 rounded-full border ${
                    appearance.bg_gradient.from === c.bg ? "ring-2 ring-primary" : ""
                  }`}
                  style={{ background: c.bg }}
                />
              ))}
            </div>
            <div className="mt-3 flex gap-2">
              <input
                type="color"
                value={appearance.bg_gradient.from}
                onChange={(e) =>
                  update("bg_gradient", {
                    ...appearance.bg_gradient,
                    from: e.target.value,
                  })
                }
                className="h-10 w-12"
              />

              <input
                className={input_class}
                value={appearance.bg_gradient.from}
                onChange={(e) =>
                  update("bg_gradient", {
                    ...appearance.bg_gradient,
                    from: e.target.value,
                  })
                }
              />
            </div>
          </Field>

          <Field label="To">
            <div className="flex flex-wrap gap-2">
              {BG_COLOR_OPTIONS.map((c) => (
                <button
                  key={`to-${c.bg}`}
                  type="button"
                  onClick={() =>
                    update("bg_gradient", {
                      ...appearance.bg_gradient,
                      to: c.bg,
                    })
                  }
                  className={`size-9 rounded-full border ${
                    appearance.bg_gradient.to === c.bg ? "ring-2 ring-primary" : ""
                  }`}
                  style={{ background: c.bg }}
                />
              ))}
            </div>
            <div className="mt-3 flex gap-2">
              <input
                type="color"
                value={appearance.bg_gradient.to}
                onChange={(e) =>
                  update("bg_gradient", {
                    ...appearance.bg_gradient,
                    to: e.target.value,
                  })
                }
                className="h-10 w-12"
              />

              <input
                className={input_class}
                value={appearance.bg_gradient.to}
                onChange={(e) =>
                  update("bg_gradient", {
                    ...appearance.bg_gradient,
                    to: e.target.value,
                  })
                }
              />
            </div>
          </Field>

          <Field label="Direction">
            <Select
              value={appearance.bg_gradient.direction}
              onValueChange={(value) =>
                update("bg_gradient", {
                  ...appearance.bg_gradient,
                  direction: value as AppearanceSettings["bg_gradient"]["direction"],
                })
              }
            >
              <SelectTrigger className={input_class}>
                <SelectValue placeholder="Select direction" />
              </SelectTrigger>

              <SelectContent>
                <SelectItem value="to-r">Left → Right</SelectItem>
                <SelectItem value="to-l">Right → Left</SelectItem>
                <SelectItem value="to-t">Bottom → Top</SelectItem>
                <SelectItem value="to-b">Top → Bottom</SelectItem>
                <SelectItem value="to-tr">Bottom Left → Top Right</SelectItem>
                <SelectItem value="to-tl">Bottom Right → Top Left</SelectItem>
                <SelectItem value="to-br">Top Left → Bottom Right</SelectItem>
                <SelectItem value="to-bl">Top Right → Bottom Left</SelectItem>
              </SelectContent>
            </Select>
          </Field>
        </div>
      )}
      {appearance.bg_style === "image" && (
        <>
          <div className="mt-4 w-full">
            <Label>Background image (optional)</Label>
            <div className="mt-2">
              <MultiImageUploader
                value={
                  appearance.bg_image
                    ? [{ url: appearance.bg_image, key: getS3KeyFromUrl(appearance.bg_image) }]
                    : []
                }
                onChange={(data) => {
                  update("bg_image", data?.[0]?.url);
                }}
                gridClassName="grid-cols-1 gap-3"
                PreviewItemClassName="aspect-3/4! rounded-md"
                maxFiles={1}
                className="w-full max-w-40"
                triggerClassName="w-full max-w-40"
                showLimit={false}
              >
                <div className="aspect-3/4! cursor-pointer w-full flex items-center justify-center flex-col">
                  <UploadCloud />
                  <div className="text-center text-xs mt-0.5">3/4</div>
                </div>
              </MultiImageUploader>
            </div>

            <p className="mt-2 text-[11px] text-muted-foreground">
              Upload a photo to use as your page backdrop. The selected preset above acts as a tint
              overlay so text stays legible.
            </p>
          </div>
          <div className="max-w-75">
            <Field label="Overlay Opacity">
              <Slider
                min={0}
                max={100}
                step={1}
                value={[Math.round((appearance.bg_image_opacity ?? 0.35) * 100)]}
                className=""
                onValueChange={([value]) => update("bg_image_opacity", value / 100)}
              />

              <div className="mt-2 text-xs text-muted-foreground">
                {Math.round((appearance.bg_image_opacity ?? 0.35) * 100)}%
              </div>
            </Field>
          </div>
        </>
      )}
    </Card>
  );
};

export default ThemeSection;
